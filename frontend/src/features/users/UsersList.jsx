import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { usersApi } from '../../api/misc.api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/formatDate';
import { toast } from '../../lib/toast';
import PageHeader from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import UserFormModal from './UserFormModal';
import UserEditModal from './UserEditModal';

export default function UsersList() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    usersApi.list().then(setUsers).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleActive = async (user) => {
    try {
      await usersApi.setActive(user._id, !user.isActive);
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await usersApi.remove(deleteTarget._id);
      toast.success('User deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} src={u.avatarUrl} size="sm" />
          <div>
            <p className="font-medium text-ink">
              {u.name}
              {u._id === me.id && <span className="ml-1.5 text-xs font-normal text-ink-subtle">(you)</span>}
            </p>
            <p className="text-xs text-ink-subtle">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (u) => <span className="capitalize">{u.roleName.replace('_', ' ')}</span> },
    { key: 'lastLoginAt', header: 'Last Login', render: (u) => (u.lastLoginAt ? formatDate(u.lastLoginAt, 'MMM d, yyyy · h:mm a') : 'Never') },
    { key: 'status', header: 'Status', render: (u) => <Badge tone={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions',
      header: '',
      render: (u) =>
        u._id !== me.id && (
          <div className="flex items-center justify-end gap-1.5">
            <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditUser(u)} />
            <Button size="sm" variant={u.isActive ? 'outlineDanger' : 'secondary'} onClick={() => toggleActive(u)}>
              {u.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button size="sm" variant="ghost" icon={Trash2} className="text-danger hover:bg-danger-soft" onClick={() => setDeleteTarget(u)} />
          </div>
        ),
      className: 'text-right',
      headerClassName: 'text-right',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage staff accounts, roles and access."
        actions={
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>
            Add User
          </Button>
        }
      />
      <Card>
        <Table columns={columns} data={users} loading={loading} emptyTitle="No users yet" />
      </Card>

      <UserFormModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />
      <UserEditModal open={Boolean(editUser)} onClose={() => setEditUser(null)} user={editUser} onSaved={load} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this user?"
        description={deleteTarget ? `${deleteTarget.name} (${deleteTarget.email}) will be permanently removed. This can't be undone.` : ''}
        confirmLabel="Delete user"
      />
    </div>
  );
}
