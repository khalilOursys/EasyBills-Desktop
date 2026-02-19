// src/redux/driversSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Configuration from "../configuration";

// Fetch all drivers
export const fetchDrivers = createAsyncThunk("drivers/fetchAll", async () => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + "driver", {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
  });
  const drivers = await response.json();
  return drivers;
});

// Fetch active drivers
export const fetchActiveDrivers = createAsyncThunk(
  "drivers/fetchActive",
  async () => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(Configuration.BACK_BASEURL + "driver/active", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
    });
    const drivers = await response.json();
    return drivers;
  },
);

// Fetch driver by ID
export const driverGetById = createAsyncThunk("drivers/getById", async (id) => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + `driver/${id}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
  });
  const driver = await response.json();
  return driver;
});

// Fetch drivers by car ID
export const fetchDriversByCar = createAsyncThunk(
  "drivers/fetchByCar",
  async (carId) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `driver/car/${carId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      },
    );
    const drivers = await response.json();
    return drivers;
  },
);

// Create new driver
export const driverAdded = createAsyncThunk(
  "drivers/create",
  async (driverData) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(Configuration.BACK_BASEURL + "driver", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
      body: JSON.stringify(driverData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create driver");
    }

    const driver = await response.json();
    return driver;
  },
);

// Update driver
export const driverUpdated = createAsyncThunk(
  "drivers/update",
  async ({ id, ...driverData }) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(Configuration.BACK_BASEURL + `driver/${id}`, {
      method: "PATCH", // Note: Using PATCH as per your controller
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
      body: JSON.stringify(driverData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update driver");
    }

    const driver = await response.json();
    return driver;
  },
);

// Delete driver
export const driverDeleted = createAsyncThunk("drivers/delete", async (id) => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + `driver/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete driver");
  }

  return id;
});

// Toggle driver active status
export const toggleDriverActive = createAsyncThunk(
  "drivers/toggleActive",
  async (id) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(
      Configuration.BACK_BASEURL + `driver/${id}/toggle-active`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          /* "x-access-token": token, */
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to toggle driver status");
    }

    const driver = await response.json();
    return driver;
  },
);

const driversSlice = createSlice({
  name: "drivers",
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
      // Fetch all drivers
      .addCase(fetchDrivers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDrivers.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchDrivers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetch active drivers
      .addCase(fetchActiveDrivers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveDrivers.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchActiveDrivers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetch drivers by car
      .addCase(fetchDriversByCar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDriversByCar.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchDriversByCar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Add driver
      .addCase(driverAdded.fulfilled, (state, action) => {
        state.entities.push(action.payload);
        state.error = null;
      })
      .addCase(driverAdded.rejected, (state, action) => {
        state.error = action.error.message;
      })

      // Update driver
      .addCase(driverUpdated.fulfilled, (state, action) => {
        const index = state.entities.findIndex(
          (driver) => driver.id === action.payload.id,
        );
        if (index !== -1) {
          state.entities[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(driverUpdated.rejected, (state, action) => {
        state.error = action.error.message;
      })

      // Delete driver
      .addCase(driverDeleted.fulfilled, (state, action) => {
        state.entities = state.entities.filter(
          (driver) => driver.id !== action.payload,
        );
        state.error = null;
      })
      .addCase(driverDeleted.rejected, (state, action) => {
        state.error = action.error.message;
      })

      // Toggle driver active
      .addCase(toggleDriverActive.fulfilled, (state, action) => {
        const index = state.entities.findIndex(
          (driver) => driver.id === action.payload.id,
        );
        if (index !== -1) {
          state.entities[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(toggleDriverActive.rejected, (state, action) => {
        state.error = action.error.message;
      });
  },
});

export const { clearError } = driversSlice.actions;
export default driversSlice.reducer;
