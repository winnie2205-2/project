document.addEventListener('DOMContentLoaded', async () => {
    let originalData = {}; // Store original values
    let tempLogoUrl = ''; // Store temporary logo changes

    // Load initial data
    async function loadProfile() {
        try {
            const response = await fetch('/api/profile');
            const profile = await response.json();
            
            // Store original values
            originalData = {
                companyName: profile.companyName,
                logoUrl: profile.logoUrl,
                contactInfo: {
                    address: profile.contactInfo.address,
                    phone: profile.contactInfo.phone,
                    salesPhone: profile.contactInfo.salesPhone,
                    email: profile.contactInfo.email,
                    website: profile.contactInfo.website
                }
            };

            // Set form values
            document.getElementById('companyNameInput').value = originalData.companyName;
            document.getElementById('logoPreview').src = originalData.logoUrl;
            document.getElementById('officePhoneInput').value = originalData.contactInfo.phone;
            document.getElementById('salesPhoneInput').value = originalData.contactInfo.salesPhone;
            document.getElementById('emailInput').value = originalData.contactInfo.email;
            document.getElementById('websiteInput').value = originalData.contactInfo.website;
            document.getElementById('addressInput').value = originalData.contactInfo.address;

            tempLogoUrl = originalData.logoUrl;

        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    await loadProfile();

    // Handle logo upload preview
    document.getElementById('logoUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                tempLogoUrl = e.target.result;
                document.getElementById('logoPreview').src = tempLogoUrl;
            };
            reader.readAsDataURL(file);
        }
    });

    // Save handler
    document.getElementById('saveButton').addEventListener('click', async () => {
        const formData = {
            companyName: document.getElementById('companyNameInput').value,
            logoUrl: tempLogoUrl,
            contactInfo: {
                address: document.getElementById('addressInput').value,
                phone: document.getElementById('officePhoneInput').value,
                salesPhone: document.getElementById('salesPhoneInput').value,
                email: document.getElementById('emailInput').value,
                website: document.getElementById('websiteInput').value
            }
        };

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Update original data with new values
                originalData = formData;
                
                // Update UI elements
                document.getElementById('companyLogo').src = formData.logoUrl;
                document.getElementById('companyName').textContent = formData.companyName;

                // Show success feedback
                const toast = new bootstrap.Toast(document.getElementById('successToast'));
                toast.show();

                // Clear file input
                document.getElementById('logoUpload').value = '';

                // Optional: Reload to ensure consistency
                setTimeout(() => location.reload(), 2000);
            }
        } catch (error) {
            console.error('Save error:', error);
        }
    });

    // Cancel handler
    document.getElementById('CancelButton').addEventListener('click', () => {
        // Reset all fields to original values
        document.getElementById('companyNameInput').value = originalData.companyName;
        document.getElementById('logoPreview').src = originalData.logoUrl;
        document.getElementById('officePhoneInput').value = originalData.contactInfo.phone;
        document.getElementById('salesPhoneInput').value = originalData.contactInfo.salesPhone;
        document.getElementById('emailInput').value = originalData.contactInfo.email;
        document.getElementById('websiteInput').value = originalData.contactInfo.website;
        document.getElementById('addressInput').value = originalData.contactInfo.address;
        
        // Reset file input and temporary logo
        document.getElementById('logoUpload').value = '';
        tempLogoUrl = originalData.logoUrl;
    });
});