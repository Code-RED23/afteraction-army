'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Shield } from 'lucide-react';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', state: '', size: 'small' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.state) { setError('Please fill in all required fields.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create agency');
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-900/30 border border-amber-800/40 mb-4">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-1">Set up your agency</h1>
          <p className="text-sm text-gray-500">Welcome{user?.firstName ? `, ${user.firstName}` : ''}. Let&apos;s get your department connected.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Agency Name <span className="text-red-400">*</span></label>
            <input type="text" placeholder="e.g. Sacramento Metro Fire" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">State <span className="text-red-400">*</span></label>
            <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm">
              <option value="">Select state...</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Department Size</label>
            <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm">
              <option value="small">1-25 personnel</option>
              <option value="medium">26-100 personnel</option>
              <option value="large">101-500 personnel</option>
              <option value="xlarge">500+ personnel</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/30 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors">
            {loading ? 'Creating...' : 'Create Agency & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
