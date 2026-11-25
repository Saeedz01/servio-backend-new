import { Controller, Get, Param } from '@nestjs/common';
import { ServicesService } from './services.service.js';

// Read-only: areas are managed by seeding, not by the API.
@Controller('service-areas')
export class ServiceAreasController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll() {
    return this.servicesService.findAllAreas();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOneArea(id);
  }
}
