// src/redux/carsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Configuration from "../configuration";

// Fetch all cars
export const fetchCars = createAsyncThunk("cars/fetchAll", async () => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + "cars", {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
  });
  const cars = await response.json();
  return cars;
});

// Fetch car by ID
export const carGetById = createAsyncThunk("cars/getById", async (id) => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + `cars/${id}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
  });
  const car = await response.json();
  return car;
});

// Create new car
export const carAdded = createAsyncThunk("cars/create", async (carData) => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + "cars", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
    body: JSON.stringify(carData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create car");
  }

  const car = await response.json();
  return car;
});

// Update car
export const carUpdated = createAsyncThunk(
  "cars/update",
  async ({ id, ...carData }) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(Configuration.BACK_BASEURL + `cars/${id}`, {
      method: "PATCH", // Using PATCH as per your controller
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
      body: JSON.stringify(carData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update car");
    }

    const car = await response.json();
    return car;
  },
);

// Delete car
export const carDeleted = createAsyncThunk("cars/delete", async (id) => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + `cars/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete car");
  }

  return id;
});

const carsSlice = createSlice({
  name: "cars",
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
      // Fetch all cars
      .addCase(fetchCars.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCars.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchCars.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Add car
      .addCase(carAdded.fulfilled, (state, action) => {
        state.entities.push(action.payload);
        state.error = null;
      })
      .addCase(carAdded.rejected, (state, action) => {
        state.error = action.error.message;
      })

      // Update car
      .addCase(carUpdated.fulfilled, (state, action) => {
        const index = state.entities.findIndex(
          (car) => car.id === action.payload.id,
        );
        if (index !== -1) {
          state.entities[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(carUpdated.rejected, (state, action) => {
        state.error = action.error.message;
      })

      // Delete car
      .addCase(carDeleted.fulfilled, (state, action) => {
        state.entities = state.entities.filter(
          (car) => car.id !== action.payload,
        );
        state.error = null;
      })
      .addCase(carDeleted.rejected, (state, action) => {
        state.error = action.error.message;
      });
  },
});

export const { clearError } = carsSlice.actions;
export default carsSlice.reducer;
