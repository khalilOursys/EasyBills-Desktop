// src/redux/clientsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Configuration from "../configuration";

export const fetchClients = createAsyncThunk("clients/fetchAll", async () => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + "clients", {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
  });
  const clients = await response.json();
  return clients;
});

export const clientGetById = createAsyncThunk("clients/getById", async (id) => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + `clients/${id}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
  });
  const client = await response.json();
  return client;
});

export const clientAdded = createAsyncThunk(
  "clients/create",
  async (clientData) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(Configuration.BACK_BASEURL + "clients", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
      body: JSON.stringify(clientData),
    });
    const client = await response.json();
    return client;
  }
);

export const clientUpdated = createAsyncThunk(
  "clients/update",
  async ({ id, ...clientData }) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(Configuration.BACK_BASEURL + `clients/${id}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
      body: JSON.stringify(clientData),
    });
    const client = await response.json();
    return client;
  }
);

export const clientDeleted = createAsyncThunk("clients/delete", async (id) => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + `clients/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
  });
  return id;
});

const clientsSlice = createSlice({
  name: "clients",
  initialState: {
    entities: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchClients.rejected, (state) => {
        state.loading = false;
      })
      .addCase(clientAdded.fulfilled, (state, action) => {
        state.entities.push(action.payload);
      })
      .addCase(clientUpdated.fulfilled, (state, action) => {
        const index = state.entities.findIndex(
          (client) => client.id === action.payload.id
        );
        if (index !== -1) {
          state.entities[index] = action.payload;
        }
      })
      .addCase(clientDeleted.fulfilled, (state, action) => {
        state.entities = state.entities.filter(
          (client) => client.id !== action.payload
        );
      });
  },
});

export default clientsSlice.reducer;
