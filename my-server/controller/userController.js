const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ดึงข้อมูลผู้ใช้ทั้งหมด
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // ไม่ดึง password
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// สร้างผู้ใช้ใหม่
exports.createUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // ตรวจสอบว่าผู้ใช้หรืออีเมลซ้ำหรือไม่
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // เข้ารหัสรหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 10);

        // สร้างผู้ใช้ใหม่
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// เข้าสู่ระบบผู้ใช้
exports.loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        // ค้นหาผู้ใช้
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // ตรวจสอบรหัสผ่าน
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // สร้าง JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '1h' }
        );

        // เก็บ token ใน MongoDB
        user.token = token;
        await user.save(); // อัปเดตข้อมูล user ในฐานข้อมูล

        res.status(200).json({ token, message: 'Login successful!' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ออกจากระบบผู้ใช้
exports.logoutUser = async (req, res) => {
    try {
        // ลบ token ในฝั่ง client
        res.status(200).json({ message: 'Logout successful, token removed from client' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
})
.then(response => response.json())
.then(data => {
    if (data.status === 200) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role);

        // ตรวจสอบ role แล้วเปลี่ยนเส้นทาง
        if (data.user.role === 'Admin') {
            window.location.href = '/my-app/admin.html';
        } else {
            window.location.href = '/inventory.html';
        }
    } else {
        alert('Invalid username or password');
    }
})
.catch(error => console.error('Login error:', error));
