export interface LoginUser {
  id: number;      // or number, depending on backend
  username: string;
  email: string;
  is_admin: boolean;
}

export class LoginUser {

  id: number;      // or number, depending on backend
  username: string;
  email: string;
  is_admin: boolean;

  constructor(member_id: number, username: string, email: string, is_admin: boolean) {
    this.id = member_id;
    this.username = username;
    this.email = email;
    this.is_admin = is_admin;
  }

}

export type UserStatus = "active" | "suspended";
export interface User {
  id: number;      // or number, depending on backend
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  handle: string;
  is_admin: boolean;
  status: UserStatus;
}

export interface UserPrivileges {
  userId: number;
  workspaceId?: number;
  boardId?: number;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface WorkspaceUser {
  id: number;      // or number, depending on backend
  username: string;
  first_name: string;
  last_name: string;
}

export interface UsersResponse{
  message: string;
  n_response: number; 
  response: User[];
}

export interface UserResponse{
  message: string;
  n_response: number; 
  response: User;
}

export interface UpdateDeleteUserResponse {
  message: string;
  member_id: number;
}
