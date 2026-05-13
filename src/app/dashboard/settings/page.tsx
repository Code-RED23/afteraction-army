'use client';

import { useEffect, useState } from 'react';
import { Settings, Users, Mail, Loader2, Plus, Trash2, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Agency {
  id: string;
  name: string;
  state: string;
  size: string;
}

interface Member {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'member';
  created_at: string;
}

interface InviteItem {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function SettingsPage() {
  const [agency, setAgency] = useState<Agency | null>(null);
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
      setAgency(data.agency);
      setMembers(data.members || []);
      setInvites(data.invites || []);
      setLoading(false);
    })();
  }, []);

  async function saveAgency() {
    if (!agency) return;
    setSaving(true);
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: agency.name, state: agency.state, size: agency.size }),
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
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          Settings
        </h2>
        <p className="text-sm text-gray-500">Manage your agency and team</p>
      </div>

      {/* Agency Info */}
      <div className="border border-gray-800 rounded-lg bg-gray-900/50 mb-6">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-200">Agency Information</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Agency Name</label>
            <input
              type="text"
              value={agency?.name || ''}
              onChange={(e) => agency && setAgency({ ...agency, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600 block mb-1">State</label>
              <input
                type="text"
                value={agency?.state || ''}
                onChange={(e) => agency && setAgency({ ...agency, state: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Size</label>
              <select
                value={agency?.size || ''}
                onChange={(e) => agency && setAgency({ ...agency, size: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              >
                <option value="small">Small (1-25)</option>
                <option value="medium">Medium (26-75)</option>
                <option value="large">Large (76-200)</option>
                <option value="xlarge">XLarge (200+)</option>
              </select>
            </div>
          </div>
          <button
            onClick={saveAgency}
            disabled={saving}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Team Members */}
      <div className="border border-gray-800 rounded-lg bg-gray-900/50 mb-6">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-gray-200">Team Members ({members.length})</h3>
        </div>
        <div className="divide-y divide-gray-800">
          {members.map((m) => (
            <div key={m.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  m.role === 'admin' ? 'bg-amber-900/40 border border-amber-800/40' : 'bg-gray-800 border border-gray-700'
                )}>
                  {m.role === 'admin' ? <Shield className="w-4 h-4 text-amber-400" /> : <User className="w-4 h-4 text-gray-400" />}
                </div>
                <div>
                  <p className="text-sm text-gray-200">{m.full_name}</p>
                  <p className="text-xs text-gray-600">{m.email}</p>
                </div>
              </div>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded',
                m.role === 'admin' ? 'bg-amber-900/30 text-amber-400' : 'bg-gray-800 text-gray-500'
              )}>
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Invite */}
      <div className="border border-gray-800 rounded-lg bg-gray-900/50">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
          <Mail className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-gray-200">Invite Members</h3>
        </div>
        <div className="p-4">
          <div className="flex gap-2 mb-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@department.gov"
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
            />
            <button
              onClick={sendInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
            >
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
