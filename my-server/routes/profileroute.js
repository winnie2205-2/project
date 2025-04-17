const express = require('express');
const router = express.Router();
const Profile = require('../models/profileModel'); // นำเข้าโมเดล Profile

// 📦 ดึงข้อมูลโปรไฟล์
router.get('/profile', async (req, res) => {
    try {
        console.log('Fetching profile...');
        const profile = await Profile.findOne();
        console.log('Profile found:', profile);
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json(profile);
    } catch (error) {
        console.error('🚨 Error fetching profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// 🔧 แก้ไขโปรไฟล์
router.put('/profile', async (req, res) => {
  const { companyName, logoUrl, contactInfo, defaultLocation } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!companyName || !logoUrl || !contactInfo || !contactInfo.address || !contactInfo.phone || !contactInfo.email) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'All fields are required' });
  }

  try {
      console.log('Updating profile with data:', req.body);
      let profile = await Profile.findOne();

      if (!profile) {
          console.log('Profile not found for update');
          return res.status(404).json({ message: 'Profile not found. Cannot update non-existent profile.' });
      }

      // อัปเดตข้อมูล
      profile.companyName = companyName;
      profile.logoUrl = logoUrl;
      profile.contactInfo = contactInfo;
      profile.defaultLocation = defaultLocation || 'all'; // ถ้าไม่มีให้ default เป็น 'all'

      await profile.save();
      console.log('Profile updated successfully:', profile);
      res.status(200).json({ message: 'Profile updated successfully', profile });

  } catch (error) {
      console.error('🚨 Error updating profile:', error);
      res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
