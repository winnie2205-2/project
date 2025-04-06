const express = require('express');
const router = express.Router();
const Profile = require('../models/profileModel'); // นำเข้าโมเดล Profile


// Route สำหรับดึงข้อมูลโปรไฟล์
router.get('/profile', async (req, res) => {
    try {
      console.log('Fetching profile...');
      const profile = await Profile.findOne();
      console.log('Profile found:', profile);  // ดูข้อมูลที่ดึงมา
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      res.json(profile);
    } catch (error) {
      console.error('🚨 Error fetching profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
});

  
// 📌 API สำหรับอัปเดตข้อมูลโปรไฟล์
router.put('/profile', async (req, res) => {
  const { companyName, logoUrl, contactInfo } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!companyName || !logoUrl || !contactInfo || !contactInfo.address || !contactInfo.phone || !contactInfo.email) {
      return res.status(400).json({ message: 'All fields are required' });
  }

  try {
      // ค้นหาโปรไฟล์ที่มีอยู่แล้ว
      let profile = await Profile.findOne();

      // ❌ ถ้าไม่เจอโปรไฟล์ ให้แจ้งว่าไม่มีข้อมูลให้แก้ไข
      if (!profile) {
          return res.status(404).json({ message: 'Profile not found. Cannot update non-existent profile.' });
      }

      // ✅ แก้ไขข้อมูล
      profile.companyName = companyName;
      profile.logoUrl = logoUrl;
      profile.contactInfo = contactInfo;

      await profile.save();
      res.status(200).json({ message: 'Profile updated successfully', profile });

  } catch (error) {
      console.error('🚨 Error updating profile:', error);
      res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; // ส่งออก router
