export default defineNuxtRouteMiddleware(async () => {
  const { fetchMe, user } = useAuth();
  await fetchMe();
  if (!user.value || user.value.role !== 'CLIENT') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }
});
