function toQueryString(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  return params.toString();
}

export function useAdminDashboard() {
  return useApi<Record<string, unknown>>('/admin/dashboard');
}

export function useAdminSettings() {
  return useApi<Record<string, unknown>>('/admin/settings');
}

export function useAdminUpdateSettings(input: Record<string, unknown>) {
  return useApi<Record<string, unknown>>('/admin/settings', {
    method: 'PATCH',
    body: input
  });
}

export function useAdminUsers(query: Record<string, string | number | undefined> = {}) {
  const qs = toQueryString(query);
  const config = useRuntimeConfig();
  const authToken = useCookie<string | null>('access_token');
  const path = qs ? `/admin/users?${qs}` : '/admin/users';
  return $fetch<{ data: Array<Record<string, unknown>>; meta?: Record<string, unknown> }>(`${config.public.apiBaseUrl}${path}`, {
    headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}
  });
}

export function useAdminUser(id: string) {
  return useApi<Record<string, unknown>>(`/admin/users/${id}`);
}

export function useAdminUpdateUserRole(id: string, role: 'CLIENT' | 'VENDOR' | 'ADMIN') {
  return useApi<Record<string, unknown>>(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: { role }
  });
}

export function useAdminUpdateUserStatus(id: string, nextStatus: 'ACTIVE' | 'BANNED') {
  return useApi<Record<string, unknown>>(`/admin/users/${id}/status`, {
    method: 'PATCH',
    body: { status: nextStatus }
  });
}

export function useAdminVendors(query: Record<string, string | number | undefined> = {}) {
  const qs = toQueryString(query);
  const config = useRuntimeConfig();
  const authToken = useCookie<string | null>('access_token');
  const path = qs ? `/admin/vendors?${qs}` : '/admin/vendors';
  return $fetch<{ data: Array<Record<string, unknown>>; meta?: Record<string, unknown> }>(`${config.public.apiBaseUrl}${path}`, {
    headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}
  });
}

export function useAdminVendor(id: string) {
  return useApi<Record<string, unknown>>(`/admin/vendors/${id}`);
}

export function useAdminApproveVendor(id: string, reason?: string) {
  return useApi<Record<string, unknown>>(`/admin/vendors/${id}/approve`, {
    method: 'PATCH',
    body: { reason }
  });
}

export function useAdminRejectVendor(id: string, reason?: string) {
  return useApi<Record<string, unknown>>(`/admin/vendors/${id}/reject`, {
    method: 'PATCH',
    body: { reason }
  });
}

export function useAdminTours(query: Record<string, string | number | undefined> = {}) {
  const qs = toQueryString(query);
  const config = useRuntimeConfig();
  const authToken = useCookie<string | null>('access_token');
  const path = qs ? `/admin/tours?${qs}` : '/admin/tours';
  return $fetch<{ data: Array<Record<string, unknown>>; meta?: Record<string, unknown> }>(`${config.public.apiBaseUrl}${path}`, {
    headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}
  });
}

export function useAdminTour(id: string) {
  return useApi<Record<string, unknown>>(`/admin/tours/${id}`);
}

export function useAdminCreateTour(input: Record<string, unknown>) {
  return useApi<Record<string, unknown>>('/admin/tours', {
    method: 'POST',
    body: input
  });
}

export function useAdminUpdateTour(id: string, input: Record<string, unknown>) {
  return useApi<Record<string, unknown>>(`/admin/tours/${id}`, {
    method: 'PATCH',
    body: input
  });
}

export function useAdminUpdateTourStatus(id: string, nextStatus: string) {
  return useApi<Record<string, unknown>>(`/admin/tours/${id}/status`, {
    method: 'PATCH',
    body: { status: nextStatus }
  });
}

export function useAdminBookings(query: Record<string, string | number | undefined> = {}) {
  const qs = toQueryString(query);
  const config = useRuntimeConfig();
  const authToken = useCookie<string | null>('access_token');
  const path = qs ? `/admin/bookings?${qs}` : '/admin/bookings';
  return $fetch<{ data: Array<Record<string, unknown>>; meta?: Record<string, unknown> }>(`${config.public.apiBaseUrl}${path}`, {
    headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}
  });
}

export function useAdminBooking(id: string) {
  return useApi<Record<string, unknown>>(`/admin/bookings/${id}`);
}

export function useAdminCancelBooking(id: string, reason?: string) {
  return useApi<Record<string, unknown>>(`/admin/bookings/${id}/cancel`, {
    method: 'PATCH',
    body: { reason }
  });
}

export function useAdminRefundBooking(bookingId: string, amountCents?: number, reason?: string) {
  return useApi<Record<string, unknown>>(`/admin/payments/${bookingId}/refund`, {
    method: 'POST',
    body: {
      amountCents,
      reason
    }
  });
}

export function useAdminContent(query: Record<string, string | number | undefined> = {}) {
  const qs = toQueryString(query);
  return useApi<Record<string, unknown>>(qs ? `/admin/content?${qs}` : '/admin/content');
}

export function useAdminCreateContent(input: Record<string, unknown>) {
  return useApi<Record<string, unknown>>('/admin/content', {
    method: 'POST',
    body: input
  });
}

export function useAdminUpdateContent(id: string, input: Record<string, unknown>) {
  return useApi<Record<string, unknown>>(`/admin/content/${id}`, {
    method: 'PATCH',
    body: input
  });
}

export function useAdminCreateFaq(input: Record<string, unknown>) {
  return useApi<Record<string, unknown>>('/admin/faq', {
    method: 'POST',
    body: input
  });
}

export function useAdminUpdateFaq(id: string, input: Record<string, unknown>) {
  return useApi<Record<string, unknown>>(`/admin/faq/${id}`, {
    method: 'PATCH',
    body: input
  });
}

export function useAdminDeleteFaq(id: string) {
  return useApi<{ success: true }>(`/admin/faq/${id}`, {
    method: 'DELETE'
  });
}

export function useAdminModerateReview(id: string) {
  return useApi<{ success: true }>(`/admin/reviews/${id}/moderate`, {
    method: 'PATCH',
    body: { action: 'REMOVE' }
  });
}

export function useAdminAnalyticsOverview() {
  return useApi<Record<string, unknown>>('/admin/analytics/overview');
}

export function useAdminRevenueReport(query: Record<string, string | number | undefined> = {}) {
  const qs = toQueryString(query);
  return useApi<Record<string, unknown>>(qs ? `/admin/reports/revenue?${qs}` : '/admin/reports/revenue');
}

export function useAdminConversionReport(query: Record<string, string | number | undefined> = {}) {
  const qs = toQueryString(query);
  return useApi<Record<string, unknown>>(qs ? `/admin/reports/conversion?${qs}` : '/admin/reports/conversion');
}
