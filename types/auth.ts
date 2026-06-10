export interface Role {
  id: string;
  name: string;
  guard_name: string;
  permissions?: string;
}

export interface User {
  id: number;
  name: string;
  email: string | null;
  username: string | null;
  phone: string | null;
  roles?: Role[] | null;
  created_at?: string | null;
  orders_count?: number;
  status?: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: string | number;
}

export interface LoginResponseData extends AuthTokens {
  user: User;
}
