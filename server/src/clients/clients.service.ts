// src/clients/clients.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    // Check if client with same name exists
    const existing = await this.prisma.client.findFirst({
      where: { name: createClientDto.name },
    });

    if (existing) {
      throw new BadRequestException(
        `Client with name "${createClientDto.name}" already exists.`,
      );
    }

    return await this.prisma.client.create({
      data: createClientDto,
    });
  }

  async findAll() {
    return await this.prisma.client.findMany({
      orderBy: { id: 'desc' },
      include: {
        saleInvoices: {
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
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        saleInvoices: {
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

    if (!client) {
      throw new NotFoundException(`Client with id ${id} not found.`);
    }

    return client;
  }

  async update(id: number, updateClientDto: UpdateClientDto) {
    // Check if client exists
    await this.findOne(id);

    // Check if name is being updated to an existing name
    if (updateClientDto.name) {
      const existing = await this.prisma.client.findFirst({
        where: {
          name: updateClientDto.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Client with name "${updateClientDto.name}" already exists.`,
        );
      }
    }

    return await this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });
  }

  async remove(id: number) {
    // Check if client exists
    const client = await this.findOne(id);

    // Check if client has invoices
    if (client.saleInvoices && client.saleInvoices.length > 0) {
      throw new BadRequestException(
        'Cannot delete client with existing invoices.',
      );
    }

    return await this.prisma.client.delete({
      where: { id },
    });
  }
}
