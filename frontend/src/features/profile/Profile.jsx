import { useRef, useState } from 'react';
import { Save, KeyRound, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../lib/toast';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function Profile() {
  const { user, updateProfile, changePassword, uploadAvatar } = useAuth();
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error('Please choose a JPEG, PNG or WEBP image');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image must be 2MB or smaller');
      return;
    }
    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    if (!name || !email) {
      setProfileError('Name and email are required');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({ name, email });
      toast.success('Profile updated');
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <PageHeader title="My Profile" description="Update your account details and password." />

      <div className="flex max-w-2xl flex-col gap-4">
        <Card>
          <CardHeader title="Profile photo" />
          <CardBody className="flex items-center gap-5">
            <Avatar name={user.name} src={user.avatarUrl} size="lg" />
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button
                type="button"
                variant="secondary"
                icon={Camera}
                loading={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                Change photo
              </Button>
              <p className="mt-2 text-xs text-ink-subtle">JPEG, PNG or WEBP, up to 2MB.</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Profile details" subtitle={`Signed in as ${user.role.replace('_', ' ')}`} />
          <CardBody>
            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
              {profileError && <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger-soft-text">{profileError}</p>}
              <Input label="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <div>
                <Button type="submit" icon={Save} loading={savingProfile}>
                  Save changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Change password" subtitle="Choose a strong password you don't use elsewhere" />
          <CardBody>
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              {passwordError && <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger-soft-text">{passwordError}</p>}
              <Input label="Current password" type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="New password" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} hint="At least 8 characters" />
                <Input label="Confirm new password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <div>
                <Button type="submit" variant="secondary" icon={KeyRound} loading={savingPassword}>
                  Update password
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
