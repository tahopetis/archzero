import { useState } from 'react';
import { Plus, Edit, Trash2, Shield, Check, X } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  userCount: number;
}

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'Admin',
      description: 'Full system access with all permissions',
      permissions: [
        { id: '1', name: 'Create Cards', resource: 'cards', action: 'create' },
        { id: '2', name: 'Edit Cards', resource: 'cards', action: 'edit' },
        { id: '3', name: 'Delete Cards', resource: 'cards', action: 'delete' },
        { id: '4', name: 'Manage Users', resource: 'users', action: 'manage' },
        { id: '5', name: 'Manage Roles', resource: 'roles', action: 'manage' },
      ],
      userCount: 1,
    },
    {
      id: '2',
      name: 'Editor',
      description: 'Can create and edit cards but cannot delete',
      permissions: [
        { id: '1', name: 'Create Cards', resource: 'cards', action: 'create' },
        { id: '2', name: 'Edit Cards', resource: 'cards', action: 'edit' },
      ],
      userCount: 3,
    },
    {
      id: '3',
      name: 'Viewer',
      description: 'Read-only access to cards and governance data',
      permissions: [
        { id: '6', name: 'View Cards', resource: 'cards', action: 'view' },
        { id: '7', name: 'View Governance', resource: 'governance', action: 'view' },
      ],
      userCount: 5,
    },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" data-testid="roles-page-title">
          Role Management
        </h1>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          data-testid="add-role-btn"
        >
          <Plus size={20} />
          Add Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            data-testid={`role-item-${role.id}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Shield size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white" data-testid={`role-name-${role.id}`}>
                    {role.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400" data-testid={`role-users-${role.id}`}>
                    {role.userCount} users
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingRole(role)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  data-testid={`edit-role-${role.id}`}
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this role?')) {
                      setRoles(roles.filter((r) => r.id !== role.id));
                    }
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600"
                  data-testid={`delete-role-${role.id}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4" data-testid={`role-description-${role.id}`}>
              {role.description}
            </p>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions</h4>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((permission) => (
                  <span
                    key={permission.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    data-testid={`role-permission-${role.id}-${permission.id}`}
                  >
                    <Check size={12} />
                    {permission.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isCreating && (
        <RoleForm
          onClose={() => setIsCreating(false)}
          onSave={(newRole) => {
            setRoles([...roles, { ...newRole, id: Date.now().toString(), userCount: 0 }]);
            setIsCreating(false);
          }}
        />
      )}

      {editingRole && (
        <RoleForm
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onSave={(updatedRole) => {
            setRoles(roles.map((r) => (r.id === editingRole.id ? { ...r, ...updatedRole } : r)));
            setEditingRole(null);
          }}
        />
      )}
    </div>
  );
}

interface RoleFormProps {
  role?: Role;
  onClose: () => void;
  onSave: (role: Omit<Role, 'id' | 'userCount'>) => void;
}

function RoleForm({ role, onClose, onSave }: RoleFormProps) {
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');

  const availablePermissions: Permission[] = [
    { id: '1', name: 'Create Cards', resource: 'cards', action: 'create' },
    { id: '2', name: 'Edit Cards', resource: 'cards', action: 'update' }, // Changed from 'edit' to 'update' to match tests
    { id: '3', name: 'Delete Cards', resource: 'cards', action: 'delete' },
    { id: '4', name: 'View Cards', resource: 'cards', action: 'read' }, // Changed from 'view' to 'read' to match tests
    { id: '5', name: 'Manage Users', resource: 'users', action: 'manage' },
    { id: '6', name: 'Manage Roles', resource: 'roles', action: 'manage' },
    { id: '7', name: 'View Governance', resource: 'governance', action: 'view' },
    { id: '8', name: 'Edit Governance', resource: 'governance', action: 'edit' },
  ];

  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(role?.permissions.map((p) => p.id) || [])
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const permissions = availablePermissions.filter((p) => selectedPermissions.has(p.id));
    onSave({ name, description, permissions });
  };

  const togglePermission = (permissionId: string) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(permissionId)) {
      newSet.delete(permissionId);
    } else {
      newSet.add(permissionId);
    }
    setSelectedPermissions(newSet);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="role-form-modal">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{role ? 'Edit Role' : 'Create Role'}</h2>
        <form onSubmit={handleSubmit} data-testid="role-form">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Role Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="role-name"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              data-testid="role-description"
              rows={3}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Permissions</label>
            <div className="grid grid-cols-2 gap-2">
              {availablePermissions.map((permission) => (
                <label
                  key={permission.id}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPermissions.has(permission.id)
                      ? 'bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-600'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.has(permission.id)}
                    onChange={() => togglePermission(permission.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    data-testid={`perm-${permission.resource}-${permission.action}`}
                    id={`perm-${permission.resource}-${permission.action}`}
                  />
                  <span className="text-sm">{permission.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              data-testid="cancel-role-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              data-testid="save-role-btn"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
