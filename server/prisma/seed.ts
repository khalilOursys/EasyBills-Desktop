import {
  PrismaClient,
  UserRole,
  PurchaseInvoiceType,
  InvoiceStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data (children first)
  await prisma.purchaseInvoiceItem.deleteMany();
  await prisma.saleInvoiceItem.deleteMany();
  await prisma.payment.deleteMany();

  await prisma.purchaseInvoice.deleteMany();
  await prisma.saleInvoice.deleteMany();

  await prisma.car.deleteMany();
  await prisma.driver.deleteMany();

  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.client.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.companySettings.deleteMany();

  console.log('🗑️ Cleaned all tables');

  // ----------------------
  // USERS
  // ----------------------
  const hashed = {
    admin: await bcrypt.hash('Admin123!', 10),
    c1: await bcrypt.hash('Commercial123!', 10),
    c2: await bcrypt.hash('Commercial456!', 10),
  };

  await prisma.user.createMany({
    data: [
      {
        email: 'admin@company.com',
        password: hashed.admin,
        role: UserRole.ADMIN,
      },
      {
        email: 'commercial1@company.com',
        password: hashed.c1,
        role: UserRole.COMMERCIAL,
      },
      {
        email: 'commercial2@company.com',
        password: hashed.c2,
        role: UserRole.COMMERCIAL,
      },
    ],
  });

  console.log('👥 Created users');

  // ----------------------
  // COMPANY SETTINGS
  // ----------------------
  await prisma.companySettings.create({
    data: {
      companyName: 'TechCorp SARL',
      address: '123 Business Street, Casablanca, Morocco',
      phone: '+212 5 22 33 44 55',
      taxNumber: '12345678',
    },
  });

  console.log('🏢 Created company settings');

  // ----------------------
  // CATEGORIES
  // ----------------------
  await prisma.category.createMany({
    data: [
      {
        name: 'Électronique',
        description: 'Produits électroniques et gadgets',
      },
      { name: 'Informatique', description: 'Ordinateurs et accessoires' },
      { name: 'Bureau', description: 'Fournitures de bureau' },
    ],
  });
  const categoryList = await prisma.category.findMany();
  console.log('📂 Created categories');

  // ----------------------
  // CLIENTS
  // ----------------------
  await prisma.client.createMany({
    data: [
      {
        name: 'Entreprise ABC SARL',
        phone: '+212 6 11 22 33 44',
        address: '45 Rue Mohammed V, Rabat',
        taxNumber: '87654321',
      },
      {
        name: 'Société XYZ SA',
        phone: '+212 6 55 66 77 88',
        address: '89 Avenue Hassan II, Casablanca',
        taxNumber: '98765432',
      },
      {
        name: 'Magasin Electro Plus',
        phone: '+212 5 99 88 77 66',
        address: '12 Rue des Commerçants, Marrakech',
        taxNumber: '76543210',
      },
    ],
  });
  const clientList = await prisma.client.findMany();
  console.log('👤 Created clients');

  // ----------------------
  // SUPPLIERS
  // ----------------------
  await prisma.supplier.createMany({
    data: [
      {
        code: 'SUP001',
        name: 'Fournisseur Tech Global',
        taxNumber: '11111111',
        phone: '+212 5 11 22 33 44',
        address: '100 Avenue des Industries, Tanger',
        bankRib: '123456789012345678901234',
      },
      {
        code: 'SUP002',
        name: 'Distributeur Informatique Pro',
        taxNumber: '22222222',
        phone: '+212 5 44 33 22 11',
        address: '200 Boulevard Mohammed VI, Casablanca',
        bankRib: '234567890123456789012345',
      },
      {
        code: 'SUP003',
        name: 'Importateur Électronique',
        taxNumber: '33333333',
        phone: '+212 5 77 88 99 00',
        address: '300 Rue du Commerce, Rabat',
        bankRib: '345678901234567890123456',
      },
    ],
  });
  const supplierList = await prisma.supplier.findMany();
  console.log('🏭 Created suppliers');

  // ----------------------
  // PRODUCTS
  // ----------------------
  await prisma.product.createMany({
    data: [
      {
        reference: 'PROD001',
        internalCode: 'INT001',
        name: 'Ordinateur Portable HP EliteBook',
        stock: 15,
        minStock: 5,
        purchasePrice: 8000,
        marginPercent: 25,
        salePrice: 10000,
        discount: 5,
        vat: 20,
        categoryId: categoryList[1].id,
      },
      {
        reference: 'PROD002',
        internalCode: 'INT002',
        name: 'Smartphone Samsung Galaxy S24',
        stock: 30,
        minStock: 10,
        purchasePrice: 6000,
        marginPercent: 30,
        salePrice: 7800,
        discount: 0,
        vat: 20,
        categoryId: categoryList[0].id,
      },
      {
        reference: 'PROD003',
        internalCode: 'INT003',
        name: 'Imprimante Canon',
        stock: 8,
        minStock: 3,
        purchasePrice: 3000,
        marginPercent: 20,
        salePrice: 3600,
        discount: 10,
        vat: 20,
        categoryId: categoryList[1].id,
      },
    ],
  });
  const productList = await prisma.product.findMany();
  console.log('📦 Created products');

  // ----------------------
  // DRIVERS
  // ----------------------
  const driver1 = await prisma.driver.create({
    data: {
      firstName: 'Ali',
      lastName: 'Ben Salem',
      phone: '+216 22 111 222',
      cin: '12345678',
      licenseNumber: 'L-46789',
    },
  });
  const driver2 = await prisma.driver.create({
    data: {
      firstName: 'Sami',
      lastName: 'Trabelsi',
      phone: '+216 55 333 444',
      cin: '87654321',
      licenseNumber: 'L-55678',
    },
  });
  const driver3 = await prisma.driver.create({
    data: {
      firstName: 'Moez',
      lastName: 'Jlassi',
      phone: '+216 98 444 555',
      cin: '65432187',
      licenseNumber: 'L-98123',
    },
  });
  console.log('🧑‍✈️ Created drivers');

  // ----------------------
  // CARS → assign drivers directly
  // ----------------------
  await prisma.car.create({
    data: {
      registration: 'TU-1001',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
    },
  });
  await prisma.car.create({
    data: {
      registration: 'TU-2002',
      brand: 'Kia',
      model: 'Rio',
      year: 2021,
    },
  });
  await prisma.car.create({
    data: {
      registration: 'TU-3003',
      brand: 'Hyundai',
      model: 'i20',
      year: 2019,
    },
  });
  console.log('🚗 Created and assigned cars');

  // ----------------------
  // PURCHASE INVOICES
  // ----------------------
  await prisma.purchaseInvoice.create({
    data: {
      invoiceNumber: 'FAC-ACH-2024-001',
      date: new Date('2024-01-15'),
      type: PurchaseInvoiceType.PURCHASE_INVOICE,
      status: InvoiceStatus.PAID,
      supplierId: supplierList[0].id,
      totalHT: 20000,
      totalTTC: 24000,
      items: {
        create: [
          { quantity: 5, price: 8000, productId: productList[0].id },
          { quantity: 10, price: 6000, productId: productList[1].id },
        ],
      },
    },
  });

  await prisma.purchaseInvoice.create({
    data: {
      invoiceNumber: 'FAC-ACH-2024-002',
      date: new Date('2024-01-20'),
      type: PurchaseInvoiceType.PURCHASE_INVOICE,
      status: InvoiceStatus.VALIDATED,
      supplierId: supplierList[1].id,
      totalHT: 9000,
      totalTTC: 10800,
      items: {
        create: [{ quantity: 3, price: 3000, productId: productList[2].id }],
      },
    },
  });
  console.log('📥 Created purchase invoices');

  // ----------------------
  // UPDATE STOCK
  // ----------------------
  const purchaseItems = await prisma.purchaseInvoiceItem.findMany();
  for (const item of purchaseItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }

  console.log('📊 Updated stock');
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
