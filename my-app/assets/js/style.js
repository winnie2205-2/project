document.addEventListener("DOMContentLoaded", function () {
    let activeNav = localStorage.getItem("activeNav");
  
    if (activeNav) {
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.nav === activeNav) {
                item.classList.add('active');
            }
        });
    }

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function () {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Store the active navigation item in localStorage
            localStorage.setItem("activeNav", this.dataset.nav);
        });
    });
});



