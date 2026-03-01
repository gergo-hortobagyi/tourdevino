interface MyReview {
  id: string;
  bookingId: string | null;
  tourId: string;
  rating: number;
  comment: string | null;
  updatedAt: string;
  tour: {
    id: string;
    slug: string;
    title: string;
    region: string;
  };
}

export function useMyReviews() {
  return useAsyncData('my-reviews', async () => {
    return useApi<{ data: MyReview[]; meta: { total: number } }>('/reviews/me');
  });
}

export async function useCreateReview(input: { bookingId: string; tourId: string; rating: number; comment?: string }) {
  return useApi<MyReview>('/reviews', {
    method: 'POST',
    body: input
  });
}

export async function useUpdateReview(reviewId: string, input: { rating?: number; comment?: string }) {
  return useApi<MyReview>(`/reviews/${reviewId}`, {
    method: 'PATCH',
    body: input
  });
}

export async function useDeleteReview(reviewId: string) {
  return useApi<{ success: true }>(`/reviews/${reviewId}`, {
    method: 'DELETE'
  });
}
