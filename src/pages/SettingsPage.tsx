import { useState } from 'react';
import { Building2, Clock, Bell, Shield, Palette, Check, Moon, Sun, Monitor, Rocket, MapPin, Image, Users } from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/context/ThemeContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const sections = [
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
] as const;

type SectionId = (typeof sections)[number]['id'];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn('relative h-6 w-11 rounded-full transition-colors', checked ? 'bg-brand-600' : 'bg-ink-200 dark:bg-ink-700')}
    >
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  );
}

const ORG_STORAGE_KEY = 'srujan_org_settings_v1';
const NOTIF_STORAGE_KEY = 'srujan_notif_settings_v1';

const defaultOrgSettings = {
  companyName: 'Srujan Infotech Pvt. Ltd.',
  email: 'contact@srujaninfotech.com',
  phone: '+91 20 6800 0000',
  address: 'Srujan Web Technovision Growth Hub, 101, 1st Floor, Shreyas Crest, S.No. 48/1/5, 6 & 7, Pashan - Sus Rd, Baner, Pune, Maharashtra 411045',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function SettingsPage() {
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const [active, setActive] = useState<SectionId>('organization');
  const [checklistOpen, setChecklistOpen] = useState(() => localStorage.getItem('srujan_setup_checklist_dismissed') !== 'true');
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [orgForm, setOrgForm] = useState(() => loadFromStorage(ORG_STORAGE_KEY, defaultOrgSettings));
  const [settings, setSettings] = useState(() => loadFromStorage(NOTIF_STORAGE_KEY, {
    emailNotifs: true,
    attendanceAlerts: true,
    leaveNotifs: true,
    reportNotifs: false,
    autoCheckout: false,
  }));

  const toggle = (key: keyof typeof settings) => setSettings((s) => ({ ...s, [key]: !s[key] }));

  const saveOrgSettings = () => {
    localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(orgForm));
    toast('Organization settings saved', 'success');
  };

  const saveNotifSettings = () => {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(settings));
    toast('Notification preferences saved', 'success');
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.next) { toast('Please fill in all password fields', 'error'); return; }
    if (pwForm.next.length < 6) { toast('New password must be at least 6 characters', 'error'); return; }
    if (pwForm.next !== pwForm.confirm) { toast('New passwords do not match', 'error'); return; }
    setSavingPw(true);
    try {
      await api.auth.changePassword(pwForm.current, pwForm.next);
      toast('Password updated successfully', 'success');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update password', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">Settings</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Manage your organization and application preferences</p>
      </div>

      {checklistOpen && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 via-ink-950 to-brand-950 p-5 shadow-pop">
          <div className="pattern-dots absolute inset-0 opacity-40" />
          <div className="absolute -right-14 -top-14 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                  <Rocket className="h-5 w-5 text-brand-300" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-white">Deploying this for a new company?</h2>
                  <p className="text-xs text-white/60">This same system can be relaunched for any company — just walk through this checklist.</p>
                </div>
              </div>
              <button onClick={() => { setChecklistOpen(false); localStorage.setItem('srujan_setup_checklist_dismissed', 'true'); }} className="rounded-lg px-2 py-1 text-xs text-white/50 hover:bg-white/10 hover:text-white">
                Dismiss
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Building2, title: 'Company details', desc: 'Set name, email, phone & address in Organization tab' },
                { icon: Image, title: 'Logo', desc: 'Replace public/logo.png with the new brand mark' },
                { icon: MapPin, title: 'Office geofence', desc: 'Set real office coordinates in server/.env' },
                { icon: Users, title: 'Departments & team', desc: 'Update departments in seed.js, then add employees' },
              ].map((step) => (
                <div key={step.title} className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10 backdrop-blur-sm">
                  <step.icon className="h-4 w-4 text-brand-300" />
                  <p className="mt-2 text-sm font-semibold text-white">{step.title}</p>
                  <p className="mt-0.5 text-xs text-white/50">{step.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-white/40">Full step-by-step guide: see README.md at the project root.</p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        {/* Sidebar nav */}
        <Card className="h-fit p-2">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active === s.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800'
              )}
            >
              <s.icon className="h-[18px] w-[18px]" /> {s.label}
            </button>
          ))}
        </Card>

        {/* Content */}
        <div className="space-y-5">
          {active === 'organization' && (
            <Card className="p-6">
              <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Organization Details</h2>
              <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">Your company information and branding</p>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
                  <img src="/logo.png" alt="Logo" className="h-12 w-12" />
                </div>
                <div>
                  <Button variant="outline" size="sm" disabled title="Logo upload isn't available in this version yet">Upload New Logo</Button>
                  <p className="mt-1 text-xs text-ink-400">Coming soon — PNG or SVG, max 2MB</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Company Name" value={orgForm.companyName} onChange={(e) => setOrgForm({ ...orgForm, companyName: e.target.value })} />
                <Input label="Email" type="email" value={orgForm.email} onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })} />
                <Input label="Phone" value={orgForm.phone} onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })} />
                <Input label="Address" value={orgForm.address} onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })} />
              </div>
              <div className="mt-5 flex justify-end">
                <Button onClick={saveOrgSettings}><Check className="h-4 w-4" /> Save Changes</Button>
              </div>
            </Card>
          )}

          {active === 'attendance' && (
            <Card className="p-6">
              <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Attendance Settings</h2>
              <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">Configure attendance rules and policies</p>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Office Start Time" type="time" defaultValue="09:30" />
                <Input label="Office End Time" type="time" defaultValue="18:30" />
                <Input label="Grace Period (minutes)" type="number" defaultValue="10" />
                <Input label="Minimum Working Hours" type="number" defaultValue="8" />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-ink-200 p-4 dark:border-ink-800">
                <div>
                  <p className="text-sm font-medium text-ink-800 dark:text-ink-200">Auto Checkout</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">Automatically check out employees at end of shift</p>
                </div>
                <Toggle checked={settings.autoCheckout} onChange={() => toggle('autoCheckout')} />
              </div>
              <div className="mt-5 flex justify-end">
                <Button onClick={() => toast('Attendance settings saved', 'success')}><Check className="h-4 w-4" /> Save Changes</Button>
              </div>
            </Card>
          )}

          {active === 'notifications' && (
            <Card className="p-6">
              <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Notification Preferences</h2>
              <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">Choose what notifications you receive</p>
              <div className="mt-5 space-y-3">
                {[
                  { key: 'emailNotifs' as const, label: 'Email Notifications', desc: 'Receive notifications via email' },
                  { key: 'attendanceAlerts' as const, label: 'Attendance Alerts', desc: 'Get alerted about attendance anomalies' },
                  { key: 'leaveNotifs' as const, label: 'Leave Notifications', desc: 'Notifications for leave requests and approvals' },
                  { key: 'reportNotifs' as const, label: 'Report Notifications', desc: 'Get notified when reports are ready' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-xl border border-ink-200 p-4 dark:border-ink-800">
                    <div>
                      <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{item.label}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">{item.desc}</p>
                    </div>
                    <Toggle checked={settings[item.key]} onChange={() => toggle(item.key)} />
                  </div>
                ))}
              </div>
              <div className="mt-5 flex justify-end">
                <Button onClick={saveNotifSettings}><Check className="h-4 w-4" /> Save Changes</Button>
              </div>
            </Card>
          )}

          {active === 'security' && (
            <div className="space-y-5">
              <Card className="p-6">
                <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Change Password</h2>
                <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">Update your account password</p>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="Current Password" type="password" placeholder="••••••••" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} />
                  <div />
                  <Input label="New Password" type="password" placeholder="••••••••" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} />
                  <Input label="Confirm Password" type="password" placeholder="••••••••" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
                </div>
                <div className="mt-5 flex justify-end">
                  <Button onClick={handleChangePassword} disabled={savingPw}>{savingPw ? 'Updating...' : 'Update Password'}</Button>
                </div>
              </Card>
              <Card className="p-6">
                <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Two-Factor Authentication</h2>
                <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">Add an extra layer of security to your account</p>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-ink-200 p-4 dark:border-ink-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 dark:bg-ink-800"><Shield className="h-5 w-5 text-ink-500" /></div>
                    <div>
                      <p className="text-sm font-medium text-ink-800 dark:text-ink-200">2FA is currently disabled</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">Protect your account with an authenticator app · Coming soon</p>
                    </div>
                  </div>
                  <Button variant="outline" disabled title="2FA isn't available in this version yet">Enable</Button>
                </div>
              </Card>
              <Card className="p-6">
                <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Active Sessions</h2>
                <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">Devices currently logged into your account</p>
                <div className="mt-4 space-y-2">
                  {[
                    { device: 'MacBook Pro · Chrome', location: 'San Francisco, CA', current: true },
                    { device: 'iPhone 15 · Safari', location: 'San Francisco, CA', current: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-ink-200 p-4 dark:border-ink-800">
                      <div>
                        <p className="text-sm font-medium text-ink-800 dark:text-ink-200">{s.device} {s.current && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">Current</span>}</p>
                        <p className="text-xs text-ink-500 dark:text-ink-400">{s.location}</p>
                      </div>
                      {!s.current && <Button variant="ghost" size="sm" onClick={() => toast('Session revoked', 'info')}>Revoke</Button>}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {active === 'appearance' && (
            <Card className="p-6">
              <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Appearance</h2>
              <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">Choose how the application looks</p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {([
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                      theme === opt.value ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10' : 'border-ink-200 hover:border-ink-300 dark:border-ink-700'
                    )}
                  >
                    <opt.icon className={cn('h-6 w-6', theme === opt.value ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400')} />
                    <span className={cn('text-sm font-medium', theme === opt.value ? 'text-brand-700 dark:text-brand-300' : 'text-ink-600 dark:text-ink-300')}>{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-ink-50 p-4 dark:bg-ink-800">
                <p className="text-xs text-ink-500 dark:text-ink-400">Theme changes apply instantly and are saved to your preferences.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
