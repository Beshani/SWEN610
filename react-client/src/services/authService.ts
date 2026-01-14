import { apiClient } from '../api/ApiClient';
import type { LoginRequest, LoginResponse, MeResponse } from '../models/auth';

export const authService = {
  login(payload: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse, LoginRequest>('/login', payload);
  },

  logout(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/logout');
  },

  getMe(): Promise<MeResponse> {
    return apiClient.get<MeResponse>('/auth/me');
  },
  
};
