import { apiClient } from '../api/ApiClient';
import type { Category } from '../models/task';
import type {
  Workspace,
  WorkspaceAccess,
  WorkspaceResponse,
  BoardAccess,
  WorkspaceAccessResponse,
} from '../models/workspace';

export const workspaceService = {
  getWorkspacesForUser(user_id: number): Promise<Workspace[]> {
    return apiClient.get<WorkspaceResponse>(`/w/me`).then((res) => res.workspaces);
  },

  getAdminWorkspaces(): Promise<Workspace[]> {
    return apiClient.get<WorkspaceResponse>('/w/auth').then((res) => res.workspaces);
  },

  getAdminWorkspaceAccess(): Promise<WorkspaceAccess[]> {
    return apiClient.get<WorkspaceAccessResponse>('/w/auth/m').then((res) => res.workspaces);
  },

  getWorkspaceAccess(workspaceId: number, userId: number): Promise<WorkspaceAccess> {
    return apiClient.get<WorkspaceAccess>(`/w/${workspaceId}/m/${userId}`);
  },

  getBoardAccess(): Promise<BoardAccess[]> {
    return apiClient.get<BoardAccess[]>('/w/b/auth/m');
  },

  getCategories(): Promise<Category[]> {
    return apiClient.get<Category[]>('/c/');
  },

  updateWorkspace(id: number, payload: Partial<Workspace>): Promise<Workspace> {
    return apiClient.put<Workspace, Partial<Workspace>>(`/w/${id}/update`, payload);
  },

  createWorkspace(payload: Partial<Workspace>): Promise<Workspace> {
    return apiClient.post<Workspace, Partial<Workspace>>('/w/create', payload);
  },

  deleteWorkspace(id: number): Promise<void> {
    return apiClient.delete<void>(`/w/${id}/delete`);
  },

  addWorkspaceUsers(workspace_id: number, user_names: string[]): Promise<Workspace> {
    return apiClient.post<Workspace>(`/w/${workspace_id}/ms/a`, { usernames: user_names });
  },

  removeWorkspaceUsers(workspace_id: number, user_names: string[]): Promise<Workspace> {
    return apiClient.post<Workspace>(`/w/${workspace_id}/ms/d`, { usernames: user_names });
  },

};
