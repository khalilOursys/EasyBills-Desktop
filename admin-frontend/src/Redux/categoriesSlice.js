// src/redux/categoriesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Configuration from "../configuration";
console.log(process.env.REACT_APP_BACK_BASEURL);

export const fetchCategories = createAsyncThunk(
  "categories/fetchAll",
  async () => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(Configuration.BACK_BASEURL + "categories", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
    });
    const categories = await response.json();
    return categories;
  },
);

export const categoryGetById = createAsyncThunk(
  "categories/getById",
  async (id) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `categories/${id}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      },
    );
    const category = await response.json();
    return category;
  },
);

export const categoryAdded = createAsyncThunk(
  "categories/create",
  async (categoryData) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(Configuration.BACK_BASEURL + "categories", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
      body: JSON.stringify(categoryData),
    });
    const category = await response.json();
    return category;
  },
);

export const categoryUpdated = createAsyncThunk(
  "categories/update",
  async ({ id, ...categoryData }) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `categories/${id}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
        body: JSON.stringify(categoryData),
      },
    );
    const category = await response.json();
    return category;
  },
);

export const categoryDeleted = createAsyncThunk(
  "categories/delete",
  async (id) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `categories/${id}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      },
    );
    return id;
  },
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState: {
    entities: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchCategories.rejected, (state) => {
        state.loading = false;
      })
      .addCase(categoryAdded.fulfilled, (state, action) => {
        state.entities.push(action.payload);
      })
      .addCase(categoryUpdated.fulfilled, (state, action) => {
        const index = state.entities.findIndex(
          (cat) => cat.id === action.payload.id,
        );
        if (index !== -1) {
          state.entities[index] = action.payload;
        }
      })
      .addCase(categoryDeleted.fulfilled, (state, action) => {
        state.entities = state.entities.filter(
          (cat) => cat.id !== action.payload,
        );
      });
  },
});

export default categoriesSlice.reducer;
