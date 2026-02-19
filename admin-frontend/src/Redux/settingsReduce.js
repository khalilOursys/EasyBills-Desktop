import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Configuration from "../configuration";

const token = localStorage.getItem("x-access-token");

/* ================= GET SETTINGS ================= */
export const getCompanySettings = createAsyncThunk(
  "settings/getCompanySettings",
  async () => {
    const response = await fetch(
      Configuration.BACK_BASEURL + "company-settings",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          /* "x-access-token": token, */
        },
      }
    );
    return await response.json();
  }
);

/* ================= UPDATE SETTINGS ================= */
export const updateCompanySettings = createAsyncThunk(
  "settings/updateCompanySettings",
  async (formData) => {
    const response = await fetch(
      Configuration.BACK_BASEURL + "company-settings",
      {
        method: "PUT",
        /* headers: {
          "x-access-token": token,
        }, */
        body: formData,
      }
    );
    return await response.json();
  }
);

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    loading: false,
  },
  reducers: {},
  extraReducers: {
    [getCompanySettings.pending]: (state) => {
      state.loading = true;
    },
    [getCompanySettings.fulfilled]: (state) => {
      state.loading = false;
    },
    [getCompanySettings.rejected]: (state) => {
      state.loading = false;
    },
  },
});

export default settingsSlice.reducer;
