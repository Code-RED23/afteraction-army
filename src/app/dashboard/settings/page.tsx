'use client';

import { useEffect, useState } from 'react';
import { Settings, Users, Mail, Loader2, Plus, Trash2, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatoonData {
  id: string;
  name: string;
  company: string | null;
  battalion: string | null;
  brigade: string | null;
  installation: string | null;
  state: string;
}

interface Member {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'nco' | 'soldier';
  rank: string | null;
  duty_position: string | null;
  squad_id: string | null;
  created_at: string;
}

interface InviteItem {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function SettingsPage() {
  const [platoon, setPlatoon] = useState<PlatoonData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setPlatoon(data.platoon);
      setMembers(data.members || []);
      setInvites(data.invites || []);
      setLoading(false);
    })();
  }, []);

  async function savePlatoon() {
    if (!platoon) return;
    setSaving(true);
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: platoon.name, company: platoon.company, battalion: platoon.battalion, brigade: platoon.brigade, installation: platoon.installation, state: platoon.state }),
    });
    setSaving(false);
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError('');

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      setInviteError(data.error || 'Failed to send invite');
    } else {
      const { invite } = await res.json();
      setInvites([invite, ...invites]);
      setInviteEmail('');
    }
    setInviting(false);
  }

  async function cancelInvite(inviteId: string) {
    await fetch('/api/invite', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId }),
    });
    setInvites(invites.filter((i) => i.id !== inviteId));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-green-400" />
          Unit Settings
        </h2>
        <p className="text-sm text-gray-500">Manage your platoon and personnel</p>
      </div>

      {/* Platoon Info */}
      <div className="border border-gray-800 rounded-lg bg-gray-900/50 mb-6">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-200">Platoon Information</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Platoon Designation</label>
            <input type="text" value={platoon?.name || ''} onChange={(e) => platoon && setPlatoon({ ...platoon, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500/40" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Company</label>
              <input type="text" value={platoon?.company || ''} onChange={(e) => platoon && setPlatoon({ ...platoon, company: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500/40" />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Battalion</label>
              <input type="text" value={platoon?.battalion || ''} onChange={(e) => platoon && setPlatoon({ ...platoon, battalion: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500/40" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Brigade</label>
              <input type="text" value={platoon?.brigade || ''} onChange={(e) => platoon && setPlatoon({ ...platoon, brigade: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500/40" />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Installation</label>
              <input type="text" value={platoon?.installation || ''} onChange={(e) => platoon && setPlatoon({ ...platoon, installation: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500/40" />
            </div>
          </div>
          <button onClick={savePlatoon} disabled={saving}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Personnel */}
      <div className="border border-gray-800 rounded-lg bg-gray-900/50 mb-6">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-semibold text-gray-200">Personnel ({members.length})</h3>
        </div>
        <div className="divide-y divide-gray-800">
          {members.map((m) => (
            <div key={m.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  m.role === 'admin' || m.role === 'nco' ? 'bg-green-900/40 border border-green-800/40' : 'bg-gray-800 border border-gray-700'
                )}>
                  {m.role === 'admin' || m.role === 'nco' ? <Shield className="w-4 h-4 text-green-400" /> : <User className="w-4 h-4 text-gray-400" />}
                </div>
                <div>
                  <p className="text-sm text-gray-200">{m.rank ? `${m.rank} ` : ''}{m.full_name}</p>
                  <p className="text-xs text-gray-600">{m.duty_position || m.email}</p>
                </div>
              </div>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded',
                m.role === 'admin' ? 'bg-green-900/30 text-green-400'
                  : m.role === 'nco' ? 'bg-green-900/20 text-green-500'
                  : 'bg-gray-800 text-gray-500'
              )}>
                {m.role === 'admin' ? 'Admin' : m.role === 'nco' ? 'NCO' : 'Soldier'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Invite */}
      <div className="border border-gray-800 rounded-lg bg-gray-900/50">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
          <Mail className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-semibold text-gray-200">Invite Personnel</h3>
        </div>
        <div className="p-4">
          <div className="flex gap-2 mb-3">
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="soldier@army.mil"
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500/40"
              onKeyDown={(e) => e.key === 'Enter' && sendInvite()} />
            <button onClick={sendInvite} disabled={inviting || !inviteEmail.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors">
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Invite
            </button>
          </div>
          {inviteError && <p className="text-xs text-red-400 mb-3">{inviteError}</p>}

          {invites.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-600 uppercase tracking-wider">Pending Invites</p>
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2 px-3 bg-gray-800/40 rounded-lg">
                  <span className="text-sm text-gray-400">{inv.email}</span>
                  <button onClick={() => cancelInvite(inv.id)} className="p-1 text-gray-600 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
