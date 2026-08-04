import { supabase } from './supabaseClient';
import { Conversation, Message } from '../types';

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated in Supabase');
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function safeFetch(url: string, options: RequestInit) {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (err: any) {
    console.error('Fetch network error:', err);
    throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please ensure the Node.js Express server is running on port 5000.`);
  }
}

export async function sendChatMessage(message: string, conversationId?: string) {
  const headers = await getAuthHeader();
  const response = await safeFetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, conversationId }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send message to AI');
  }

  return data.data as {
    conversationId: string;
    title: string;
    userMessage: Message;
    aiMessage: Message;
  };
}

export async function fetchConversations(): Promise<Conversation[]> {
  const headers = await getAuthHeader();
  const response = await safeFetch(`${API_BASE_URL}/chat/conversations`, {
    method: 'GET',
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch conversations');
  }

  return data.conversations || [];
}

export async function fetchConversationMessages(conversationId: string): Promise<{ conversation: Conversation; messages: Message[] }> {
  const headers = await getAuthHeader();
  const response = await safeFetch(`${API_BASE_URL}/chat/conversations/${conversationId}`, {
    method: 'GET',
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch messages');
  }

  return {
    conversation: data.conversation,
    messages: data.messages || [],
  };
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const headers = await getAuthHeader();
  const response = await safeFetch(`${API_BASE_URL}/chat/conversations/${conversationId}`, {
    method: 'DELETE',
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete conversation');
  }
}

export async function fetchDashboardStats(): Promise<{ totalConversations: number }> {
  const headers = await getAuthHeader();
  const response = await safeFetch(`${API_BASE_URL}/chat/stats`, {
    method: 'GET',
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch stats');
  }

  return { totalConversations: data.totalConversations || 0 };
}
