export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'model';
  content: string;
  created_at: string;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    conversationId: string;
    title: string;
    userMessage: Message;
    aiMessage: Message;
  };
  error?: string;
}
