import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Configuration from "../configuration";

// Get all sale invoices
export const fetchSaleInvoices = createAsyncThunk(
  "saleInvoices/fetchAll",
  async (filters) => {
    // If no filters → empty object
    const params = filters || {};

    const query = new URLSearchParams(params).toString();

    const response = await fetch(
      Configuration.BACK_BASEURL + "sale-invoices" + (query ? "?" + query : ""),
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    return await response.json();
  },
);

// Get invoice by ID
export const getSaleInvoice = createAsyncThunk(
  "saleInvoices/getById",
  async (id) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `sale-invoices/${id}`,
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
export const getSaleInvoiceByNumber = createAsyncThunk(
  "saleInvoices/getByNumber",
  async (invoiceNumber) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `sale-invoices/number/${invoiceNumber}`,
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

// Create new sale invoice
export const addSaleInvoice = createAsyncThunk(
  "saleInvoices/create",
  async (invoiceData) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(Configuration.BACK_BASEURL + "sale-invoices", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
      body: JSON.stringify(invoiceData),
    });
    const invoice = await response.json();
    return invoice;
  },
);

// Update sale invoice
export const updateSaleInvoice = createAsyncThunk(
  "saleInvoices/update",
  async ({ id, ...invoiceData }) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `sale-invoices/${id}`,
      {
        method: "PATCH",
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

// Delete sale invoice
export const deleteSaleInvoice = createAsyncThunk(
  "saleInvoices/delete",
  async (id) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `sale-invoices/${id}`,
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
  "saleInvoices/updateStatus",
  async ({ id, status }) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `sale-invoices/${id}/status`,
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
  "saleInvoices/uploadPDF",
  async ({ id, file }) => {
    const token = localStorage.getItem("x-access-token");
    const formData = new FormData();
    formData.append("pdf", file);

    const response = await fetch(
      Configuration.BACK_BASEURL + `sale-invoices/${id}/upload-pdf`,
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
  "saleInvoices/filterByDate",
  async ({ startDate, endDate }) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL +
        `sale-invoices/filter/date-range?startDate=${startDate}&endDate=${endDate}`,
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

// Get invoices by client
export const getInvoicesByClient = createAsyncThunk(
  "saleInvoices/getByClient",
  async (clientId) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `sale-invoices/client/${clientId}`,
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

// Get Refund Invoice by ID
export const getRefundInvoice = createAsyncThunk(
  "saleInvoices/getRefundById",
  async (id) => {
    const response = await fetch(
      Configuration.BACK_BASEURL + `sale-refunds/${id}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );
    const invoice = await response.json();
    return invoice;
  },
);

// Add Refund Invoice
export const addRefundInvoice = createAsyncThunk(
  "saleInvoices/addRefund",
  async (invoiceData) => {
    const response = await fetch(Configuration.BACK_BASEURL + "sale-refunds", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoiceData),
    });
    const invoice = await response.json();
    return invoice;
  },
);

// Update Refund Invoice
export const updateRefundInvoice = createAsyncThunk(
  "saleInvoices/updateRefund",
  async ({ id, ...invoiceData }) => {
    const response = await fetch(
      Configuration.BACK_BASEURL + `sale-refunds/${id}`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      },
    );
    const invoice = await response.json();
    return invoice;
  },
);
const saleInvoiceSlice = createSlice({
  name: "saleInvoices",
  initialState: {
    entities: [],
    currentInvoice: null,
    loading: false,
    error: null,
    filters: {
      startDate: null,
      endDate: null,
      clientId: null,
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
        clientId: null,
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
      .addCase(fetchSaleInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSaleInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchSaleInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Get invoice by ID
      .addCase(getSaleInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSaleInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInvoice = action.payload;
      })
      .addCase(getSaleInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Create invoice
      .addCase(addSaleInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSaleInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.entities.push(action.payload);
      })
      .addCase(addSaleInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Update invoice
      .addCase(updateSaleInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSaleInvoice.fulfilled, (state, action) => {
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
      .addCase(updateSaleInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Delete invoice
      .addCase(deleteSaleInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSaleInvoice.fulfilled, (state, action) => {
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
      .addCase(deleteSaleInvoice.rejected, (state, action) => {
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

      // Get by client
      .addCase(getInvoicesByClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getInvoicesByClient.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(getInvoicesByClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // ==============================
      // Refund Invoice reducers
      // ==============================
      // Get Refund Invoice
      .addCase(getRefundInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRefundInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInvoice = action.payload;
      })
      .addCase(getRefundInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Add Refund Invoice
      .addCase(addRefundInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addRefundInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.entities.push(action.payload);
      })
      .addCase(addRefundInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Update Refund Invoice
      .addCase(updateRefundInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRefundInvoice.fulfilled, (state, action) => {
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
      .addCase(updateRefundInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setFilters, clearFilters, clearCurrentInvoice } =
  saleInvoiceSlice.actions;
export default saleInvoiceSlice.reducer;
