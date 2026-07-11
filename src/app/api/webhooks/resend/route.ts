import { Webhook } from 'svix'; 
import { ApplicationStatus } from '@prisma/client';
import { db } from '@/lib/db';

const STATUS_RANK: Record<ApplicationStatus, number> = {
  sent: 1,
  delivered: 2,
  opened: 3,
  clicked: 4,
  delivery_delayed: 4,
  bounced: 5,
  complained: 5,
  failed: 5,
};

const EVENT_TO_STATUS: Record<string, ApplicationStatus> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.delivery_delayed': 'delivery_delayed',
  'email.failed': 'failed',
};

export async function POST(req: Request) {
  const payload = await req.text();
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET!);
  let event: any;

  try {
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // idempotency check
  const existing = await db.webhookEvent.findUnique({ where: { id: svixId } });
  if (existing) {
    return new Response('Already processed', { status: 200 });
  }

  const { type, data } = event;
  const emailId = data?.email_id;
  const newStatus = EVENT_TO_STATUS[type];

  if (emailId && newStatus) {
    const application = await db.application.findUnique({
      where: { resendEmailId: emailId },
    });

    if (application && STATUS_RANK[newStatus] >= STATUS_RANK[application.status]) {
      await db.application.update({
        where: { resendEmailId: emailId },
        data: { status: newStatus },
      });
    }
  }

  // record event for idempotency (do this even if emailId not found, so retries don't reprocess)
  await db.webhookEvent.create({
    data: { id: svixId, type },
  });

  return new Response('OK', { status: 200 });
}