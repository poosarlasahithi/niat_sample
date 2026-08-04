import { groq } from '../config/groq';
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
      activeConversationId = undefined;
    } else {
      conversationTitle = conv.title;
    }
  }

  if (!activeConversationId) {
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

  // 4. Map message history to Groq chat completions format
  const formattedMessages = [
    {
      role: 'system' as const,
      content: 'You are AskFlow AI, an intelligent, helpful, polite, and precise AI assistant. Format code snippets cleanly in Markdown when appropriate.',
    },
    ...(historyMsgs || []).map((msg) => ({
      role: (msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: msg.content,
    })),
  ];

  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured on the server. Please check server .env settings.');
  }

  const modelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  let aiResponseText = '';
  try {
    const response = await groq.chat.completions.create({
      model: modelName,
      messages: formattedMessages,
    });

    aiResponseText = response.choices[0]?.message?.content || 'I could not process your request at this moment.';
  } catch (apiError: any) {
    console.error('Groq API Error:', apiError);
    // Fallback attempt with llama-3.1-8b-instant if the selected model fails
    try {
      const fallbackResponse = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: formattedMessages,
      });
      aiResponseText = fallbackResponse.choices[0]?.message?.content || 'Response received from backup model.';
    } catch (fallbackError: any) {
      throw new Error(`Groq API Error: ${apiError?.message || 'Failed to call Groq API'}`);
    }
  }

  // 5. Insert AI message into Supabase as role: 'model' for compatibility
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
