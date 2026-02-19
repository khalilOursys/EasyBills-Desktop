// src/redux/purchaseInvoiceSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Configuration from "../configuration";

// Get all purchase invoices
export const fetchPurchaseInvoices = createAsyncThunk(
  "purchaseInvoices/fetchAll",
  async (filters) => {
    const token = localStorage.getItem("x-access-token");
    const params = filters || {};

    const query = new URLSearchParams(params).toString();
    const response = await fetch(
      Configuration.BACK_BASEURL +
        "purchase-invoices" +
        (query ? "?" + query : ""),
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      },
    );
    const invoices = await response.json();
    return invoices;
  },
);

// Get invoice by ID
export const getPurchaseInvoice = createAsyncThunk(
  "purchaseInvoices/getById",
  async (id) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `purchase-invoices/${id}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      },
    );
    const invoice = await response.json();
    return invoice;
  },
);

// Get invoice by invoice number
export const getPurchaseInvoiceByNumber = createAsyncThunk(
  "purchaseInvoices/getByNumber",
  async (invoiceNumber) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `purchase-invoices/number/${invoiceNumber}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      },
    );
    const invoice = await response.json();
    return invoice;
  },
);

// Create new purchase invoice
export const addPurchaseInvoice = createAsyncThunk(
  "purchaseInvoices/create",
  async (invoiceData) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + "purchase-invoices",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
        body: JSON.stringify(invoiceData),
      },
    );
    const invoice = await response.json();
    return invoice;
  },
);

// Update purchase invoice
export const updatePurchaseInvoice = createAsyncThunk(
  "purchaseInvoices/update",
  async ({ id, ...invoiceData }) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `purchase-invoices/${id}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
        body: JSON.stringify(invoiceData),
      },
    );
    const invoice = await response.json();
    return invoice;
  },
);

// Delete purchase invoice
export const deletePurchaseInvoice = createAsyncThunk(
  "purchaseInvoices/delete",
  async (id) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `purchase-invoices/${id}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      },
    );
    return { id, response };
  },
);

// Update invoice status
export const updateInvoiceStatus = createAsyncThunk(
  "purchaseInvoices/updateStatus",
  async ({ id, status }) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `purchase-invoices/${id}/status`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
        body: JSON.stringify({ status }),
      },
    );
    const invoice = await response.json();
    return invoice;
  },
);

// Upload PDF for invoice
export const uploadInvoicePDF = createAsyncThunk(
  "purchaseInvoices/uploadPDF",
  async ({ id, file }) => {
    const token = localStorage.getItem("x-access-token");
    const formData = new FormData();
    formData.append("pdf", file);

    const response = await fetch(
      Configuration.BACK_BASEURL + `purchase-invoices/${id}/upload-pdf`,
      {
        method: "POST",
        headers: {
          /* "x-access-token": token, */
        },
        body: formData,
      },
    );
    const result = await response.json();
    return { id, pdfUrl: result.pdfUrl };
  },
);

// Filter invoices by date range
export const filterInvoicesByDate = createAsyncThunk(
  "purchaseInvoices/filterByDate",
  async ({ startDate, endDate }) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL +
        `purchase-invoices/filter?startDate=${startDate}&endDate=${endDate}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      },
    );
    const invoices = await response.json();
    return invoices;
  },
);

// Get invoices by supplier
export const getInvoicesBySupplier = createAsyncThunk(
  "purchaseInvoices/getBySupplier",
  async (supplierId) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `purchase-invoices/supplier/${supplierId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      },
    );
    const invoices = await response.json();
    return invoices;
  },
);

const purchaseInvoiceSlice = createSlice({
  name: "purchaseInvoices",
  initialState: {
    entities: [],
    currentInvoice: null,
    loading: false,
    error: null,
    filters: {
      startDate: null,
      endDate: null,
      supplierId: null,
      status: null,
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        startDate: null,
        endDate: null,
        supplierId: null,
        status: null,
      };
    },
    clearCurrentInvoice: (state) => {
      state.currentInvoice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all invoices
      .addCase(fetchPurchaseInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchPurchaseInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Get invoice by ID
      .addCase(getPurchaseInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPurchaseInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInvoice = action.payload;
      })
      .addCase(getPurchaseInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Create invoice
      .addCase(addPurchaseInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPurchaseInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.entities.push(action.payload);
      })
      .addCase(addPurchaseInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Update invoice
      .addCase(updatePurchaseInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePurchaseInvoice.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.entities.findIndex(
          (invoice) => invoice.id === action.payload.id,
        );
        if (index !== -1) {
          state.entities[index] = action.payload;
        }
        if (
          state.currentInvoice &&
          state.currentInvoice.id === action.payload.id
        ) {
          state.currentInvoice = action.payload;
        }
      })
      .addCase(updatePurchaseInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Delete invoice
      .addCase(deletePurchaseInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePurchaseInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = state.entities.filter(
          (invoice) => invoice.id !== action.payload.id,
        );
        if (
          state.currentInvoice &&
          state.currentInvoice.id === action.payload.id
        ) {
          state.currentInvoice = null;
        }
      })
      .addCase(deletePurchaseInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Update status
      .addCase(updateInvoiceStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInvoiceStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.entities.findIndex(
          (invoice) => invoice.id === action.payload.id,
        );
        if (index !== -1) {
          state.entities[index].status = action.payload.status;
        }
        if (
          state.currentInvoice &&
          state.currentInvoice.id === action.payload.id
        ) {
          state.currentInvoice.status = action.payload.status;
        }
      })
      .addCase(updateInvoiceStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Upload PDF
      .addCase(uploadInvoicePDF.fulfilled, (state, action) => {
        const index = state.entities.findIndex(
          (invoice) => invoice.id === action.payload.id,
        );
        if (index !== -1) {
          state.entities[index].pdfUrl = action.payload.pdfUrl;
        }
        if (
          state.currentInvoice &&
          state.currentInvoice.id === action.payload.id
        ) {
          state.currentInvoice.pdfUrl = action.payload.pdfUrl;
        }
      })

      // Filter by date
      .addCase(filterInvoicesByDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterInvoicesByDate.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(filterInvoicesByDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Get by supplier
      .addCase(getInvoicesBySupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getInvoicesBySupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(getInvoicesBySupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setFilters, clearFilters, clearCurrentInvoice } =
  purchaseInvoiceSlice.actions;
export default purchaseInvoiceSlice.reducer;
