interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
  status: 'ACTIVE' | 'BANNED';
  createdAt: string;
  updatedAt: string;
}

export const useProfile = () =>
  useAsyncData('profile', async () => {
    return useApi<UserProfile>('/users/me');
  });

export const useUpdateProfile = async (payload: { firstName?: string; lastName?: string }) => {
  return useApi<UserProfile>('/users/me', {
    method: 'PATCH',
    body: payload
  });
};
