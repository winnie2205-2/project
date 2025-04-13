const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
require('dotenv').config(); // โหลดตัวแปรจาก .env

// Middleware ตรวจสอบ token และแนบข้อมูลผู้ใช้
const authenticate = async (req, res, next) => {
    const authHeader = req.headers['authorization']; // ดึง Authorization Header
    const token = authHeader && authHeader.split(' ')[1]; // ตรวจสอบรูปแบบ Bearer <token>
    console.log('Token received:', token);  // เพิ่มการแสดง token ที่รับมาจาก request

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // ตรวจสอบ Token
        console.log('Decoded JWT:', decoded);  // เพิ่มการแสดงข้อมูลของ decoded JWT

        const user = await User.findOne({ username: decoded.username }); // ค้นหาผู้ใช้จาก username
        if (!user) {
            return res.status(403).json({ error: 'User not found' });
        }

        console.log('User Role:', user.role);  // แสดงข้อมูลของ user ที่พบ

        req.user = { role: user.role, username: user.username, object_id: user._id }; // แนบข้อมูลผู้ใช้ใน req
        
        next();
    } catch (error) {
        console.error('JWT verification failed:', error);  // เพิ่มการแสดงข้อผิดพลาดของการตรวจสอบ token
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid token" });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        return next();
    }
    return res.status(403).json({ message: "Admin access required" });
};

module.exports = { authenticate, isAdmin, authMiddleware };