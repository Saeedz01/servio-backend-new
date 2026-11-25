import { Controller, Get, Param } from '@nestjs/common';
import { ServicesService } from './services.service.js';

// Read-only: categories are managed by seeding, not by the API.
@Controller('service-categories')
export class ServiceCategoriesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll() {
    return this.servicesService.findAllCategories();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOneCategory(id);
  }
}
