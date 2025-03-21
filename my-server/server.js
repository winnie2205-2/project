const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const config = require('./config/config.js');

const { authenticate, isAdmin } = require("./middleware/authMiddleware");
const itemsRoutes = require('./routes/itemsroute');
const userRoutes = require('./routes/userRoute'); 
const categoryRoutes = require('./routes/categoryroute'); 

const User = require('./models/userModel'); // Import User Model
const Item = require('./models/itemModel'); 



dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000', // กำหนดให้อนุญาตเฉพาะ frontend ที่มาจาก localhost:3000
    allowedHeaders: ['Authorization', 'Content-Type'], // อนุญาต header authorization
  }))

// เชื่อมต่อ MongoDB
mongoose.connect(config.url)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });


// Routes
app.use('/api/users', userRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/categories', categoryRoutes);

// Static Files
const staticDirectory = path.join(__dirname, '../my-app');
app.use(express.static(staticDirectory));

// ✅ แก้ไขเส้นทางสำหรับหน้า Inventory
app.get('/inventory.html', authenticate, (req, res) => {
    res.sendFile(path.join(staticDirectory, 'inventory.html'));
}); 

// ✅ แก้ไขเส้นทาง Admin ให้มีการตรวจสอบสิทธิ์
app.get("/admin.html", authenticate, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ✅ Forgot Password API (แก้ไข)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 ชั่วโมง
        await user.save();

        const resetLink = `http://localhost:5000/reset-password/${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request',
            text: `Click this link to reset your password: ${resetLink}`,
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ error: 'Error sending reset email' });
    }
});

// ✅ Reset Password API (เพิ่ม bcrypt)
app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // เข้ารหัสรหัสผ่านก่อนบันทึก
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error resetting password' });
    }
});

// ✅ ค้นหาสินค้า (ตรวจสอบ Item Model)
app.get('/search', authenticate, async (req, res) => {
    const searchQuery = req.query.name;
  
    try {
        const items = await Item.find({
            name: { $regex: searchQuery, $options: 'i' }
        });

        res.json(items);
    } catch (error) {
        res.status(500).json({ error: "Error fetching items" });
    }
});

// ✅ อัปโหลดไฟล์ Excel (ตรวจสอบโครงสร้างข้อมูล)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

app.post('/api/upload-excel', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const filePath = path.join(__dirname, 'uploads', req.file.filename);
        const workbook = XLSX.readFile(filePath);
        const sheetNames = workbook.SheetNames;
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);

        // ตรวจสอบและแปลงข้อมูลให้ตรงกับ itemSchema
        const formattedData = data.map(item => ({
            id: item.id ? String(item.id) : new Date().getTime().toString(), // ใช้ timestamp เป็นค่า default
            name: item.name || "Unnamed",
            location: item.location || "Unknown",
            qty: item.qty ? Number(item.qty) : 0,
            price: item.price ? Number(item.price) : 0,
            status: item.status === 'Enable' || item.status === 'Disable' ? item.status : 'Enable',
            reorderPoint: item.reorderPoint ? Number(item.reorderPoint) : 0
        }));

        const items = await Item.insertMany(formattedData);

        res.json({ message: 'Items uploaded successfully', items });
    } catch (error) {
        console.error('Error uploading excel file:', error);
        res.status(500).json({ error: 'Error uploading items from Excel' });
    }
});

app.get('/api/users/role_check', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // ตัด "Bearer " ออก
    if (!token) return res.status(403).json({ error: "No token provided" });

    try {
        const decoded = jwt.verify(token, 'secret-key'); // ตรวจสอบความถูกต้องของ token
        res.json({ role: decoded.role });
    } catch (error) {
        res.status(403).json({ error: "Invalid or expired token" });
    }
});

// ✅ เพิ่ม User ใหม่
app.post('/api/users/add', async (req, res) => {
    const { User_ID, Username, Gmail, Password, status, Role } = req.body;

    console.log("Request body:", req.body);

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!User_ID || !Username || !Gmail || !Password || !Role) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็นทั้งหมด' });
    }

    // ตรวจสอบว่า Role เป็นค่าใน enum หรือไม่
    const validRoles = ["Admin", "Owner", "Employee"];
    if (!validRoles.includes(Role)) {
        return res.status(400).json({ error: 'Role ต้องเป็นค่า Admin, Owner หรือ Employee' });
    }

    try {
        // เข้ารหัสรหัสผ่านก่อนบันทึก
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Password, salt);  // hash password

        // สร้างผู้ใช้ใหม่
        const newUser = new User({
            username: Username,
            email: Gmail,
            password: hashedPassword,
            role: Role,
            token: '',  // กำหนดค่าเริ่มต้นเป็น string ว่าง
            resetPasswordToken: '',  // กำหนดค่าเริ่มต้นเป็น string ว่าง
            resetPasswordExpires: null,  // กำหนดค่าเริ่มต้นเป็น null
        });

        console.log("New User object:", newUser);

        // บันทึกข้อมูลผู้ใช้ลง MongoDB
        await newUser.save();

        res.status(201).json({ message: 'ผู้ใช้ถูกเพิ่มสำเร็จ', user: newUser });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้' });
    }
});


// ✅ ตั้งค่าพอร์ตและเริ่มเซิร์ฟเวอร์
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
