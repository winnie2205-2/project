const express = require("express");
const router = express.Router();
const Category = require("../models/categoryModel");

// ✅ ดึงหมวดหมู่ทั้งหมด
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "❌ โหลดหมวดหมู่ล้มเหลว!", error });
  }
});

// ✅ เพิ่มหมวดหมู่ใหม่
router.post("/", async (req, res) => {
  try {
    const { categoryName } = req.body;

    const newCategory = new Category({ categoryName });
    await newCategory.save();

    res.status(201).json({ message: "✅ หมวดหมู่ถูกเพิ่มแล้ว!", newCategory });
  } catch (error) {
    res.status(500).json({ message: "❌ ไม่สามารถเพิ่มหมวดหมู่ได้!", error });
  }
});

module.exports = router;
