/**
 * Ceylon Expand Admin Permission Registry
 * 
 * Centralized permission definitions to prevent drift and ensure consistency.
 * All admin permissions are defined here with strict typing.
 */

// Define permission domains and their allowed actions
export const PERMS = {
  users: ['view', 'edit', 'ban', 'delete'] as const,
  roles: ['view', 'assign', 'create_custom', 'delete'] as const,
  trips: ['view', 'moderate', 'delete', 'edit'] as const,
  reports: ['view', 'resolve', 'escalate', 'delete'] as const,
  chat: ['view', 'moderate', 'purge', 'block'] as const,
  logs: ['view', 'export', 'delete'] as const,
  settings: ['view', 'edit', 'secrets'] as const,
  taxonomy: ['view', 'edit', 'create', 'delete'] as const,
  media: ['view', 'upload', 'delete', 'moderate'] as const,
} as const;

// Type definitions
export type PermDomain = keyof typeof PERMS;
export type PermKey = `${PermDomain}.${typeof PERMS[PermDomain][number]}`;

// Flatten all permissions into a single array
export const ALL_PERMS: PermKey[] = Object.entries(PERMS).flatMap(([domain, actions]) =>
  actions.map(action => `${domain}.${action}` as PermKey)
);

// PermKey type is already exported above

// Permission categories for UI grouping
export const PERMISSION_CATEGORIES = {
  'User Management': [
    'users.view',
    'users.edit', 
    'users.ban',
    'users.delete'
  ] as PermKey[],
  'Content Moderation': [
    'trips.view',
    'trips.moderate',
    'trips.edit',
    'trips.delete',
    'media.view',
    'media.moderate',
    'media.delete'
  ] as PermKey[],
  'Chat & Reports': [
    'chat.view',
    'chat.moderate',
    'chat.purge',
    'chat.block',
    'reports.view',
    'reports.resolve',
    'reports.escalate',
    'reports.delete'
  ] as PermKey[],
  'System Administration': [
    'roles.view',
    'roles.assign', 
    'roles.create_custom',
    'roles.delete',
    'logs.view',
    'logs.export',
    'logs.delete',
    'settings.view',
    'settings.edit',
    'settings.secrets'
  ] as PermKey[],
  'Platform Content': [
    'taxonomy.view',
    'taxonomy.edit',
    'taxonomy.create',
    'taxonomy.delete',
    'media.view',
    'media.upload'
  ] as PermKey[]
} as const;

// Destructive actions requiring step-up authentication
export const DESTRUCTIVE_PERMISSIONS: PermKey[] = [
  'users.ban',
  'users.delete',
  'trips.delete',
  'chat.purge',
  'reports.delete',
  'logs.delete',
  'settings.secrets',
  'roles.delete',
  'taxonomy.delete',
  'media.delete'
];

// Default role permission sets
export const ROLE_DEFAULTS: Record<string, PermKey[]> = {
  superadmin: ALL_PERMS,
  
  admin: ALL_PERMS.filter(perm => 
    !perm.includes('settings.secrets') && 
    !perm.includes('roles.create_custom')
  ),
  
  moderator: [
    'users.view',
    'trips.view',
    'trips.moderate',
    'trips.edit',
    'reports.view',
    'reports.resolve', 
    'reports.escalate',
    'chat.view',
    'chat.moderate',
    'logs.view',
    'media.view',
    'media.moderate'
  ],
  
  user: [] // No admin permissions
};

// Helper functions
export function hasPermission(userPermissions: PermKey[], required: PermKey): boolean {
  return userPermissions.includes(required);
}

export function hasAnyPermission(userPermissions: PermKey[], required: PermKey[]): boolean {
  return required.some(perm => userPermissions.includes(perm));
}

export function hasAllPermissions(userPermissions: PermKey[], required: PermKey[]): boolean {
  return required.every(perm => userPermissions.includes(perm));
}

export function isDestructiveAction(permission: PermKey): boolean {
  return DESTRUCTIVE_PERMISSIONS.includes(permission);
}

export function getPermissionsByCategory(category: keyof typeof PERMISSION_CATEGORIES): PermKey[] {
  return PERMISSION_CATEGORIES[category];
}

export function validatePermissions(permissions: string[]): PermKey[] {
  const validPermissions: PermKey[] = [];
  const invalidPermissions: string[] = [];
  
  for (const perm of permissions) {
    if (ALL_PERMS.includes(perm as PermKey)) {
      validPermissions.push(perm as PermKey);
    } else {
      invalidPermissions.push(perm);
    }
  }
  
  if (invalidPermissions.length > 0) {
    console.warn('❌ Invalid permissions detected:', invalidPermissions);
    console.warn('Valid permissions are:', ALL_PERMS);
  }
  
  return validPermissions;
}

// Permission descriptions for UI
export const PERMISSION_DESCRIPTIONS: Record<PermKey, string> = {
  // Users
  'users.view': 'View user profiles and basic information',
  'users.edit': 'Edit user profiles and account details',  
  'users.ban': 'Ban/suspend user accounts',
  'users.delete': 'Permanently delete user accounts',
  
  // Roles
  'roles.view': 'View existing roles and permissions',
  'roles.assign': 'Assign roles to users',
  'roles.create_custom': 'Create custom roles with specific permissions',
  'roles.delete': 'Delete custom roles',
  
  // Trips  
  'trips.view': 'View all trips and trip details',
  'trips.moderate': 'Hide/show trips, manage trip visibility',
  'trips.edit': 'Edit trip content and details',
  'trips.delete': 'Permanently delete trips',
  
  // Reports
  'reports.view': 'View reported content and safety reports',
  'reports.resolve': 'Mark reports as resolved',
  'reports.escalate': 'Escalate reports to higher authority',
  'reports.delete': 'Delete reports from system',
  
  // Chat
  'chat.view': 'View chat conversations and messages',
  'chat.moderate': 'Hide inappropriate messages',
  'chat.purge': 'Permanently delete chat conversations',
  'chat.block': 'Block users from chat features',
  
  // Logs
  'logs.view': 'View system audit logs and admin actions',
  'logs.export': 'Export audit logs for compliance',
  'logs.delete': 'Delete old audit log entries',
  
  // Settings
  'settings.view': 'View system configuration settings',
  'settings.edit': 'Modify system settings and configuration',
  'settings.secrets': 'Access and modify sensitive system secrets',
  
  // Taxonomy
  'taxonomy.view': 'View categories, regions, and taxonomies',
  'taxonomy.edit': 'Modify existing taxonomies',
  'taxonomy.create': 'Create new categories and taxonomies',
  'taxonomy.delete': 'Delete taxonomy entries',
  
  // Media
  'media.view': 'View uploaded media and assets',
  'media.upload': 'Upload new media assets',
  'media.moderate': 'Review and moderate uploaded content',
  'media.delete': 'Delete media assets'
};