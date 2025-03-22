const express = require('express');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');
const mongoose = require('mongoose')
const router = express.Router();
const hashPassword = require('../hash');
const comparePassword = require('../hash');

router.get('/users', authenticate, async (req, res) => {
    try {
        const { status } = req.query; // รับค่า status จาก query string
        const query = {};

        if (status) {
            query.status = status; // เพิ่มเงื่อนไขในการค้นหา ถ้ามีค่า status ส่งมา
        }

        const users = await User.find(query, '-password'); // ไม่ดึง password
        const formattedUsers = users.map(user => ({
            _id: user._id.toString(), // ส่งค่า _id ไปให้ frontend ใช้งาน
            username: user.username,
            role: user.role,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));

        res.json(formattedUsers);
    } catch (error) {
        console.error('🚨 Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 📌 สร้าง User
router.post('/create', async (req, res) => {
    try {
        const { username, email, password, role, status = "enable" } = req.body;

        if (!username || !email || !password || !role) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });

        if (existingUser) {
            return res.status(400).json({ error: "Username or email already exists" });
        }

        console.log('password:', password);

        // ✅ ใช้ฟังก์ชัน hashPassword เพื่อแฮชรหัสผ่าน
        const hashedPassword = await hashPassword(password);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,  // 🔑 บันทึกรหัสผ่านที่ถูก hash
            role,
            status
        });

        await newUser.save();
        await newUser.addLog("create", { status });

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("🚨 Error creating user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/login', async (req, res) => {
    console.log("📌 Login API called with:", req.body);

    const { username, password } = req.body;

    if (!username || !password) {
        console.log("❌ Missing username or password");
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            console.log("❌ User not found");
            return res.status(401).json({ message: "Invalid username or password" });
        }

        console.log("🔑 Input password:", password);
        console.log("🔒 Hashed password in DB:", user.password);

        // ✅ ใช้ฟังก์ชัน comparePassword ในการตรวจสอบรหัสผ่าน
        const isMatch = await comparePassword(password, user.password);
        console.log("🔍 Password match result:", isMatch);

        if (!isMatch) {
            console.log("❌ Password incorrect");
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const token = await user.generateAuthToken();
        await user.addLog('login', { ip: req.ip, device: req.headers['user-agent'] });

        console.log("✅ Login successful, token generated");

        let redirectUrl = '';
        if (user.role === 'Admin') {
            redirectUrl = '/admin.html';
        } else if (user.role === 'Employee' || user.role === 'Owner') {
            redirectUrl = '/overview.html';
        }

        res.json({ token, user: user.toJSON(), redirectUrl });
    } catch (error) {
        console.error("🚨 Error during login:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get('/role_check', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized, no user found' });
        }

        console.log('🔍 req.user:', req.user);

        const { role, username } = req.user;
        const user = await User.findOne({ role, username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('✅ User found:', user);
        res.json({ username: req.user.username, role: req.user.role });

    } catch (error) {
        console.error('🚨 Server Error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
    }
});

// 📌 Edit User
router.put('/edit/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, password, status: userStatus, role: userRole } = req.body;
        
        // ค้นหาผู้ใช้ตาม ID
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // อัปเดตข้อมูลที่ส่งมา (ถ้ามี)
        if (username) user.username = username;
        if (email) user.email = email;
        if (userStatus) user.status = userStatus;
        if (userRole) user.role = userRole;
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }
        
        // บันทึกการเปลี่ยนแปลง
        await user.save();
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('🚨 Error updating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/delete/:id', authenticate, async (req, res) => {
    console.log('deldel');
    try {
        const { id } = req.params;
        console.log("Deleting user ID:", id);

        const user = await User.findByIdAndDelete(id);
        console.log('user:',user)
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // await user.addLog('delete', {});

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('🚨 Error deleting user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/data_logs', authenticate, async (req, res) => {
    try {
        const userId = req.user.object_id;

        // ค้นหาผู้ใช้และโหลด activityLogs
        const user = await User.findById(userId).populate("activityLogs");

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // เรียง logs จากใหม่ไปเก่า
        const logs = user.activityLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        console.log('log:', logs)
        res.json(logs);
    } catch (error) {
        console.error('🚨 Error fetching logs:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

module.exports = router;
