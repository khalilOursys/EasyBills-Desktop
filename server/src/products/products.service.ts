import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';
import { SearchProductsDto } from './dto/search-products.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, imageUrl?: string) {
    // Check if product with same reference exists (if reference is provided)
    if (createProductDto.reference) {
      const existingByRef = await this.prisma.product.findFirst({
        where: { reference: createProductDto.reference },
      });

      if (existingByRef) {
        throw new BadRequestException(
          `Product with reference "${createProductDto.reference}" already exists.`,
        );
      }
    }

    // Check if product with same internal code exists (if internal code is provided)
    if (createProductDto.internalCode) {
      const existingByCode = await this.prisma.product.findFirst({
        where: { internalCode: createProductDto.internalCode },
      });

      if (existingByCode) {
        throw new BadRequestException(
          `Product with internal code "${createProductDto.internalCode}" already exists.`,
        );
      }
    }

    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new BadRequestException(
        `Category with id ${createProductDto.categoryId} not found.`,
      );
    }

    // Check if brand exists if brandId is provided
    if (createProductDto.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: createProductDto.brandId },
      });

      if (!brand) {
        throw new BadRequestException(
          `Brand with id ${createProductDto.brandId} not found.`,
        );
      }
    }

    return await this.prisma.product.create({
      data: {
        reference: createProductDto.reference,
        internalCode: createProductDto.internalCode,
        name: createProductDto.name,
        description: createProductDto.description, // Added description
        purchasePrice: createProductDto.purchasePrice,
        marginPercent: createProductDto.marginPercent,
        salePrice: createProductDto.salePrice,
        priceIncludingTax: createProductDto.priceIncludingTax,
        categoryId: createProductDto.categoryId,
        brandId: createProductDto.brandId,
        stock: createProductDto.stock || 0,
        minStock: createProductDto.minStock || 0,
        discount: createProductDto.discount || 0,
        vat: createProductDto.vat || 19,
        img: imageUrl,
      },
      include: {
        category: true,
        brand: true,
      },
    });
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    imageUrl?: string,
  ) {
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

    // Check if category exists if categoryId is provided
    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new BadRequestException(
          `Category with id ${updateProductDto.categoryId} not found.`,
        );
      }
    }

    // Check if brand exists if brandId is provided
    if (updateProductDto.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: updateProductDto.brandId },
      });

      if (!brand) {
        throw new BadRequestException(
          `Brand with id ${updateProductDto.brandId} not found.`,
        );
      }
    }

    // Prepare update data
    const updateData: any = { ...updateProductDto };

    // If a new image was uploaded, add it to the update data
    if (imageUrl) {
      updateData.img = imageUrl;
    }

    return await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        brand: true,
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
        brand: {
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
        brand: true,
        purchaseInvoiceItems: {
          include: {
            invoice: true,
          },
        },
        saleInvoiceItems: {
          include: {
            invoice: true,
          },
        },
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
      include: {
        category: true,
        brand: true,
      },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with reference ${reference} not found.`,
      );
    }

    return product;
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
  async searchProducts(searchParams: SearchProductsDto) {
    const {
      search,
      brandNames,
      categoryNames,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sortBy = 'id',
      sortOrder = 'desc',
    } = searchParams;

    // Build where clause
    const where: Prisma.ProductWhereInput = {};

    // Text search (optional - search in name, reference, description)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { internalCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by brand names
    if (brandNames) {
      const brandsArray = Array.isArray(brandNames) ? brandNames : [brandNames];

      where.brand = {
        name: { in: brandsArray, mode: 'insensitive' },
      };
    }

    // Filter by category names
    if (categoryNames) {
      const categoriesArray = Array.isArray(categoryNames)
        ? categoryNames
        : [categoryNames];

      where.category = {
        name: { in: categoriesArray, mode: 'insensitive' },
      };
    }

    // Filter by price range (using salePrice)
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.salePrice = {};

      if (minPrice !== undefined) {
        where.salePrice.gte = minPrice;
      }

      if (maxPrice !== undefined) {
        where.salePrice.lte = maxPrice;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Get total count for pagination
    const totalCount = await this.prisma.product.count({ where });

    // Get products with pagination and sorting
    const products = await this.prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            img: true,
          },
        },
      },
    });

    return {
      products,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async getFilterOptions() {
    // Get all brands with product counts
    const brands = await this.prisma.brand.findMany({
      where: {
        isActive: true,
        products: {
          some: {}, // Only include brands that have at least one product
        },
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get all categories with product counts
    const categories = await this.prisma.category.findMany({
      where: {
        products: {
          some: {}, // Only include brands that have at least one product
        },
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get price range from all products
    const priceAggregation = await this.prisma.product.aggregate({
      _min: {
        salePrice: true,
      },
      _max: {
        salePrice: true,
      },
    });

    return {
      brands: brands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        productCount: brand._count.products,
        img: brand.img,
      })),
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        productCount: category._count.products,
      })),
      priceRange: {
        minPrice: priceAggregation._min.salePrice || 0,
        maxPrice: priceAggregation._max.salePrice || 1000,
      },
    };
  }
}
