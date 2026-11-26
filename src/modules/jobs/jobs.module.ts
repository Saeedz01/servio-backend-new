import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller.js';
import { BidsController } from './bids.controller.js';
import { JobsService } from './jobs.service.js';
import { BidsService } from './bids.service.js';

@Module({
  controllers: [JobsController, BidsController],
  providers: [JobsService, BidsService],
})
export class JobsModule {}
