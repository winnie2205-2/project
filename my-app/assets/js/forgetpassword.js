document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('forgotForm');
  const emailInput = document.getElementById('emailInput');
  const emailError = document.getElementById('emailError');

  form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      emailError.style.display = 'none';
      emailInput.style.borderColor = '#000';

      // Basic validation
      if (!email) {
          showEmailError('โปรดระบุอีเมล');
          return;
      }

      // Email format validation
      if (!validateEmail(email)) {
          showEmailError('รูปแบบอีเมลไม่ถูกต้อง');
          return;
      }

      try {
          const response = await fetch('/api/forgot-password', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email })
          });

          const data = await response.json();

          if (!response.ok) {
              throw new Error(data.error || 'เกิดข้อผิดพลาดในการส่งอีเมล');
          }

          Swal.fire({
              icon: 'success',
              title: 'ส่งอีเมลเรียบร้อย!',
              html: `กรุณาตรวจสอบอีเมล <strong>${email}</strong><br>เพื่อตั้งค่ารหัสผ่านใหม่`,
              confirmButtonText: 'ตกลง'
          });

      } catch (error) {
          showEmailError(error.message);
      }
  });

  function showEmailError(message) {
      emailInput.style.borderColor = '#dc3545';
      emailError.textContent = message;
      emailError.style.display = 'block';
  }

  function validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const form = document.getElementById('resetForm');

  if (!token) {
      form.innerHTML = `
          <div class="alert alert-danger" role="alert">
              ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง กรุณาขอลิงก์ใหม่
          </div>
      `;
      return;
  }

  form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      let isValid = true;

      // Clear errors
      document.querySelectorAll('.text-danger').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.form-control').forEach(el => el.style.borderColor = '#000');

      // Validate password
      if (newPassword.length < 8) {
          showError('passwordError', 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร', 'newPassword');
          isValid = false;
      }

      // Validate match
      if (newPassword !== confirmPassword) {
          showError('confirmError', 'รหัสผ่านไม่ตรงกัน', 'confirmPassword');
          isValid = false;
      }

      if (!isValid) return;

      try {
          const response = await fetch('/api/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, newPassword })
          });

          const data = await response.json();
          
          if (!response.ok) {
              throw new Error(data.error || 'รีเซ็ตรหัสผ่านไม่สำเร็จ');
          }

          Swal.fire({
              title: 'สำเร็จ!',
              text: 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว',
              icon: 'success',
              confirmButtonText: 'เข้าสู่ระบบ'
          }).then(() => {
              window.location.href = 'index.html';
          });

      } catch (error) {
          Swal.fire({
              title: 'เกิดข้อผิดพลาด!',
              text: error.message,
              icon: 'error',
              confirmButtonText: 'ตกลง'
          });
      }
  });

  function showError(elementId, message, inputId) {
      const errorDiv = document.getElementById(elementId);
      document.getElementById(inputId).style.borderColor = '#dc3545';
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
  }
});