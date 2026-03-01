import { Controller, Get, Inject, Param, Query } from '@nestjs/common';

import { ListToursDto } from './dto/list-tours.dto.js';
import { MapToursDto } from './dto/map-tours.dto.js';
import { ToursService } from './tours.service.js';

@Controller('tours')
export class ToursController {
  constructor(@Inject(ToursService) private readonly toursService: ToursService) {}

  @Get()
  async list(@Query() query: ListToursDto) {
    return this.toursService.listPublicTours(query);
  }

  @Get('map')
  async map(@Query() query: MapToursDto) {
    return this.toursService.mapTours(query);
  }

  @Get(':id')
  async byId(@Param('id') id: string) {
    return this.toursService.getTourById(id);
  }

  @Get(':id/availability')
  async availability(@Param('id') id: string) {
    return this.toursService.getAvailability(id);
  }
}
