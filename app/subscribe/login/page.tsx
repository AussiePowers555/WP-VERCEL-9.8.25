'use client';
import { useState } from 'react';

export default function SubscriberLogin() {
  const [email, setEmail] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/subscription/verify', { method: 'POST', body: JSON.stringify({ email }) });
    const data = await res.json();
    if (data.hasAccess) {
      sessionStorage.setItem('subscriberEmail', email);
      window.location.href = '/'; // your main app
    } else {
      alert(`Access denied: ${data.reason || 'No active subscription'}`);
      window.location.href = '/subscribe/pricing';
    }
  }

  return (
    <form onSubmit={submit} className="container mx-auto p-6 max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Subscriber Login</h1>
      <input className="w-full border rounded px-3 py-2" placeholder="your@email"
             value={email} onChange={e => setEmail(e.target.value)} />
      <button className="rounded bg-blue-600 text-white px-4 py-2">Verify</button>
    </form>
  );
}
