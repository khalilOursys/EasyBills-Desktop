// src/redux/brandsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Configuration from "../configuration";

// Fetch all brands
export const fetchBrands = createAsyncThunk("brands/fetchAll", async () => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + "brands", {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
  });
  const brands = await response.json();
  return brands;
});

// Fetch active brands only
export const fetchActiveBrands = createAsyncThunk(
  "brands/fetchActive",
  async () => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + "brands/getIsActived",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      },
    );
    const brands = await response.json();
    return brands;
  },
);

// Fetch brand by ID
export const brandGetById = createAsyncThunk("brands/getById", async (id) => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(
    Configuration.BACK_BASEURL + `brands/getBrandById/${id}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
    },
  );
  const brand = await response.json();
  return brand;
});

// Upload brand image
export const uploadBrandImage = createAsyncThunk(
  "brands/uploadImage",
  async (file) => {
    const token = localStorage.getItem("x-access-token");
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(Configuration.BACK_BASEURL + "brands/upload", {
      method: "POST",
      headers: {
        /* "x-access-token": token, */
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload image");
    }

    const result = await response.json();
    return result.url;
  },
);

// Create new brand
export const brandAdded = createAsyncThunk(
  "brands/create",
  async (brandData) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(Configuration.BACK_BASEURL + "brands", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
      body: JSON.stringify(brandData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create brand");
    }

    const brand = await response.json();
    return brand;
  },
);

// Update brand
export const brandUpdated = createAsyncThunk(
  "brands/update",
  async ({ id, ...brandData }) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(Configuration.BACK_BASEURL + `brands/${id}`, {
      method: "PUT", // Using PUT as per your controller
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
      body: JSON.stringify(brandData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update brand");
    }

    const brand = await response.json();
    return brand;
  },
);

// Delete brand
export const brandDeleted = createAsyncThunk("brands/delete", async (id) => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + `brands/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete brand");
  }

  return id;
});

const brandsSlice = createSlice({
  name: "brands",
  initialState: {
    entities: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all brands
      .addCase(fetchBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetch active brands
      .addCase(fetchActiveBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchActiveBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Add brand
      .addCase(brandAdded.fulfilled, (state, action) => {
        state.entities.push(action.payload);
        state.error = null;
      })
      .addCase(brandAdded.rejected, (state, action) => {
        state.error = action.error.message;
      })

      // Update brand
      .addCase(brandUpdated.fulfilled, (state, action) => {
        const index = state.entities.findIndex(
          (brand) => brand.id === action.payload.id,
        );
        if (index !== -1) {
          state.entities[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(brandUpdated.rejected, (state, action) => {
        state.error = action.error.message;
      })

      // Delete brand
      .addCase(brandDeleted.fulfilled, (state, action) => {
        state.entities = state.entities.filter(
          (brand) => brand.id !== action.payload,
        );
        state.error = null;
      })
      .addCase(brandDeleted.rejected, (state, action) => {
        state.error = action.error.message;
      });
  },
});

export const { clearError } = brandsSlice.actions;
export default brandsSlice.reducer;
