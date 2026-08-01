import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  fetchConversations,
  fetchConversationMessages,
  sendChatMessage,
  deleteConversation,
} from '../lib/api';
import { Conversation, Message } from '../types';
import { chatInputSchema } from '../lib/validation';
import {
  Send,
  Plus,
  Bot,
  User,
  Loader2,
  Sparkles,
  MessageSquare,
  Trash2,
  AlertCircle,
  History,
  ChevronLeft,
} from 'lucide-react';

export const ChatPage: React.FC = () => {
  const location = useLocation();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string>('New Conversation');
  const [messages, setMessages] = useState<Message[]>([]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMsgs, setIsFetchingMsgs] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load user conversation list on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Handle location state for "Start New Chat" from dashboard
  useEffect(() => {
    if (location.state?.newChat) {
      handleNewChat();
    }
  }, [location.state]);

  const loadConversations = async () => {
    try {
      const list = await fetchConversations();
      setConversations(list);
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
    }
  };

  const handleSelectConversation = async (convId: string) => {
    setActiveConversationId(convId);
    setIsFetchingMsgs(true);
    setApiError(null);
    setShowHistorySidebar(false);

    try {
      const { conversation, messages: loadedMessages } = await fetchConversationMessages(convId);
      setActiveTitle(conversation.title);
      setMessages(loadedMessages);
    } catch (err: any) {
      console.error('Error fetching conversation messages:', err);
      setApiError('Failed to load conversation history.');
    } finally {
      setIsFetchingMsgs(false);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setActiveTitle('New Conversation');
    setMessages([]);
    setInputMessage('');
    setApiError(null);
    setInputError(null);
    setShowHistorySidebar(false);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));

      if (activeConversationId === convId) {
        handleNewChat();
      }
    } catch (err: any) {
      console.error('Failed to delete conversation:', err);
      setApiError('Could not delete conversation.');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setInputError(null);
    setApiError(null);

    // Zod Client Validation
    const validationResult = chatInputSchema.safeParse({ message: inputMessage });
    if (!validationResult.success) {
      setInputError(validationResult.error.errors[0]?.message || 'Invalid message');
      return;
    }

    const trimmedMsg = inputMessage.trim();
    if (!trimmedMsg || isLoading) return;

    // Optimistically add user message to UI
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversationId || 'temp',
      user_id: 'current',
      role: 'user',
      content: trimmedMsg,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const result = await sendChatMessage(trimmedMsg, activeConversationId || undefined);

      setActiveConversationId(result.conversationId);
      setActiveTitle(result.title);

      // Replace temp message with server response
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        result.userMessage,
        result.aiMessage,
      ]);

      // Refresh list of conversations in background
      loadConversations();
    } catch (err: any) {
      console.error('Send message error:', err);
      setApiError(err.message || 'Failed to send message to AI backend.');
      // Keep user message so text isn't lost
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col w-full bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Top Action Bar */}
      <div className="h-16 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setShowHistorySidebar(!showHistorySidebar)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Toggle Conversation History"
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">History</span>
          </button>

          <div className="h-5 w-px bg-slate-800" />

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-sm sm:text-base text-white truncate max-w-xs sm:max-w-md">
              {activeTitle}
            </h2>
          </div>
        </div>

        {/* Required New Chat Button */}
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Main Workspace Area (Chat View + History Drawer) */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Slide-out History Drawer */}
        <div
          className={`absolute lg:relative z-30 top-0 bottom-0 left-0 w-72 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out flex flex-col ${
            showHistorySidebar ? 'translate-x-0' : '-translate-x-full lg:hidden'
          }`}
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Past Conversations</span>
            <button
              onClick={() => setShowHistorySidebar(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No previous conversations yet.</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs font-medium transition-all ${
                    activeConversationId === conv.id
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MessageSquare className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    title="Delete Conversation"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Message History Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-950">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {apiError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            {isFetchingMsgs ? (
              <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span>Loading chat history...</span>
              </div>
            ) : messages.length === 0 ? (
              /* Empty state welcome card */
              <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-4 animate-pulse-glow">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">How can AskFlow AI help you today?</h3>
                <p className="text-sm text-slate-400 mb-6">
                  Ask questions, debug code, brainstorm ideas, or process text with Google Gemini AI.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                  {[
                    'Explain Quantum Computing simply',
                    'Write a REST API in Node.js',
                    'Draft an email announcement',
                    'Debug React state re-render issue',
                  ].map((promptText, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputMessage(promptText);
                      }}
                      className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/30 text-xs text-slate-300 transition-all"
                    >
                      "{promptText}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message Bubbles List */
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-md ${
                        isUser
                          ? 'bg-slate-800 border border-slate-700 text-indigo-400'
                          : 'bg-gradient-to-tr from-indigo-600 to-cyan-400 shadow-indigo-500/20'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Content Bubble */}
                    <div
                      className={`rounded-2xl p-4 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/10'
                          : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none shadow-md'
                      }`}
                    >
                      <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                      <span
                        className={`text-[10px] block mt-2 ${
                          isUser ? 'text-indigo-200 text-right' : 'text-slate-500'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Required Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-3 max-w-3xl mr-auto">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-3 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span className="font-medium text-slate-300">AskFlow AI is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Message Input Area */}
          <div className="p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto space-y-2">
              {inputError && <p className="text-xs text-red-400 px-2 font-medium">{inputError}</p>}
              <div className="relative flex items-center bg-slate-950 border border-slate-800 focus-within:border-indigo-500/60 rounded-2xl p-2 shadow-inner transition-all">
                <textarea
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    if (inputError) setInputError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything... (Press Enter to send, Shift+Enter for new line)"
                  rows={2}
                  className="w-full bg-transparent border-0 text-white placeholder-slate-500 focus:outline-none focus:ring-0 text-sm resize-none px-3 py-1.5"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-md shadow-indigo-600/20 flex-shrink-0 ml-2"
                  aria-label="Send message"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center justify-between px-2 text-[11px] text-slate-500">
                <span>AskFlow AI powered by Gemini</span>
                <span>Zod Validated Inputs</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
