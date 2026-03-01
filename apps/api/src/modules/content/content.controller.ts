import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { ContentService } from './content.service.js';
import { ContactDto } from './dto/contact.dto.js';

@Controller()
export class ContentController {
  constructor(@Inject(ContentService) private readonly contentService: ContentService) {}

  @Get('content/:slug')
  async pageBySlug(@Param('slug') slug: string) {
    return this.contentService.pageBySlug(slug);
  }

  @Get('faq')
  async faq() {
    return this.contentService.faq();
  }

  @Post('contact')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async contact(@Body() dto: ContactDto) {
    return this.contentService.contact(dto);
  }
}
