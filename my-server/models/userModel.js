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

    // ✅ เพิ่มสถานะของผู้ใช้
    status: { type: String, enum: ["enable", "disable"], default: "enable" },

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

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10); // 10 คือจำนวนรอบการสร้าง salt
    }
    next();
  });
  
  // ฟังก์ชันในการตรวจสอบรหัสผ่าน
  userSchema.methods.isPasswordCorrect = async function (password) {
    return bcrypt.compare(password, this.password);
  };

// ✅ Middleware เช็คสถานะก่อนเข้าสู่ระบบ
userSchema.statics.authenticate = async function (email, password) {
    const user = await this.findOne({ email });

    if (!user) {
        throw new Error("User not found");
    }

    if (user.status === "disable") {
        throw new Error("Your account is disabled. Please contact the administrator.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error("Invalid credentials");
    }

    return user;
};

// 📌 Method: เพิ่ม Log ของ User
userSchema.methods.addLog = async function(action, details = {}) {
    this.activityLogs.push({
        action,
        details,
        timestamp: new Date()
    });
    await this.save();
};

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
