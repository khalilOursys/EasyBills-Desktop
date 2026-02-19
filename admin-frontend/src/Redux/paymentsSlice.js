// src/redux/paymentsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Configuration from "../configuration";

// Fetch all payments with optional filters
export const fetchPayments = createAsyncThunk(
  "payments/fetchAll",
  async (filters = {}) => {
    const token = localStorage.getItem("x-access-token");
    const queryParams = new URLSearchParams();

    if (filters.type) queryParams.append("type", filters.type);
    if (filters.entityId) queryParams.append("entityId", filters.entityId);

    const url =
      Configuration.BACK_BASEURL +
      "payments" +
      (queryParams.toString() ? `?${queryParams.toString()}` : "");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
    });
    const payments = await response.json();
    return payments;
  }
);

// Fetch payment by ID
export const fetchPaymentById = createAsyncThunk(
  "payments/getById",
  async (id) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `payments/${id}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      }
    );
    const payment = await response.json();
    return payment;
  }
);

// Create new payment
export const addPayment = createAsyncThunk(
  "payments/create",
  async (paymentData) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(Configuration.BACK_BASEURL + "payments", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
      body: JSON.stringify(paymentData),
    });
    const payment = await response.json();
    return payment;
  }
);

// Update payment
export const updatePayment = createAsyncThunk(
  "payments/update",
  async ({ id, ...paymentData }) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `payments/${id}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
        body: JSON.stringify(paymentData),
      }
    );
    const payment = await response.json();
    return payment;
  }
);

// Delete payment
export const deletePayment = createAsyncThunk("payments/delete", async (id) => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + `payments/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
  });
  return id;
});

// Fetch payments by supplier
export const fetchSupplierPayments = createAsyncThunk(
  "payments/fetchBySupplier",
  async (supplierId) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `payments/supplier/${supplierId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      }
    );
    const payments = await response.json();
    return payments;
  }
);

// Fetch payments by client
export const fetchClientPayments = createAsyncThunk(
  "payments/fetchByClient",
  async (clientId) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `payments/client/${clientId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      }
    );
    const payments = await response.json();
    return payments;
  }
);

// Fetch payments by purchase invoice
export const fetchPurchaseInvoicePayments = createAsyncThunk(
  "payments/fetchByPurchaseInvoice",
  async (invoiceId) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `payments/purchase-invoice/${invoiceId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      }
    );
    const payments = await response.json();
    return payments;
  }
);

// Fetch payments by sale invoice
export const fetchSaleInvoicePayments = createAsyncThunk(
  "payments/fetchBySaleInvoice",
  async (invoiceId) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `payments/sale-invoice/${invoiceId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      }
    );
    const payments = await response.json();
    return payments;
  }
);

// Fetch today's payment summary
export const fetchTodaySummary = createAsyncThunk(
  "payments/fetchTodaySummary",
  async () => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `payments/summary/today`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      }
    );
    const summary = await response.json();
    return summary;
  }
);

const paymentsSlice = createSlice({
  name: "payments",
  initialState: {
    entities: [],
    currentPayment: null,
    summary: null,
    loading: false,
  },
  reducers: {
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
    },
    clearSummary: (state) => {
      state.summary = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all payments
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchPayments.rejected, (state) => {
        state.loading = false;
      })
      // Fetch payment by ID
      .addCase(fetchPaymentById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPaymentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayment = action.payload;
      })
      .addCase(fetchPaymentById.rejected, (state) => {
        state.loading = false;
      })
      // Add payment
      .addCase(addPayment.fulfilled, (state, action) => {
        state.entities.unshift(action.payload);
      })
      // Update payment
      .addCase(updatePayment.fulfilled, (state, action) => {
        const index = state.entities.findIndex(
          (payment) => payment.id === action.payload.id
        );
        if (index !== -1) {
          state.entities[index] = action.payload;
        }
        if (
          state.currentPayment &&
          state.currentPayment.id === action.payload.id
        ) {
          state.currentPayment = action.payload;
        }
      })
      // Delete payment
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.entities = state.entities.filter(
          (payment) => payment.id !== action.payload
        );
        if (
          state.currentPayment &&
          state.currentPayment.id === action.payload
        ) {
          state.currentPayment = null;
        }
      })
      // Fetch supplier payments
      .addCase(fetchSupplierPayments.fulfilled, (state, action) => {
        // You might want to store these separately or replace entities
        state.entities = action.payload;
        state.loading = false;
      })
      .addCase(fetchSupplierPayments.pending, (state) => {
        state.loading = true;
      })
      // Fetch client payments
      .addCase(fetchClientPayments.fulfilled, (state, action) => {
        state.entities = action.payload;
        state.loading = false;
      })
      .addCase(fetchClientPayments.pending, (state) => {
        state.loading = true;
      })
      // Fetch today's summary
      .addCase(fetchTodaySummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      });
  },
});

export const { clearCurrentPayment, clearSummary } = paymentsSlice.actions;
export default paymentsSlice.reducer;
