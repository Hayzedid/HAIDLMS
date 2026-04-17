export type UserRole = 'student' | 'instructor' | 'admin';

export interface User {
  id: string;
  email: string;
  password_hash: string | null;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  mfa_secret: string | null;
  mfa_enabled: boolean;
  failed_login_attempts: number;
  locked_until: Date | null;
  organization_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId?: string;
}

export interface RegisterBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'student' | 'instructor'; // admin created only by existing admin
}

export interface LoginBody {
  email: string;
  password: string;
  mfaCode?: string;
}
