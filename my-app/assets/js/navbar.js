window.onload = async function () {
    try {
        const token = localStorage.getItem("token");
        console.log('my-token:', token);

        // Check if token exists
        if (!token) {
            alert("กรุณาล็อกอินก่อน");
            window.location.href = '/index.html';
            return;
        }

        // Decode JWT to extract the username
        const decodedToken = decodeJwt(token);
        console.log('Decoded Token:', decodedToken);

        // Extract and display the username in the user bar
        const username = decodedToken.username;
        if (username) {
            document.getElementById("Userbar").textContent = username;
        }

        // Send request to check role
        const response = await fetch('http://localhost:5000/api/users/role_check', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Error response:', response);
            window.location.href = '/index.html';
            return;
        }

        const data = await response.json();
        console.log("User data:", data);

        if (data.error) {
            alert(data.error || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลผู้ใช้');
            window.location.href = '/showDash.html';
            return;
        }

        const userRole = data.role;
        console.log("User role:", userRole);

        // Set role-based image
        const roleLower = userRole.toLowerCase();
        document.getElementById('userImage').src = `/assets/img/${roleLower}.png`;

        // Get all navigation items
        const overviewNav = document.getElementById("overviewNav");
        const inventoryNav = document.getElementById("inventoryNav");
        const userManagementNav = document.getElementById("userManagementNav");
        const userLogNav = document.getElementById("userLogNav");
        const reportNav = document.getElementById("reportNav");
        const replenishmentNav = document.getElementById("replenishmentNav");
        const withdrawnNav = document.getElementById("withdrawnNav");
        const settingNav = document.getElementById("settingNav");

        // Hide all nav items initially
        const navItems = [
            overviewNav, inventoryNav, userManagementNav, 
            userLogNav, reportNav, replenishmentNav, 
            withdrawnNav, settingNav
        ];
        navItems.forEach(item => item.style.display = 'none');

        // Show nav items based on role
        if (userRole === "Employee") {
            [overviewNav, inventoryNav, reportNav, replenishmentNav, withdrawnNav]
                .forEach(item => item.style.display = 'block');
        } else if (userRole === "Owner") {
            [overviewNav, inventoryNav, userLogNav, reportNav, replenishmentNav, withdrawnNav]
                .forEach(item => item.style.display = 'block');
        } else if (userRole === "Admin") {
            [userManagementNav, userLogNav, settingNav]
                .forEach(item => item.style.display = 'block');
        }

    } catch (error) {
        console.error('Network error or fetch issue:', error);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
};

// Function to decode JWT token (keep this the same)
function decodeJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
    );
    return JSON.parse(jsonPayload);
}