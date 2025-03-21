export async function roleAdmin() {
    const token = localStorage.getItem("token");
    console.log('my-token:', token);

    // ตรวจสอบว่า token มีค่าอยู่หรือไม่
    if (!token) {
        alert("กรุณาล็อกอินก่อน");
        window.location.href = '/showDash.html';  // ถ้าไม่มี token ให้ redirect ไปหน้า login
        return;
    }

    try {
        // ส่งคำขอ GET ไปที่เซิร์ฟเวอร์เพื่อเช็ค role
        const response = await fetch('http://localhost:5000/api/users/role_check', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,  // ส่ง token เป็น Bearer token
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('Error response:', errorData);
            window.location.href = '/index.html'; // ถ้ามีข้อผิดพลาดจาก API จะพาไปหน้า login
            return;
        }

        const data = await response.json();
        console.log("User data:", data);

        if (data.error) {
            alert(data.error || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลผู้ใช้');
            window.location.href = '/showDash.html';
            return;
        }

        // ✅ ตรวจสอบ role และทำการ redirect
        if (data.role === "Admin") {
            window.location.href = "/admin.html";
        } else if (data.role === "employee") {
            window.location.href = "/inventory.html";
        } else {
            window.location.href = "/index.html";
        }
        
        
        
    } catch (error) {
        console.error('Network error or fetch issue:', error);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
}

