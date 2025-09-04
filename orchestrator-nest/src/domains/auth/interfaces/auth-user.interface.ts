export interface AuthUser {
  id: string;
  userId: string; // Alias for id for compatibility
  email: string;
  firstName?: string;
  lastName?: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  active?: boolean;
}
