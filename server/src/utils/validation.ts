import { z } from 'zod';

export const chatMessageSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID format').optional().or(z.literal('')),
  message: z.string().trim().min(1, 'Message cannot be empty').max(8000, 'Message is too long (max 8000 characters)'),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
