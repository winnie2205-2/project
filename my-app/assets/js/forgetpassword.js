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
          showEmailError('The email format is incorrect.');
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
              throw new Error(data.error || 'An error occurred while sending the email.');
          }

          Swal.fire({
              icon: 'success',
              title: 'The email has been sent successfully!',
              html: `Please check your email. <strong>${email}</strong><br>to reset your password.`,
              confirmButtonText: 'Confirmed.'
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
              The password reset link is invalid. Please request a new link.
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
          showError('passwordError', 'The password must be at least 8 characters long.', 'newPassword');
          isValid = false;
      }

      // Validate match
      if (newPassword !== confirmPassword) {
          showError('confirmError', 'The passwords do not match.', 'confirmPassword');
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
              throw new Error(data.error || 'Password reset failed.');
          }

          Swal.fire({
              title: 'Success!',
              text: 'The password has been successfully reset.',
              icon: 'success',
              confirmButtonText: 'Please log in'
          }).then(() => {
              window.location.href = 'index.html';
          });

      } catch (error) {
          Swal.fire({
              title: 'An error has occurred!',
              text: error.message,
              icon: 'error',
              confirmButtonText: 'Confirmed.'
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