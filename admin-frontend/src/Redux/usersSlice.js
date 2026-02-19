// src/redux/usersSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Configuration from "../configuration";
export const loginFetch = createAsyncThunk("user/login", async (payload) => {
  const response = await fetch(Configuration.BACK_BASEURL + "auth/login", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const users = await response.json();
  return users;
});
export const fetchUsers = createAsyncThunk("users/fetchAll", async () => {
  /* const token = localStorage.getItem("x-access-token"); */
  const response = await fetch(Configuration.BACK_BASEURL + "users", {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
  });
  const users = await response.json();
  return users;
});

export const userGetById = createAsyncThunk("users/getById", async (id) => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + `users/${id}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
  });
  const user = await response.json();
  return user;
});

export const userAdded = createAsyncThunk("users/create", async (userData) => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + "users", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
    body: JSON.stringify(userData),
  });
  const user = await response.json();
  return user;
});

export const userUpdated = createAsyncThunk(
  "users/update",
  async ({ id, ...userData }) => {
    const token = localStorage.getItem("x-access-token");
    const response = await fetch(Configuration.BACK_BASEURL + `users/${id}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        /* "x-access-token": token, */
      },
      body: JSON.stringify(userData),
    });
    const user = await response.json();
    return user;
  }
);

export const userDeleted = createAsyncThunk("users/delete", async (id) => {
  const token = localStorage.getItem("x-access-token");
  const response = await fetch(Configuration.BACK_BASEURL + `users/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      /* "x-access-token": token, */
    },
  });
  return id;
});

const usersSlice = createSlice({
  name: "users",
  initialState: {
    entities: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchUsers.rejected, (state) => {
        state.loading = false;
      })
      .addCase(userGetById.fulfilled, (state, action) => {
        // Keep your existing logic for current user if needed
      })
      .addCase(userAdded.fulfilled, (state, action) => {
        state.entities.push(action.payload);
      })
      .addCase(userUpdated.fulfilled, (state, action) => {
        const index = state.entities.findIndex(
          (user) => user.id === action.payload.id
        );
        if (index !== -1) {
          state.entities[index] = action.payload;
        }
      })
      .addCase(userDeleted.fulfilled, (state, action) => {
        state.entities = state.entities.filter(
          (user) => user.id !== action.payload
        );
      });
  },
});

export default usersSlice.reducer;
