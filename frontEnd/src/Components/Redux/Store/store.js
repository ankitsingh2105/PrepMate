import  { configureStore } from "@reduxjs/toolkit"
import userInfoReducer from "../Slices/userInfoSlice";

const store =  configureStore({
    reducer : {
        userInfo : userInfoReducer
    }
})

export default store;