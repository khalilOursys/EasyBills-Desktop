// src/store.js
import { configureStore } from "@reduxjs/toolkit";
import usersSlicer from "./Redux/usersSlice";

export default configureStore({
  reducer: {
    // Existing reducers
    users: usersSlicer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});
