// dto/filter-sale-invoice.dto.ts

import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { InvoiceStatus, SaleInvoiceType } from '@prisma/client';
import { Type } from 'class-transformer';

export class FilterSaleInvoiceDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @IsEnum(SaleInvoiceType)
  @IsOptional()
  type?: SaleInvoiceType;

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  driverId?: number;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  hasDriver?: boolean;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
