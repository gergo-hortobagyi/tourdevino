import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TourStatus } from '@prisma/client';

import { CacheService } from '../../common/services/cache.service.js';
import { PrismaService } from '../../common/services/prisma.service.js';
import { ListToursDto } from './dto/list-tours.dto.js';
import { MapToursDto } from './dto/map-tours.dto.js';

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

@Injectable()
export class ToursService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService
  ) {}

  async listPublicTours(query: ListToursDto): Promise<{ data: TourListItem[]; meta: Record<string, unknown> }> {
    const cacheKey = `tours:list:${JSON.stringify(query)}`;
    const cached = this.cache.get<{ data: TourListItem[]; meta: Record<string, unknown> }>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: Record<string, unknown> = {
      status: TourStatus.ACTIVE,
      ...(query.region ? { region: query.region } : {}),
      ...(query.query
        ? {
            OR: [
              { title: { contains: query.query, mode: 'insensitive' } },
              { description: { contains: query.query, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(query.priceMin !== undefined || query.priceMax !== undefined
        ? {
            priceCents: {
              ...(query.priceMin !== undefined ? { gte: Math.floor(query.priceMin * 100) } : {}),
              ...(query.priceMax !== undefined ? { lte: Math.floor(query.priceMax * 100) } : {})
            }
          }
        : {}),
      ...(query.duration ? { durationHours: { lte: query.duration } } : {})
    };

    const orderBy = this.orderByForSort(query.sort);
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 12);

    const [total, tours] = await this.prisma.$transaction([
      this.prisma.tour.count({ where }),
      this.prisma.tour.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          media: {
            orderBy: { sortOrder: 'asc' },
            take: 1
          },
          reviews: {
            select: { rating: true }
          }
        }
      })
    ]);

    const mapped = tours
      .map((tour): TourListItem => {
        const ratings = tour.reviews.map((review) => review.rating);
        const averageRating =
          ratings.length > 0 ? Number((ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length).toFixed(2)) : 0;

        return {
          id: tour.id,
          slug: tour.slug,
          title: tour.title,
          region: tour.region,
          description: tour.description,
          priceCents: tour.priceCents,
          durationHours: tour.durationHours,
          averageRating,
          reviewCount: ratings.length,
          heroImageUrl: tour.media[0]?.url ?? null,
          latitude: tour.latitude,
          longitude: tour.longitude
        };
      })
      .filter((tour) => (query.ratingMin !== undefined ? tour.averageRating >= query.ratingMin : true));

    const payload = {
      data: mapped,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    };

    this.cache.set(cacheKey, payload, 30_000);
    return payload;
  }

  async mapTours(query: MapToursDto): Promise<TourListItem[]> {
    const cacheKey = `tours:map:${JSON.stringify(query)}`;
    const cached = this.cache.get<TourListItem[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const tours = await this.prisma.tour.findMany({
      where: {
        status: TourStatus.ACTIVE,
        ...(query.region ? { region: query.region } : {}),
        latitude: { not: null },
        longitude: { not: null }
      },
      include: {
        media: { orderBy: { sortOrder: 'asc' }, take: 1 },
        reviews: { select: { rating: true } }
      }
    });

    const radius = query.radiusKm ?? 50;

    const mapped = tours
      .map((tour): TourListItem => {
        const ratings = tour.reviews.map((review) => review.rating);
        return {
          id: tour.id,
          slug: tour.slug,
          title: tour.title,
          region: tour.region,
          description: tour.description,
          priceCents: tour.priceCents,
          durationHours: tour.durationHours,
          averageRating:
            ratings.length > 0 ? Number((ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length).toFixed(2)) : 0,
          reviewCount: ratings.length,
          heroImageUrl: tour.media[0]?.url ?? null,
          latitude: tour.latitude,
          longitude: tour.longitude
        };
      })
      .filter((tour) => {
        if (query.lat === undefined || query.lng === undefined || tour.latitude === null || tour.longitude === null) {
          return true;
        }
        return this.distanceKm(query.lat, query.lng, tour.latitude, tour.longitude) <= radius;
      });

    this.cache.set(cacheKey, mapped, 30_000);
    return mapped;
  }

  async getTourById(id: string) {
    const tour = await this.prisma.tour.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        status: TourStatus.ACTIVE
      },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        schedules: { orderBy: { startsAt: 'asc' }, take: 5 },
        availability: { orderBy: { date: 'asc' }, take: 7 },
        reviews: {
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 6
        }
      }
    });

    if (!tour) {
      throw new NotFoundException({ code: 'TOUR_NOT_FOUND', message: 'Tour not found' });
    }

    const ratings = tour.reviews.map((review) => review.rating);

    return {
      id: tour.id,
      slug: tour.slug,
      title: tour.title,
      description: tour.description,
      region: tour.region,
      priceCents: tour.priceCents,
      durationHours: tour.durationHours,
      latitude: tour.latitude,
      longitude: tour.longitude,
      averageRating: ratings.length > 0 ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(2)) : 0,
      reviewCount: ratings.length,
      media: tour.media,
      schedules: tour.schedules,
      availability: tour.availability,
      reviews: tour.reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        authorName: `${review.user.firstName} ${review.user.lastName}`
      }))
    };
  }

  async getAvailability(id: string) {
    const tour = await this.prisma.tour.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        status: TourStatus.ACTIVE
      },
      select: {
        id: true,
        availability: {
          orderBy: { date: 'asc' },
          take: 30
        }
      }
    });

    if (!tour) {
      throw new NotFoundException({ code: 'TOUR_NOT_FOUND', message: 'Tour not found' });
    }

    return tour.availability.map((entry) => ({
      date: entry.date,
      capacity: entry.capacity,
      availableSpots: Math.max(0, entry.capacity - entry.bookedCount)
    }));
  }

  private orderByForSort(sort?: string) {
    switch (sort) {
      case 'price_asc':
        return { priceCents: 'asc' as const };
      case 'price_desc':
        return { priceCents: 'desc' as const };
      case 'newest':
        return { createdAt: 'desc' as const };
      default:
        return { updatedAt: 'desc' as const };
    }
  }

  private distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRadians = (value: number): number => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
