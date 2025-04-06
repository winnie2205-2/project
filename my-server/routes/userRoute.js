const express = require('express');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');
// const mongoose = require('mongoose')
const router = express.Router();
const hashPassword = require('../hash');
const comparePassword = require('../hash');
const path = require('path'); 

router.use('/assets/img', express.static(path.join(__dirname, '../my-app/assets/img')));

router.get('/user-icon/:role', authenticate, (req, res) => {
    const { role } = req.params;

    // ตรวจสอบว่า role ที่ได้รับถูกต้องหรือไม่
    if (!['admin', 'owner', 'employee'].includes(role.toLowerCase())) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    // กำหนดชื่อไฟล์ของ icon ตาม role
    let iconFile;
    switch (role.toLowerCase()) {
        case 'admin':
            iconFile = 'admin.png';
            break;
        case 'owner':
            iconFile = 'owner.png';
            break;
        case 'employee':
            iconFile = 'employee.png';
            break;
        default:
            return res.status(400).json({ message: 'Role not found' });
    }

    // ส่ง URL ของไฟล์ icon กลับไปให้ frontend
    const iconUrl = `/assets/img/${iconFile}`;
    res.json({ iconUrl });
});

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

        await newUser.addLog("create", { status, createdBy: req.user.username });

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

        // ตรวจสอบว่าแก้ไขฟิลด์อะไรบ้าง
        const updatedFields = [];
        if (username && username !== user.username) {
            user.username = username;
            updatedFields.push('username');
        }
        if (email && email !== user.email) {
            user.email = email;
            updatedFields.push('email');
        }
        if (userStatus && userStatus !== user.status) {
            user.status = userStatus;
            updatedFields.push('status');
        }
        if (userRole && userRole !== user.role) {
            user.role = userRole;
            updatedFields.push('role');
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
            updatedFields.push('password');
        }

        // บันทึกการเปลี่ยนแปลง
        await user.save();

       // เมื่อแก้ไข user
       await user.addLog("edit", { username, email, status: userStatus, role: userRole, editedBy: req.user.username });


        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('🚨 Error updating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.delete('/delete/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Deleting user ID:", id);

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 👉 เก็บ log ก่อนลบ
        await user.addLog("delete", { deletedBy: req.user.username });


        // 👉 ลบผู้ใช้
        await User.findByIdAndDelete(id);

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

        // รวม username เข้าไปในแต่ละ log
        const logs = user.activityLogs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(log => ({
                ...log.toObject(),  // เปลี่ยน activityLog ให้เป็น Object
                username: user.username  // เพิ่ม username
            }));

        console.log('log:', logs);
        res.json(logs);
    } catch (error) {
        console.error('🚨 Error fetching logs:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

module.exports = router;
