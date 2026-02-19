// src/redux/suppliersSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Configuration from "../configuration";

export const fetchSuppliers = createAsyncThunk(
  "suppliers/fetchAll",
  async () => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(Configuration.BACK_BASEURL + "suppliers", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
    });
    const suppliers = await response.json();
    return suppliers;
  }
);

export const supplierGetById = createAsyncThunk(
  "suppliers/getById",
  async (id) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `suppliers/${id}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      }
    );
    const supplier = await response.json();
    return supplier;
  }
);

export const supplierAdded = createAsyncThunk(
  "suppliers/create",
  async (supplierData) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(Configuration.BACK_BASEURL + "suppliers", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
      body: JSON.stringify(supplierData),
    });
    const supplier = await response.json();
    return supplier;
  }
);

export const supplierUpdated = createAsyncThunk(
  "suppliers/update",
  async ({ id, ...supplierData }) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `suppliers/${id}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
        body: JSON.stringify(supplierData),
      }
    );
    const supplier = await response.json();
    return supplier;
  }
);

export const supplierDeleted = createAsyncThunk(
  "suppliers/delete",
  async (id) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `suppliers/${id}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      }
    );
    return id;
  }
);

const suppliersSlice = createSlice({
  name: "suppliers",
  initialState: {
    entities: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchSuppliers.rejected, (state) => {
        state.loading = false;
      })
      .addCase(supplierAdded.fulfilled, (state, action) => {
        state.entities.push(action.payload);
      })
      .addCase(supplierUpdated.fulfilled, (state, action) => {
        const index = state.entities.findIndex(
          (supplier) => supplier.id === action.payload.id
        );
        if (index !== -1) {
          state.entities[index] = action.payload;
        }
      })
      .addCase(supplierDeleted.fulfilled, (state, action) => {
        state.entities = state.entities.filter(
          (supplier) => supplier.id !== action.payload
        );
      });
  },
});

export default suppliersSlice.reducer;
