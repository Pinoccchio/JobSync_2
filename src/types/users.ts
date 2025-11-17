// User Management Type Definitions

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'ADMIN' | 'HR' | 'PESO' | 'APPLICANT';
  status: 'active' | 'inactive';
  phone: string | null;
  profile_image_url: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'HR' | 'PESO';
}

export interface UpdateUserRequest {
  full_name?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  reason?: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
