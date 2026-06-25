import { useState } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'api'>('profile');
  const [name, setName] = useState(user?.user_metadata?.full_name ?? '');
  const [saved, setSaved] = useState(false);
  const [apiKey] = useState('sk-truss-xxxxxxxxxxxxxxxxxxxxxx');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = (user?.user_metadata?.full_name ?? user?.email ?? '?')
    .charAt(0)
    .toUpperCase();

  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      <div className="flex-1 p-6 overflow-y-auto max-w-3xl">
        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-[#1e2a3a] mb-8">
          {(['profile', 'api'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#f97316] text-white'
                  : 'border-transparent text-[#64748b] hover:text-[#94a3b8]'
              }`}
            >
              {tab === 'api' ? 'API' : 'Profile'}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest mb-4">Identity</p>
              <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#1e2a3a] border border-[#2d3748] flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-[#f97316]">{initials}</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {user?.user_metadata?.full_name ?? user?.email}
                    </p>
                    <p className="text-sm text-[#64748b]">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-medium text-[#94a3b8] block mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111827] border border-[#2d3748] rounded-lg text-sm text-[#e2e8f0] focus:outline-none focus:border-[#f97316] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#94a3b8] block mb-2">Email Address (Read-only)</label>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="w-full px-4 py-3 bg-[#111827] border border-[#1e2a3a] rounded-lg text-sm text-[#4a5568] cursor-not-allowed"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#f97316] hover:bg-[#ea6c0a] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {saved ? (
                <>
                  <Check size={14} />
                  Saved!
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            {/* API Key */}
            <div>
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest mb-4">API Access</p>
              <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-5">
                <label className="text-xs font-medium text-[#94a3b8] block mb-2">API Key</label>
                <div className="flex gap-3">
                  <input
                    type="password"
                    value={apiKey}
                    readOnly
                    className="flex-1 px-4 py-3 bg-[#0d1117] border border-[#1e2a3a] rounded font-mono text-sm text-[#64748b]"
                  />
                  <button className="px-4 py-2.5 bg-[#1c2333] border border-[#2d3748] text-sm text-[#94a3b8] rounded hover:border-[#374151] hover:text-white transition-colors">
                    Reveal
                  </button>
                  <button className="px-4 py-2.5 bg-[#1c2333] border border-[#2d3748] text-sm text-[#94a3b8] rounded hover:border-[#374151] hover:text-white transition-colors">
                    Regenerate
                  </button>
                </div>
                <p className="text-[11px] text-[#374151] mt-2">Keep your API key secret. It grants full access to your account.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
