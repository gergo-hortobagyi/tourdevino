export default defineNuxtRouteMiddleware(async () => {
  const { fetchMe, user } = useAuth();
  await fetchMe();
  if (!user.value || user.value.role !== 'VENDOR') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }
});
