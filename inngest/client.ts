import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'applypilot',
  name: 'ApplyPilot Job Application Engine',
  eventKey: process.env.INNGEST_EVENT_KEY,
});
