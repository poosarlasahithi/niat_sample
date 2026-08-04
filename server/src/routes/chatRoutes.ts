import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { chatMessageSchema } from '../utils/validation';
import { processChatMessage } from '../services/groqService';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// Apply auth middleware to all chat routes
router.use(authenticateUser);

/**
 * POST /api/chat
 * Send user message, call Gemini, store messages in Supabase, return AI response.
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = chatMessageSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { conversationId, message } = parseResult.data;
    const userId = req.user!.id;

    const result = await processChatMessage(userId, message, conversationId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error handling chat POST request:', error);
    res.status(500).json({
      error: error.message || 'An error occurred while communicating with AskFlow AI.',
    });
  }
});

/**
 * GET /api/chat/conversations
 * Retrieve all conversations for logged-in user
 */
router.get('/conversations', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, conversations: data || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/conversations/:id
 * Retrieve messages for a specific conversation
 */
router.get('/conversations/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id;

    // Ensure conversation belongs to user
    const { data: conv, error: convErr } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (convErr || !conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const { data: messages, error: msgsErr } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgsErr) {
      res.status(500).json({ error: msgsErr.message });
      return;
    }

    res.json({
      success: true,
      conversation: conv,
      messages: messages || [],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/chat/conversations/:id
 * Delete a conversation
 */
router.delete('/conversations/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id;

    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chat/stats
 * Retrieve dashboard metrics (total conversations count)
 */
router.get('/stats', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const { count, error } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({
      success: true,
      totalConversations: count || 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
