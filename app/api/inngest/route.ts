import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { processSendQueue } from '@/inngest/functions/sendQueue';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processSendQueue],
});
