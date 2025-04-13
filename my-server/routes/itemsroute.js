const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Item = require("../models/itemModel");
const Category = require("../models/categoryModel");
const PDFDocument = require("pdfkit");
const iconv = require('iconv-lite');
const path = require('path');
const fs = require("fs");
const thaiFontPath = path.join(__dirname, '../../my-app/assets/fonts/THSarabunNew.ttf');
const { authenticate } = require('../middleware/authMiddleware'); 
const User = require('../models/userModel');

if (!fs.existsSync(thaiFontPath)) {
    console.error(`🚨 ไม่พบฟอนต์ที่: ${thaiFontPath}`);
} else {
    console.log(`✅ พบฟอนต์ที่: ${thaiFontPath}`);
}

// ✅ ดึงสินค้าทั้งหมด พร้อมแสดง categoryName แทน ObjectId
router.get("/overview", async (req, res) => {
    try {
        const { location } = req.query;
        let filter = {};

        // ตรวจสอบ location และใช้เงื่อนไขที่เหมาะสม
        if (location && location !== "all") {
            filter.location = location;
        }

        // ดึงข้อมูลตามเงื่อนไข filter
        const items = await Item.find(filter).populate("categoryID", "categoryName");

        let totalRevenue = 0, totalExpense = 0, totalLoss = 0;
        let locations = {
            Krabi: { revenue: 0, expense: 0, loss: 0 },
            "Nakhon Si Thammarat": { revenue: 0, expense: 0, loss: 0 }
        };
        let categoryOverview = {};

        items.forEach(item => {
            let revenue = 0, expense = 0;
            const categoryName = item.categoryID ? item.categoryID.categoryName : "Uncategorized";

            item.activityLogs.forEach(log => {
                if (log.action === "withdraw") {
                    revenue += log.qty * item.price; // รายได้จากการขาย
                } else if (log.action === "restock") {
                    expense += log.qty * (log.purchasePrice || item.price); // ใช้ purchasePrice ถ้ามี
                }
            });

            const loss = Math.max(0, expense - revenue); // คำนวณขาดทุน

            // อัปเดตค่า overview
            totalRevenue += revenue;
            totalExpense += expense;
            totalLoss += loss;

            // อัปเดตข้อมูลแยกตาม location
            if (item.location in locations) {
                locations[item.location].revenue += revenue;
                locations[item.location].expense += expense;
                locations[item.location].loss += loss;
            }

            // อัปเดตข้อมูลแยกตาม category
            if (!categoryOverview[categoryName]) {
                categoryOverview[categoryName] = { revenue: 0, expense: 0, loss: 0 };
            }
            categoryOverview[categoryName].revenue += revenue;
            categoryOverview[categoryName].expense += expense;
            categoryOverview[categoryName].loss += loss;
        });

        let response = {
            overview: {
                totalRevenue,
                totalExpense,
                totalLoss
            },
            locations,
            categoryOverview
        };

        // เงื่อนไขสำหรับ location ที่ระบุ (Krabi หรือ Nakhon Si Thammarat)
        if (location && location !== "all") {
            response = {
                overview: {
                    totalRevenue: locations[location]?.revenue || 0,
                    totalExpense: locations[location]?.expense || 0,
                    totalLoss: locations[location]?.loss || 0
                },
                categoryOverview
            };
        }

        res.json(response);
    } catch (error) {
        console.error("🚨 Error fetching overview:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/overview/chart", async (req, res) => {
    try {
        const { location } = req.query;
        let filter = {};

        if (location && location !== "all") {
            filter.location = location;
        }

        const items = await Item.find(filter)
            .populate("categoryID", "categoryName")
            .select("name qty price createdAt activityLogs");

        let monthlyData = {}; // เก็บข้อมูลรายเดือน
        let productData = {}; // เก็บข้อมูลตามสินค้าแทน category

        let itemList = []; // เก็บรายการสินค้า
        let topProducts = {}; // เก็บข้อมูลสินค้า Top 10

        items.forEach(item => {
            const revenue = item.qty * item.price;
            let expense = 0;

            item.activityLogs.forEach(log => {
                if (log.action === "withdraw") {
                    expense += log.qty * item.price;
                }
            });

            // ✅ จัดข้อมูลรายเดือน
            const month = new Date(item.createdAt).toLocaleString("en-US", { month: "short", year: "numeric" });

            if (!monthlyData[month]) {
                monthlyData[month] = { revenue: 0, expense: 0 };
            }
            monthlyData[month].revenue += revenue;
            monthlyData[month].expense += expense;

            // ✅ จัดข้อมูลตามสินค้า (แทน Category Overview)
            if (!productData[item.name]) {
                productData[item.name] = { revenue: 0, expense: 0 };
            }
            productData[item.name].revenue += revenue;
            productData[item.name].expense += expense;

            // ✅ เก็บข้อมูลสินค้า
            itemList.push({
                name: item.name,
                revenue,
                expense
            });

            // ✅ จัดข้อมูลสินค้าสำหรับ Top 10
            if (!topProducts[item.name]) {
                topProducts[item.name] = { revenue: 0, expense: 0 };
            }
            topProducts[item.name].revenue += revenue;
            topProducts[item.name].expense += expense;
        });

        // ✅ คัดกรอง Top 10 สินค้าโดยเรียงตามรายได้สูงสุด
        const top10Products = Object.entries(topProducts)
            .map(([name, values]) => ({ name, ...values }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        res.json({
            items: itemList,
            topProducts: top10Products,
            monthlyOverview: Object.entries(monthlyData).map(([month, values]) => ({
                month,
                revenue: values.revenue,
                expense: values.expense
            })),
            categoryOverview: Object.entries(productData).map(([name, values]) => ({
                productName: name,  // เปลี่ยนจาก category เป็น productName
                revenue: values.revenue,
                expense: values.expense
            }))
        });
    } catch (error) {
        console.error("🚨 Error fetching chart data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


router.get("/", async (req, res) => {
    try {
        const items = await Item.find().populate("categoryID", "categoryName");

        if (!items.length) {
            return res.status(404).json({ message: "No items found" });
        }

        // คำนวณ Reorder Alert (แจ้งเตือนเมื่อสินค้าใกล้หมด)
        const itemsWithAlert = items.map(item => {
            const warningThreshold = item.reorderPoint + (item.qty * 0.15); // 15% ของสินค้าทั้งหมด
            let alertLevel = "normal";

            if (item.status === "disabled") {
                alertLevel = "gray"; // สีเทา (ไอเทมถูกปิดใช้งาน)
            } else if (item.qty <= item.reorderPoint) {
                alertLevel = "danger"; // สีแดง (ถึงหรือต่ำกว่า reorderPoint)
            } else if (item.qty > item.reorderPoint && item.qty <= warningThreshold) {
                alertLevel = "warning"; // สีเหลือง (อยู่ในช่วง 15% ก่อนถึง reorderPoint)
            } else {
                alertLevel = "normal"; // ปกติ (เกิน warningThreshold)
            }

            return {
                _id: item._id,
                categoryName: item.categoryID ? item.categoryID.categoryName : "", // ส่งค่า categoryName โดยตรง
                name: item.name,
                location: item.location,
                qty: item.qty,
                price: item.price,
                status: item.status,
                reorderPoint: item.reorderPoint,
                alertLevel
            };
        });

        res.json(itemsWithAlert);
    } catch (err) {
        res.status(500).json({ message: "Error fetching items", error: err.message });
    }
});

// ✅ ดึงข้อมูลสินค้าตาม ID
router.get("/:id", async (req, res) => {
    try {
        const item = await Item.findById(req.params.id).populate("categoryID", "categoryName");

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // ✅ คำนวณ Reorder Alert
        const threshold = item.reorderPoint * 1.15;
        let alertLevel = "normal";

        if (item.qty <= item.reorderPoint) {
            alertLevel = "danger";
        } else if (item.qty <= threshold) {
            alertLevel = "warning";
        }

        res.json({
            _id: item._id,
            name: item.name,
            location: item.location,
            qty: item.qty,
            price: item.price,
            status: item.status,
            reorderPoint: item.reorderPoint,
            category: item.categoryID.categoryName,
            alertLevel
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// itemsroute.js
router.post("/create", authenticate, async (req, res) => {
    try {
        const { name, location, qty, price, reorderPoint, categoryName } = req.body;

        console.log('Received data:', req.body); // ตรวจสอบข้อมูลที่รับมา

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!name || !location || qty === undefined || qty === null || !price || reorderPoint === undefined || reorderPoint === null || !categoryName) {
            console.log('Missing data:', { name, location, qty, price, reorderPoint, categoryName });
            return res.status(400).json({ message: "❌ ข้อมูลไม่ครบ กรุณาตรวจสอบ JSON ที่ส่งมา" });
        }

        if (typeof qty !== 'number' || typeof price !== 'number' || typeof reorderPoint !== 'number') {
            console.log('Invalid data types:', { qty, price, reorderPoint });
            return res.status(400).json({ message: "❌ ข้อมูลไม่ถูกต้อง: qty, price และ reorderPoint ต้องเป็นตัวเลข" });
        }

        // ใช้ findOneAndUpdate เพื่อทำให้การค้นหาและการสร้าง category เป็นขั้นตอนเดียว
        let category = await Category.findOneAndUpdate(
            { categoryName }, // ค้นหาจาก categoryName
            { categoryName }, // ถ้าไม่เจอจะสร้างใหม่
            { new: true, upsert: true } // ถ้าไม่เจอจะสร้างใหม่
        );
        console.log('Category found or created:', category); // ตรวจสอบ category ที่ได้

        const newItem = new Item({
            name,
            location,
            qty,
            price,
            reorderPoint,
            categoryID: category._id,
            createdBy: req.user.username  // เพิ่มผู้สร้างใน newItem
        });

        console.log('New item object:', newItem); // ตรวจสอบข้อมูลของสินค้าใหม่

        // บันทึกสินค้าใหม่
        await newItem.save();
        console.log('Item saved successfully:', newItem); // ตรวจสอบเมื่อสินค้าเพิ่มแล้ว

        // ค้นหาผู้ใช้ที่เพิ่มสินค้า
        const currentUser = await User.findOne({ username: req.user.username });
        console.log('Current user:', currentUser); // ตรวจสอบข้อมูลผู้ใช้

        if (currentUser) {
            // บันทึก Log ใน User
            try {
                await currentUser.addLog("Create Item", {
                    itemName: name,
                    itemLocation: location,
                    itemQty: qty,
                    itemPrice: price,
                    itemReorderPoint: reorderPoint,
                    categoryName,
                    createdBy: req.user.username,
                    role: currentUser.role,
                    ip: req.ip,
                    device: req.headers['user-agent'],
                    // เพิ่มรายละเอียดการสร้างสินค้า
                    logDetails: `name: ${name}, qty: ${qty}, price: ${price}, location: ${location}`
                });
                console.log(`📝 Log added for ${currentUser.username} creating item ${name}`);
            } catch (logError) {
                console.log("⚠️ Error while logging activity:", logError);
            }
        } else {
            console.log("⚠️ Cannot find current user to log activity.");
        }

        // ส่งข้อมูลกลับพร้อมข้อมูลสินค้าที่เพิ่ม
        res.status(201).json({ 
            message: "✅ สินค้าถูกเพิ่มแล้ว!", 
            newItem: { id: newItem._id, name: newItem.name, price: newItem.price, location: newItem.location, qty: newItem.qty, reorderPoint: newItem.reorderPoint }
        });

    } catch (err) {
        console.log('Error during item creation:', err); // ตรวจสอบข้อผิดพลาดที่เกิดขึ้น
        res.status(400).json({ message: "❌ เกิดข้อผิดพลาด: " + err.message });
    }
});

// ✅ แก้ไขข้อมูลสินค้า พร้อมการเปลี่ยนแปลง category (ถ้าจำเป็น)
router.patch("/edit/:id", authenticate, async (req, res) => {
    try {
        const { name, location, qty, price, reorderPoint, status, categoryName } = req.body; // ดึงข้อมูลจาก body
        const { id } = req.params;  // ใช้ id จาก URL parameter

        let categoryID;

        if (categoryName) {
            let category = await Category.findOne({ categoryName });
            if (!category) {
                category = new Category({ categoryName });
                await category.save();  // บันทึกหมวดหมู่ใหม่
            }
            categoryID = category._id;
        }

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({ message: "Invalid price" });
        }

        let parsedReorderPoint = reorderPoint === "null" || reorderPoint === null || reorderPoint === undefined ? 0 : reorderPoint;

        const updates = {
            name,
            location,
            qty,
            price: parsedPrice,
            reorderPoint: parsedReorderPoint,
            status
        };

        if (categoryID) {
            updates.categoryID = categoryID;
        }

        // หาข้อมูลสินค้าเก่าก่อนการอัปเดต
        const previousItem = await Item.findById(id);

        if (!previousItem) {
            return res.status(404).json({ message: "Item not found" });
        }

        // อัปเดตข้อมูลสินค้า
        const updatedItem = await Item.findByIdAndUpdate(id, updates, { new: true }).populate("categoryID", "categoryName");

        if (!updatedItem) {
            return res.status(404).json({ message: "Item not found after update" });
        }

        // ค้นหาผู้ใช้ที่ทำการแก้ไขข้อมูล
        const currentUser = await User.findOne({ username: req.user.username });  // ใช้ `req.user.username`
        if (currentUser) {
            // บันทึก log การแก้ไขข้อมูลสินค้า
            await currentUser.addLog("edit", {
                itemId: id,
                itemName: updatedItem.name,
                editedBy: req.user.username,
                role: currentUser.role,
                ip: req.ip,  // IP ของผู้ใช้
                device: req.headers['user-agent'],  // ข้อมูลของอุปกรณ์
                changes: {
                    // เก็บข้อมูลก่อนการแก้ไข
                    oldData: {
                        name: previousItem.name,
                        location: previousItem.location,
                        qty: previousItem.qty,
                        price: previousItem.price,
                        reorderPoint: previousItem.reorderPoint,
                        status: previousItem.status,
                        categoryName: previousItem.categoryID ? previousItem.categoryID.categoryName : "N/A"
                    },
                    // เก็บข้อมูลหลังการแก้ไข
                    newData: {
                        name: updatedItem.name,
                        location: updatedItem.location,
                        qty: updatedItem.qty,
                        price: updatedItem.price,
                        reorderPoint: updatedItem.reorderPoint,
                        status: updatedItem.status,
                        categoryName: updatedItem.categoryID.categoryName
                    }
                }
            });

            console.log(`📝 Log added for ${currentUser.username} editing item ${updatedItem.name}`);
        } else {
            console.log("⚠️ Cannot find current user to log activity.");
        }

        res.status(200).json({ message: "✅ Update successful", updatedItem });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

// ✅ ลบสินค้า
router.delete("/:id", authenticate, async (req, res) => {
    try {
        const deletedItem = await Item.findByIdAndDelete(req.params.id);

        if (!deletedItem) {
            return res.status(404).json({ message: "Item not found" });
        }

        // ค้นหาผู้ใช้ที่ทำการลบสินค้า
        const currentUser = await User.findOne({ username: req.user.username });

        if (currentUser) {
            // บันทึก log การลบสินค้าลงในผู้ใช้
            await currentUser.addLog("Delete Item", {
                itemId: deletedItem._id,
                itemName: deletedItem.name,
                deletedBy: req.user.username,
                role: currentUser.role,
                ip: req.ip,
                device: req.headers['user-agent'],
                deletedData: {
                    // ข้อมูลของสินค้าที่ถูกลบ
                    name: deletedItem.name,
                    location: deletedItem.location,
                    qty: deletedItem.qty,
                    price: deletedItem.price,
                    reorderPoint: deletedItem.reorderPoint,
                    status: deletedItem.status,
                    categoryName: deletedItem.categoryID ? deletedItem.categoryID.categoryName : "N/A"
                }
            });

            console.log(`📝 Log added for ${currentUser.username} deleting item ${deletedItem.name}`);
        } else {
            console.log("⚠️ Cannot find current user to log activity.");
        }

        res.json({ message: "✅ Item deleted successfully" });

    } catch (err) {
        console.log('Error during item deletion:', err);
        res.status(500).json({ message: "Error deleting item", error: err.message });
    }
});

router.get("/report/items", async (req, res) => {
    try {
        const items = await Item.find({})
            .sort({ createdAt: -1 })
            .select("_id name location qty price status reorderPoint categoryID createdAt")
            // Change "name" to "categoryName" in populate
            .populate("categoryID", "categoryName");  // ← This is the fix

        const result = items.map(item => ({
            _id: item._id,
            name: item.name,
            location: item.location,
            qty: item.qty,
            price: item.price,
            status: item.status,
            reorderPoint: item.reorderPoint,
            createdAt: item.createdAt,
            // Access categoryName directly from populated document
            categoryName: item.categoryID?.categoryName || "N/A", // ← And this
        }));

        res.json(result);
    } catch (error) {
        console.error("Error fetching item report:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/report/low-stock", async (req, res) => {
    try {
        const lowStockItems = await Item.find({ $expr: { $lte: ["$qty", "$reorderPoint"] } })
            .sort({ qty: 1 })
            .select("_id name location qty price status reorderPoint categoryID createdAt")
            .populate("categoryID", "categoryName"); // Changed to categoryName

        const result = lowStockItems.map(item => ({
            id: item._id,
            name: item.name,
            location: item.location,
            qty: item.qty,
            price: item.price, // Keep as number for frontend formatting
            status: item.status,
            reorderPoint: item.reorderPoint,
            categoryName: item.categoryID?.categoryName || "N/A", // Optional chaining
            createdAt: item.createdAt // Keep as Date object
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching low stock report:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/withdraw', authenticate, async (req, res) => {
    const { itemId, qty } = req.body;
    const currentUser = req.user;  // ใช้ข้อมูลจาก token ที่ยืนยันตัวตนแล้ว

    // ตรวจสอบว่า currentUser มีข้อมูลหรือไม่
    if (!currentUser) {
        return res.status(400).json({ message: 'User not authenticated' });
    }

    console.log("Request Body:", req.body); // เพิ่มบรรทัดนี้เพื่อดูข้อมูลที่ได้รับจาก client

    // ตรวจสอบว่า itemId และ qty ถูกส่งมาหรือไม่
    if (!itemId || !qty) {
        return res.status(400).json({ message: 'Item ID and quantity are required' });
    }

    // ตรวจสอบว่า itemId เป็น ObjectId ที่ถูกต้องหรือไม่
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({ message: 'Invalid Item ID' });
    }

    // ตรวจสอบว่า จำนวน qty เป็นค่าบวกและไม่ใช่ NaN
    if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ message: 'Invalid quantity. It must be a positive number.' });
    }

    try {
        // ค้นหาสินค้าในฐานข้อมูลตาม itemId
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // ตรวจสอบว่า จำนวนที่ต้องการเบิกมากกว่าจำนวนที่มีในคลังหรือไม่
        if (item.qty < qty) {
            return res.status(400).json({ message: 'Insufficient stock to withdraw' });
        }

        // ลดจำนวนสินค้าในคลัง
        item.qty -= qty;

        // เพิ่มข้อมูลการเบิกใน activityLogs
        item.activityLogs.push({
            action: 'withdraw',
            qty: qty,
            user: currentUser.username,  // ใช้ currentUser ที่มาจาก req.user
            date: new Date(),
            status: 'withdrawn',
            remainingQty: item.qty,
            categoryName: item.categoryID ? item.categoryID.name : "N/A", // เพิ่ม categoryName
        });

        // บันทึกการเปลี่ยนแปลงในฐานข้อมูล
        await item.save();

        // บันทึก log การเบิกสินค้าลงในผู้ใช้
        const user = await User.findOne({ username: currentUser.username });

        if (user) {
            await user.addLog("Withdraw Item", {
                itemId: item._id,
                itemName: item.name,
                withdrawnBy: currentUser.username,
                qtyWithdrawn: qty,  // จำนวนสินค้าที่เบิก
                remainingQty: item.qty,  // จำนวนสินค้าหลังการเบิก
                categoryName: item.categoryID ? item.categoryID.name : "N/A",
                role: user.role,
                ip: req.ip,
                device: req.headers['user-agent']
            });

            console.log(`📝 Log added for ${currentUser.username} withdrawing item ${item.name}`);
        } else {
            console.log("⚠️ Cannot find current user to log activity.");
        }

        // ส่งข้อมูลกลับไปที่ Client
        res.status(200).json({
            message: 'Item withdrawn successfully',
            item: {
                id: item._id,
                name: item.name,
                remainingQty: item.qty,  // จำนวนสินค้าหลังการเบิก
                categoryName: item.categoryID ? item.categoryID.name : "N/A"
            }
        });
    } catch (error) {
        console.error('Error during withdrawal:', error);
        res.status(500).json({ message: 'Server error during withdrawal' });
    }
});

// Add product in the selection box
router.post('/api/items/add', async (req, res) => {
    try {
        const { itemId, qty, user } = req.body;
        
        // Find the item
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Update quantity
        item.qty += parseInt(qty);
        
        // Update history/log
        item.history.push({
            action: 'add',
            qty: parseInt(qty),
            user: user,
            date: new Date()
        });

        // Save the updated item
        await item.save();

        res.status(200).json(item);
    } catch (error) {
        console.error('Error adding to inventory:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Fix for router.get('/report/withdrawals')
router.get('/report/withdrawals', async (req, res) => {
    try {
        // Add .populate() to get category data
        const items = await Item.find({ "activityLogs.action": "withdraw" })
                              .populate('categoryID');

        const report = [];

        items.forEach(item => {
            item.activityLogs.forEach(log => {
                if (log.action === "withdraw") {
                    report.push({
                        // Keep all existing fields
                        itemId: item._id,
                        itemName: item.name,
                        location: item.location,
                        // Fix category name population
                        categoryName: item.categoryID ? item.categoryID.categoryName : "N/A",
                        price: item.price,
                        withdrawnQty: log.qty,
                        // Use current quantity instead of historical quantity
                        remainingQty: item.qty, // This is the current quantity
                        historicalRemainingQty: log.remainingQty, // Keep historical data if needed
                        user: log.user,
                        date: log.date,
                        status: log.status
                    });
                }
            });
        });

        res.status(200).json({
            message: "Withdrawal report generated successfully",
            report: report
        });
    } catch (error) {
        console.error('Error generating withdrawal report:', error);
        res.status(500).json({ message: 'Server error while generating report' });
    }
});

// Withdrawals PDF report
router.get("/report/withdrawals/pdf", async (req, res) => {
    try {
        const { location, startDate, endDate } = req.query;
        
        // Initialize filters
        let locationFilter = {};
        
        // Process location filter
        if (location) {
            if (typeof location === 'string') {
                if (location.toLowerCase() === "both") {
                    locationFilter["location"] = { $in: ["Nakhon Si Thammarat", "Krabi"] };
                } else {
                    locationFilter["location"] = location;
                }
            } else if (Array.isArray(location)) {
                locationFilter["location"] = { $in: location };
            }
        }

        // Process date filter
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter["activityLogs.date"] = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59))
            };
        }

        // Build query combining filters
        const query = { "activityLogs.action": "withdraw", ...dateFilter, ...locationFilter };
        
        // Fetch data from MongoDB
        const items = await Item.find(query).populate("categoryID");
        
        // Transform data
        const withdrawals = items.flatMap(item => 
            item.activityLogs
                .filter(log => log.action === "withdraw")
                .filter(log => 
                    !startDate || !endDate || 
                    (new Date(log.date) >= new Date(startDate) && new Date(log.date) <= new Date(new Date(endDate).setHours(23, 59, 59)))
                )
                .map(log => ({
                    categoryName: item.categoryID?.categoryName || "ไม่ระบุหมวดหมู่",
                    itemName: item.name,
                    location: item.location === "Nakhon Si Thammarat" ? "นครศรีฯ" : "กระบี่",
                    remainingQty: log.remainingQty || 0,
                    price: item.price || 0,
                    withdrawnQty: log.qty || 0,
                    date: log.date
                }))
        );

        withdrawals.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Calculate totals
        const totalWithdrawn = withdrawals.reduce((sum, item) => sum + item.withdrawnQty, 0);
        const totalValue = withdrawals.reduce((sum, item) => sum + (item.withdrawnQty * item.price), 0);

        // Formatting functions
        const formatInteger = (num) => num !== undefined && num !== null ? num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0';
        const formatCurrency = (num) => num !== undefined && num !== null ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
        const formatDateOnly = (date) => date ? new Date(date).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }) : 'N/A';

        // PDF Setup - Set 1 inch margins (72 points per inch)
        const margin = 72;
        const doc = new PDFDocument({ 
            margins: {
                top: margin,
                bottom: margin,
                left: margin,
                right: margin
            }, 
            size: 'A4' 
        });
        
        const filename = `รายงานการเบิกจ่าย_${Date.now()}.pdf`;
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader("Content-Type", "application/pdf");

        // Thai font setup
        if (fs.existsSync(thaiFontPath)) {
            doc.registerFont('ThaiFont', thaiFontPath);
            doc.font('ThaiFont');
        } else {
            console.error("Thai font not found at:", thaiFontPath);
            return res.status(500).json({ error: "Font configuration error" });
        }
        
        doc.pipe(res);

        // Add logo at the top
        const logoPath = 'D:/Project/my-app/assets/img/log sky.png';// Adjust path as needed
        if (fs.existsSync(logoPath)) {
            const logoWidth = 80;
            const logoHeight = 80;
            const pageCenter = doc.page.width / 2;
            doc.image(logoPath, pageCenter - (logoWidth / 2), margin, {
                width: logoWidth,
                height: logoHeight
            });
            doc.moveDown(6); // Space after logo
        } else {
            console.warn("Logo file not found at:", logoPath);
        }

        // Header Section
        doc.fontSize(20).text("รายงานการเบิกจ่ายสินค้า", { align: "center" });
        doc.moveDown(0.5);
        
        const locationText = location === 'both' ? 'ทั้งสองสาขา' : 
            location === 'Nakhon Si Thammarat' ? 'สาขานครศรีธรรมราช' : 
            location === 'Krabi' ? 'สาขากระบี่' : location;

        let dateRangeText = '';
        if (startDate && endDate) {
            dateRangeText = `ระหว่างวันที่ ${new Date(startDate).toLocaleDateString('th-TH')} ถึง ${new Date(endDate).toLocaleDateString('th-TH')}`;
        }
        
        doc.fontSize(16)
            .text(`สถานที่: ${locationText}`, { align: "center" })
            .text(dateRangeText, { align: "center" })
            .text(`วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')}`, { align: "center" })

        // Summary Section
        const locationCounts = { 
            "นครศรีฯ": 0, 
            "กระบี่": 0 
        };
        const categories = {};

        withdrawals.forEach(item => {
            locationCounts[item.location]++;
            
            const catName = item.categoryName || 'ไม่ระบุหมวดหมู่';
            categories[catName] = (categories[catName] || 0) + 1;
        });

        doc.fontSize(16).text("สรุปภาพรวม", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(16)
            .text(`• จำนวนการเบิกจ่าย: ${withdrawals.length} รายการ`)
            .text(`• มูลค่าการเบิกจ่ายทั้งหมด: THB${totalValue.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            })}`)
            .moveDown(0.5)
            .text(`• สาขานครศรีธรรมราช: ${locationCounts["นครศรีฯ"]} รายการ`)
            .text(`• สาขากระบี่: ${locationCounts["กระบี่"]} รายการ`)
            .moveDown(0.5);

        // Adjust column widths to fit within 1 inch margins
        const availableWidth = doc.page.width - (margin * 2);
        const cellPadding = 3;
        
        // Adjusted column widths with more space for name
        const columns = {
            category: Math.floor(availableWidth * 0.14),
            name: Math.floor(availableWidth * 0.25),  // Increased width for name
            location: Math.floor(availableWidth * 0.12),
            remainingQty: Math.floor(availableWidth * 0.12),
            price: Math.floor(availableWidth * 0.12),
            withdrawnQty: Math.floor(availableWidth * 0.12),
            date: Math.floor(availableWidth * 0.13)
        };

        let currentY = doc.y;
        const leftMargin = margin;

        // Table Header
        const drawHeader = () => {
            let xPos = leftMargin;
            
            const headerHeight = 30;
            
            doc.fillColor('#333333').fontSize(14);
            
            // Draw header background
            doc.rect(leftMargin, currentY - 5, availableWidth, headerHeight)
               .fillColor('#f2f2f2')
               .fill();
            
            doc.fillColor('#333333');
            
            const textY = currentY + (headerHeight / 2) - 10;

            // Category header
            doc.text("ID", xPos + cellPadding, textY, { 
                width: columns.category - (cellPadding * 2),
                align: 'left'
            });
            xPos += columns.category;
            
            // Product Name header
            doc.text("Product Name", xPos + cellPadding, textY, { 
                width: columns.name - (cellPadding * 2),
                align: 'left'
            });
            xPos += columns.name;
            
            // Location header
            doc.text("Location", xPos + cellPadding, textY, { 
                width: columns.location - (cellPadding * 2),
                align: 'left'
            });
            xPos += columns.location;
            
            // Remaining Qty header
            doc.text("Remaining", xPos + cellPadding, textY, { 
                width: columns.remainingQty - (cellPadding * 2),
                align: 'right'
            });
            xPos += columns.remainingQty;
            
            // Price header
            doc.text("Price", xPos + cellPadding, textY, { 
                width: columns.price - (cellPadding * 2),
                align: 'right'
            });
            xPos += columns.price;
            
            // Withdrawn Qty header
            doc.text("Withdrawn", xPos + cellPadding, textY, { 
                width: columns.withdrawnQty - (cellPadding * 2),
                align: 'right'
            });
            xPos += columns.withdrawnQty;
            
            // Date header
            doc.text("Date", xPos + cellPadding, textY, { 
                width: columns.date - (cellPadding * 2),
                align: 'center'
            });
            
            // Update current Y position after header
            currentY += headerHeight;
            
            // Draw header bottom border
            doc.strokeColor('#000000')
                .lineWidth(1)
                .moveTo(leftMargin, currentY)
                .lineTo(leftMargin + availableWidth, currentY)
                .stroke();
               
            currentY += 10; // Add extra space after header
        };

        drawHeader();

        // Table Rows
        withdrawals.forEach((item, index) => {
            // Check if we need a new page
            if (currentY > doc.page.height - margin - 60) {
                doc.addPage();
                currentY = margin;
                doc.font('ThaiFont');
                drawHeader();
            }

            let xPos = leftMargin;
            const rowHeight = 40;  // Increased height to accommodate longer names
            
            // Apply alternating row background
            if (index % 2 === 1) {
                doc.rect(leftMargin, currentY - 2, availableWidth, rowHeight)
                   .fillColor('#f9f9f9')
                   .fill();
                doc.fillColor('#000000');
            }
            
            doc.fontSize(14);
            
            // Category
            doc.text(item.categoryName || 'N/A', xPos + cellPadding, currentY, { 
                width: columns.category - (cellPadding * 2),
                height: rowHeight,
                ellipsis: true  // Add ellipsis if text is too long
            });
            xPos += columns.category;
            
            // Product Name - Use word wrapping to prevent overlap
            doc.text(item.itemName || 'N/A', xPos + cellPadding, currentY, { 
                width: columns.name - (cellPadding * 2),
                height: rowHeight,
                align: 'left',
                ellipsis: true  // Add ellipsis if text is too long
            });
            xPos += columns.name;
            
            // Location
            doc.text(item.location || 'N/A', xPos + cellPadding, currentY, { 
                width: columns.location - (cellPadding * 2),
                height: rowHeight
            });
            xPos += columns.location;
            
            // Remaining Qty (right-aligned)
            doc.text(formatInteger(item.remainingQty), xPos + cellPadding, currentY, { 
                width: columns.remainingQty - (cellPadding * 2),
                align: 'right',
                height: rowHeight
            });
            xPos += columns.remainingQty;
            
            // Price (right-aligned)
            doc.text(formatCurrency(item.price), xPos + cellPadding, currentY, { 
                width: columns.price - (cellPadding * 2),
                align: 'right',
                height: rowHeight
            });
            xPos += columns.price;
            
            // Withdrawn Qty (right-aligned)
            doc.text(formatInteger(item.withdrawnQty), xPos + cellPadding, currentY, { 
                width: columns.withdrawnQty - (cellPadding * 2),
                align: 'right',
                height: rowHeight
            });
            xPos += columns.withdrawnQty;
            
            // Date (center-aligned) - Now using formatDateOnly
            doc.text(formatDateOnly(item.date), xPos + cellPadding, currentY, { 
                width: columns.date - (cellPadding * 2),
                align: 'center',
                height: rowHeight
            });

            // Update Y position
            currentY += rowHeight + 5;
            
            // Draw light gray border between rows
            doc.strokeColor('#E0E0E0')
                .lineWidth(0.5)
                .moveTo(leftMargin, currentY - 5)
                .lineTo(leftMargin + availableWidth, currentY - 5)
                .stroke()
                .strokeColor('#000000')
                .lineWidth(1);
        });

        // Error handling for PDF generation
        doc.on('error', (err) => {
            console.error("PDF Generation Error:", err);
            res.status(500).end();
        });

        // Check if we need a new page for signatures
        if (doc.y > doc.page.height - margin - 180) {
            doc.addPage();
            doc.font('ThaiFont');
        }

        // Signature Section
        doc.moveDown(4);
        
        const pageWidth = doc.page.width;
        const signatureWidth = 180;
        const signatureGap = 40;
        
        const leftSignatureX = (pageWidth / 2) - signatureWidth - (signatureGap / 2);
        const rightSignatureX = (pageWidth / 2) + (signatureGap / 2);
        const signatureY = doc.y;
        
        // Left signature
        doc.fontSize(16)
            .text("ผู้จัดทำรายงาน", leftSignatureX, signatureY, { width: signatureWidth, align: "center" })
            .moveDown(2)
            .text("_________________________", leftSignatureX, doc.y, { width: signatureWidth, align: "center" })
            .moveDown(0.5)
            .text("(                                )", leftSignatureX, doc.y, { width: signatureWidth, align: "center" })
            .moveDown(0.5)
            .text("ตำแหน่ง: _____________________", leftSignatureX, doc.y, { width: signatureWidth, align: "center" });

        // Reset Y position for right signature to align with left signature
        doc.y = signatureY;
        
        // Right signature
        doc.fontSize(16)
            .text("ผู้ตรวจสอบรายงาน", rightSignatureX, signatureY, { width: signatureWidth, align: "center" })
            .moveDown(2)
            .text("_________________________", rightSignatureX, doc.y, { width: signatureWidth, align: "center" })
            .moveDown(0.5)
            .text("(                                )", rightSignatureX, doc.y, { width: signatureWidth, align: "center" })
            .moveDown(0.5)
            .text("ตำแหน่ง: _____________________", rightSignatureX, doc.y, { width: signatureWidth, align: "center" });

        // Move below both signatures
        doc.x = margin;
        doc.y = doc.y + 100;
        
        // Timestamp and page footer
        doc.fontSize(16)
            .text(`พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}`, 
                { align: "center" });

        doc.end();

    } catch (error) {
        console.error("🚨 เกิดข้อผิดพลาดในการสร้าง PDF:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Enhanced Low Stock PDF report with Thai font support and date filtering
router.get("/report/low-stock/pdf", async (req, res) => {
    try {
        const { location, startDate, endDate } = req.query;
        let filter = {
            $expr: { $lte: ["$qty", "$reorderPoint"] }
        };

        // Build location filter
        if (location) {
            if (location.toLowerCase() === "both") {
                filter["location"] = { $in: ["Nakhon Si Thammarat", "Krabi"] };
            } else {
                filter["location"] = location;
            }
        }

        // Build date filter
        if (startDate && endDate) {
            filter["createdAt"] = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59))
            };
        }

        // Formatting functions
        const formatInteger = (num) => num !== undefined && num !== null ? num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0';
        const formatCurrency = (num) => num !== undefined && num !== null ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
        const formatDateTime = (date) => date ? new Date(date).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }) : 'N/A';

        // Query items
        const items = await Item.find(filter)
            .sort({ qty: 1 })
            .populate("categoryID", "categoryName");

        if (!items.length) {
            return res.status(404).json({ error: "ไม่พบข้อมูลสินค้า" });
        }

        // PDF Setup - Set 1 inch margins (72 points per inch)
        const margin = 72;
        const doc = new PDFDocument({ 
            margins: {
                top: margin,
                bottom: margin,
                left: margin,
                right: margin
            }, 
            size: 'A4' 
        });
        
        const filename = `รายงานสินค้าต่ำกว่าจุดสั่งซื้อ_${Date.now()}.pdf`;
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader("Content-Type", "application/pdf");

        // Thai font setup
        if (fs.existsSync(thaiFontPath)) {
            doc.registerFont('ThaiFont', thaiFontPath);
            doc.font('ThaiFont');
        } else {
            console.error("Thai font not found at:", thaiFontPath);
            return res.status(500).json({ error: "Font configuration error" });
        }
        
        doc.pipe(res);

        // Add logo at the top
        const logoPath = 'D:/Project/my-app/assets/img/log sky.png';// Adjust path as needed
        if (fs.existsSync(logoPath)) {
            const logoWidth = 80;
            const logoHeight = 80;
            const pageCenter = doc.page.width / 2;
            doc.image(logoPath, pageCenter - (logoWidth / 2), margin, {
                width: logoWidth,
                height: logoHeight
            });
            doc.moveDown(6); // Space after logo
        } else {
            console.warn("Logo file not found at:", logoPath);
        }

        // Header Section
        doc.fontSize(20).text("รายงานสินค้าต่ำกว่าจุดสั่งซื้อ", { align: "center" });
        doc.moveDown(0.5);
        
        const locationText = location === 'both' ? 'ทั้งสองสาขา' : 
            location === 'Nakhon Si Thammarat' ? 'สาขานครศรีธรรมราช' : 
            location === 'Krabi' ? 'สาขากระบี่' : location;

        let dateRangeText = '';
        if (startDate && endDate) {
            dateRangeText = `ระหว่างวันที่ ${new Date(startDate).toLocaleDateString('th-TH')} ถึง ${new Date(endDate).toLocaleDateString('th-TH')}`;
        }
        
        doc.fontSize(16)
            .text(`สถานที่: ${locationText}`, { align: "center" })
            .text(dateRangeText, { align: "center" })
            .text(`วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')}`, { align: "center" })

        // Summary Section
        let totalItems = items.length;
        let totalUnderstockValue = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
        const locationCounts = { 
            "Nakhon Si Thammarat": 0, 
            "Krabi": 0 
        };
        const categories = {};

        items.forEach(item => {
            // Fixed location counting
            if (locationCounts.hasOwnProperty(item.location)) {
                locationCounts[item.location]++;
            }
            
            const catName = item.categoryID?.categoryName || 'ไม่ระบุหมวดหมู่';
            categories[catName] = (categories[catName] || 0) + 1;
        });

        doc.fontSize(16).text("สรุปภาพรวม", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(16)
            .text(`• จำนวนสินค้าต่ำกว่าจุดสั่งซื้อ: ${totalItems} รายการ`)
            .text(`• มูลค่าสินค้าต่ำกว่าจุดสั่งซื้อ: THB${totalUnderstockValue.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            })}`)
            .moveDown(0.5)
            // Fixed location display names
            .text(`• สาขานครศรีธรรมราช: ${locationCounts["Nakhon Si Thammarat"]} รายการ`)
            .text(`• สาขากระบี่: ${locationCounts["Krabi"]} รายการ`)
            .moveDown(0.5);

        // Adjust column widths to fit within 1 inch margins
        const availableWidth = doc.page.width - (margin * 2);
        const cellPadding = 3;
        
        // Updated column widths to give more space to product name
        const columns = {
            category: Math.floor(availableWidth * 0.10),
            name: Math.floor(availableWidth * 0.30),  // Increased width for name
            location: Math.floor(availableWidth * 0.12),
            quantity: Math.floor(availableWidth * 0.10),
            price: Math.floor(availableWidth * 0.10),
            reorderPoint: Math.floor(availableWidth * 0.16),
            date: Math.floor(availableWidth * 0.13)
        };

        let currentY = doc.y;
        const leftMargin = margin;

        // Enhanced name rendering function
        const renderMultilineName = (doc, name, xPos, currentY, width, cellPadding, rowHeight) => {
            doc.fontSize(14);
            
            // Ensure full name is displayed
            const displayName = name || 'N/A';
            
            // Calculate text dimensions to manage height
            const textOptions = { 
                width: width - (cellPadding * 2),
                height: rowHeight,
                align: 'left'
            };
            
            // Render name, allowing it to wrap if too long
            doc.text(displayName, xPos + cellPadding, currentY, textOptions);
        };

        // Table Header
        const drawHeader = () => {
            let xPos = leftMargin;
            
            const headerHeight = 30;
            
            doc.fillColor('#333333').fontSize(14);
            
            // Draw header background
            doc.rect(leftMargin, currentY - 5, availableWidth, headerHeight)
               .fillColor('#f2f2f2')
               .fill();
            
            doc.fillColor('#333333');
            
            const textY = currentY + (headerHeight / 2) - 10;
            
            // Category header
            doc.text("ID", xPos + cellPadding, textY, { 
                width: columns.category - (cellPadding * 2),
                align: 'left'
            });
            xPos += columns.category;
            
            // Product Name header
            doc.text("Product Name", xPos + cellPadding, textY, { 
                width: columns.name - (cellPadding * 2),
                align: 'left'
            });
            xPos += columns.name;
            
            // Location header
            doc.text("Location", xPos + cellPadding, textY, { 
                width: columns.location - (cellPadding * 2),
                align: 'left'
            });
            xPos += columns.location;
            
            // Quantity header
            doc.text("Quantity", xPos + cellPadding, textY, { 
                width: columns.quantity - (cellPadding * 2),
                align: 'right'
            });
            xPos += columns.quantity;
            
            // Price header
            doc.text("Price", xPos + cellPadding, textY, { 
                width: columns.price - (cellPadding * 2),
                align: 'right'
            });
            xPos += columns.price;
            
            // Reorder Point header
            doc.text("Reorder Point", xPos + cellPadding, textY, { 
                width: columns.reorderPoint - (cellPadding * 2),
                align: 'right'
            });
            xPos += columns.reorderPoint;
            
            // Date header
            doc.text("Date", xPos + cellPadding, textY, { 
                width: columns.date - (cellPadding * 2),
                align: 'center'
            });
            
            // Update current Y position after header
            currentY += headerHeight;
            
            // Draw header bottom border
            doc.strokeColor('#000000')
                .lineWidth(1)
                .moveTo(leftMargin, currentY)
                .lineTo(leftMargin + availableWidth, currentY)
                .stroke();
               
            currentY += 10; // Add extra space after header
        };

        drawHeader();

        // Table Rows
        items.forEach((item, index) => {
            // Check if we need a new page
            if (currentY > doc.page.height - margin - 60) {
                doc.addPage();
                currentY = margin;
                doc.font('ThaiFont');
                drawHeader();
            }

            let xPos = leftMargin;
            const rowHeight = 40;  // Increased row height to accommodate multiline names
            
            // Apply alternating row background
            if (index % 2 === 1) {
                doc.rect(leftMargin, currentY - 2, availableWidth, rowHeight)
                   .fillColor('#f9f9f9')
                   .fill();
                doc.fillColor('#000000');
            }
            
            doc.fontSize(14);
     
            // Category
            doc.text(item.categoryID?.categoryName || 'N/A', xPos + cellPadding, currentY, { 
                width: columns.category - (cellPadding * 2),
                height: rowHeight
            });
            xPos += columns.category;
            
            // Product Name (with enhanced rendering)
            renderMultilineName(
                doc, 
                item.name, 
                xPos, 
                currentY, 
                columns.name, 
                cellPadding, 
                rowHeight
            );
            xPos += columns.name;
            
            // Location
            doc.text(item.location || 'N/A', xPos + cellPadding, currentY, { 
                width: columns.location - (cellPadding * 2),
                height: rowHeight
            });
            xPos += columns.location;
            
            // Quantity (right-aligned)
            doc.text(formatInteger(item.qty), xPos + cellPadding, currentY, { 
                width: columns.quantity - (cellPadding * 2),
                align: 'right',
                height: rowHeight
            });
            xPos += columns.quantity;
            
            // Price (right-aligned)
            doc.text(formatCurrency(item.price), xPos + cellPadding, currentY, { 
                width: columns.price - (cellPadding * 2),
                align: 'right',
                height: rowHeight
            });
            xPos += columns.price;
            
            // Reorder Point (right-aligned)
            doc.text(formatInteger(item.reorderPoint), xPos + cellPadding, currentY, { 
                width: columns.reorderPoint - (cellPadding * 2),
                align: 'right',
                height: rowHeight
            });
            xPos += columns.reorderPoint;
            
            // Date (center-aligned) - Now only showing date
            doc.text(formatDateTime(item.createdAt), xPos + cellPadding, currentY, { 
                width: columns.date - (cellPadding * 2),
                align: 'center',
                height: rowHeight
            });

            // Update Y position
            currentY += rowHeight + 5;
            
            // Draw light gray border between rows
            doc.strokeColor('#E0E0E0')
                .lineWidth(0.5)
                .moveTo(leftMargin, currentY - 5)
                .lineTo(leftMargin + availableWidth, currentY - 5)
                .stroke()
                .strokeColor('#000000')
                .lineWidth(1);
        });

        // Error handling for PDF generation
        doc.on('error', (err) => {
            console.error("PDF Generation Error:", err);
            res.status(500).end();
        });

        // Check if we need a new page for signatures
        if (doc.y > doc.page.height - margin - 180) {
            doc.addPage();
            doc.font('ThaiFont');
        }

        // Signature Section
        doc.moveDown(4);
        
        const pageWidth = doc.page.width;
        const signatureWidth = 180;
        const signatureGap = 40;
        
        const leftSignatureX = (pageWidth / 2) - signatureWidth - (signatureGap / 2);
        const rightSignatureX = (pageWidth / 2) + (signatureGap / 2);
        const signatureY = doc.y;
        
        // Left signature
        doc.fontSize(16)
            .text("ผู้จัดทำรายงาน", leftSignatureX, signatureY, { width: signatureWidth, align: "center" })
            .moveDown(2)
            .text("_________________________", leftSignatureX, doc.y, { width: signatureWidth, align: "center" })
            .moveDown(0.5)
            .text("(                                )", leftSignatureX, doc.y, { width: signatureWidth, align: "center" })
            .moveDown(0.5)
            .text("ตำแหน่ง: _____________________", leftSignatureX, doc.y, { width: signatureWidth, align: "center" });

        // Reset Y position for right signature to align with left signature
        doc.y = signatureY;
        
        // Right signature
        doc.fontSize(16)
            .text("ผู้ตรวจสอบรายงาน", rightSignatureX, signatureY, { width: signatureWidth, align: "center" })
            .moveDown(2)
            .text("_________________________", rightSignatureX, doc.y, { width: signatureWidth, align: "center" })
            .moveDown(0.5)
            .text("(                                )", rightSignatureX, doc.y, { width: signatureWidth, align: "center" })
            .moveDown(0.5)
            .text("ตำแหน่ง: _____________________", rightSignatureX, doc.y, { width: signatureWidth, align: "center" });

        // Move below both signatures
        doc.x = margin;
        doc.y = doc.y + 100;
        
        // Timestamp and page footer
        doc.fontSize(16)
            .text(`พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}`, 
                { align: "center" });

        doc.end();

    } catch (error) {
        console.error("🚨 An error occurred while creating the PDF", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


router.get("/report/average-products/pdf", async (req, res) => {
    try {
        const { location, startDate, endDate } = req.query;
        let filter = {};

        // Build location filter
        if (location) {
            if (location.toLowerCase() === "both") {
                filter["location"] = { $in: ["Nakhon Si Thammarat", "Krabi"] };
            } else {
                filter["location"] = location;
            }
        }

        // Build date filter
        if (startDate && endDate) {
            filter["createdAt"] = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59))
            };
        }

        // Query items
        const items = await Item.find(filter)
            .sort({ createdAt: -1 })
            .populate("categoryID", "categoryName");

        if (!items.length) {
            return res.status(404).json({ error: "Product information not found" });
        }

        // PDF Setup - Set 1 inch margins (72 points per inch)
        const margin = 72;
        const doc = new PDFDocument({ 
            margins: {
                top: margin,
                bottom: margin,
                left: margin,
                right: margin
            }, 
            size: 'A4' 
        });
        
        const filename = `รายงานสินค้า_${Date.now()}.pdf`;
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader("Content-Type", "application/pdf");

        // Thai font setup
        if (fs.existsSync(thaiFontPath)) {
            doc.registerFont('ThaiFont', thaiFontPath);
            doc.font('ThaiFont');
        } else {
            console.error("Thai font not found at:", thaiFontPath);
            return res.status(500).json({ error: "Font configuration error" });
        }
        
        doc.pipe(res);

        // Add logo at the top
        // Assuming you have a logo file path defined
        const logoPath = 'D:/Project/my-app/assets/img/log sky.png';// Adjust path as needed
        if (fs.existsSync(logoPath)) {
            // Center the logo with 100px height (maintain aspect ratio)
            const logoWidth = 80;
            const logoHeight = 80;
            const pageCenter = doc.page.width / 2;
            doc.image(logoPath, pageCenter - (logoWidth / 2), margin, {
                width: logoWidth,
                height: logoHeight
            });
            doc.moveDown(6); // Space after logo
        } else {
            console.warn("Logo file not found at:", logoPath);
        }

        // Header Section
        doc.fontSize(20).text("รายงานสินค้าคงคลัง", { align: "center" });
        doc.moveDown(0.5);
        
        const locationText = location === 'both' ? 'ทั้งสองสาขา' : 
            location === 'Nakhon Si Thammarat' ? 'สาขานครศรีธรรมราช' : 
            location === 'Krabi' ? 'สาขากระบี่' : location;

        let dateRangeText = '';
        if (startDate && endDate) {
            dateRangeText = `ระหว่างวันที่ ${new Date(startDate).toLocaleDateString('th-TH')} ถึง ${new Date(endDate).toLocaleDateString('th-TH')}`;
        }
        
        doc.fontSize(16)
            .text(`สถานที่: ${locationText}`, { align: "center" })
            .text(dateRangeText, { align: "center" })
            .text(`วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')}`, { align: "center" })

        // Summary Section
        let totalQty = 0;
        let totalValue = 0;
        const locationCounts = { 
            "Nakhon Si Thammarat": 0, 
            "Krabi": 0 
        };
        const categories = {};

        items.forEach(item => {
            totalQty += item.qty || 0;
            totalValue += (item.qty || 0) * (item.price || 0);
            
            // Fixed location counting
            if (locationCounts.hasOwnProperty(item.location)) {
                locationCounts[item.location]++;
            }
            
            const catName = item.categoryID?.categoryName || 'ไม่ระบุหมวดหมู่';
            categories[catName] = (categories[catName] || 0) + 1;
        });

        doc.fontSize(16).text("สรุปภาพรวม", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(16)
            .text(`• จำนวนสินค้าทั้งหมด: ${items.length} รายการ`)
            .text(`• จำนวนรวมทั้งหมด: ${totalQty} หน่วย`)
            .text(`• มูลค่ารวมทั้งหมด: THB${totalValue.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            })}`)
            .moveDown(0.5)
            // Fixed location display names
            .text(`• สาขานครศรีธรรมราช: ${locationCounts["Nakhon Si Thammarat"]} รายการ`)
            .text(`• สาขากระบี่: ${locationCounts["Krabi"]} รายการ`)
            .moveDown(0.5);

        // Adjust column widths to fit within 1 inch margins
        const availableWidth = doc.page.width - (margin * 2);
        
        // Adjusted column widths - increased ID column width
        const columns = {
            category: Math.floor(availableWidth * 0.14),    // Increased for full ID display
            name: Math.floor(availableWidth * 0.26),      // Slightly reduced
            location: Math.floor(availableWidth * 0.10),
            quantity: Math.floor(availableWidth * 0.08),
            price: Math.floor(availableWidth * 0.12),
            amount: Math.floor(availableWidth * 0.12),
            reorder: Math.floor(availableWidth * 0.09),
            date: Math.floor(availableWidth * 0.10)      // Slightly reduced
        };

        let currentY = doc.y;
        const leftMargin = margin;
        const cellPadding = 3;
        
        // Table Header with increased height to prevent overlap
        const drawHeader = () => {
            let xPos = leftMargin;
            
            // Increase the header height significantly
            const headerHeight = 30;  // Increased from 35 to 45
            
            doc.fillColor('#333333').fontSize(14);
            
            // Draw header background
            doc.rect(leftMargin, currentY - 5, availableWidth, headerHeight)
               .fillColor('#f2f2f2')
               .fill();
            
            doc.fillColor('#333333'); // Reset text color
            
            // Improved vertical centering for all header cells
            const textY = currentY + (headerHeight / 2) - 10; // Calculate center position
            
            // Category/ID header - vertically centered
            doc.text("ID", xPos + cellPadding, textY, { 
                width: columns.category - (cellPadding * 2),
                align: 'left'
            });
            xPos += columns.category;
            
            // Continue with other headers - using the same textY value for all
            doc.text("Product Name", xPos + cellPadding, textY, { 
                width: columns.name - (cellPadding * 2),
                align: 'left'
            });
            xPos += columns.name;
            
            // Location header - vertically centered
            doc.text("Location", xPos + cellPadding, currentY + 5, { 
                width: columns.location - (cellPadding * 2),
                align: 'left'
            });
            xPos += columns.location;
            
            // Quantity header - vertically centered
            doc.text("Qty", xPos + cellPadding, currentY + 5, { 
                width: columns.quantity - (cellPadding * 2),
                align: 'right'
            });
            xPos += columns.quantity;
            
            // Price header - vertically centered
            doc.text("Price", xPos + cellPadding, currentY + 5, { 
                width: columns.price - (cellPadding * 2),
                align: 'right'
            });
            xPos += columns.price;
            
            // Amount header - vertically centered
            doc.text("Amount", xPos + cellPadding, currentY + 5, { 
                width: columns.amount - (cellPadding * 2),
                align: 'right'
            });
            xPos += columns.amount;
            
            // Reorder header - vertically centered
            doc.text("Reorder", xPos + cellPadding, currentY + 5, { 
                width: columns.reorder - (cellPadding * 2),
                align: 'right'
            });
            xPos += columns.reorder;
            
            // Date header - vertically centered
            doc.text("Date", xPos + cellPadding, currentY + 5, { 
                width: columns.date - (cellPadding * 2),
                align: 'left'
            });
            
            // Update current Y position after header
            currentY += headerHeight;
                
                // Draw header bottom border
                doc.strokeColor('#000000')
                .lineWidth(1)
                .moveTo(leftMargin, currentY)
                .lineTo(leftMargin + availableWidth, currentY)
                .stroke();
               
            currentY += 10; // Add extra space after header
        };

        drawHeader();

        // Table Rows with improved formatting and larger font
        items.forEach((item, index) => {
            // Check if we need a new page
            if (currentY > doc.page.height - margin - 60) {
                doc.addPage();
                currentY = margin;
                doc.font('ThaiFont');
                drawHeader();
            }

            const amount = (item.qty || 0) * (item.price || 0);
            const locationName = item.location === 'Nakhon Si Thammarat' ? 'นครศรีฯ' : 'กระบี่';
            const itemDate = item.createdAt?.toLocaleDateString('th-TH') || '-';
            const categoryName = item.categoryID?.categoryName || 'ไม่ระบุหมวดหมู่';
            
            // Calculate row height based on content - increased for larger font
            let rowHeight = 30; // Further increased to prevent overlap
            const maxTextWidth = columns.name - (cellPadding * 2);
            const nameText = item.name || '-';
            
            // Check if name text needs multiple lines
            if (doc.widthOfString(nameText) > maxTextWidth) {
                // Calculate height needed for wrapped text
                const nameHeight = doc.heightOfString(nameText, { width: maxTextWidth });
                rowHeight = Math.max(rowHeight, nameHeight + 8); // More padding for safety
            }

            let xPos = leftMargin;
            
            // Apply alternating row background for better readability
            if (index % 2 === 1) {
                doc.rect(leftMargin, currentY - 2, availableWidth, rowHeight)
                   .fillColor('#f9f9f9')
                   .fill();
                doc.fillColor('#000000'); // Reset text color
            }
            
            doc.fontSize(14);
            
            // Category/ID - with full display now that width is increased
            doc.text(categoryName, xPos + cellPadding, currentY, { 
                width: columns.category - (cellPadding * 2),
                height: rowHeight,
                ellipsis: true
            });
            xPos += columns.category;
            
            // Product name - with proper wrapping for long text
            if (doc.widthOfString(nameText) > maxTextWidth) {
                const textOptions = { 
                    width: maxTextWidth,
                    height: rowHeight,
                    ellipsis: true
                };
                
                // Adjust truncation logic if needed
                if (doc.heightOfString(nameText, { width: maxTextWidth }) > rowHeight * 1.5) {
                    // Truncate with ellipsis if too long
                    let truncatedName = nameText;
                    while (doc.heightOfString(truncatedName + "...", { width: maxTextWidth }) > rowHeight * 1.5 && 
                           truncatedName.length > 6) {
                        truncatedName = truncatedName.substring(0, truncatedName.length - 1);
                    }
                    doc.text(truncatedName + "...", xPos + cellPadding, currentY, textOptions);
                } else {
                    // Use normal wrapping
                    doc.text(nameText, xPos + cellPadding, currentY, textOptions);
                }
            } else {
                // Normal handling for short names
                doc.text(nameText, xPos + cellPadding, currentY, { 
                    width: columns.name - (cellPadding * 2),
                    height: rowHeight
                });
            }
            xPos += columns.name;
            
            // Location
            doc.text(locationName, xPos + cellPadding, currentY, { 
                width: columns.location - (cellPadding * 2),
                height: rowHeight
            });
            xPos += columns.location;
            
            // Quantity (right-aligned)
            doc.text((item.qty || 0).toString(), xPos + cellPadding, currentY, { 
                width: columns.quantity - (cellPadding * 2),
                align: 'right',
                height: rowHeight
            });
            xPos += columns.quantity;
            
            // Price (right-aligned)
            doc.text((item.price || 0).toFixed(2), xPos + cellPadding, currentY, { 
                width: columns.price - (cellPadding * 2),
                align: 'right',
                height: rowHeight
            });
            xPos += columns.price;
            
            // Amount (right-aligned)
            doc.text(amount.toFixed(2), xPos + cellPadding, currentY, { 
                width: columns.amount - (cellPadding * 2),
                align: 'right',
                height: rowHeight
            });
            xPos += columns.amount;
            
            // Reorder point (right-aligned)
            doc.text((item.reorderPoint || 0).toString(), xPos + cellPadding, currentY, { 
                width: columns.reorder - (cellPadding * 2),
                align: 'right',
                height: rowHeight
            });
            xPos += columns.reorder;
            
            // Date
            doc.text(itemDate, xPos + cellPadding, currentY, { 
                width: columns.date - (cellPadding * 2),
                height: rowHeight
            });

            // Draw light gray border between rows
            currentY += rowHeight + 5; // Added extra spacing between rows
            doc.strokeColor('#E0E0E0')
                .lineWidth(0.5)
                .moveTo(leftMargin, currentY - 5)
                .lineTo(leftMargin + availableWidth, currentY - 5)
                .stroke()
                .strokeColor('#000000') // Reset to black
                .lineWidth(1);
        });

        // Error handling for PDF generation
        doc.on('error', (err) => {
            console.error("PDF Generation Error:", err);
            res.status(500).end();
        });

        // Check if we need a new page for signatures
        if (doc.y > doc.page.height - margin - 180) {
            doc.addPage();
            doc.font('ThaiFont');
        }

        // Signature Section with improved side-by-side layout
        doc.moveDown(4);
        
        // Calculate positions for signatures to be clearly side by side
        const pageWidth = doc.page.width;
        const signatureWidth = 180;
        const signatureGap = 40;
        
        // Calculate starting positions to place signatures side by side
        const leftSignatureX = (pageWidth / 2) - signatureWidth - (signatureGap / 2);
        const rightSignatureX = (pageWidth / 2) + (signatureGap / 2);
        const signatureY = doc.y;
        
        // Left signature
        doc.fontSize(16)
            .text("ผู้จัดทำรายงาน", leftSignatureX, signatureY, { width: signatureWidth, align: "center" })
            .moveDown(2)
            .text("_________________________", leftSignatureX, doc.y, { width: signatureWidth, align: "center" })
            .moveDown(0.5)
            .text("(                                )", leftSignatureX, doc.y, { width: signatureWidth, align: "center" })
            .moveDown(0.5)
            .text("ตำแหน่ง: _____________________", leftSignatureX, doc.y, { width: signatureWidth, align: "center" });

        // Reset Y position for right signature to align with left signature
        doc.y = signatureY;
        
        // Right signature - aligned side by side with left signature
        doc.fontSize(16)
            .text("ผู้ตรวจสอบรายงาน", rightSignatureX, signatureY, { width: signatureWidth, align: "center" })
            .moveDown(2)
            .text("_________________________", rightSignatureX, doc.y, { width: signatureWidth, align: "center" })
            .moveDown(0.5)
            .text("(                                )", rightSignatureX, doc.y, { width: signatureWidth, align: "center" })
            .moveDown(0.5)
            .text("ตำแหน่ง: _____________________", rightSignatureX, doc.y, { width: signatureWidth, align: "center" });

        // Move below both signatures
        doc.x = margin;
        doc.y = doc.y + 100;
        
        // Timestamp and page footer
        doc.fontSize(16)
            .text(`พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}`, 
                { align: "center" });

        doc.end();

    } catch (error) {
        console.error("🚨 An error occurred while creating the PDF", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/import", async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const file = req.files.file;
    const importMode = req.body.importMode || "normal";

    // Parse file (implement your actual file parsing logic)
    const importItems = await parseFile(file);

    let stats = {
      total: importItems.length,
      imported: 0,
      skipped: 0,
      updated: 0,
      failed: 0,
      duplicates: 0, // Add duplicates counter
    };

    for (const item of importItems) {
      try {
        let existingItem;
        let isDuplicate = false;

        // Check for duplicates
        existingItem = await Item.findOne({
          name: { $regex: new RegExp(`^${item.name}$`, "i") },
        });

        if (existingItem) {
          stats.duplicates++;
          isDuplicate = true;
        }

        // Handle import modes
        if (importMode === "update" && existingItem) {
          // Update existing item
          existingItem.qty = item.qty;
          existingItem.price = item.price;
          existingItem.location = item.location;
          await existingItem.save();
          stats.updated++;
        } else if (importMode === "skip" && existingItem) {
          stats.skipped++;
        } else {
          // Create new item
          const newItem = new Item({
            name: item.name,
            qty: item.qty,
            price: item.price,
            location: item.location,
          });
          await newItem.save();
          stats.imported++;
        }
      } catch (err) {
        stats.failed++;
        console.error(`Error processing item ${item.name}:`, err);
      }
    }

    // Send response with stats
    res.status(200).json({
      message: "Import completed",
      stats: stats, // Ensure stats object is included
    });
  } catch (error) {
    console.error("Error importing data:", error);
    res.status(500).json({ message: "Error importing data", error: error.message });
  }
});

router.post("/restock", authenticate, async (req, res) => {
    try {
        const { categoryID, name, price, qty, location } = req.body;

        if (!categoryID || !name || !price || !qty || !location) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        let existingItem = await Item.findOne({ categoryID, name, location });

        const logData = {
            action: "restock",
            qty,
            purchasePrice: price,
            date: new Date(),
            status: "restocked",
            user: req.user.username,
            role: req.user.role,
            ip: req.ip,
            device: req.headers['user-agent']
        };

        if (existingItem) {
            existingItem.qty += qty;
            existingItem.activityLogs.push(logData);
            await existingItem.save();
        } else {
            existingItem = new Item({
                categoryID,
                name,
                price,
                qty,
                location,
                activityLogs: [logData]
            });
            await existingItem.save();
        }

        // 🟩 เพิ่มบันทึก log ให้ user
        const user = await User.findOne({ username: req.user.username });

        if (user) {
            await user.addLog("Restock Item", {
                itemId: existingItem._id,
                itemName: existingItem.name,
                restockedQty: qty,
                role: user.role,
                ip: req.ip,
                device: req.headers['user-agent']
            });

            console.log(`📝 Log added for ${req.user.username} restocking ${existingItem.name} (${qty} units)`);
        } else {
            console.log("⚠️ Cannot find current user to log activity.");
        }

        res.json({ message: "Restocked successfully", item: existingItem });
    } catch (error) {
        console.error("🚨 Error restocking item:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;