import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { createBidSchema, type CreateBidDto } from './dto/create-bid.dto.js';
import { updateBidSchema, type UpdateBidDto } from './dto/update-bid.dto.js';
import { listBidsSchema, type ListBidsQuery } from './dto/list-bids.dto.js';
import { BidsService } from './bids.service.js';

@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  create(@Body({ schema: createBidSchema }) dto: CreateBidDto) {
    return this.bidsService.create(dto);
  }

  @Get()
  findAll(@Query({ schema: listBidsSchema }) query: ListBidsQuery) {
    return this.bidsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bidsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body({ schema: updateBidSchema }) dto: UpdateBidDto) {
    return this.bidsService.update(id, dto);
  }

  @Post(':id/withdraw')
  withdraw(@Param('id') id: string) {
    return this.bidsService.withdraw(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bidsService.remove(id);
  }
}
