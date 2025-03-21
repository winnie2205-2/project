const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Item = require("../models/itemModel");
const Category = require("../models/categoryModel");

// ✅ ดึงสินค้าทั้งหมด พร้อมแสดง categoryName แทน ObjectId
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

            if (item.qty <= item.reorderPoint) {
                alertLevel = "danger"; // สีแดง (ต้องเติมสินค้า)
            } else if (item.qty <= threshold) {
                alertLevel = "warning"; // สีเหลือง (ใกล้ถึงจุดต้องเติมสินค้า)
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

router.get('/search_item', async (req, res) => {
    console.log('xaxaxa')
    try {
        const searchQuery = req.query.name; // ดึงค่าจาก query string
        const items = await Item.find({ name: new RegExp(searchQuery, 'i') }); // ค้นหาจากชื่อสินค้า (ไม่ต้องใช้ _id)

        if (!items.length) {
            return res.status(200).json({ message: "No items found" });
        }

        res.json(items); // ส่งข้อมูลที่ค้นหากลับ
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

        // ตรวจสอบว่า categoryName มีอยู่ในฐานข้อมูลหรือไม่
        let category = await Category.findOne({ categoryName });

        if (!category) {
            // หากไม่พบหมวดหมู่ในฐานข้อมูล, ให้สร้างหมวดหมู่ใหม่
            category = new Category({ categoryName });
            await category.save(); // บันทึกหมวดหมู่ใหม่ลงฐานข้อมูล
        }

        // สร้างสินค้าใหม่พร้อมกับ categoryID ที่ได้จากการสร้างหรือตรวจสอบ
        const newItem = new Item({
            name,
            location,
            qty,
            price,
            reorderPoint,
            categoryID: category._id // ใช้ _id ของหมวดหมู่ที่สร้างหรือค้นหา
        });

        await newItem.save(); // บันทึกสินค้าใหม่ลงฐานข้อมูล
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

module.exports = router;
