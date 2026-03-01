interface BookingPayload {
  tourId: string;
  scheduledAt: string;
  guestCount: number;
  specialRequests?: string;
}

interface BookingItem {
  id: string;
  status: string;
  guestCount: number;
  scheduledAt: string;
  tour: {
    id: string;
    slug: string;
    title: string;
    region: string;
  };
  canCancel: boolean;
  cancellationPolicyHours: number;
  cancellationReason: string | null;
}

interface PaymentIntentResponse {
  id: string;
  bookingId: string;
  paymentStatus: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  providerRef: string | null;
  amount: number;
  currency: string;
  updatedAt: string;
}

interface PaymentStatusResponse {
  paymentStatus: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  providerRef: string | null;
  amount: number;
  currency: string;
  updatedAt: string;
}

export const useCreateBooking = async (payload: BookingPayload) => {
  const idempotencyKey = crypto.randomUUID();
  return useApi<{ id: string; status: string; totalCents: number }>('/bookings', {
    method: 'POST',
    body: payload,
    headers: {
      'idempotency-key': idempotencyKey
    }
  });
};

export const useMyBookings = () =>
  useAsyncData('my-bookings', async () => {
    const config = useRuntimeConfig();
    const accessToken = useCookie<string | null>('access_token');
    const response = await $fetch<{ data: BookingItem[]; meta?: { total: number } }>(`${config.public.apiBaseUrl}/bookings/me`, {
      headers: accessToken.value ? { Authorization: `Bearer ${accessToken.value}` } : {}
    });

    const payload = {
      data: response.data,
      meta: response.meta ?? { total: response.data.length }
    };

    return payload;
  });

export const useCancelBooking = async (id: string) => {
  return useApi<{ id: string; status: string }>(`/bookings/${id}/cancel`, {
    method: 'PATCH'
  });
};

export const useCreatePaymentIntent = async (bookingId: string, idempotencyKey?: string) => {
  const key = idempotencyKey ?? crypto.randomUUID();
  return useApi<PaymentIntentResponse>('/payments/intents', {
    method: 'POST',
    body: {
      bookingId,
      idempotencyKey: key
    },
    headers: {
      'idempotency-key': key
    }
  });
};

export const usePaymentStatus = async (bookingId: string) => {
  return useApi<PaymentStatusResponse>(`/payments/${bookingId}/status`);
};

export const useSimulatePayment = async (bookingId: string, status: 'succeeded' | 'failed') => {
  return useApi<{ success: true }>(`/payments/${bookingId}/simulate`, {
    method: 'POST',
    body: { status }
  });
};
