// src/orders/orders.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto, cashierId: number) {
    // Start transaction
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Check stock availability
      for (const item of createOrderDto.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.productId} not found`,
          );
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          );
        }
      }

      // 2. Generate order number
      const orderNumber = await this.generateOrderNumber(prisma);

      // 3. Create order
      const order = await prisma.order.create({
        data: {
          orderNumber,
          subtotal: createOrderDto.subtotal,
          tax: createOrderDto.tax,
          total: createOrderDto.total,
          tableNumber: createOrderDto.tableNumber,
          notes: createOrderDto.notes,
          cashierId: cashierId,
          status: 'COMPLETED', // Auto-complete for POS
          items: {
            create: createOrderDto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
            })),
          },
          payments: {
            create: {
              amount: createOrderDto.payment.amount,
              method: createOrderDto.payment.method,
              change: createOrderDto.payment.change || 0,
            },
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          payments: true,
          cashier: true,
        },
      });

      // 4. Update product stock
      for (const item of createOrderDto.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return order;
    });
  }

  async updateOrder(
    id: number,
    updateOrderDto: UpdateOrderDto,
    cashierId: number,
  ) {
    // First, get the existing order
    const existingOrder = await this.findOne(id);

    if (existingOrder.status === 'COMPLETED') {
      throw new BadRequestException('Cannot update a completed order');
    }

    if (existingOrder.status === 'CANCELLED') {
      throw new BadRequestException('Cannot update a cancelled order');
    }

    return await this.prisma.$transaction(async (prisma) => {
      // 1. Restore stock from old items
      for (const item of existingOrder.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      // 2. Check stock availability for new items
      if (updateOrderDto.items) {
        for (const item of updateOrderDto.items) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new NotFoundException(
              `Product with ID ${item.productId} not found`,
            );
          }

          if (product.stock < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
            );
          }
        }
      }

      // 3. Delete old order items
      await prisma.orderItem.deleteMany({
        where: { orderId: id },
      });

      // 4. Delete old payments
      await prisma.orderPayment.deleteMany({
        where: { orderId: id },
      });

      // 5. Update order with new data
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          subtotal: updateOrderDto.subtotal ?? existingOrder.subtotal,
          tax: updateOrderDto.tax ?? existingOrder.tax,
          total: updateOrderDto.total ?? existingOrder.total,
          tableNumber: updateOrderDto.tableNumber ?? existingOrder.tableNumber,
          notes: updateOrderDto.notes ?? existingOrder.notes,
          cashierId: cashierId,
          status: updateOrderDto.status ?? existingOrder.status,
          items: {
            create: (updateOrderDto.items ?? existingOrder.items).map(
              (item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity,
              }),
            ),
          },
          payments: {
            create: {
              amount:
                updateOrderDto.payment?.amount ??
                existingOrder.payments[0]?.amount,
              method:
                updateOrderDto.payment?.method ??
                existingOrder.payments[0]?.method,
              change:
                updateOrderDto.payment?.change ??
                existingOrder.payments[0]?.change ??
                0,
            },
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          payments: true,
          cashier: true,
        },
      });

      // 6. Deduct new stock
      const itemsToDeduct = updateOrderDto.items ?? existingOrder.items;
      for (const item of itemsToDeduct) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return updatedOrder;
    });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  img: true,
                  category: true,
                },
              },
            },
          },
          payments: true,
          cashier: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.order.count(),
    ]);

    return {
      orders,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                img: true,
                reference: true,
                category: true,
              },
            },
          },
        },
        payments: true,
        cashier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
        cashier: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with number ${orderNumber} not found`);
    }

    return order;
  }

  async updateStatus(id: number, updateStatusDto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    // If cancelling order, restore stock
    if (
      updateStatusDto.status === 'CANCELLED' &&
      order.status !== 'CANCELLED'
    ) {
      await this.prisma.$transaction(async (prisma) => {
        // Restore stock for each item
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }

        // Update order status
        await prisma.order.update({
          where: { id },
          data: {
            status: updateStatusDto.status,
            notes: updateStatusDto.notes || order.notes,
          },
        });
      });
    } else {
      // Just update status
      return await this.prisma.order.update({
        where: { id },
        data: {
          status: updateStatusDto.status,
          notes: updateStatusDto.notes || order.notes,
        },
      });
    }

    return this.findOne(id);
  }

  async getTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await this.prisma.order.aggregate({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: 'COMPLETED',
      },
      _sum: {
        total: true,
      },
      _count: true,
    });

    const paymentMethods = await this.prisma.orderPayment.groupBy({
      by: ['method'],
      where: {
        order: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
          status: 'COMPLETED',
        },
      },
      _sum: {
        amount: true,
      },
    });

    return {
      totalSales: stats._sum.total || 0,
      totalOrders: stats._count,
      paymentMethods: paymentMethods.map((pm) => ({
        method: pm.method,
        amount: pm._sum.amount || 0,
      })),
    };
  }

  private async generateOrderNumber(prisma: any): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: `ORD-${dateStr}`,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastSeq + 1;
    }

    return `ORD-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }
}
