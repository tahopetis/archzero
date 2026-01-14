import { useState } from 'react';
import { Shield, CheckCircle, XCircle } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export function PermissionsPage() {
  const [roles] = useState<Role[]>([
    {
      id: '1',
      name: 'Admin',
      permissions: [
        { id: '1', name: 'Create Cards', resource: 'cards', action: 'create', description: 'Create new architecture cards' },
        { id: '2', name: 'Edit Cards', resource: 'cards', action: 'edit', description: 'Edit existing architecture cards' },
        { id: '3', name: 'Delete Cards', resource: 'cards', action: 'delete', description: 'Delete architecture cards' },
        { id: '6', name: 'View Cards', resource: 'cards', action: 'view', description: 'View architecture cards' },
        { id: '4', name: 'Manage Users', resource: 'users', action: 'manage', description: 'Create, edit, and delete users' },
        { id: '5', name: 'Manage Roles', resource: 'roles', action: 'manage', description: 'Create, edit, and delete roles' },
        { id: '7', name: 'View Governance', resource: 'governance', action: 'view', description: 'View governance data' },
        { id: '8', name: 'Edit Governance', resource: 'governance', action: 'edit', description: 'Edit governance data' },
      ],
    },
    {
      id: '2',
      name: 'Editor',
      permissions: [
        { id: '1', name: 'Create Cards', resource: 'cards', action: 'create', description: 'Create new architecture cards' },
        { id: '2', name: 'Edit Cards', resource: 'cards', action: 'edit', description: 'Edit existing architecture cards' },
        { id: '6', name: 'View Cards', resource: 'cards', action: 'view', description: 'View architecture cards' },
        { id: '7', name: 'View Governance', resource: 'governance', action: 'view', description: 'View governance data' },
      ],
    },
    {
      id: '3',
      name: 'Viewer',
      permissions: [
        { id: '6', name: 'View Cards', resource: 'cards', action: 'view', description: 'View architecture cards' },
        { id: '7', name: 'View Governance', resource: 'governance', action: 'view', description: 'View governance data' },
      ],
    },
  ]);

  const allPermissions: Permission[] = [
    { id: '1', name: 'Create Cards', resource: 'cards', action: 'create', description: 'Create new architecture cards' },
    { id: '2', name: 'Edit Cards', resource: 'cards', action: 'edit', description: 'Edit existing architecture cards' },
    { id: '3', name: 'Delete Cards', resource: 'cards', action: 'delete', description: 'Delete architecture cards' },
    { id: '6', name: 'View Cards', resource: 'cards', action: 'view', description: 'View architecture cards' },
    { id: '4', name: 'Manage Users', resource: 'users', action: 'manage', description: 'Create, edit, and delete users' },
    { id: '5', name: 'Manage Roles', resource: 'roles', action: 'manage', description: 'Create, edit, and delete roles' },
    { id: '7', name: 'View Governance', resource: 'governance', action: 'view', description: 'View governance data' },
    { id: '8', name: 'Edit Governance', resource: 'governance', action: 'edit', description: 'Edit governance data' },
  ];

  const hasPermission = (role: Role, permissionId: string) => {
    return role.permissions.some((p) => p.id === permissionId);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Shield size={32} className="text-blue-600" />
          <h1 className="text-3xl font-bold" data-testid="permissions-page-title">
            Permission Matrix
          </h1>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full" data-testid="permissions-matrix">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[200px]">
                Permission
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]"
                  data-testid={`permissions-header-role-${role.id}`}
                >
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {allPermissions.map((permission) => (
              <tr key={permission.id} data-testid={`permission-row-${permission.id}`}>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white" data-testid={`permission-name-${permission.id}`}>
                      {permission.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400" data-testid={`permission-description-${permission.id}`}>
                      {permission.description}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {permission.resource}:{permission.action}
                    </div>
                  </div>
                </td>
                {roles.map((role) => (
                  <td
                    key={role.id}
                    className="px-6 py-4 text-center"
                    data-testid={`permission-cell-${permission.id}-${role.id}`}
                  >
                    {hasPermission(role, permission.id) ? (
                      <CheckCircle
                        size={24}
                        className="inline-block text-green-600 dark:text-green-400"
                        data-testid={`permission-granted-${permission.id}-${role.id}`}
                      />
                    ) : (
                      <XCircle
                        size={24}
                        className="inline-block text-gray-300 dark:text-gray-600"
                        data-testid={`permission-denied-${permission.id}-${role.id}`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">About Permission Matrix</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              This matrix shows all available permissions and which roles have access to them.
              Use the Role Management page to modify role permissions. Permissions follow the format resource:action
              (e.g., cards:edit allows editing architecture cards).
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Permissions Summary</h3>
          <div className="space-y-2">
            {allPermissions.reduce((acc, p) => {
              const resource = p.resource;
              if (!acc[resource]) acc[resource] = [];
              acc[resource].push(p);
              return acc;
            }, {} as Record<string, Permission[]>) &&
              Object.entries(
                allPermissions.reduce((acc, p) => {
                  const resource = p.resource;
                  if (!acc[resource]) acc[resource] = [];
                  acc[resource].push(p);
                  return acc;
                }, {} as Record<string, Permission[]>)
              ).map(([resource, perms]) => (
                <div key={resource} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">{resource}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{perms.length} permissions</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Role Coverage</h3>
          <div className="space-y-2">
            {roles.map((role) => (
              <div key={role.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400" data-testid={`role-coverage-name-${role.id}`}>
                  {role.name}
                </span>
                <span className="font-medium text-gray-900 dark:text-white" data-testid={`role-coverage-count-${role.id}`}>
                  {role.permissions.length} / {allPermissions.length}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Roles</span>
              <span className="font-medium text-gray-900 dark:text-white">{roles.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Permissions</span>
              <span className="font-medium text-gray-900 dark:text-white">{allPermissions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Grant Events</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {roles.reduce((sum, role) => sum + role.permissions.length, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
