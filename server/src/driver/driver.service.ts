import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { Driver, Prisma } from '@prisma/client';

@Injectable()
export class DriverService {
  constructor(private prisma: PrismaService) {}

  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
    try {
      // Check if car exists if carId is provided
      if (createDriverDto.carId) {
        const car = await this.prisma.car.findFirst({
          where: { id: createDriverDto.carId },
        });

        if (!car) {
          throw new NotFoundException(
            `Car with ID ${createDriverDto.carId} not found`,
          );
        }
      }

      // Check for unique constraints
      if (createDriverDto.cin) {
        const existingDriver = await this.prisma.driver.findFirst({
          where: { cin: createDriverDto.cin },
        });
        if (existingDriver) {
          throw new ConflictException('CIN already exists');
        }
      }

      if (createDriverDto.licenseNumber) {
        const existingDriver = await this.prisma.driver.findFirst({
          where: { licenseNumber: createDriverDto.licenseNumber },
        });
        if (existingDriver) {
          throw new ConflictException('License number already exists');
        }
      }

      return await this.prisma.driver.create({
        data: createDriverDto,
        include: {
          car: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Unique constraint violation');
        }
      }
      throw error;
    }
  }

  async findAll(): Promise<Driver[]> {
    return await this.prisma.driver.findMany({
      include: {
        car: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  async findOne(id: number): Promise<Driver> {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        car: true,
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }

    return driver;
  }

  async update(id: number, updateDriverDto: UpdateDriverDto): Promise<Driver> {
    await this.findOne(id); // Check if driver exists

    // Check if car exists if carId is provided
    if (updateDriverDto.carId) {
      const car = await this.prisma.car.findUnique({
        where: { id: updateDriverDto.carId },
      });

      if (!car) {
        throw new NotFoundException(
          `Car with ID ${updateDriverDto.carId} not found`,
        );
      }
    }

    try {
      return await this.prisma.driver.update({
        where: { id },
        data: updateDriverDto,
        include: {
          car: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Unique constraint violation');
        }
      }
      throw error;
    }
  }

  async remove(id: number): Promise<Driver> {
    await this.findOne(id); // Check if driver exists

    return await this.prisma.driver.delete({
      where: { id },
    });
  }

  async toggleActive(id: number): Promise<Driver> {
    const driver = await this.findOne(id);

    return await this.prisma.driver.update({
      where: { id },
      data: { active: !driver.active },
      include: {
        car: true,
      },
    });
  }

  async findByCar(carId: number): Promise<Driver[]> {
    return await this.prisma.driver.findMany({
      where: { carId },
      include: {
        car: true,
      },
    });
  }

  async findActive(): Promise<Driver[]> {
    return await this.prisma.driver.findMany({
      where: { active: true },
      include: {
        car: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }
}
