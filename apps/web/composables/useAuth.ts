interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'CLIENT' | 'VENDOR' | 'ADMIN';
  };
}

export const useAuth = () => {
  const accessToken = useCookie<string | null>('access_token');
  const refreshToken = useCookie<string | null>('refresh_token');
  const user = useState<AuthPayload['user'] | null>('auth_user', () => null);

  const login = async (email: string, password: string): Promise<void> => {
    const data = await useApi<AuthPayload>('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    accessToken.value = data.accessToken;
    refreshToken.value = data.refreshToken;
    user.value = data.user;
  };

  const signup = async (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<void> => {
    const data = await useApi<AuthPayload>('/auth/signup', {
      method: 'POST',
      body: payload
    });
    accessToken.value = data.accessToken;
    refreshToken.value = data.refreshToken;
    user.value = data.user;
  };

  const fetchMe = async (): Promise<void> => {
    if (!accessToken.value) {
      user.value = null;
      return;
    }
    const profile = await useApi<AuthPayload['user'] & { role: AuthPayload['user']['role'] }>('/auth/me');
    user.value = profile;
  };

  const logout = async (): Promise<void> => {
    if (refreshToken.value) {
      await useApi<{ success: true }>('/auth/logout', {
        method: 'POST',
        body: { refreshToken: refreshToken.value }
      });
    }
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
  };

  return { accessToken, refreshToken, user, login, signup, fetchMe, logout };
};
