// src/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    // Check if product with same reference exists
    const existingByRef = await this.prisma.product.findFirst({
      where: { reference: createProductDto.reference },
    });

    if (existingByRef) {
      throw new BadRequestException(
        `Product with reference "${createProductDto.reference}" already exists.`,
      );
    }

    // Check if product with same internal code exists
    const existingByCode = await this.prisma.product.findFirst({
      where: { internalCode: createProductDto.internalCode },
    });

    if (existingByCode) {
      throw new BadRequestException(
        `Product with internal code "${createProductDto.internalCode}" already exists.`,
      );
    }

    return await this.prisma.product.create({
      data: {
        ...createProductDto,
        stock: createProductDto.stock || 0,
        minStock: createProductDto.minStock || 0,
        discount: createProductDto.discount || 0,
        vat: createProductDto.vat || 19,
      },
    });
  }

  async findAll() {
    return await this.prisma.product.findMany({
      orderBy: { id: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        purchaseInvoiceItems: true,
        saleInvoiceItems: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found.`);
    }

    return product;
  }

  async findByReference(reference: string) {
    const product = await this.prisma.product.findFirst({
      where: { reference },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with reference ${reference} not found.`,
      );
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    // Check if product exists
    await this.findOne(id);

    // Check if reference is being updated to an existing reference
    if (updateProductDto.reference) {
      const existing = await this.prisma.product.findFirst({
        where: {
          reference: updateProductDto.reference,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Product with reference "${updateProductDto.reference}" already exists.`,
        );
      }
    }

    // Check if internal code is being updated to an existing internal code
    if (updateProductDto.internalCode) {
      const existing = await this.prisma.product.findFirst({
        where: {
          internalCode: updateProductDto.internalCode,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Product with internal code "${updateProductDto.internalCode}" already exists.`,
        );
      }
    }

    return await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: number) {
    // Check if product exists
    const product = await this.findOne(id);

    // Check if product has invoice items
    if (
      (product.purchaseInvoiceItems &&
        product.purchaseInvoiceItems.length > 0) ||
      (product.saleInvoiceItems && product.saleInvoiceItems.length > 0)
    ) {
      throw new BadRequestException(
        'Cannot delete product with existing invoice items.',
      );
    }

    return await this.prisma.product.delete({
      where: { id },
    });
  }

  async updateStock(
    id: number,
    quantity: number,
    operation: 'increment' | 'decrement',
  ) {
    const product = await this.findOne(id);

    const newStock =
      operation === 'increment'
        ? product.stock + quantity
        : product.stock - quantity;

    if (newStock < 0) {
      throw new BadRequestException('Insufficient stock.');
    }

    return await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });
  }
}
