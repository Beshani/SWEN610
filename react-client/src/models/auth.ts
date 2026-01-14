export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  session_key: string;
  member_id: number;
  username: string;
  email: string;
  is_admin: boolean;
}

export interface MeResponse {
  member_id: number;
  username: string;
  email: string;
  is_admin: boolean;
}
