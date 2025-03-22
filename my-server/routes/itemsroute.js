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

        // ✅ ตรวจสอบ location และใช้เงื่อนไขที่เหมาะสม
        if (location && location !== "all") {
            filter.location = location;
        }

        // ✅ ดึงข้อมูลตามเงื่อนไข filter
        const items = await Item.find(filter).populate("categoryID", "categoryName");

        let totalProfit = 0, totalExpense = 0, totalLoss = 0;
        let locations = {
            Krabi: { profit: 0, expense: 0, loss: 0 },
            "Nakhon Si Thammarat": { profit: 0, expense: 0, loss: 0 }
        };
        let categoryOverview = {};

        items.forEach(item => {
            const profit = item.qty * item.price;
            let expense = 0, loss = 0;
            const categoryName = item.categoryID ? item.categoryID.categoryName : "Uncategorized";

            item.activityLogs.forEach(log => {
                if (log.action === "withdraw") {
                    expense += log.qty * item.price;
                }
            });

            totalProfit += profit;
            totalExpense += expense;
            totalLoss += loss;

            if (item.location === "Krabi") {
                locations.Krabi.profit += profit;
                locations.Krabi.expense += expense;
                locations.Krabi.loss += loss;
            } else if (item.location === "Nakhon Si Thammarat") {
                locations["Nakhon Si Thammarat"].profit += profit;
                locations["Nakhon Si Thammarat"].expense += expense;
                locations["Nakhon Si Thammarat"].loss += loss;
            }

            if (!categoryOverview[categoryName]) {
                categoryOverview[categoryName] = { profit: 0, expense: 0, loss: 0 };
            }
            categoryOverview[categoryName].profit += profit;
            categoryOverview[categoryName].expense += expense;
            categoryOverview[categoryName].loss += loss;
        });

        let response = {
            overview: {
                totalProfit,
                totalExpense,
                totalLoss
            },
            locations,
            categoryOverview
        };

        // ✅ เงื่อนไขสำหรับ location ที่ระบุ (Krabi หรือ Nakhon Si Thammarat)
        if (location && location !== "all") {
            response = {
                overview: {
                    totalProfit: locations[location]?.profit || 0,
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

        const items = await Item.find(filter).populate("categoryID", "categoryName");

        let monthlyData = {}; // เก็บข้อมูลรายเดือน
        let categoryData = {}; // เก็บข้อมูลตามหมวดหมู่

        items.forEach(item => {
            const profit = item.qty * item.price;
            let expense = 0;
            const categoryName = item.categoryID ? item.categoryID.categoryName : "Uncategorized";

            item.activityLogs.forEach(log => {
                if (log.action === "withdraw") {
                    expense += log.qty * item.price;
                }
            });

            // ✅ จัดข้อมูลรายเดือน
            const month = new Date(item.createdAt).toLocaleString("en-US", { month: "short", year: "numeric" });

            if (!monthlyData[month]) {
                monthlyData[month] = { profit: 0, expense: 0 };
            }
            monthlyData[month].profit += profit;
            monthlyData[month].expense += expense;

            // ✅ จัดข้อมูลตามหมวดหมู่
            if (!categoryData[categoryName]) {
                categoryData[categoryName] = { profit: 0, expense: 0 };
            }
            categoryData[categoryName].profit += profit;
            categoryData[categoryName].expense += expense;
        });

        res.json({
            monthlyOverview: Object.entries(monthlyData).map(([month, values]) => ({
                month,
                profit: values.profit,
                expense: values.expense
            })),
            categoryOverview: Object.entries(categoryData).map(([category, values]) => ({
                category,
                profit: values.profit,
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
            const threshold = item.reorderPoint * 1.15; // 15% เพิ่มเติมจาก reorderPoint
            let alertLevel = "normal";
        
            if (item.status === "disabled") {
                alertLevel = "gray"; // สีเทา (ไอเทมถูกปิดใช้งาน)
            } else if (item.qty <= threshold) {
                alertLevel = "danger"; // สีแดง (ใกล้ถึงจุดต้องเติมสินค้า)
            } else if (item.qty > threshold) {
                alertLevel = "normal"; // ปกติ
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
router.post("/create", async (req, res) => {
    try {
        const { name, location, qty, price, reorderPoint, categoryName } = req.body;

        if (!name || !location || qty == null || !price || !reorderPoint || !categoryName) {
            return res.status(400).json({ message: "❌ ข้อมูลไม่ครบ กรุณาตรวจสอบ JSON ที่ส่งมา" });
        }

        // ✅ แก้ไขตรงนี้: ใช้ categoryName จาก req.body แทน
        let category = await Category.findOne({ categoryName });
        if (!category) {
            category = new Category({ categoryName });
            await category.save();
        }

        const newItem = new Item({
            name,
            location,
            qty,
            price,
            reorderPoint,
            categoryID: category._id
        });

        await newItem.save();
        res.status(201).json({ message: "✅ สินค้าถูกเพิ่มแล้ว!", newItem });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// ✅ แก้ไขข้อมูลสินค้า พร้อมการเปลี่ยนแปลง category (ถ้าจำเป็น)
router.patch("/edit/:id", async (req, res) => {
    try {
        const { name, location, qty, price, reorderPoint, status, categoryName } = req.body;
        const { id } = req.params;  // ใช้ id จาก URL parameter

        let categoryID;

        // ตรวจสอบว่ามีการส่ง categoryName มาหรือไม่
        if (categoryName) {
            // ค้นหาหมวดหมู่ตาม categoryName
            let category = await Category.findOne({ categoryName });

            // ถ้าไม่พบหมวดหมู่ในฐานข้อมูล ให้สร้างใหม่
            if (!category) {
                category = new Category({ categoryName });
                await category.save();  // บันทึกหมวดหมู่ใหม่
            }

            // ใช้ _id ของ category
            categoryID = category._id;
        }

        // ตรวจสอบและแปลงค่า price เป็นทศนิยม
        const parsedPrice = parseFloat(price); // แปลงเป็นทศนิยม
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({ message: "Invalid price" });
        }

        // ตรวจสอบ reorderPoint ว่ามีค่าเป็น null หรือไม่
        let parsedReorderPoint;
        if (reorderPoint === "null" || reorderPoint === null || reorderPoint === undefined) {
            parsedReorderPoint = 0;  // กำหนดให้เป็น 0 ถ้าเป็น null หรือ undefined
        } else {
            parsedReorderPoint = reorderPoint;  // ใช้ค่า reorderPoint ที่ส่งมาถ้ามี
        }

        // สร้างข้อมูลที่จะอัปเดต
        const updates = {
            name,
            location,
            qty,
            price: parsedPrice,   // ใช้ค่า parsedPrice แทน
            reorderPoint: parsedReorderPoint,  // ใช้ค่า parsedReorderPoint แทน
            status
        };

        // ถ้ามี categoryID ให้เพิ่มเข้าไป
        if (categoryID) {
            updates.categoryID = categoryID;  // เพิ่ม categoryID ในข้อมูลที่จะอัปเดต
        }

        // ค้นหาและอัปเดตข้อมูลในฐานข้อมูล
        const updatedItem = await Item.findByIdAndUpdate(id, updates, { new: true }).populate("categoryID", "categoryName");

        if (!updatedItem) {
            return res.status(404).json({ message: "Item not found" });
        }

        // ส่งข้อมูลที่อัปเดตกลับไป
        res.status(200).json({ message: "✅ Update successful", updatedItem });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

// ✅ ลบสินค้า
router.delete("/:id", async (req, res) => {
    try {
        const deletedItem = await Item.findByIdAndDelete(req.params.id);

        if (!deletedItem) {
            return res.status(404).json({ message: "Item not found" });
        }

        res.json({ message: "✅ Item deleted successfully" });
    } catch (err) {
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

router.post('/withdraw', async (req, res) => {
    const { itemId, qty, user } = req.body;

    console.log(req.body); // เพิ่มบรรทัดนี้เพื่อดูข้อมูลที่ได้รับจาก client

    // ตรวจสอบว่า itemId, qty, และ user ถูกส่งมาหรือไม่
    if (!itemId || !qty || !user) {
        return res.status(400).json({ message: 'Item ID, quantity, and user are required' });
    }

    // ตรวจสอบว่าจำนวน qty เป็นค่าบวกและไม่ใช่ NaN
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
            user: user,
            date: new Date(),
            status: 'withdrawn',
            remainingQty: item.qty,
            categoryName: item.categoryID ? item.categoryID.name : "N/A", // เพิ่ม categoryName
        });
        // บันทึกการเปลี่ยนแปลงในฐานข้อมูล
        await item.save();

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
            // Handle for single or multiple locations
            if (typeof location === 'string') {
                if (location.toLowerCase() === "both") {
                    // Use full location names as stored in the database
                    locationFilter["location"] = { $in: ["Nakhon Si Thammarat", "Krabi"] };
                } else {
                    // Use the location value directly without mapping
                    locationFilter["location"] = location;
                }
            } else if (Array.isArray(location)) {
                // Use the location values directly from the array
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
                    // Correctly map based on stored location values
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

        // Create PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const filename = `รายงานการเบิกจ่าย_${Date.now()}.pdf`;
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader("Content-Type", "application/pdf");

        // Thai font setup
        if (fs.existsSync(thaiFontPath)) {
            doc.registerFont('ThaiFont', thaiFontPath);
            doc.font('ThaiFont');
        }
        doc.pipe(res);

        // Header Section
        doc.fontSize(18).text("รายงานการเบิกจ่ายสินค้า", { align: "center" });
        doc.moveDown(0.5);

        // Format location text based on selection
        let locationText = "ไม่ระบุสถานที่";
        
        if (Array.isArray(location)) {
            if (location.includes("Nakhon Si Thammarat") && location.includes("Krabi")) {
                locationText = "ทั้งสองสาขา (นครศรีธรรมราชและกระบี่)";
            } else if (location.includes("Nakhon Si Thammarat")) {
                locationText = "สาขานครศรีธรรมราช";
            } else if (location.includes("Krabi")) {
                locationText = "สาขากระบี่";
            }
        } else if (typeof location === 'string') {
            if (location.toLowerCase() === "both") {
                locationText = "ทั้งสองสาขา (นครศรีธรรมราชและกระบี่)";
            } else if (location === "Nakhon Si Thammarat") {
                locationText = "สาขานครศรีธรรมราช";
            } else if (location === "Krabi") {
                locationText = "สาขากระบี่";
            }
        }

        let dateRangeText = '';
        if (startDate && endDate) {
            dateRangeText = `ระหว่างวันที่ ${new Date(startDate).toLocaleDateString('th-TH')} ถึง ${new Date(endDate).toLocaleDateString('th-TH')}`;
        }

        doc.fontSize(12)
            .text(`สถานที่: ${locationText}`, { align: "center" })
            .text(dateRangeText, { align: "center" })
            .text(`วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')}`, { align: "center" })
            .moveDown(1.5);

        // Summary Section
        doc.fontSize(16).text("สรุปภาพรวม", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12)
            .text(`จำนวนรวมที่เบิก: ${parseFloat(totalWithdrawn).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            })} หน่วย`)
            .text(`มูลค่ารวมทั้งหมด: ฿${totalValue.toFixed(2)}`)
            .moveDown(2);

        // Table Setup - Fixed column widths and alignment
        const columns = {
            category: 50,    // หมวดหมู่
            name: 190,       // ชื่อสินค้า
            location: 60,    // สถานที่
            remainingQty: 50,// คงเหลือ
            price: 50,       // ราคา
            withdrawnQty: 50,// เบิกแล้ว
            date: 90         // วันที่
        };

        // Pre-calculate column positions - Fixed positioning
        const columnPositions = {
            category: 50,
            name: 50 + columns.category,
            location: 50 + columns.category + columns.name,
            remainingQty: 50 + columns.category + columns.name + columns.location,
            price: 50 + columns.category + columns.name + columns.location + columns.remainingQty,
            withdrawnQty: 50 + columns.category + columns.name + columns.location + columns.remainingQty + columns.price,
            date: 50 + columns.category + columns.name + columns.location + columns.remainingQty + columns.price + columns.withdrawnQty
        };

        let currentY = doc.y;

        // English Table Headers with fixed alignment
        const drawHeader = () => {
            doc.fontSize(12)
                .text("ID", columnPositions.category, currentY, { width: columns.category })
                .text("Product Name", columnPositions.name, currentY, { width: columns.name })
                .text("Location", columnPositions.location, currentY, { width: columns.location })
                .text("Remaining", columnPositions.remainingQty, currentY, { width: columns.remainingQty, align: "right" })
                .text("Price", columnPositions.price, currentY, { width: columns.price, align: "right" })
                .text("Withdrawn", columnPositions.withdrawnQty, currentY, { width: columns.withdrawnQty, align: "right" })
                .text("Date", columnPositions.date, currentY, { width: columns.date });

            // Draw header underline
            currentY += 20;
            doc.moveTo(50, currentY)
                .lineTo(columnPositions.date + columns.date, currentY)
                .stroke();
            currentY += 10;
        };

        drawHeader();

        // Table Rows with fixed alignment
        withdrawals.forEach((item, index) => {
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
                doc.font('ThaiFont');
                drawHeader();
            }

            // Formatting functions
            const formatNumber = num => parseFloat(num).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            
            const formatDate = date => new Date(date).toLocaleDateString('th-TH');

            // Draw row using exact column positions
            doc.fontSize(10)
                .text(item.categoryName, columnPositions.category, currentY, { 
                    width: columns.category,
                    ellipsis: true 
                })
                .text(item.itemName, columnPositions.name, currentY, { 
                    width: columns.name,
                    ellipsis: true 
                })
                .text(item.location, columnPositions.location, currentY, { 
                    width: columns.location 
                })
                .text(formatNumber(item.remainingQty), columnPositions.remainingQty, currentY, { 
                    width: columns.remainingQty,
                    align: "right" 
                })
                .text(`฿${formatNumber(item.price)}`, columnPositions.price, currentY, { 
                    width: columns.price,
                    align: "right" 
                })
                .text(formatNumber(item.withdrawnQty), columnPositions.withdrawnQty, currentY, { 
                    width: columns.withdrawnQty,
                    align: "right" 
                })
                .text(formatDate(item.date), columnPositions.date, currentY, { 
                    width: columns.date 
                });

            currentY += 25;
        });

        // Signature Section (Remains at the bottom)
        doc.moveDown(4);
        doc.fontSize(12)
            .text("ผู้จัดทำรายงาน", 100, doc.y, { align: "center" })
            .moveDown(2)
            .text("_________________________", 100, doc.y, { align: "center" })
            .moveDown(0.5)
            .text("(ชื่อ)", 100, doc.y, { align: "center" })
            .moveDown(0.5)
            .text("ตำแหน่ง: _____________________", 100, doc.y, { align: "center" });

        const rightColumnY = doc.y - 120;
        doc.fontSize(12)
            .text("ผู้ตรวจสอบรายงาน", 400, rightColumnY, { align: "center" })
            .moveDown(2)
            .text("_________________________", 400, doc.y, { align: "center" })
            .moveDown(0.5)
            .text("(ชื่อ)", 400, doc.y, { align: "center" })
            .moveDown(0.5)
            .text("ตำแหน่ง: _____________________", 400, doc.y, { align: "center" });

        // Timestamp
        doc.moveDown(3);
        doc.fontSize(10)
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
        const { location } = req.query; // Add location filter

        // Build location filter
        let locationFilter = {};
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

        // Update query to include location filter
        const items = await Item.find({ 
            $expr: { $lte: ["$qty", "$reorderPoint"] },
            ...locationFilter
        })
        .sort({ qty: 1 })
        .populate("categoryID", "categoryName");

        // Create PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const filename = `รายงานสินค้าต่ำกว่าจุดสั่งซื้อ_${Date.now()}.pdf`;
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader("Content-Type", "application/pdf");

        // Thai font setup
        if (fs.existsSync(thaiFontPath)) {
            doc.registerFont('ThaiFont', thaiFontPath);
            doc.font('ThaiFont');
        }
        doc.pipe(res);

        // Header Section
        doc.fontSize(18).text("รายงานสินค้าต่ำกว่าจุดสั่งซื้อ", { align: "center" });
        doc.moveDown(0.5);
        doc.fontSize(12)
            .text(`วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')}`, { align: "center" })
            .moveDown(1.5);

        // Summary Section
        let totalItems = items.length;
        let totalUnderstockValue = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
        let locationCounts = { nst: 0, krabi: 0 };
        let categoryCounts = {};

        items.forEach(item => {
            locationCounts[item.location] = (locationCounts[item.location] || 0) + 1;
            const catName = item.categoryID?.categoryName || 'ไม่ระบุหมวดหมู่';
            categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
        });

        doc.fontSize(14).text("สรุปภาพรวม", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12)
            .text(`• จำนวนสินค้าต่ำกว่าจุดสั่งซื้อ: ${totalItems} รายการ`)
            .text(`• มูลค่าสินค้าคงคลังปัจจุบัน: ฿${totalUnderstockValue.toFixed(2)}`)
            .moveDown(0.5)
            .text(`• สาขานครศรีธรรมราช: ${locationCounts.nst} รายการ`)
            .text(`• สาขากระบี่: ${locationCounts.krabi} รายการ`)
            .moveDown(2);

        // Table Setup
        const columns = {
            category: 90,
            name: 140,
            location: 70,
            currentQty: 70,
            price: 70,
            reorderPoint: 80,
            date: 90
        };

        const columnPositions = {
            category: 50,
            name: 50 + columns.category,
            location: 50 + columns.category + columns.name,
            currentQty: 50 + columns.category + columns.name + columns.location,
            price: 50 + columns.category + columns.name + columns.location + columns.currentQty,
            reorderPoint: 50 + columns.category + columns.name + columns.location + columns.currentQty + columns.price,
            date: 50 + columns.category + columns.name + columns.location + columns.currentQty + columns.price + columns.reorderPoint
        };

        let currentY = doc.y;

        // Table Headers - Changed to match what's being displayed
        const drawHeader = () => {
            doc.fontSize(12)
                .text("Category", columnPositions.category, currentY, { width: columns.category })
                .text("Product Name", columnPositions.name, currentY, { width: columns.name })
                .text("Location", columnPositions.location, currentY, { width: columns.location })
                .text("Current Qty", columnPositions.currentQty, currentY, { width: columns.currentQty, align: "right" })
                .text("Price", columnPositions.price, currentY, { width: columns.price, align: "right" })
                .text("Reorder Point", columnPositions.reorderPoint, currentY, { width: columns.reorderPoint, align: "right" })
                .text("Created Date", columnPositions.date, currentY, { width: columns.date });

            currentY += 20;
            doc.moveTo(50, currentY)
                .lineTo(columnPositions.date + columns.date, currentY)
                .stroke();
            currentY += 10;
        };

        drawHeader();

        // Table Rows
        items.forEach((item, index) => {
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
                doc.font('ThaiFont');
                drawHeader();
            }

            const formatNumber = num => parseFloat(num).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            doc.fontSize(10)
                .text(item.categoryID?.categoryName || 'ไม่ระบุหมวดหมู่', columnPositions.category, currentY, { 
                    width: columns.category,
                    ellipsis: true 
                })
                .text(item.name, columnPositions.name, currentY, { 
                    width: columns.name,
                    ellipsis: true 
                })
                .text(item.location === 'Nakhon Si Thammarat' ? 'นครศรีฯ' : 'กระบี่', columnPositions.location, currentY, { 
                    width: columns.location 
                })
                .text(formatNumber(item.qty), columnPositions.currentQty, currentY, { 
                    width: columns.currentQty,
                    align: "right" 
                })
                .text(`฿${formatNumber(item.price)}`, columnPositions.price, currentY, { 
                    width: columns.price,
                    align: "right" 
                })
                .text(formatNumber(item.reorderPoint), columnPositions.reorderPoint, currentY, { 
                    width: columns.reorderPoint,
                    align: "right" 
                })
                .text(new Date(item.createdAt).toLocaleDateString('th-TH'), columnPositions.date, currentY, { 
                    width: columns.date 
                });

            currentY += 25;
        });

        // Signature Section
        doc.moveDown(4);
        doc.fontSize(12)
            .text("ผู้จัดทำรายงาน", 100, doc.y, { align: "center" })
            .moveDown(2)
            .text("_________________________", 100, doc.y, { align: "center" })
            .moveDown(0.5)
            .text("(ชื่อ)", 100, doc.y, { align: "center" })
            .moveDown(0.5)
            .text("ตำแหน่ง: _____________________", 100, doc.y, { align: "center" });

        const rightColumnY = doc.y - 120;
        doc.fontSize(12)
            .text("ผู้ตรวจสอบรายงาน", 400, rightColumnY, { align: "center" })
            .moveDown(2)
            .text("_________________________", 400, doc.y, { align: "center" })
            .moveDown(0.5)
            .text("(ชื่อ)", 400, doc.y, { align: "center" })
            .moveDown(0.5)
            .text("ตำแหน่ง: _____________________", 400, doc.y, { align: "center" });

        // Timestamp
        doc.moveDown(3);
        doc.fontSize(10)
            .text(`พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}`, 
                { align: "center" });

        doc.end();

    } catch (error) {
        console.error("🚨 เกิดข้อผิดพลาดในการสร้าง PDF:", error);
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
            return res.status(404).json({ error: "ไม่พบข้อมูลสินค้า" });
        }

        // PDF Setup
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
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

        // Header Section
        doc.fontSize(18).text("รายงานสินค้าคงคลัง", { align: "center" });
        doc.moveDown(0.5);
        
        const locationText = location === 'both' ? 'ทั้งสองสาขา' : 
            location === 'Nakhon Si Thammarat' ? 'สาขานครศรีธรรมราช' : 
            location === 'Krabi' ? 'สาขากระบี่' : location;

        let dateRangeText = '';
        if (startDate && endDate) {
            dateRangeText = `ระหว่างวันที่ ${new Date(startDate).toLocaleDateString('th-TH')} ถึง ${new Date(endDate).toLocaleDateString('th-TH')}`;
        }
        
        doc.fontSize(12)
            .text(`สถานที่: ${locationText}`, { align: "center" })
            .text(dateRangeText, { align: "center" })
            .text(`วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')}`, { align: "center" })
            .moveDown(1.5);

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
        doc.fontSize(12)
            .text(`• จำนวนสินค้าทั้งหมด: ${items.length} รายการ`)
            .text(`• จำนวนรวมทั้งหมด: ${totalQty} หน่วย`)
            .text(`• มูลค่ารวมทั้งหมด: ฿${totalValue.toFixed(2)}`)
            .moveDown(0.5)
            // Fixed location display names
            .text(`• สาขานครศรีธรรมราช: ${locationCounts["Nakhon Si Thammarat"]} รายการ`)
            .text(`• สาขากระบี่: ${locationCounts["Krabi"]} รายการ`)
            .moveDown(2);

        // Product Table (English Headers)
        const columns = {
            category: 50,
            name: 190,
            location: 60,
            quantity: 50,
            price: 50,
            amount: 50,
            reorder: 50,
            date: 90
        };

        let currentY = doc.y;
        
        // Table Header (English)
        const drawHeader = () => {
            doc.fontSize(16)
                .text("ID", 50, currentY, { width: columns.category })
                .text("Product Name", 50 + columns.category, currentY, { width: columns.name })
                .text("Location", 50 + columns.category + columns.name, currentY, { width: columns.location })
                .text("Qty", 50 + columns.category + columns.name + columns.location, currentY, { width: columns.quantity })
                .text("Price", 50 + columns.category + columns.name + columns.location + columns.quantity, currentY, { width: columns.price })
                .text("Amount", 50 + columns.category + columns.name + columns.location + columns.quantity + columns.price, currentY, { width: columns.amount })
                .text("Reorder", 50 + columns.category + columns.name + columns.location + columns.quantity + columns.price + columns.amount, currentY, { width: columns.reorder })
                .text("Date", 50 + columns.category + columns.name + columns.location + columns.quantity + columns.price + columns.amount + columns.reorder, currentY, { width: columns.date });
            
            currentY += 20;
            doc.moveTo(50, currentY)
                .lineTo(50 + Object.values(columns).reduce((a, b) => a + b) + 35, currentY)
                .stroke();
            currentY += 10;
        };

        drawHeader();

        // Table Rows (Thai Content)
        items.forEach((item, index) => {
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
                doc.font('ThaiFont');
                drawHeader();
            }

            const amount = (item.qty || 0) * (item.price || 0);
            const locationName = item.location === 'Nakhon Si Thammarat' ? 'นครศรีฯ' : 'กระบี่';
            const itemDate = item.createdAt?.toLocaleDateString('th-TH') || '-';
            const categoryName = item.categoryID?.categoryName || 'ไม่ระบุหมวดหมู่';

            doc.fontSize(10)
                .text(categoryName, 50, currentY, { width: columns.category })
                .text(item.name || '-', 50 + columns.category, currentY, { width: columns.name, ellipsis: true })
                .text(locationName, 50 + columns.category + columns.name, currentY, { width: columns.location })
                .text((item.qty || 0).toString(), 50 + columns.category + columns.name + columns.location, currentY, { width: columns.quantity })
                .text((item.price || 0).toFixed(2), 50 + columns.category + columns.name + columns.location + columns.quantity, currentY, { width: columns.price })
                .text(amount.toFixed(2), 50 + columns.category + columns.name + columns.location + columns.quantity + columns.price, currentY, { width: columns.amount })
                .text((item.reorderPoint || 0).toString(), 50 + columns.category + columns.name + columns.location + columns.quantity + columns.price + columns.amount, currentY, { width: columns.reorder })
                .text(itemDate, 50 + columns.category + columns.name + columns.location + columns.quantity + columns.price + columns.amount + columns.reorder, currentY, { width: columns.date });

            currentY += 25;
        });

        // Error handling for PDF generation
        doc.on('error', (err) => {
            console.error("PDF Generation Error:", err);
            res.status(500).end();
        });

        // Signature Section
        doc.moveDown(4);
        doc.fontSize(12)
            .text("ผู้จัดทำรายงาน", 100, doc.y, { align: "center" })
            .moveDown(2)
            .text("_________________________", 100, doc.y, { align: "center" })
            .moveDown(0.5)
            .text("(ชื่อ)", 100, doc.y, { align: "center" })
            .moveDown(0.5)
            .text("ตำแหน่ง: _____________________", 100, doc.y, { align: "center" });

        const rightColumnY = doc.y - 120;
        doc.fontSize(12)
            .text("ผู้ตรวจสอบรายงาน", 400, rightColumnY, { align: "center" })
            .moveDown(2)
            .text("_________________________", 400, doc.y, { align: "center" })
            .moveDown(0.5)
            .text("(ชื่อ)", 400, doc.y, { align: "center" })
            .moveDown(0.5)
            .text("ตำแหน่ง: _____________________", 400, doc.y, { align: "center" });

        // Timestamp
        doc.moveDown(3);
        doc.fontSize(10)
            .text(`พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}`, 
                { align: "center" });

        doc.end();

    } catch (error) {
        console.error("🚨 เกิดข้อผิดพลาดในการสร้าง PDF:", error);
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

module.exports = router;