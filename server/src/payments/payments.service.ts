// src/payments/payments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentMethod } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto) {
    // Validate that payment is linked to either purchase or sale, not both
    if (createPaymentDto.purchaseInvoiceId && createPaymentDto.saleInvoiceId) {
      throw new BadRequestException(
        'Payment cannot be linked to both purchase and sale invoice simultaneously.',
      );
    }

    // Validate that corresponding entity is provided
    if (createPaymentDto.purchaseInvoiceId && !createPaymentDto.supplierId) {
      throw new BadRequestException(
        'Supplier ID is required for purchase invoice payments.',
      );
    }

    if (createPaymentDto.saleInvoiceId && !createPaymentDto.clientId) {
      throw new BadRequestException(
        'Client ID is required for sale invoice payments.',
      );
    }

    // Validate invoice exists and belongs to the right entity
    if (createPaymentDto.purchaseInvoiceId) {
      const invoice = await this.prisma.purchaseInvoice.findUnique({
        where: { id: createPaymentDto.purchaseInvoiceId },
        include: { supplier: true },
      });

      if (!invoice) {
        throw new NotFoundException(
          `Purchase invoice with id ${createPaymentDto.purchaseInvoiceId} not found.`,
        );
      }

      if (invoice.supplierId !== createPaymentDto.supplierId) {
        throw new BadRequestException(
          'Supplier does not match the purchase invoice supplier.',
        );
      }

      // Calculate total paid for this invoice
      const totalPaid = await this.getInvoiceTotalPaid(
        'purchase',
        createPaymentDto.purchaseInvoiceId,
      );

      if (totalPaid + createPaymentDto.amount > invoice.totalTTC) {
        throw new BadRequestException(
          `Payment amount exceeds the remaining balance. Maximum allowed: ${invoice.totalTTC - totalPaid}`,
        );
      }
    }

    if (createPaymentDto.saleInvoiceId) {
      const invoice = await this.prisma.saleInvoice.findUnique({
        where: { id: createPaymentDto.saleInvoiceId },
        include: { client: true },
      });

      if (!invoice) {
        throw new NotFoundException(
          `Sale invoice with id ${createPaymentDto.saleInvoiceId} not found.`,
        );
      }

      if (invoice.clientId !== createPaymentDto.clientId) {
        throw new BadRequestException(
          'Client does not match the sale invoice client.',
        );
      }

      // Calculate total paid for this invoice
      const totalPaid = await this.getInvoiceTotalPaid(
        'sale',
        createPaymentDto.saleInvoiceId,
      );

      if (totalPaid + createPaymentDto.amount > invoice.totalTTC) {
        throw new BadRequestException(
          `Payment amount exceeds the remaining balance. Maximum allowed: ${invoice.totalTTC - totalPaid}`,
        );
      }
    }

    return await this.prisma.payment.create({
      data: {
        ...createPaymentDto,
        createdAt: new Date(),
      },
    });
  }

  async findAll(type?: 'purchase' | 'sale' | 'all', entityId?: string) {
    const where: any = {};

    if (type === 'purchase') {
      where.purchaseInvoiceId = { not: null };
    } else if (type === 'sale') {
      where.saleInvoiceId = { not: null };
    }

    if (entityId) {
      const id = parseInt(entityId);
      where.OR = [
        { purchaseInvoiceId: id },
        { saleInvoiceId: id },
        { supplierId: id },
        { clientId: id },
      ];
    }

    return await this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        purchaseInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalTTC: true,
          },
        },
        saleInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalTTC: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        purchaseInvoice: true,
        saleInvoice: true,
        supplier: true,
        client: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found.`);
    }

    return payment;
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    // Check if payment exists
    await this.findOne(id);

    // Prevent changing invoice links
    if (
      updatePaymentDto.purchaseInvoiceId ||
      updatePaymentDto.saleInvoiceId ||
      updatePaymentDto.supplierId ||
      updatePaymentDto.clientId
    ) {
      throw new BadRequestException(
        'Cannot change invoice or entity associations. Create a new payment instead.',
      );
    }

    return await this.prisma.payment.update({
      where: { id },
      data: updatePaymentDto,
    });
  }

  async remove(id: number) {
    // Check if payment exists
    const payment = await this.findOne(id);

    // Check if payment is older than 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    if (payment.createdAt < twentyFourHoursAgo) {
      throw new BadRequestException(
        'Cannot delete payments older than 24 hours.',
      );
    }

    return await this.prisma.payment.delete({
      where: { id },
    });
  }

  async findBySupplier(supplierId: number) {
    return await this.prisma.payment.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' },
      include: {
        purchaseInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
    });
  }

  async findByClient(clientId: number) {
    return await this.prisma.payment.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: {
        saleInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
    });
  }

  async findByPurchaseInvoice(purchaseInvoiceId: number) {
    return await this.prisma.payment.findMany({
      where: { purchaseInvoiceId },
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findBySaleInvoice(saleInvoiceId: number) {
    return await this.prisma.payment.findMany({
      where: { saleInvoiceId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getTodaySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const payments = await this.prisma.payment.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        purchaseInvoice: true,
        saleInvoice: true,
      },
    });

    const purchasePayments = payments.filter((p) => p.purchaseInvoiceId);
    const salePayments = payments.filter((p) => p.saleInvoiceId);

    const totalPurchase = purchasePayments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );
    const totalSale = salePayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPurchase,
      totalSale,
      netFlow: totalSale - totalPurchase,
      count: payments.length,
      byMethod: payments.reduce(
        (acc, p) => {
          acc[p.method] = (acc[p.method] || 0) + p.amount;
          return acc;
        },
        {} as Record<PaymentMethod, number>,
      ),
    };
  }

  private async getInvoiceTotalPaid(
    type: 'purchase' | 'sale',
    invoiceId: number,
  ): Promise<number> {
    const where =
      type === 'purchase'
        ? { purchaseInvoiceId: invoiceId }
        : { saleInvoiceId: invoiceId };

    const payments = await this.prisma.payment.findMany({
      where,
      select: { amount: true },
    });

    return payments.reduce((sum, p) => sum + p.amount, 0);
  }
}
