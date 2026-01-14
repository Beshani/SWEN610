import { apiClient } from '../api/ApiClient';
import type {
  AdminBoardAccessResponse,
  Board,
  BoardAccess,
  BoardAccessResponse,
  BoardCreateRequest,
  BoardUpdateRequest,
} from '../models/workspace';

export const boardService = {
  /**
   * Fetch metadata + access info for a single board.
   */
  getBoard(workspaceId: number, boardId: number): Promise<BoardAccess> {
    return apiClient.get<BoardAccessResponse>(`/w/${workspaceId}/b/${boardId}`).then(a => a.board);
  },

  /**
   * Admin: Get access information for ALL boards.
   */
  getBoardAccess(): Promise<BoardAccess[]> {
    return apiClient.get<AdminBoardAccessResponse>('/w/b/auth/m').then(res => res.boards);
  },

  /**
   * Non-admin users: get boards they are allowed to see.
   */
  getBoardAccessForUser(userId: number): Promise<BoardAccess[]> {
    return apiClient.get<BoardAccess[]>(`/w/b/me`);
  },

  /**
   * Create a new board in a workspace.
   */
  createBoard(
    workspaceId: number,
    payload: BoardCreateRequest
  ): Promise<Board> {
    return apiClient.post<Board, BoardCreateRequest>(
      `/w/${workspaceId}/b/add`,
      payload
    );
  },

  /**
   * Update name/description of a board.
   */
  updateBoard(
    boardId: number,
    workspaceId: number,
    payload: BoardUpdateRequest
  ): Promise<Board> {
    return apiClient.put<Board, BoardUpdateRequest>(
      `/w/${workspaceId}/b/${boardId}/update`,
      payload
    );
  },

  /**
   * Delete a board.
   */
  deleteBoard(
    workspaceId: number,
    boardId: number,
  ): Promise<void> {
    return apiClient.delete<void>(`/w/${workspaceId}/b/${boardId}/delete`);
  },

  /**
   * Update allowed users for a board (optional).
   */
  updateBoardUsers(boardId: number, users: string[]): Promise<BoardAccess> {
    return apiClient.put<BoardAccess, { users: string[] }>(
      `/boards/${boardId}/users`,
      { users }
    );
  },

  addBoardUsers(workspace_id: number, board_id: number, user_names: string[]): Promise<Board> {
      return apiClient.post<Board>(`/w/${workspace_id}/b/${board_id}/ms/a`, { usernames: user_names });
    },
  
  removeBoardUsers(workspace_id: number, board_id: number, user_names: string[]): Promise<Board> {
      return apiClient.post<Board>(`/w/${workspace_id}/b/${board_id}/ms/d`, { usernames: user_names });
    },

};
