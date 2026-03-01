export default defineNuxtRouteMiddleware(async () => {
  const { accessToken, fetchMe, user } = useAuth();
  if (!accessToken.value) {
    return navigateTo('/login');
  }
  if (!user.value) {
    try {
      await fetchMe();
    } catch {
      return navigateTo('/login');
    }
  }
});
