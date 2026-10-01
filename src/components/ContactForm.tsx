import { useState } from 'react';

const roles = ['Dentist', 'Dental Assistant', 'Practice Manager', 'Clinic Buyer', 'Distributor / Reseller', 'Other'];
const interests = ['Disposables', 'Medical Uniforms', 'Cold Line', 'Dispensers', 'Hemostats', 'Impression Material', 'General Inquiry'];

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus('sending');
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => 'Request failed'));
      setStatus('success');
      form.reset();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  function whatsappPrefill() {
    const form = document.querySelector<HTMLFormElement>('#inquiry-form');
    if (!form) return;
    const data = Object.fromEntries(new FormData(form).entries());
    const msg = `Hello Barmaan Dental!\nName: ${data.name || '-'}\nClinic: ${data.clinic || '-'}\nEmail: ${data.email || '-'}\nPhone: ${data.phone || '-'}\nRole: ${data.role || '-'}\nProduct Interest: ${data.interest || '-'}\nMessage: ${data.message || '-'}`;
    window.open(`https://wa.me/27648299032?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  }

  if (status === 'success') {
    return (
      <div className="form-success" role="status">
        <strong>✓ Thank you!</strong>
        <p>Your inquiry has been sent. Our team will get back to you shortly via email or WhatsApp.</p>
        <button type="button" className="btn-link" onClick={() => setStatus('idle')}>
          Send another inquiry
        </button>
      </div>
    );
  }

  return (
    <form id="inquiry-form" onSubmit={handleSubmit} noValidate={false}>
      <div className="form-grid">
        <label>
          Full Name
          <input name="name" type="text" placeholder="Dr. John Doe" required />
        </label>
        <label>
          Clinic/Practice Name
          <input name="clinic" type="text" placeholder="City Dental Care" />
        </label>
        <label>
          Email Address
          <input name="email" type="email" placeholder="email@clinic.co.za" required />
        </label>
        <label>
          Phone Number
          <input name="phone" type="tel" placeholder="+27 ..." />
        </label>
        <label>
          Your Role
          <select name="role" defaultValue="">
            <option value="" disabled>Select Role</option>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label>
          Product Interest
          <select name="interest" defaultValue="">
            <option value="" disabled>Select Interest</option>
            {interests.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>
      </div>
      <label className="full">
        Message
        <textarea name="message" rows={5} placeholder="Please provide details about your inquiry..." />
      </label>

      {status === 'error' && (
        <p className="form-error" role="alert">
          Sorry, sending failed ({errorMsg}). Please try WhatsApp instead.
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn-submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Submit Inquiry'}
        </button>
        <button type="button" className="btn-wa" onClick={whatsappPrefill}>
          Send via WhatsApp
        </button>
      </div>

      <style>{`
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        label { display: flex; flex-direction: column; gap: 6px; font-size: 0.88rem; font-weight: 600; color: #55677a; }
        .full { margin-top: 18px; }
        input, select, textarea {
          font-family: inherit; font-size: 0.92rem; padding: 11px 14px;
          border: 1px solid #cfe3f0; border-radius: 10px; outline: none;
          transition: border-color .2s; background: #fff; color: #3a4a58;
        }
        input:focus, select:focus, textarea:focus { border-color: #1596d8; }
        textarea { resize: vertical; }
        .form-actions { display: flex; gap: 12px; margin-top: 22px; flex-wrap: wrap; }
        .btn-submit {
          flex: 1; min-width: 200px; background: #1596d8; color: #fff; border: 0;
          padding: 13px 20px; border-radius: 999px; font-family: inherit;
          font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: background .2s;
        }
        .btn-submit:hover { background: #0e7bb8; }
        .btn-submit:disabled { opacity: .6; cursor: wait; }
        .btn-wa {
          background: #2ec24e; color: #fff; border: 0; padding: 13px 24px;
          border-radius: 999px; font-family: inherit; font-weight: 600;
          font-size: 0.95rem; cursor: pointer; transition: background .2s;
        }
        .btn-wa:hover { background: #27ad43; }
        .form-error { margin-top: 14px; color: #c0392b; font-size: 0.88rem; }
        .form-success { text-align: center; padding: 30px 10px; }
        .form-success strong { color: #2ec24e; font-size: 1.2rem; display: block; margin-bottom: 8px; }
        .form-success p { color: #55677a; font-size: 0.93rem; margin-bottom: 14px; }
        .btn-link { background: none; border: 0; color: #1596d8; font-family: inherit; font-weight: 600; cursor: pointer; text-decoration: underline; }
        @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
      `}</style>
    </form>
  );
}
