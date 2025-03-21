const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
require('dotenv').config(); // โหลดตัวแปรจาก .env

// Middleware ตรวจสอบ token และแนบข้อมูลผู้ใช้
const authenticate = async (req, res, next) => {
    const authHeader = req.headers['authorization']; // ดึง Authorization Header
    const token = authHeader && authHeader.split(' ')[1]; // ตรวจสอบรูปแบบ Bearer <token>
    console.log('header:', token);

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // ตรวจสอบ Token
        console.log('Decoded:', decoded);

        const user = await User.findOne({ username: decoded.username }); // ✅ ค้นหาจาก username ไม่ใช่ user
        if (!user) {
            return res.status(403).json({ error: 'User not found' });
        }

        console.log('User Role:', user.role);

        req.user = { role: user.role, username: user.username }; // แนบข้อมูลผู้ใช้ใน req
        
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};


// Middleware ตรวจสอบสิทธิ์ admin
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
    }
    next();
};



module.exports = { authenticate, isAdmin };
