import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from "axios";
import link from "../../../connect";


export const handleUserInfo = createAsyncThunk("/getUserInfo", async () => {
    const { backEndLink } = link;
    const response = await axios.get(`${backEndLink}/user/getInfo`, {
        withCredentials: true,
    });
    // console.log("response in store :: ", response);
    return response.data;
})

const userInfoSlice = createSlice({
    name: "userInfo",
    initialState: {
        userDetails: {},
        loading: "",
        error: "",
    },
    extraReducers: (builder) => {
        builder
            .addCase(handleUserInfo.pending, (state) => {
                state.loading = true;
            })
            .addCase(handleUserInfo.fulfilled, (state, action) => {
                state.loading = false;
                state.userDetails = action.payload;
            })
            .addCase(handleUserInfo.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
    }
})

export default userInfoSlice.reducer