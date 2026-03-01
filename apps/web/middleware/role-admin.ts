export default defineNuxtRouteMiddleware(async () => {
  const { fetchMe, user } = useAuth();
  await fetchMe();
  if (!user.value || user.value.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }
});
