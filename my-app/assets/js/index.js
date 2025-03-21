document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.querySelector('#loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const username = document.querySelector('#username').value;
            const password = document.querySelector('#password').value;

            if (!username || !password) {
                alert("Please enter both username and password");
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();
                console.log(data);
                if (response.ok) {
                    alert('Login successful!');
                    localStorage.setItem("token", data.token);
                    console.log("Token saved:", localStorage.getItem("token"));

                    if(data.user.role == 'Employee'){
                        window.location.href = '/inventory.html';
                    }

                    if(data.user.role == 'Admin'){
                        window.location.href = '/admin.html';
                    }

                    // ✅ ตรวจสอบ role และเปลี่ยนหน้าเฉพาะหลัง login เท่านั้น
                    // await roleAdmin();
                } else {
                    alert(data.error || 'Login failed');
                }
            } catch (error) {
                console.error('Error during login:', error);
                alert('An error occurred, please try again later.');
            }
        });
    }
});
