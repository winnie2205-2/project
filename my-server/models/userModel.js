const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const defaultTokenExpiration = '1h';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Admin", "Owner", "Employee"], default: "Employee" },
    token: { type: String, default: "" }, 
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // ✅ เพิ่ม Logs เก็บประวัติการใช้งานของ User
    activityLogs: [
        {
            action: { type: String, required: true },  // เช่น "Login", "Delete Product"
            timestamp: { type: Date, default: Date.now }, // เวลาที่กระทำ
            details: { type: mongoose.Schema.Types.Mixed } // รายละเอียดเพิ่มเติม เช่น { productId: "xxx" }
        }
    ]

}, {
    versionKey: false,
    timestamps: true
});

// 📌 Method: เพิ่ม Log ของ User
userSchema.methods.addLog = async function (action, details = {}) {
    this.activityLogs.push({ action, details });
    await this.save();
};

// 📌 Hash password before saving
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// 📌 Generate JWT Token และบันทึกลงใน Database
userSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign(
        { username: this.username, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: defaultTokenExpiration }
    );

    this.token = token;
    await this.save();

    return token;
};

// 📌 Method to compare password
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// 📌 Generate Password Reset Token
userSchema.methods.generateResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

// 📌 Ensure sensitive data is not included when returning JSON
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
