const mongoose = require("mongoose");

const mockSchema = new mongoose.Schema({
    mockType: {
        type: String,
        required : true,
    },
    schedule: {
        type: Date,
        required : true,
    },
    isAvailable: {
        type: Boolean,
        default: false,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require : true
    },
})

mockSchema.index({ user: 1, schedule:1, mockType: 1 }, { unique: true });
module.exports = mongoose.model("Mock", mockSchema);