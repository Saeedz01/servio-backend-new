import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { createBookingSchema, type CreateBookingDto } from './dto/create-booking.dto.js';
import { listBookingsSchema, type ListBookingsQuery } from './dto/list-bookings.dto.js';
import { updateBookingSchema, type UpdateBookingDto } from './dto/update-booking.dto.js';
import { BookingsService } from './bookings.service.js';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body({ schema: createBookingSchema }) dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Get()
  findAll(@Query({ schema: listBookingsSchema }) query: ListBookingsQuery) {
    return this.bookingsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body({ schema: updateBookingSchema }) dto: UpdateBookingDto) {
    return this.bookingsService.update(id, dto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.bookingsService.cancel(id);
  }
}
