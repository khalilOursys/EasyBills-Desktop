// src/orders/orders.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  ParseIntPipe,
  Query,
  ValidationPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly ordersService: OrderService) {}

  @Post()
  async create(
    @Body(ValidationPipe) createOrderDto: CreateOrderDto,
    @Req() req: any,
  ) {
    // Get cashier ID from session/JWT (default to 1 for now)
    const cashierId = req.user?.id || 1;
    return await this.ordersService.create(createOrderDto, cashierId);
  }

  @Get()
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return await this.ordersService.findAll(page, limit);
  }

  @Get('today/stats')
  async getTodayStats() {
    return await this.ordersService.getTodayStats();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.ordersService.findOne(id);
  }

  @Get('number/:orderNumber')
  async findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return await this.ordersService.findByOrderNumber(orderNumber);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateStatusDto: UpdateOrderStatusDto,
  ) {
    return await this.ordersService.updateStatus(id, updateStatusDto);
  }
}
