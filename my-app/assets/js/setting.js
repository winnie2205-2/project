document.addEventListener('DOMContentLoaded', async () => {
    let originalData = {}; // Store original values
    let tempLogoUrl = ''; // Store temporary logo changes
    
    // Load initial data
    async function loadProfile() {
        try {
            const response = await fetch('/api/profile/profile');
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
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
                },
                // Add defaultLocation to originalData
                defaultLocation: profile.defaultLocation || 'all'
            };

            // Set form values
            document.getElementById('companyNameInput').value = originalData.companyName;
            document.getElementById('logoPreview').src = originalData.logoUrl;
            document.getElementById('officePhoneInput').value = originalData.contactInfo.phone;
            document.getElementById('salesPhoneInput').value = originalData.contactInfo.salesPhone;
            document.getElementById('emailInput').value = originalData.contactInfo.email;
            document.getElementById('websiteInput').value = originalData.contactInfo.website;
            document.getElementById('addressInput').value = originalData.contactInfo.address;
            
            // Set the default location if the selector exists
            const locationSelect = document.getElementById('locationSelect');
            if (locationSelect) {
                locationSelect.value = originalData.defaultLocation;
            }

            // Update the sidebar elements as well
            document.getElementById('companyLogo').src = originalData.logoUrl;
            document.getElementById('companyName').textContent = originalData.companyName;

            tempLogoUrl = originalData.logoUrl;

        } catch (error) {
            console.error('Error loading profile:', error);
            // Add error notification to user
            showErrorToast('Failed to load company profile data');
        }
    }

    // Initial load
    await loadProfile();

    // Handle logo upload preview
    document.getElementById('logoUpload').addEventListener('change', function(e) {
        // [Your existing code for logo upload]
    });

    // Save handler with validation
    document.getElementById('saveButton').addEventListener('click', async () => {
        // Get values from form fields
        const companyName = document.getElementById('companyNameInput').value.trim();
        const address = document.getElementById('addressInput').value.trim();
        const phone = document.getElementById('officePhoneInput').value.trim();
        const salesPhone = document.getElementById('salesPhoneInput').value.trim();
        const email = document.getElementById('emailInput').value.trim();
        const website = document.getElementById('websiteInput').value.trim();
        
        // Get the selected location
        const locationSelect = document.getElementById('locationSelect');
        const defaultLocation = locationSelect ? locationSelect.value : originalData.defaultLocation;
        
        // [Your existing validation code]

        // Show loading state
        const saveBtn = document.getElementById('saveButton');
        const originalText = saveBtn.textContent;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        saveBtn.disabled = true;

        const formData = {
            companyName: companyName,
            logoUrl: tempLogoUrl,
            contactInfo: {
                address: address,
                phone: phone,
                salesPhone: salesPhone,
                email: email,
                website: website
            },
            // Add defaultLocation to formData
            defaultLocation: defaultLocation
        };

        try {
            const response = await fetch('/api/profile/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save settings');
            }

            const profile = await response.json();
            
            // Update original data with new values
            originalData = {...formData};
            
            // Update UI elements globally
            document.getElementById('companyLogo').src = formData.logoUrl;
            document.getElementById('companyName').textContent = formData.companyName;
            
            // Save the location to localStorage for use in inventory page
            localStorage.setItem('defaultLocation', formData.defaultLocation);

            // Show success feedback
            const toast = new bootstrap.Toast(document.getElementById('successToast'));
            toast.show();

            if (!window.location.href.includes('inventory.html')) {
                const locationMap = {
                    'warehouse1': 'Nakhon Si Thammarat',
                    'warehouse2': 'Krabi',
                    'all': 'All Locations'
                };
                
                const locationName = locationMap[defaultLocation] || 'All Locations';
                
                // Show an additional notification about the location change
                if (defaultLocation !== originalData.defaultLocation) {
                    const notificationToast = document.createElement('div');
                    notificationToast.className = 'toast';
                    notificationToast.setAttribute('role', 'alert');
                    notificationToast.setAttribute('aria-live', 'assertive');
                    notificationToast.setAttribute('aria-atomic', 'true');
                    
                    notificationToast.innerHTML = `
                        <div class="toast-header bg-info text-white">
                            <strong class="me-auto">Location Changed</strong>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                        </div>
                        <div class="toast-body">
                            Inventory will now show items from: <strong>${locationName}</strong>
                        </div>
                    `;
                    
                    document.querySelector('.position-fixed').appendChild(notificationToast);
                    const toast = new bootstrap.Toast(notificationToast);
                    toast.show();
                }
            }

            // Clear file input
            document.getElementById('logoUpload').value = '';
        } catch (error) {
            console.error('Save error:', error);
            showErrorToast(error.message || 'Failed to save settings');
        } finally {
            // Reset button state
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
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
        
        // Reset location select if exists
        const locationSelect = document.getElementById('locationSelect');
        if (locationSelect) {
            locationSelect.value = originalData.defaultLocation;
        }
        
        // Reset file input and temporary logo
        document.getElementById('logoUpload').value = '';
        tempLogoUrl = originalData.logoUrl;
    });
    
    // Helper functions
    function validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    
    function validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    function showErrorToast(message) {
        // Create error toast if not exists
        if (!document.getElementById('errorToast')) {
            const toastContainer = document.querySelector('.position-fixed');
            const errorToast = document.createElement('div');
            errorToast.id = 'errorToast';
            errorToast.className = 'toast';
            errorToast.setAttribute('role', 'alert');
            errorToast.setAttribute('aria-live', 'assertive');
            errorToast.setAttribute('aria-atomic', 'true');
            
            errorToast.innerHTML = `
                <div class="toast-header bg-danger text-white">
                    <strong class="me-auto">Error</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body"></div>
            `;
            
            toastContainer.appendChild(errorToast);
        }
        
        // Set message and show toast
        document.querySelector('#errorToast .toast-body').textContent = message;
        const toast = new bootstrap.Toast(document.getElementById('errorToast'));
        toast.show();
    }
});