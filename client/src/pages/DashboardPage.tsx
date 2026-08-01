import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardStats } from '../lib/api';
import { MessageSquare, Plus, Sparkles, Loader2, RefreshCw } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { userName } = useAuth();
  const navigate = useNavigate();

  const [totalConversations, setTotalConversations] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await fetchDashboardStats();
      setTotalConversations(stats.totalConversations);
    } catch (err: any) {
      console.error('Failed to load dashboard stats:', err);
      setError('Could not connect to backend server. Make sure the Express backend is running.');
      setTotalConversations(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleStartNewChat = () => {
    navigate('/chat', { state: { newChat: true } });
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
      {/* Top Banner / Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-8 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Workspace Active</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">{userName}</span>!
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl">
            Explore your AI conversations or launch a new chat session powered by Google Gemini.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadStats}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Two Required Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Total AI Conversations */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition-all duration-300 shadow-lg group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Metrics</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-slate-400">Total AI Conversations</h3>
            {loading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-sm text-slate-500">Counting conversations...</span>
              </div>
            ) : (
              <p className="text-4xl font-extrabold text-white tracking-tight">
                {totalConversations !== null ? totalConversations : 0}
              </p>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-4">Stored securely with Row Level Security in Supabase</p>
        </div>

        {/* Card 2: Start New Chat Button */}
        <div
          onClick={handleStartNewChat}
          className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-indigo-900/20 border border-indigo-500/30 hover:border-indigo-500/60 rounded-2xl p-6 transition-all duration-300 shadow-lg shadow-indigo-500/5 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Quick Action</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
              Start New Chat
            </h3>
            <p className="text-sm text-slate-400">
              Launch a full-page intelligent chat session with Google Gemini AI.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-indigo-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
            <span>Open Chatbot</span>
            <Plus className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
