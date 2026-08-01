import { ai } from '../config/gemini';
import { supabaseAdmin } from '../config/supabase';

export interface ChatServiceResponse {
  conversationId: string;
  title: string;
  userMessage: {
    id: string;
    role: string;
    content: string;
    created_at: string;
  };
  aiMessage: {
    id: string;
    role: string;
    content: string;
    created_at: string;
  };
}

export const processChatMessage = async (
  userId: string,
  userPrompt: string,
  conversationId?: string
): Promise<ChatServiceResponse> => {
  let activeConversationId = conversationId;
  let conversationTitle = 'New Conversation';

  // 1. Ensure conversation exists or create a new one
  if (activeConversationId) {
    const { data: conv, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', activeConversationId)
      .eq('user_id', userId)
      .single();

    if (error || !conv) {
      // If conversation not found, create new one
      activeConversationId = undefined;
    } else {
      conversationTitle = conv.title;
    }
  }

  if (!activeConversationId) {
    // Generate a title based on the user prompt
    const initialTitle = userPrompt.length > 35 ? userPrompt.substring(0, 35) + '...' : userPrompt;
    const { data: newConv, error: createErr } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id: userId,
        title: initialTitle,
      })
      .select()
      .single();

    if (createErr || !newConv) {
      throw new Error(`Failed to create conversation: ${createErr?.message || 'Database error'}`);
    }

    activeConversationId = newConv.id;
    conversationTitle = newConv.title;
  }

  // 2. Insert user message into Supabase
  const { data: userMsg, error: userMsgErr } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: activeConversationId,
      user_id: userId,
      role: 'user',
      content: userPrompt,
    })
    .select()
    .single();

  if (userMsgErr || !userMsg) {
    throw new Error(`Failed to save user message: ${userMsgErr?.message || 'Database error'}`);
  }

  // 3. Fetch recent message history for context
  const { data: historyMsgs } = await supabaseAdmin
    .from('messages')
    .select('role, content')
    .eq('conversation_id', activeConversationId)
    .order('created_at', { ascending: true })
    .limit(30);

  // 4. Construct content payload for @google/genai SDK
  const formattedContents = (historyMsgs || []).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  // If no API key configured, throw helpful error
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please check server .env settings.');
  }

  let aiResponseText = '';
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction: 'You are AskFlow AI, an intelligent, helpful, polite, and precise AI assistant. Format code snippets cleanly in Markdown when appropriate.',
      },
    });

    aiResponseText = response.text || 'I could not process your request at this moment.';
  } catch (apiError: any) {
    console.error('Gemini API Error:', apiError);
    // Fallback attempt with gemini-1.5-flash if gemini-2.5-flash is not available
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: formattedContents,
      });
      aiResponseText = fallbackResponse.text || 'Response received from backup model.';
    } catch (fallbackError: any) {
      throw new Error(`Gemini API Error: ${apiError?.message || 'Failed to call Gemini API'}`);
    }
  }

  // 5. Insert AI message into Supabase
  const { data: aiMsg, error: aiMsgErr } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: activeConversationId,
      user_id: userId,
      role: 'model',
      content: aiResponseText,
    })
    .select()
    .single();

  if (aiMsgErr || !aiMsg) {
    throw new Error(`Failed to save AI response: ${aiMsgErr?.message || 'Database error'}`);
  }

  // 6. Touch conversations updated_at timestamp
  await supabaseAdmin
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', activeConversationId);

  return {
    conversationId: activeConversationId!,
    title: conversationTitle,
    userMessage: userMsg,
    aiMessage: aiMsg,
  };
};
