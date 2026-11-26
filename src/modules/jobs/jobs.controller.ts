import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { createJobSchema, type CreateJobDto } from './dto/create-job.dto.js';
import { updateJobSchema, type UpdateJobDto } from './dto/update-job.dto.js';
import { listJobsSchema, type ListJobsQuery } from './dto/list-jobs.dto.js';
import { awardJobSchema, type AwardJobDto } from './dto/award-job.dto.js';
import { JobsService } from './jobs.service.js';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  create(@Body({ schema: createJobSchema }) dto: CreateJobDto) {
    return this.jobsService.create(dto);
  }

  @Get()
  findAll(@Query({ schema: listJobsSchema }) query: ListJobsQuery) {
    return this.jobsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body({ schema: updateJobSchema }) dto: UpdateJobDto) {
    return this.jobsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }

  @Post(':id/award')
  award(@Param('id') id: string, @Body({ schema: awardJobSchema }) dto: AwardJobDto) {
    return this.jobsService.award(id, dto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.jobsService.cancel(id);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.jobsService.complete(id);
  }
}
