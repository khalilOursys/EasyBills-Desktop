// src/components.js
// User
import AjouterUser from "./views/Settings/User/AjouterUser";
import ListUser from "./views/Settings/User/ListUser";

// Role
import ListRole from "./views/Settings/Role/ListRole";
import AjouterRole from "./views/Settings/Role/AjouterRole";

// Category
import AjouterCategory from "./views/Settings/Category/AjouterCategory";
import ListCategories from "./views/Settings/Category/ListCategories";

// Product
import AjouterProduct from "./views/Settings/Product/AjouterProduct";
import ListProducts from "./views/Settings/Product/ListProducts";

// Client
import AjouterClient from "./views/Settings/Client/AjouterClient";
import ListClients from "./views/Settings/Client/ListClients";

// Supplier
import AjouterSupplier from "./views/Settings/Supplier/AjouterSupplier";
import ListSuppliers from "./views/Settings/Supplier/ListSuppliers";

// Driver
import AjouterDriver from "./views/Settings/Drivers/AjouterDriver";
import ListDrivers from "./views/Settings/Drivers/ListDrivers";

// Car
import AjouterCar from "./views/Settings/Cars/AjouterCar";
import ListCars from "./views/Settings/Cars/ListCars";

import NotFound from "./views/NotFound";
import ListPurchaseInvoice from "./views/Settings/Invoice/FactureList";
import AddPurchaseInvoice from "./views/Settings/Invoice/AddFacture";
import ListSaleInvoice from "./views/Settings/SaleInvoice/ListSaleInvoice";
import AddSaleInvoice from "./views/Settings/SaleInvoice/AddSaleInvoice";
import SaleInvoiceDetails from "./views/Settings/SaleInvoice/DetailFacture";
import ListRefundInvoice from "./views/Settings/SaleInvoiceRefund/ListRefundInvoice";
import AddRefundInvoice from "./views/Settings/SaleInvoiceRefund/AddRefundInvoice";

// Payment Components
import AjouterPayment from "./views/Settings/Payments/AjouterPayment";
import ListPayments from "./views/Settings/Payments/ListPayments";
import CompanySettings from "./views/CompanySettings";
import AjouterBrand from "./views/Settings/Brands/AjouterBrand";
import ListBrands from "./views/Settings/Brands/ListBrands";

const Components = {
  // Existing
  ListUser,
  AjouterUser,
  ListRole,
  AjouterRole,
  NotFound,
  ListCategories,
  AjouterCategory,
  ListProducts,
  AjouterProduct,
  ListClients,
  AjouterClient,
  ListSuppliers,
  AjouterSupplier,

  // New Driver components
  AjouterDriver,
  ListDrivers,

  // New Car components
  AjouterCar,
  ListCars,

  // Invoice components
  ListPurchaseInvoice,
  AddPurchaseInvoice,
  AddSaleInvoice,
  ListSaleInvoice,
  SaleInvoiceDetails,

  // Payment components
  AjouterPayment,
  ListPayments,

  // Other
  CompanySettings,
  ListRefundInvoice,
  AddRefundInvoice,
  AjouterBrand,
  ListBrands,
};

export default Components;
