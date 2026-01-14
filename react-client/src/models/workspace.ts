import type { Task } from "./task";
import type { WorkspaceUser } from "./user";

export interface Board {
  id: number;
  name: string;
  description: string;
  workspaceId: number;
  workspaceSlug: string;
  taskCount: number;
}

export interface Workspace {
  id: number;
  name: string;
  description: string;
  slug: string;
  creator: string;
  boards: Board[];
  boardCount: number;
}

export interface WorkspaceAccess {
  id: number;
  name: string;
  description: string;
  slug: string;
  users: WorkspaceUser[];   // user ids
  boardCount: number;
}

export interface WorkspaceAccessResponse {
  status: string;
  workspaces: WorkspaceAccess[];
}

export interface WorkspaceResponse {
  status: string;
  member_id: number;
  n_workspaces: number;
  workspaces: Workspace[];
}


export interface BoardAccess {
  id: number;
  name: string;
  description: string;
  workspaceId: number;
  workspaceName: string;
  users: WorkspaceUser[];   // user ids
  taskCount: number;
  tasks: Task[];
}

export interface BoardAccessResponse {
  status: string; 
  member_id: number; 
  workspace_id: number;
  board: BoardAccess;
}

export interface AdminBoardAccessResponse {
  status: string; 
  boards: BoardAccess[];
}

export interface BoardCreateRequest {
  name: string;
  description?: string;
}

export interface BoardUpdateRequest {
  name?: string;
  description?: string;
}

