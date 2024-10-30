const mongoose = require("mongoose");

const mockSchema = new mongoose.Schema({
    mockType : {
        type : String,
    },
    schedule : {
        type : Date
    },
    tempLock : {
        type : Boolean,
    },
    isAvailable : {
        type : Boolean
    }
})

modules.exports =  mongoose.model("Mock" , mockSchema);