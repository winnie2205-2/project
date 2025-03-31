const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const XLSX = require('xlsx');
const csvParser = require('csv-parser');
const fs = require('fs');
const nodemailer = require('nodemailer');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const config = require('./config/config.js');

const { authenticate, isAdmin } = require("./middleware/authMiddleware");
const itemsRoutes = require('./routes/itemsroute');
const userRoutes = require('./routes/userRoute'); 
const categoryRoutes = require('./routes/categoryroute'); 
const profileroutes = require('./routes/profileroute'); 

const User = require('./models/userModel'); // Import User Model
const Item = require('./models/itemModel'); 
const Category = require('./models/categoryModel');



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
app.use('/api/profile', profileroutes);

// Static Files
const staticDirectory = path.join(__dirname, '../my-app');
app.use(express.static(staticDirectory));
app.use(express.static('assets'));

// ✅ แก้ไขเส้นทางสำหรับหน้า Inventory
app.get('/inventory.html', authenticate, (req, res) => {
    res.sendFile(path.join(staticDirectory, 'inventory.html'));
}); 

// ✅ แก้ไขเส้นทาง Admin ให้มีการตรวจสอบสิทธิ์
app.get("/admin.html", authenticate, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "nasaza300@gmail.com",
        pass: "ewbx wlyn iveg ismm"
    }
});

// ✅ API ขอรีเซ็ตรหัสผ่าน
app.post("/api/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "❌ ต้องระบุอีเมล" });
        }

        // ค้นหาผู้ใช้จากฐานข้อมูล
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "❌ ไม่พบอีเมลนี้ในระบบ" });
        }

        // ✅ สร้าง JWT Token
        const token = jwt.sign({ id: user._id }, "secret-key", { expiresIn: "15m" });
        const resetLink = `http://localhost:5000/resetpass.html?token=${token}`;

        // ✅ กำหนดค่าอีเมลที่ส่งออกไป
        const mailOptions = {
            from: "nasaza300@gmail.com",
            to: email,
            subject: "🔐 รีเซ็ตรหัสผ่านของคุณ",
            html: `<p>คลิกลิงก์ด้านล่างเพื่อเปลี่ยนรหัสผ่านของคุณ:</p>
                   <p><a href="${resetLink}">${resetLink}</a></p>
                   <p>ลิงก์นี้จะหมดอายุภายใน 15 นาที</p>`
        };

        // ✅ ส่งอีเมล
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("❌ Error sending email:", error);
                return res.status(500).json({ error: "❌ ไม่สามารถส่งอีเมลได้" });
            }
            res.json({ message: "✅ กรุณาตรวจสอบอีเมลของคุณเพื่อตั้งค่ารหัสผ่านใหม่" });
        });

    } catch (error) {
        console.error("❌ Error in forgot-password:", error);
        res.status(500).json({ error: "❌ มีข้อผิดพลาดบางอย่าง กรุณาลองใหม่" });
    }
});


// ✅ API ตั้งรหัสผ่านใหม่
app.post("/api/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // ✅ ตรวจสอบ Token
        const decoded = jwt.verify(token, "secret-key");

        // ✅ เข้ารหัสรหัสผ่านใหม่
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // ✅ อัปเดตรหัสผ่านในฐานข้อมูล
        await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });

        res.json({ message: "✅ รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว!" });

    } catch (error) {
        console.error("❌ Error in reset-password:", error);
        res.status(400).json({ error: "❌ ลิงก์หมดอายุหรือไม่ถูกต้อง" });
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

// Remove the second declaration of 'upload'
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ตรวจสอบว่าโฟลเดอร์ uploads มีอยู่หรือไม่ ถ้าไม่มีให้สร้าง
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// ฟังก์ชันบันทึกข้อมูลลงฐานข้อมูล
const saveToDatabase = async (importedData, res, fileType) => {
    try {
        for (let data of importedData) {
            let category = await Category.findOne({ categoryName: data.categoryName });

            if (!category) {
                category = new Category({ categoryName: data.categoryName });
                await category.save();
                console.log("Category created:", category.categoryName);
            }

            const item = new Item({
                categoryID: category._id,
                name: data.Name,
                location: data.Location,
                qty: parseInt(data.qty) || 0, // ถ้าไม่มีค่าจะใส่ 0
                price: parseFloat(
                    typeof data.price === 'string' ? data.price.replace(/,/g, '') : data.price
                ) || 0, // ถ้าไม่มีค่าจะใส่ 0
                status: data.Status || 'Unavailable',
                reorderPoint: data['Reorder point'] ? parseInt(data['Reorder point']) : null
            });

            await item.save();
            console.log("Item saved successfully:", item);
        }

        res.status(200).json({ message: 'Data imported successfully' });
    } catch (error) {
        console.error("Error during import:", error);
        res.status(500).json({ error: 'Failed to import data' });
    }
};


// API สำหรับอัปโหลดไฟล์และนำเข้าข้อมูล
app.post('/api/import', upload.single('file'), async (req, res) => {
    if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileType = req.body.fileType;
    const filePath = req.file.path;

    console.log('File uploaded successfully:', req.file);

    try {
        let importedData = [];

        if (fileType === 'Excel(CSV)' && path.extname(filePath) === '.csv') {
            const results = [];
            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    console.log('CSV Data:', results);
                    importedData = results;
                    await saveToDatabase(importedData, res, 'CSV');
                })
                .on('error', (err) => {
                    console.error('Error reading CSV file:', err);
                    res.status(500).json({ error: 'Error reading CSV file' });
                });
        } else if (fileType === 'Excel' && (path.extname(filePath) === '.xls' || path.extname(filePath) === '.xlsx')) {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

            console.log('Excel Data:', data);
            importedData = data;

            await saveToDatabase(importedData, res, 'Excel');
        } else {
            return res.status(400).json({ error: 'Unsupported file type' });
        }
    } catch (error) {
        console.error('Error importing data:', error);
        res.status(500).json({ error: 'Failed to import data', details: error.message });
    }
});


// ✅ ตั้งค่าพอร์ตและเริ่มเซิร์ฟเวอร์
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
