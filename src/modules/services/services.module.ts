import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller.js';
import { ServiceCategoriesController } from './categories.controller.js';
import { ServiceAreasController } from './areas.controller.js';
import { ServicesService } from './services.service.js';

@Module({
  controllers: [ServicesController, ServiceCategoriesController, ServiceAreasController],
  providers: [ServicesService],
})
export class ServicesModule {}
