const mongoose = require("mongoose");

const notificationModel = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
    }
})

module.exports = mongoose.model("Notification", notificationModel);