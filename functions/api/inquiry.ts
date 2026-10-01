// Cloudflare Pages Function: POST /api/inquiry
// Sends inquiry emails via Resend (free tier). Requires env var RESEND_API_KEY.

export const onRequestPost: PagesFunction<{ RESEND_API_KEY: string }> = async ({ request, env }) => {
  let data: Record<string, string>;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { name, clinic, email, phone, role, interest, message } = data;

  if (!name || !email) {
    return json({ error: 'Name and email are required' }, 400);
  }

  const emailBody = `
<h2>New inquiry from barmaandental.co.za</h2>
<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
  <tr><td style="padding:6px 14px 6px 0;font-weight:bold">Name</td><td>${esc(name)}</td></tr>
  <tr><td style="padding:6px 14px 6px 0;font-weight:bold">Clinic/Practice</td><td>${esc(clinic || '-')}</td></tr>
  <tr><td style="padding:6px 14px 6px 0;font-weight:bold">Email</td><td>${esc(email)}</td></tr>
  <tr><td style="padding:6px 14px 6px 0;font-weight:bold">Phone</td><td>${esc(phone || '-')}</td></tr>
  <tr><td style="padding:6px 14px 6px 0;font-weight:bold">Role</td><td>${esc(role || '-')}</td></tr>
  <tr><td style="padding:6px 14px 6px 0;font-weight:bold">Product Interest</td><td>${esc(interest || '-')}</td></tr>
  <tr><td style="padding:6px 14px 6px 0;font-weight:bold">Message</td><td>${esc(message || '-')}</td></tr>
</table>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Barmaan Dental Website <onboarding@resend.dev>',
        to: ['barmaandental@gmail.com'],
        reply_to: email,
        subject: `New inquiry: ${name}${clinic ? ` – ${clinic}` : ''}`,
        html: emailBody,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error('Resend error:', t);
      return json({ error: 'Email service error' }, 502);
    }
    return json({ ok: true });
  } catch (e) {
    console.error('Email send failed', e);
    return json({ error: 'Email service unavailable' }, 502);
  }
};

function esc(s: string) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
