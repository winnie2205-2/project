const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    categoryID: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    qty: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true },
    status: { type: String, enum: ["Enable", "Disable"], default: "Enable" },
    reorderPoint: { type: Number, default: null },
    activityLogs: [
      {
        action: { type: String, enum: ["withdraw", "restock"], required: true }, // ✅ เพิ่ม "restock"
        qty: { type: Number, required: true },
        purchasePrice: { type: Number },
        date: { type: Date, default: Date.now },
        user: { type: String, required: false }, // ✅ ไม่ต้องเป็น required
        status: { type: String, enum: ["withdrawn", "restocked"], required: true } // ✅ เพิ่ม "restocked"
      }
    ]
  },
  { versionKey: false, timestamps: true }
);

itemSchema.pre(/^find/, function (next) {
  this.populate("categoryID", "categoryName");
  next();
});

// ฟังก์ชันสำหรับการเบิกสินค้า
itemSchema.methods.withdraw = async function (qty, user) {
  if (this.qty < qty) {
    throw new Error("Not enough stock available to withdraw");
  }

  // ลดจำนวนสินค้า
  this.qty -= qty;

  // เพิ่มข้อมูลการเบิกลงใน activityLogs
  this.activityLogs.push({
    action: "withdraw",
    qty: qty,
    user: user,
    status: "withdrawn"
  });

  // บันทึกการอัพเดตในฐานข้อมูล
  await this.save();
};

const Item = mongoose.model("Item", itemSchema);
module.exports = Item;
