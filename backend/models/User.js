const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    otp: String,
    otpExpires: Date,
    isVerified: { type: Boolean, default: false },
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
