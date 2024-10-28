const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
    },
    name : {
        type : String,
        required : true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
    }
});

module.exports = mongoose.model('User', UserSchema);