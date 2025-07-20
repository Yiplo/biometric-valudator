import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  username: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
}

export const auth = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await apiRequest("POST", "/api/auth/login", { username, password });
    return response.json();
  },

  getStoredUser(): User | null {
    const stored = localStorage.getItem("biometric_user");
    return stored ? JSON.parse(stored) : null;
  },

  setStoredUser(user: User): void {
    localStorage.setItem("biometric_user", JSON.stringify(user));
  },

  clearStoredUser(): void {
    localStorage.removeItem("biometric_user");
  },

  isAuthenticated(): boolean {
    return !!this.getStoredUser();
  }
};
