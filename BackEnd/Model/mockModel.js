const mongoose = require("mongoose");

const mockSchema = new mongoose.Schema({
    mockType: {
        type: String,
    },
    schedule: {
        type: Date
    },
    tempLock: {
        type: Boolean,
        default: true,
    },
    ifAddedToList: {
        type: Boolean,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
})

mockSchema.index({ user: 1, schedule:1, mockType: 1 }, { unique: true });
module.exports = mongoose.model("Mock", mockSchema);