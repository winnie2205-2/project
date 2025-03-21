const isLogin = localStorage.getItem("token");
console.log('my-token:', isLogin);

async function roleTest() {
    if (!isLogin) {
        alert("กรุณาล็อกอินก่อน");
        window.location.href = '/index.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/users/role_check/test', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${isLogin}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Error response:', await response.json());
            window.location.href = '/index.html';
            return;
        }

        const data = await response.json();
        console.log("User data:", data);

        if (data.error) {
            alert(data.error || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลผู้ใช้');
            window.location.href = '/index.html';
            return;
        }

        if (data.role === "Employee") {
            window.location.href = '/inventory.html';
        } else {
            window.location.href = '/index.html';
        }
        
    } catch (error) {
        console.error('Network error or fetch issue:', error);
        window.location.href = '/index.html';
    }
}

(async () => {
    await roleTest();
})();
