document.addEventListener('DOMContentLoaded', async () => {
    async function loadSidebarProfile() {
        try {
            const response = await fetch('/api/profile/profile');
            if (!response.ok) return;
            
            const profile = await response.json();
            
            // Update sidebar elements
            const logo = document.getElementById('companyLogo');
            const name = document.getElementById('companyName');
            
            if (logo) logo.src = profile.logoUrl;
            if (name) name.textContent = profile.companyName;
            
        } catch (error) {
            console.error('Sidebar profile load error:', error);
        }
    }

    await loadSidebarProfile();
});