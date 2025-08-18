const mongoose = require("mongoose");

const mockSchema = new mongoose.Schema({
    mockType : {
        type : String,
    },
    schedule : {
        type : String
    },
    tempLock : {
        type : Boolean,
        default : false,
    },
    ifAddedToList : {
        type : Boolean,
    },
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User", 
    },
}) 
 
module.exports =  mongoose.model("Mock" , mockSchema);