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
  const [form, setForm] = useState({ name: '', company: '', battalion: '', brigade: '', installation: '', state: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.state) { setError('Platoon name and state are required.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create unit');
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-900/30 border border-green-800/40 mb-4">
            <Shield className="w-6 h-6 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-1">Set up your unit</h1>
          <p className="text-sm text-gray-500">Welcome{user?.firstName ? `, ${user.firstName}` : ''}. Let&apos;s get your platoon connected.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Platoon Designation <span className="text-red-400">*</span></label>
            <input type="text" placeholder="e.g. 1st Platoon, B Co, 2-506 IN" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Company</label>
              <input type="text" placeholder="e.g. Bravo Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Battalion</label>
              <input type="text" placeholder="e.g. 2-506 IN" value={form.battalion} onChange={(e) => setForm({ ...form, battalion: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Brigade</label>
              <input type="text" placeholder="e.g. 3BCT, 101st ABN" value={form.brigade} onChange={(e) => setForm({ ...form, brigade: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Installation</label>
              <input type="text" placeholder="e.g. Fort Campbell" value={form.installation} onChange={(e) => setForm({ ...form, installation: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/40 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">State <span className="text-red-400">*</span></label>
            <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/40 text-sm">
              <option value="">Select state...</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/30 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors">
            {loading ? 'Creating...' : 'Set Up Platoon & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
