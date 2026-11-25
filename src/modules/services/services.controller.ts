import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { createServiceSchema, type CreateServiceDto } from './dto/create-service.dto.js';
import { updateServiceSchema, type UpdateServiceDto } from './dto/update-service.dto.js';
import { listServicesSchema, type ListServicesQuery } from './dto/list-services.dto.js';
import { ServicesService } from './services.service.js';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(@Body({ schema: createServiceSchema }) dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get()
  findAll(@Query({ schema: listServicesSchema }) query: ListServicesQuery) {
    return this.servicesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body({ schema: updateServiceSchema }) dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
