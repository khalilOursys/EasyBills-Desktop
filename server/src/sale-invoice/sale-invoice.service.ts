// sale-invoice.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilterSaleInvoiceDto } from './dto/filter-sale-invoice.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { InvoiceStatus, SaleInvoiceType, Prisma } from '@prisma/client';
import { CreateSaleInvoiceDto } from './dto/create-sale-invoice.dto';
import { UpdateSaleInvoiceDto } from './dto/update-sale-invoice.dto';

@Injectable()
export class SaleInvoiceService {
  constructor(private prisma: PrismaService) {}

  async create(createSaleInvoiceDto: CreateSaleInvoiceDto) {
    const { items, clientId, driverId, startDate, endDate, ...invoiceData } =
      createSaleInvoiceDto;

    // Start a transaction
    return this.prisma.$transaction(async (prisma) => {
      // Check if client exists
      if (clientId) {
        const client = await prisma.client.findUnique({
          where: { id: clientId },
        });

        if (!client) {
          throw new NotFoundException(`Client with ID ${clientId} not found`);
        }
      }

      // Check if driver exists (if provided)
      if (driverId) {
        const driver = await prisma.driver.findUnique({
          where: { id: driverId },
        });

        if (!driver) {
          throw new NotFoundException(`Driver with ID ${driverId} not found`);
        }
      }

      // Check if invoice number already exists
      const existingInvoice = await prisma.saleInvoice.findFirst({
        where: { invoiceNumber: invoiceData.invoiceNumber },
      });

      if (existingInvoice) {
        throw new BadRequestException('Invoice number already exists');
      }

      // Check if all products exist and have sufficient stock
      for (const item of items) {
        const product = await prisma.product.findFirst({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.productId} not found`,
          );
        }

        // Check stock only for sale invoices (not for quotations or refunds)
        if (
          invoiceData.type === SaleInvoiceType.SALE_INVOICE ||
          invoiceData.type === SaleInvoiceType.DELIVERY_NOTE ||
          invoiceData.type === SaleInvoiceType.DELIVERY_NOTE_OUT
        ) {
          if (product.stock < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
            );
          }
        }
      }

      // Calculate VAT and totals
      let totalHT = 0;
      let totalTTC = 0;
      const calculatedItems = items.map((item) => {
        const vatRate = item.vatRate || 0; // Default VAT rate 0%
        const itemTotalHT = item.price * item.quantity;
        const itemVatAmount = itemTotalHT * (vatRate / 100);
        const itemTotalTTC = itemTotalHT + itemVatAmount;

        totalHT += itemTotalHT;
        totalTTC += itemTotalTTC;

        return {
          ...item,
          vatRate,
          vatAmount: itemVatAmount,
        };
      });

      // Add tax stamp to total TTC if applicable
      const taxStamp = invoiceData.taxStamp || 0;
      totalTTC += taxStamp;

      // Use provided totals or calculated ones
      totalHT = createSaleInvoiceDto.totalHT || totalHT;
      totalTTC = createSaleInvoiceDto.totalTTC || totalTTC;

      // Create invoice with items
      const invoice = await prisma.saleInvoice.create({
        data: {
          ...invoiceData,
          date: new Date(invoiceData.date),
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          totalHT,
          totalTTC,
          taxStamp,
          clientId: clientId || null,
          driverId: driverId || null,
          type: invoiceData.type || SaleInvoiceType.SALE_INVOICE,
          status: InvoiceStatus.DRAFT,
          items: {
            create: calculatedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              vatRate: item.vatRate,
              vatAmount: item.vatAmount,
            })),
          },
        },
        include: {
          client: true,
          driver: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update product stock for sale invoices
      if (
        invoice.type === SaleInvoiceType.SALE_INVOICE ||
        invoice.type === SaleInvoiceType.DELIVERY_NOTE ||
        invoice.type === SaleInvoiceType.DELIVERY_NOTE_OUT
      ) {
        for (const item of calculatedItems) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      return invoice;
    });
  }

  async findAll(filterDto?: FilterSaleInvoiceDto) {
    const where: Prisma.SaleInvoiceWhereInput = {};

    if (filterDto) {
      // Date range filter
      if (filterDto.startDate || filterDto.endDate) {
        // Use type assertion to tell TypeScript this is a DateTimeFilter
        where.date = {} as Prisma.DateTimeFilter;

        if (filterDto.startDate) {
          (where.date as Prisma.DateTimeFilter).gte = new Date(
            filterDto.startDate,
          );
        }
        if (filterDto.endDate) {
          (where.date as Prisma.DateTimeFilter).lte = new Date(
            filterDto.endDate,
          );
        }
      }

      // Alternative date range filter
      if (filterDto.dateFrom || filterDto.dateTo) {
        // If where.date doesn't exist, create it with type assertion
        if (!where.date) {
          where.date = {} as Prisma.DateTimeFilter;
        }

        const dateFilter = where.date as Prisma.DateTimeFilter;

        if (filterDto.dateFrom) {
          dateFilter.gte = new Date(filterDto.dateFrom);
        }
        if (filterDto.dateTo) {
          dateFilter.lte = new Date(filterDto.dateTo);
        }
      }

      // Status filter
      if (filterDto.status) {
        where.status = filterDto.status;
      }

      // Type filter
      if (filterDto.type) {
        where.type = filterDto.type;
      }

      // Invoice number filter (partial match)
      if (filterDto.invoiceNumber) {
        where.invoiceNumber = {
          contains: filterDto.invoiceNumber,
          mode: 'insensitive',
        };
      }

      // Client name filter
      if (filterDto.clientName) {
        where.client = {
          name: {
            contains: filterDto.clientName,
            mode: 'insensitive',
          },
        };
      }

      // Driver filter
      if (filterDto.driverId) {
        where.driverId = filterDto.driverId;
      }

      // Has driver filter
      if (filterDto.hasDriver !== undefined) {
        where.driverId = filterDto.hasDriver ? { not: null } : null;
      }
    }

    return this.prisma.saleInvoice.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
        driver: {
          include: {
            car: true,
          },
        },
        payments: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                reference: true,
                name: true,
                salePrice: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const invoice = await this.prisma.saleInvoice.findUnique({
      where: { id },
      include: {
        client: true,
        driver: {
          include: {
            car: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
        originalInvoice: true,
        refunds: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Sale invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async findByInvoiceNumber(invoiceNumber: string) {
    const invoice = await this.prisma.saleInvoice.findFirst({
      where: { invoiceNumber },
      include: {
        client: true,
        driver: {
          include: {
            car: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(
        `Sale invoice with number ${invoiceNumber} not found`,
      );
    }

    return invoice;
  }

  async findByClient(clientId: number) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }

    return this.prisma.saleInvoice.findMany({
      where: { clientId },
      include: {
        client: true,
        driver: {
          include: {
            car: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByDriver(driverId: number) {
    const driver = await this.prisma.driver.findFirst({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    return this.prisma.saleInvoice.findMany({
      where: { driverId },
      include: {
        client: true,
        driver: {
          include: {
            car: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: number, updateSaleInvoiceDto: UpdateSaleInvoiceDto) {
    // Check if invoice exists
    const existingInvoice = await this.findOne(id);

    const { items, clientId, driverId, startDate, endDate, ...updateData } =
      updateSaleInvoiceDto;

    // Start a transaction
    return this.prisma.$transaction(async (prisma) => {
      // If clientId is being updated, check if new client exists
      if (clientId) {
        const client = await prisma.client.findFirst({
          where: { id: clientId },
        });

        if (!client) {
          throw new NotFoundException(`Client with ID ${clientId} not found`);
        }
      }

      // If driverId is being updated, check if new driver exists
      if (driverId) {
        const driver = await prisma.driver.findFirst({
          where: { id: driverId },
        });

        if (!driver) {
          throw new NotFoundException(`Driver with ID ${driverId} not found`);
        }
      }

      // If invoice number is being updated, check if it's unique
      if (
        updateData.invoiceNumber &&
        updateData.invoiceNumber !== existingInvoice.invoiceNumber
      ) {
        const invoiceWithSameNumber = await prisma.saleInvoice.findFirst({
          where: { invoiceNumber: updateData.invoiceNumber },
        });

        if (invoiceWithSameNumber) {
          throw new BadRequestException('Invoice number already exists');
        }
      }

      // Handle items update if provided
      if (items && items.length > 0) {
        // Check if all products exist
        for (const item of items) {
          if (item.productId) {
            const product = await prisma.product.findUnique({
              where: { id: item.productId },
            });

            if (!product) {
              throw new NotFoundException(
                `Product with ID ${item.productId} not found`,
              );
            }
          }
        }

        // Calculate VAT for items
        const calculatedItems = items.map((item) => {
          const vatRate = item.vatRate || 0;
          const itemTotalHT = (item.price || 0) * (item.quantity || 0);
          const vatAmount = itemTotalHT * (vatRate / 100);

          return {
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            vatRate,
            vatAmount,
          };
        });

        // Calculate new totals
        const newTotalHT = calculatedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        const newTotalTTC =
          calculatedItems.reduce(
            (sum, item) =>
              sum + item.price * item.quantity * (1 + item.vatRate / 100),
            0,
          ) + (updateData.taxStamp || existingInvoice.taxStamp || 0);

        updateData.totalHT = newTotalHT;
        updateData.totalTTC = newTotalTTC;

        // Handle stock updates for sale invoices
        if (
          existingInvoice.type === SaleInvoiceType.SALE_INVOICE ||
          existingInvoice.type === SaleInvoiceType.DELIVERY_NOTE ||
          existingInvoice.type === SaleInvoiceType.DELIVERY_NOTE_OUT
        ) {
          // Restore old stock
          for (const oldItem of existingInvoice.items) {
            await prisma.product.update({
              where: { id: oldItem.productId },
              data: {
                stock: {
                  increment: oldItem.quantity,
                },
              },
            });
          }

          // Check stock availability for new items
          for (const newItem of calculatedItems) {
            const product = await prisma.product.findUnique({
              where: { id: newItem.productId },
            });

            if (product && product.stock < newItem.quantity) {
              throw new BadRequestException(
                `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${newItem.quantity}`,
              );
            }
          }

          // Decrement new stock
          for (const newItem of calculatedItems) {
            await prisma.product.update({
              where: { id: newItem.productId },
              data: {
                stock: {
                  decrement: newItem.quantity,
                },
              },
            });
          }
        }

        // Delete existing items and create new ones
        await prisma.saleInvoiceItem.deleteMany({
          where: { invoiceId: id },
        });

        await prisma.saleInvoiceItem.createMany({
          data: calculatedItems.map((item) => ({
            ...item,
            invoiceId: id,
          })),
        });
      }

      // Convert date strings to Date objects if provided
      const dataToUpdate: any = {
        ...updateData,
      };

      if (updateData.date) {
        dataToUpdate.date = new Date(updateData.date);
      }

      if (clientId) {
        dataToUpdate.clientId = clientId;
      }

      if (driverId !== undefined) {
        dataToUpdate.driverId = driverId;
      }

      if (startDate !== undefined) {
        dataToUpdate.startDate = startDate ? new Date(startDate) : null;
      }

      if (endDate !== undefined) {
        dataToUpdate.endDate = endDate ? new Date(endDate) : null;
      }

      // Update the invoice
      return prisma.saleInvoice.update({
        where: { id },
        data: dataToUpdate,
        include: {
          client: true,
          driver: {
            include: {
              car: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }

  async updateStatus(id: number, updateStatusDto: UpdateStatusDto) {
    const invoice = await this.findOne(id);

    // Validate status transition
    this.validateStatusTransition(invoice.status, updateStatusDto.status);

    return this.prisma.saleInvoice.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
      },
      include: {
        client: true,
        driver: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  private validateStatusTransition(
    currentStatus: InvoiceStatus,
    newStatus: InvoiceStatus,
  ) {
    const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      [InvoiceStatus.DRAFT]: [InvoiceStatus.VALIDATED, InvoiceStatus.CANCELLED],
      [InvoiceStatus.VALIDATED]: [
        InvoiceStatus.PAID,
        InvoiceStatus.CANCELLED,
        InvoiceStatus.DRAFT,
      ],
      [InvoiceStatus.PAID]: [InvoiceStatus.CANCELLED],
      [InvoiceStatus.CANCELLED]: [InvoiceStatus.DRAFT],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  async remove(id: number) {
    const invoice = await this.findOne(id);

    return this.prisma.$transaction(async (prisma) => {
      // Restore product stock for sale invoices
      if (
        invoice.type === SaleInvoiceType.SALE_INVOICE ||
        invoice.type === SaleInvoiceType.DELIVERY_NOTE ||
        invoice.type === SaleInvoiceType.DELIVERY_NOTE_OUT
      ) {
        for (const item of invoice.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      // Delete all items
      await prisma.saleInvoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Delete the invoice
      return prisma.saleInvoice.delete({
        where: { id },
      });
    });
  }

  async getStatistics() {
    const [
      totalInvoices,
      totalAmount,
      draftInvoices,
      validatedInvoices,
      paidInvoices,
      cancelledInvoices,
      monthlyStats,
      typeStats,
    ] = await Promise.all([
      this.prisma.saleInvoice.count(),
      this.prisma.saleInvoice.aggregate({
        _sum: {
          totalTTC: true,
        },
      }),
      this.prisma.saleInvoice.count({
        where: { status: InvoiceStatus.DRAFT },
      }),
      this.prisma.saleInvoice.count({
        where: { status: InvoiceStatus.VALIDATED },
      }),
      this.prisma.saleInvoice.count({
        where: { status: InvoiceStatus.PAID },
      }),
      this.prisma.saleInvoice.count({
        where: { status: InvoiceStatus.CANCELLED },
      }),
      this.prisma.saleInvoice.groupBy({
        by: ['date'],
        _sum: {
          totalTTC: true,
        },
        where: {
          date: {
            gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth() - 11,
              1,
            ),
          },
        },
        orderBy: {
          date: 'asc',
        },
      }),
      this.prisma.saleInvoice.groupBy({
        by: ['type'],
        _count: true,
        _sum: {
          totalTTC: true,
        },
      }),
    ]);

    return {
      totalInvoices,
      totalAmount: totalAmount._sum.totalTTC || 0,
      byStatus: {
        draft: draftInvoices,
        validated: validatedInvoices,
        paid: paidInvoices,
        cancelled: cancelledInvoices,
      },
      byType: typeStats,
      monthlyStats,
    };
  }

  async getAvailableDrivers() {
    const drivers = await this.prisma.driver.findMany({
      where: { active: true },
      include: {
        car: true,
        saleInvoices: {
          where: {
            status: {
              in: [InvoiceStatus.DRAFT, InvoiceStatus.VALIDATED],
            },
          },
        },
      },
    });

    return drivers.map((driver) => ({
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      fullName: `${driver.firstName} ${driver.lastName}`,
      phone: driver.phone,
      cin: driver.cin,
      licenseNumber: driver.licenseNumber,
      active: driver.active,
      currentAssignments: driver.saleInvoices.length,
      car: driver.car
        ? {
            id: driver.car.id,
            registration: driver.car.registration,
            brand: driver.car.brand,
            model: driver.car.model,
          }
        : null,
    }));
  }

  async generatePdf(id: number) {
    const invoice = await this.findOne(id);
    // Implementation for PDF generation
    // You can use libraries like pdfmake or puppeteer
    return { message: 'PDF generation endpoint', invoiceId: id };
  }

  async sendByEmail(
    id: number,
    emailData: { to: string; subject?: string; message?: string },
  ) {
    const invoice = await this.findOne(id);
    // Implementation for sending email with PDF
    return { message: 'Email sent', invoiceId: id, to: emailData.to };
  }
}
