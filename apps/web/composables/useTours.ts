interface TourListItem {
  id: string;
  slug: string;
  title: string;
  region: string;
  description: string;
  priceCents: number;
  durationHours: number;
  averageRating: number;
  reviewCount: number;
  heroImageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface TourDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  region: string;
  priceCents: number;
  durationHours: number;
  averageRating: number;
  reviewCount: number;
  latitude: number | null;
  longitude: number | null;
  media: Array<{ id: string; url: string; type: string }>;
  availability: Array<{ date: string; capacity: number; availableSpots: number }>;
}

interface TourReview {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T;
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const useToursSearch = (query: Ref<Record<string, string | number | undefined>>) =>
  useAsyncData(
    () => `tours-search-${JSON.stringify(query.value)}`,
    async () => {
      const config = useRuntimeConfig();
      const searchParams = new URLSearchParams();
      Object.entries(query.value).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.set(key, String(value));
        }
      });
      const response = await $fetch<{ data: TourListItem[]; meta: PaginatedResponse<TourListItem[]>['meta'] }>(
        `${config.public.apiBaseUrl}/tours?${searchParams.toString()}`
      );
      return response;
    },
    {
      watch: [query]
    }
  );

export const useToursMap = (region: Ref<string>) =>
  useAsyncData(
    () => `tours-map-${region.value}`,
    async () => {
      const config = useRuntimeConfig();
      const query = region.value ? `?region=${encodeURIComponent(region.value)}` : '';
      const response = await $fetch<{ data: TourListItem[] }>(`${config.public.apiBaseUrl}/tours/map${query}`);
      return response.data;
    },
    {
      watch: [region]
    }
  );

export const useTourDetail = (id: Ref<string>) =>
  useAsyncData(
    () => `tour-detail-${id.value}`,
    async () => {
      const config = useRuntimeConfig();
      const response = await $fetch<{ data: TourDetail }>(`${config.public.apiBaseUrl}/tours/${id.value}`);
      return response.data;
    },
    { watch: [id] }
  );

export const useTourReviews = (id: Ref<string>) =>
  useAsyncData(
    () => `tour-reviews-${id.value}`,
    async () => {
      const config = useRuntimeConfig();
      const response = await $fetch<{ data: TourReview[]; meta: { total: number } }>(`${config.public.apiBaseUrl}/tours/${id.value}/reviews`);
      return response;
    },
    { watch: [id] }
  );
