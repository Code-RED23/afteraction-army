import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return new Response('No secret', { status: 500 });

  const hdrs = await headers();
  const svixHeaders = { 'svix-id': hdrs.get('svix-id')!, 'svix-timestamp': hdrs.get('svix-timestamp')!, 'svix-signature': hdrs.get('svix-signature')! };
  if (!svixHeaders['svix-id']) return new Response('Missing headers', { status: 400 });

  let evt: WebhookEvent;
  try { evt = new Webhook(secret).verify(JSON.stringify(await req.json()), svixHeaders) as WebhookEvent; }
  catch { return new Response('Invalid sig', { status: 400 }); }

  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address || '';
    const fullName = [first_name, last_name].filter(Boolean).join(' ');
    const supabase = createServiceClient();

    const { data: invite } = await supabase.from('invites').select('*').eq('email', email).eq('status', 'pending').single();
    if (invite) {
      await supabase.from('profiles').insert({ clerk_user_id: id, platoon_id: invite.platoon_id, role: invite.role, full_name: fullName, email });
      await supabase.from('invites').update({ status: 'accepted' }).eq('id', invite.id);
    } else {
      await supabase.from('profiles').insert({ clerk_user_id: id, full_name: fullName, email });
    }
  }
  return new Response('OK');
}
