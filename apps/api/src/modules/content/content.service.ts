import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CacheService } from '../../common/services/cache.service.js';
import { PrismaService } from '../../common/services/prisma.service.js';
import { ContactDto } from './dto/contact.dto.js';

@Injectable()
export class ContentService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService
  ) {}

  async pageBySlug(slug: string) {
    const cacheKey = `content:page:${slug}`;
    const cached = this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) {
      return cached;
    }

    const page = await this.prisma.contentPage.findFirst({
      where: { slug, published: true }
    });

    if (!page) {
      throw new NotFoundException({ code: 'CONTENT_NOT_FOUND', message: 'Content page not found' });
    }

    this.cache.set(cacheKey, page, 60_000);
    return page;
  }

  async faq() {
    const cacheKey = 'content:faq:published';
    const cached = this.cache.get<{ data: unknown[]; meta: { total: number } }>(cacheKey);
    if (cached) {
      return cached;
    }

    const faq = await this.prisma.fAQ.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' }
    });

    const payload = {
      data: faq,
      meta: {
        total: faq.length
      }
    };

    this.cache.set(cacheKey, payload, 60_000);
    return payload;
  }

  async contact(dto: ContactDto): Promise<{ success: true }> {
    await this.prisma.contactSubmission.create({
      data: dto
    });

    return { success: true };
  }
}
