export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
  HR_MANAGER = 'hr_manager',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId?: string;
}
