// src/redux/productsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Configuration from "../configuration";

export const fetchProducts = createAsyncThunk("products/fetchAll", async () => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + "products", {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
  });
  const products = await response.json();
  return products;
});

export const productGetById = createAsyncThunk(
  "products/getById",
  async (id) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `products/${id}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      }
    );
    const product = await response.json();
    return product;
  }
);

export const productGetByReference = createAsyncThunk(
  "products/getByReference",
  async (reference) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `products/reference/${reference}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      }
    );
    const product = await response.json();
    return product;
  }
);

export const productAdded = createAsyncThunk(
  "products/create",
  async (productData) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(Configuration.BACK_BASEURL + "products", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
      body: JSON.stringify(productData),
    });
    const product = await response.json();
    return product;
  }
);

export const productUpdated = createAsyncThunk(
  "products/update",
  async ({ id, ...productData }) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `products/${id}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
        body: JSON.stringify(productData),
      }
    );
    const product = await response.json();
    return product;
  }
);

export const productDeleted = createAsyncThunk(
  "products/delete",
  async (id) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `products/${id}`,
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

export const updateStock = createAsyncThunk(
  "products/updateStock",
  async ({ id, quantity, operation }) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `products/stock/${id}/${operation}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
        body: JSON.stringify({ quantity }),
      }
    );
    const product = await response.json();
    return product;
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState: {
    entities: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchProducts.rejected, (state) => {
        state.loading = false;
      })
      .addCase(productAdded.fulfilled, (state, action) => {
        state.entities.push(action.payload);
      })
      .addCase(productUpdated.fulfilled, (state, action) => {
        const index = state.entities.findIndex(
          (prod) => prod.id === action.payload.id
        );
        if (index !== -1) {
          state.entities[index] = action.payload;
        }
      })
      .addCase(productDeleted.fulfilled, (state, action) => {
        state.entities = state.entities.filter(
          (prod) => prod.id !== action.payload
        );
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        const index = state.entities.findIndex(
          (prod) => prod.id === action.payload.id
        );
        if (index !== -1) {
          state.entities[index] = action.payload;
        }
      });
  },
});

export default productsSlice.reducer;
