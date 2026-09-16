import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { usersApi } from '../../api/misc.api';
import { toast } from '../../lib/toast';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'inventory_manager', label: 'Inventory Manager' },
];

export default function UserEditModal({ open, onClose, user, onSaved }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState('cashier');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRoleName(user.roleName);
    }
    setError('');
  }, [user, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email) {
      setError('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      await usersApi.update(user._id, { name, email, roleName });
      toast.success('User updated');
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit User"
      description={user?.email}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger-soft-text">{error}</p>}
        <Input label="Full name" required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Select label="Role" required value={roleName} onChange={(e) => setRoleName(e.target.value)}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  );
}
