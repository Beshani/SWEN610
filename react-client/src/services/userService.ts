// services/userService.ts
import { apiClient } from '../api/ApiClient';
import type { User, UsersResponse, UserResponse, UpdateDeleteUserResponse } from '../models/user';

export type UserStatus = 'active' | 'suspended';

export const userService = {
  /**
   * Get all users (admin use case).
   */
  getUsers(): Promise<User[]> {
    return apiClient.get<UsersResponse>('/members').then((res) => res.response);
  },

  /**
   * Get a single user by ID.
   */
  getUser(userId: string): Promise<User> {
    return apiClient.get<UserResponse>(`/members/${userId}`).then((res) => res.response);
  },

  /**
   * Create a new user.
   */
  createUser(payload: {
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    handle: string;
    password: string;
  }): Promise<User> {
    return apiClient.post<User, typeof payload>('/members/add', payload);
  },

  /**
   * Sign Up a new user.
   */
  signUpUser(payload: {
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    handle: string;
    password: string;
  }): Promise<User> {
    return apiClient.post<User, typeof payload>('/members/signup', payload);
  },


  /**
   * Update an existing user.
   */
  updateUser(userId: number, payload: {
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    handle: string;
    new_password?: string;
  }): Promise<UpdateDeleteUserResponse> {
    return apiClient.put<UpdateDeleteUserResponse>(`/members/${userId}`, payload);
  },

  /**
   * Delete a user.
   */
  deleteUser(userId: number): Promise<UpdateDeleteUserResponse> {
    return apiClient.delete<UpdateDeleteUserResponse>(`/members/${userId}`);
  },

  /**
   * Change Status.
   */

  updateStatus(
    userId: number,
    status: UserStatus, // 'active' | 'suspended'
  ): Promise<UpdateDeleteUserResponse> {
    return apiClient.patch<UpdateDeleteUserResponse, { status: UserStatus }>(
      `/members/${userId}/status`,
      { status },
    );
  },
};



 