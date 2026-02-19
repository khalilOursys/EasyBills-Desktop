// src/suppliers/suppliers.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSupplierDto: CreateSupplierDto) {
    // Check if supplier with same code exists
    const existingByCode = await this.prisma.supplier.findFirst({
      where: { code: createSupplierDto.code },
    });

    if (existingByCode) {
      throw new BadRequestException(
        `Supplier with code "${createSupplierDto.code}" already exists.`,
      );
    }

    // Check if supplier with same name exists
    const existingByName = await this.prisma.supplier.findFirst({
      where: { name: createSupplierDto.name },
    });

    if (existingByName) {
      throw new BadRequestException(
        `Supplier with name "${createSupplierDto.name}" already exists.`,
      );
    }

    return await this.prisma.supplier.create({
      data: createSupplierDto,
    });
  }

  async findAll() {
    return await this.prisma.supplier.findMany({
      orderBy: { id: 'desc' },
      include: {
        purchaseInvoices: {
          select: {
            id: true,
            invoiceNumber: true,
            totalTTC: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseInvoices: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with id ${id} not found.`);
    }

    return supplier;
  }

  async update(id: number, updateSupplierDto: UpdateSupplierDto) {
    // Check if supplier exists
    await this.findOne(id);

    // Check if code is being updated to an existing code
    if (updateSupplierDto.code) {
      const existing = await this.prisma.supplier.findFirst({
        where: {
          code: updateSupplierDto.code,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Supplier with code "${updateSupplierDto.code}" already exists.`,
        );
      }
    }

    // Check if name is being updated to an existing name
    if (updateSupplierDto.name) {
      const existing = await this.prisma.supplier.findFirst({
        where: {
          name: updateSupplierDto.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Supplier with name "${updateSupplierDto.name}" already exists.`,
        );
      }
    }

    return await this.prisma.supplier.update({
      where: { id },
      data: updateSupplierDto,
    });
  }

  async remove(id: number) {
    // Check if supplier exists
    const supplier = await this.findOne(id);

    // Check if supplier has invoices
    if (supplier.purchaseInvoices && supplier.purchaseInvoices.length > 0) {
      throw new BadRequestException(
        'Cannot delete supplier with existing invoices.',
      );
    }

    return await this.prisma.supplier.delete({
      where: { id },
    });
  }
}
