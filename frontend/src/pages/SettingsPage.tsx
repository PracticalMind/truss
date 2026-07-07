import { useState } from 'react';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { user, updatePassword, updateProfile } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.full_name ?? '');
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  const canChangePassword = (import.meta.env.VITE_AUTH_PROVIDER ?? 'local') === 'supabase';

  const handleSave = async () => {
    try {
      await updateProfile(name.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save changes');
    }
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }
    setPwLoading(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const initials = (user?.user_metadata?.full_name ?? user?.email ?? '?')
    .charAt(0)
    .toUpperCase();

  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      <div className="flex-1 p-6 overflow-y-auto max-w-3xl">
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

            {canChangePassword && (
              <div>
                <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest mb-4">Security</p>
                <div className="bg-[#111827] border border-[#1e2a3a] rounded-lg p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-medium text-[#94a3b8] block mb-2">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full px-4 py-3 bg-[#0d1117] border border-[#2d3748] rounded-lg text-sm text-[#e2e8f0] placeholder-[#4a5568] focus:outline-none focus:border-[#f97316] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#94a3b8] block mb-2">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-4 py-3 bg-[#0d1117] border border-[#2d3748] rounded-lg text-sm text-[#e2e8f0] placeholder-[#4a5568] focus:outline-none focus:border-[#f97316] transition-colors"
                      />
                    </div>
                  </div>

                  {pwError && (
                    <div className="p-3 bg-[#f87171]/10 border border-[#f87171]/20 rounded text-xs text-[#f87171]">
                      {pwError}
                    </div>
                  )}

                  <button
                    onClick={handleChangePassword}
                    disabled={pwLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#f97316] hover:bg-[#ea6c0a] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {pwSaved ? (
                      <>
                        <Check size={14} />
                        Updated!
                      </>
                    ) : pwLoading ? (
                      'Updating...'
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
