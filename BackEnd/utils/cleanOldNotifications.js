const mongoose = require("mongoose");
const notificationsModel = require("../Model/notificationModel")
require("dotenv").config();
async function cleanOldNotifications(){
    try{
        await mongoose.connect(process.env.MONGO_URI);

        const today = new Date();
        const fiveDaysAgo = new Date(today-5);
        const allNotifications = await notificationsModel.deleteMany({
            createdAt : { $lt : fiveDaysAgo}
        });
        console.log(allNotifications);
        await mongoose.disconnect();
        process.exit(0);
    }
    catch(error){
        console.log("ERROR :: " , error); 
    } 
}
 
cleanOldNotifications();