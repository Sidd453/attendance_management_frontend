export const ADMIN_ROLES = ['Super Admin', 'HR Admin', 'Manager'] as const;

export function isAdminRole(role?: string | null): boolean {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}
