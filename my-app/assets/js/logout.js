document.getElementById("logoutBtn").addEventListener("click", function () {
    // ลบ Token ออกจาก Local Storage
    localStorage.removeItem("token");
    // ลบ Token ออกจาก Cookie (ถ้ามีการใช้)
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // เปลี่ยนเส้นทางไปที่หน้า loading.html
    window.location.href = "loading.html";
});