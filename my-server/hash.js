const bcrypt = require('bcryptjs');

// ฟังก์ชันสำหรับแฮชรหัสผ่าน
async function hashPassword(password) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10); // 10 คือจำนวนรอบในการสร้าง salt
        return hashedPassword; // คืนค่า hashed password
    } catch (error) {
        console.error('🚨 Error hashing password:', error);
        throw new Error('Password hashing failed');
    }
}

// ฟังก์ชันสำหรับตรวจสอบรหัสผ่าน
async function comparePassword(inputPassword, hashedPassword) {
    try {
        const isMatch = await bcrypt.compare(inputPassword, hashedPassword);
        return isMatch;  // คืนค่าผลลัพธ์ว่าเป็นการจับคู่รหัสผ่านถูกต้องหรือไม่
    } catch (error) {
        console.error('🚨 Error comparing password:', error);
        return false;
    }
}

module.exports = hashPassword;  // ✅ Export ฟังก์ชันออกไปใช้ในไฟล์อื่นได้
