import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, X, ShieldCheck, Camera, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/user.service';
import { authService } from '../services/auth.service';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

const NOTIFICATION_TOGGLES = [
  { key: 'newJobs', label: 'New jobs', description: 'Get notified when jobs matching your feed are discovered.' },
  { key: 'highMatchJobs', label: 'High-match job alerts', description: 'Strong (85%+) AI matches for your profile.' },
  { key: 'interviewReminders', label: 'Interview reminders', description: 'Upcoming interviews and deadlines.' },
  { key: 'applicationUpdates', label: 'Application updates', description: 'Status changes on your tracked applications.' },
];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [skills, setSkills] = useState(user?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [prefs, setPrefs] = useState(user?.notificationPreferences || {
    newJobs: true, highMatchJobs: true, interviewReminders: true, applicationUpdates: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  // --- Email change (OTP) state ---
  const [emailStep, setEmailStep] = useState('idle'); // idle | otp-sent
  const [pendingNewEmail, setPendingNewEmail] = useState('');
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name,
      phone: user?.phone,
      location: user?.location,
      github: user?.github,
      linkedin: user?.linkedin,
      portfolio: user?.portfolio,
      expectedSalary: user?.expectedSalary,
    },
  });

  const { register: registerPw, handleSubmit: handlePwSubmit, reset: resetPw } = useForm();
  const {
    register: registerEmail, handleSubmit: handleEmailSubmit, reset: resetEmailForm,
  } = useForm();
  const { register: registerOtp, handleSubmit: handleOtpSubmit, reset: resetOtpForm } = useForm();

  const addSkill = () => {
    const value = skillInput.trim();
    if (value && !skills.includes(value)) setSkills((prev) => [...prev, value]);
    setSkillInput('');
  };

  const removeSkill = (skill) => setSkills((prev) => prev.filter((s) => s !== skill));

  const onSaveProfile = async (data) => {
    setSavingProfile(true);
    try {
      await userService.updateProfile({ ...data, skills });
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    setSavingPassword(true);
    try {
      await authService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed');
      resetPw();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const onRequestEmailChange = async (data) => {
    setRequestingOtp(true);
    try {
      await userService.requestEmailChange({ newEmail: data.newEmail, currentPassword: data.currentPassword });
      setPendingNewEmail(data.newEmail);
      setEmailStep('otp-sent');
      toast.success('Verification code sent to your new email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start email change');
    } finally {
      setRequestingOtp(false);
    }
  };

  const onVerifyEmailChange = async (data) => {
    setVerifyingOtp(true);
    try {
      await userService.verifyEmailChange(data.otp);
      await refreshUser();
      toast.success('Email address updated');
      setEmailStep('idle');
      resetEmailForm();
      resetOtpForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const onTogglePref = async (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSavingPrefs(true);
    try {
      await userService.updateNotificationPreferences(next);
    } catch (err) {
      setPrefs(prefs); // revert
      toast.error('Failed to update preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const onAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      toast.error('Only JPG, PNG, or WEBP images are supported');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      await userService.uploadProfilePicture(file);
      await refreshUser();
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const onRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      await userService.removeProfilePicture();
      await refreshUser();
      toast.success('Profile picture removed');
    } catch (err) {
      toast.error('Failed to remove image');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Profile & Settings</h1>
        <p className="text-sm text-ink/60 dark:text-paper/60">Manage your personal information and preferences.</p>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 font-display text-base font-semibold">Personal information</h3>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover ring-2 ring-paper-line dark:ring-ink-line"
              />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full bg-primary/10 font-display text-2xl font-semibold text-primary dark:bg-primary/20 dark:text-primary-light">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Change profile picture"
              className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-white shadow hover:bg-primary-dark"
            >
              <Camera size={13} />
            </button>
            <input ref={avatarInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={onAvatarSelect} />
          </div>
          <div>
            <p className="text-sm font-medium">Profile picture</p>
            <p className="text-xs text-ink/50 dark:text-paper/50">JPG, PNG, or WEBP. Max 2MB.</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => avatarInputRef.current?.click()} loading={uploadingAvatar}>
                Upload new
              </Button>
              {user?.profilePicture && (
                <Button size="sm" variant="ghost" onClick={onRemoveAvatar}>
                  <Trash2 size={13} /> Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full name" {...register('name')} />
            <Input label="Email" value={user?.email} disabled />
            <Input label="Phone" {...register('phone')} />
            <Input label="Location" {...register('location')} />
            <Input label="GitHub" placeholder="https://github.com/..." {...register('github')} />
            <Input label="LinkedIn" placeholder="https://linkedin.com/in/..." {...register('linkedin')} />
            <Input label="Portfolio" placeholder="https://..." {...register('portfolio')} />
            <Input label="Expected salary" placeholder="e.g. $100k - $120k" {...register('expectedSalary')} />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink/80 dark:text-paper/80">Skills</span>
            <div className="mb-2 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary dark:bg-primary/20 dark:text-primary-light">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill and press Enter"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              />
              <Button type="button" variant="secondary" onClick={addSkill}><Plus size={16} /></Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={savingProfile}>Save changes</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="mb-1 font-display text-base font-semibold">Change email address</h3>
        <p className="mb-4 text-xs text-ink/50 dark:text-paper/50">
          Current: <span className="font-medium text-ink dark:text-paper">{user?.email}</span>. We verify your
          password and send a code to the new address before changing anything.
        </p>

        {emailStep === 'idle' ? (
          <form onSubmit={handleEmailSubmit(onRequestEmailChange)} className="space-y-4">
            <Input label="New email address" type="email" {...registerEmail('newEmail', { required: true })} />
            <Input label="Current password" type="password" {...registerEmail('currentPassword', { required: true })} />
            <div className="flex justify-end">
              <Button type="submit" loading={requestingOtp}>Send verification code</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit(onVerifyEmailChange)} className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
              <ShieldCheck size={16} className="shrink-0 text-primary" />
              Enter the 6-digit code sent to <span className="font-medium">{pendingNewEmail}</span>
            </div>
            <Input label="Verification code" maxLength={6} {...registerOtp('otp', { required: true })} />
            <div className="flex justify-between">
              <Button type="button" variant="ghost" onClick={() => setEmailStep('idle')}>Cancel</Button>
              <Button type="submit" loading={verifyingOtp}>Confirm new email</Button>
            </div>
          </form>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-display text-base font-semibold">Change password</h3>
        <form onSubmit={handlePwSubmit(onChangePassword)} className="space-y-4">
          <Input label="Current password" type="password" {...registerPw('currentPassword', { required: true })} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="New password" type="password" {...registerPw('newPassword', { required: true, minLength: 8 })} />
            <Input label="Confirm new password" type="password" {...registerPw('confirmPassword', { required: true })} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={savingPassword}>Update password</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-display text-base font-semibold">Notification preferences</h3>
        <div className="divide-y divide-paper-line dark:divide-ink-line">
          {NOTIFICATION_TOGGLES.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-ink/50 dark:text-paper/50">{description}</p>
              </div>
              <button
                onClick={() => onTogglePref(key)}
                disabled={savingPrefs}
                aria-pressed={prefs[key]}
                aria-label={`Toggle ${label}`}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${prefs[key] ? 'bg-primary' : 'bg-paper-line dark:bg-ink-line'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-display text-base font-semibold">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Dark mode</p>
            <p className="text-xs text-ink/50 dark:text-paper/50">Switch between light and dark themes.</p>
          </div>
          <Button variant="secondary" onClick={toggleTheme}>
            {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
