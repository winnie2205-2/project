document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.querySelector('#loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const username = document.querySelector('#username').value.trim();
            const password = document.querySelector('#password').value.trim();

            // ✅ ตรวจสอบค่าก่อนส่งไป API
            console.log("📌 Sending login request with:", { username, password });

            if (!username || !password) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Oops...',
                    text: 'Please enter both username and password!',
                });
                console.log("❌ Username or password is empty!");
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

                console.log("📌 Response status:", response.status);

                let data;
                try {
                    data = await response.json();
                } catch (e) {
                    throw new Error('Invalid JSON response from server.');
                }

                console.log("📌 Server response data:", data);

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Good job!',
                        text: 'Login Successful',
                    }).then(() => {
                        localStorage.setItem("token", data.token);
                        console.log("✅ Token saved:", localStorage.getItem("token"));

                        let redirectUrl = '';
                        if (data.user && data.user.role) {
                            console.log("📌 User role:", data.user.role);

                            if (data.user.role === 'Admin') {
                                redirectUrl = '/admin.html';
                            } else if (data.user.role === 'Employee' || data.user.role === 'Owner') {
                                redirectUrl = '/overview.html';
                            }

                            if (redirectUrl) {
                                console.log("🔀 Redirecting to:", redirectUrl);
                                window.location.href = redirectUrl;
                            }
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Invalid user data received.',
                            });
                        }
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Login Failed',
                        text: data.message || 'Incorrect username or password',
                    });
                    console.log("❌ Login failed:", data.message || "Invalid credentials");
                }
            } catch (error) {
                console.error('🚨 Error during login:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'An error occurred, please try again later.',
                });
            }
        });
    }
});
