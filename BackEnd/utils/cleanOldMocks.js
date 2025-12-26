const mongoose = require("mongoose");

const mockModel = require("../Model/mockModel");

require("dotenv").config();

async function cleanUp() {
    try{
        await mongoose.connect(process.env.MONGO_URI);
        const today = new Date();
        const result = await mockModel.deleteMany({ schedule: { $lt: today } });        console.log(result);
        await mongoose.disconnect();
        process.exit(0);
    }
    catch(error){
        console.log("Some error :" , error);
    }
}
cleanUp(); 

