// services/categoryService.ts
import { apiClient } from '../api/ApiClient';
import type { Category, CategoryResponse } from '../models/task';

export const categoryService = {
  /**
   * Get all task categories (To Do, In Progress, etc.).
   */
  getCategories(): Promise<Category[]> {
    return apiClient.get<CategoryResponse>('/c/all').then((r) => r.categories);
  },

  /**
   * Create a new category.
   */
  createCategory(payload: Partial<Category>): Promise<Category> {
    return apiClient.post<Category, Partial<Category>>('/c/add', payload);
  },

  /**
   * Update an existing category.
   */
  updateCategory(id: number, payload: Partial<Category>): Promise<Category> {
    return apiClient.put<Category, Partial<Category>>(`/c/${id}`, payload);
  },

  /**
   * Delete a category.
   */
  deleteCategory(id: number): Promise<void> {
    return apiClient.delete<void>(`/c/${id}`);
  },
};
