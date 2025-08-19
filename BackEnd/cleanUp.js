const mongoose = require("mongoose");

const mockModel = require("./Model/mockModel");


async function cleanUp(){
    await mongoose.connect("mongodb+srv://WHQMCNBYGhTTwIHN:ankitchauhan21500@cluster0.2ipp9om.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    
    const today = new Date();
    console.log(today);
    const result = await mockModel.deleteMany({schedule : {$lt : today}});
    console.log(result);
    // await find
}
cleanUp(); 
