import { apiClient } from '../api/ApiClient';
import type { BaseComment, Task, TaskDBModel, TaskDBResponse, TaskPriority, TaskPriorityResponse, TaskResponse } from '../models/task';
import type { Status, StatusResponse } from '../models/task';

export const taskService = {
  getTasksForBoard(workspaceId: number, boardId: number): Promise<Task[]> {
    return apiClient.get<Task[]>(`/w/${workspaceId}/b/${boardId}/t`);
  },

  getTask(workspaceId: number, boardId: number, taskId: number): Promise<Task> {
    return apiClient.get<TaskDBResponse>(`/w/${workspaceId}/b/${boardId}/t/${taskId}`).then(t => t.task);
  },

  updateTasksForBoard(boardId: number, tasks: Task[]): Promise<Task[]> {
    // e.g., bulk update endpoint
    return apiClient.put<Task[], Task[]>(`/boards/${boardId}/tasks`, tasks);
  },

  // individual CRUD examples
  createTask(workspaceId: number, boardId: number, payload: Partial<Task>): Promise<TaskDBModel> {
    return apiClient.post<TaskResponse>(`/w/${workspaceId}/b/${boardId}/t`, payload).then(t => t.task);
  },

  updateTask(workspaceId: number, boardId: number, taskId: number, payload: Partial<Task>): Promise<Task> {
    return apiClient.put<Task, Partial<Task>>(
      `/w/${workspaceId}/b/${boardId}/t/${taskId}/update`,
      payload,
    );
  },

  createComment(workspaceId: number, boardId: number, taskId: number, payload: Partial<BaseComment>): Promise<Comment> {
    return apiClient.post<Comment, Partial<BaseComment>>(
      `/w/${workspaceId}/b/${boardId}/t/${taskId}/comments`,
      payload,
    );
  },

  deleteTask(workspaceId: number, boardId: number, taskId: number): Promise<void> {
    return apiClient.delete<void>(`/w/${workspaceId}/b/${boardId}/t/${taskId}/delete`);
  },

  async getPriorities(): Promise<TaskPriority[]> {
    return apiClient.get<TaskPriorityResponse>('/w/t/priorities').then((res) => res.task_priorities);
  },

  async getStatuses(): Promise<Status[]> {
    return apiClient.get<StatusResponse>("/w/t/status").then((res) => res.statuses);
  },

  bulkAddTaskCategories(workspaceId: number, 
                    boardId: number, 
                    taskId: number, 
                    categoryIds: number[]): Promise<Task> {
    return apiClient.post<Task>(`/w/${workspaceId}/b/${boardId}/t/${taskId}/cats/a`, { category_ids: categoryIds });
  },

  bulkRemoveTaskCategories(workspaceId: number, 
                      boardId: number, 
                      taskId: number, 
                      categoryIds: number[]): Promise<Task> {
    return apiClient.post<Task>(`/w/${workspaceId}/b/${boardId}/t/${taskId}/cats/d`, { category_ids: categoryIds });
  }

};
