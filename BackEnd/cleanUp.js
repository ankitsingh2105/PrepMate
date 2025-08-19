const mongoose = require("mongoose");

const mockModel = require("./Model/mockModel");


async function cleanUp(){
    await mongoose.connect("mongodb+srv://WHQMCNBYGhTTwIHN:ankitchauhan21500@cluster0.2ipp9om.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(today);
    const result = await mockModel.deleteMany({schedule : {$lt : today}});
    console.log(result);
    // await find
}

let temp = new Date();
if(temp < new Date("Wed Aug 20 2025 9:30 AM")){
    console.log("ok");
}
else{
    console.log("tattii");
}
cleanUp();
