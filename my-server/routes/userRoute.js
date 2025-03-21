const express = require('express');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { authenticate } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/users', authenticate, async (_, res) => {
    try {
        const users = await User.find({}, '-password'); // ไม่ดึง password
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
        const { username, email, password, role } = req.body;
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });

        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const newUser = new User({ username, email, password, role });
        await newUser.save();

        await newUser.addLog('create', {});

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    console.log("📌 Login API called with:", req.body);

    const { username, password } = req.body;
    if (!username || !password) {
        console.log("❌ Missing username or password");
        return res.status(400).json({ message: "Username and password required" });
    }

    try {
        const user = await User.findOne({ username });
        console.log("🔍 User found in database:", user);

        if (!user) {
            console.log("❌ User not found");
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const isMatch = await user.comparePassword(password);
        console.log("🔑 Password match:", isMatch);

        if (!isMatch) {
            console.log("❌ Password incorrect");
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // ใช้ await ที่นี่เพื่อให้โค้ดรอจน `token` ถูกสร้างเสร็จ
        const token = await user.generateAuthToken(); // เพิ่ม `await` ที่นี่

        await user.addLog('login', {});

        console.log("✅ Login successful, token generated");

        // ตรวจสอบ role และส่ง URL ที่เหมาะสม
        let redirectUrl = '';
        if (user.role === 'Admin') {
            redirectUrl = '/admin.html';  // ให้ไปที่หน้า admin
        } else if (user.role === 'Employee') {
            redirectUrl = '/inventory.html';  // ให้ไปที่หน้า index
        }

        // ส่ง token, user และ redirectUrl กลับไปที่ client
        res.json({ token, user: user.toJSON(), redirectUrl });
    } catch (error) {
        console.error("🚨 Error during login:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// 📌 Forgot Password
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = hashedResetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 ชม.
        await user.save();

        const resetLink = `http://localhost:5000/api/user/reset-password/${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Reset Password",
            text: `Click here to reset your password: ${resetLink}`,
        });

        res.json({ message: "Password reset email sent" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// 📌 Reset Password
router.post("/reset-password/:token", async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // ตรวจสอบว่า password ถูกส่งมาหรือไม่
        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }

        // แฮช token ที่ได้รับ
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // ค้นหาผู้ใช้ที่มี token ตรงกันและยังไม่หมดอายุ
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() } // ตรวจสอบวันหมดอายุของ token
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // แฮชรหัสผ่านใหม่ก่อนบันทึก
        const hashedPassword = await bcrypt.hash(password, 10);

        // อัปเดตข้อมูลรหัสผ่าน และลบข้อมูลที่ไม่จำเป็น
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // บันทึกข้อมูลในฐานข้อมูล
        await user.save();

        res.json({ message: "Password has been reset successfully" });
    } catch (error) {
        console.error("Error resetting password:", error);
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
        const { username, email, password } = req.body;
        
        // ค้นหาผู้ใช้ตาม ID
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // อัปเดตข้อมูลที่ส่งมา (ถ้ามี)
        if (username) user.username = username;
        if (email) user.email = email;
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
    try {
        const { id } = req.params;
        console.log("Deleting user ID:", id);

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.addLog('delete', {});

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('🚨 Error deleting user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/userlogs', authenticate, async (req, res) => {
    try {
        const logs = await UserLog.find().sort({ timestamp: -1 }); // เรียงจากใหม่ -> เก่า
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});


module.exports = router;
