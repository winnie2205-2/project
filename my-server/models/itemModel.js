const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  categoryID: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true }, // ✅ ใช้ ObjectId แทน id
  name: { type: String, required: true },
  location: { type: String, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ["Enable", "Disable"], default: "Enable" },
  reorderPoint: { type: Number, default: null }
}, { versionKey: false, timestamps: true });

// ✅ ดึง categoryName อัตโนมัติเมื่อใช้ find()
itemSchema.pre(/^find/, function (next) {
  this.populate("categoryID", "categoryName");
  next();
});

const Item = mongoose.model("Item", itemSchema);
module.exports = Item;
