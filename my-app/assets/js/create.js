function showCreateBox() {
  Swal.fire({
    html: `
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.1/dist/sweetalert2.min.css">
      <link rel="stylesheet" href="bootstrap/css/bootstrap.min.css">
      <link rel="stylesheet" href="assets/css/style.css">
      <link rel="stylesheet" href="assets/css/popup.css">
      <div class="container justify-content-left">
        <div class="d-flex justify-content-center">
          <div class="card" style="background:#ebe3ce;width:800px;max-width:inherit;">
            <div class="card-header text-center">
              <h5 style="font-weight:bold;">Add Product Information</h5>
            </div>
            <div class="card-body">
              <form id="productForm">
                <div class="mb-3">
                  <label class="form-label" for="productID">
                      Product ID* <span style="font-size: 12px; color: gray;">(e.g. MGA0000001)</span>
                  </label>
                  <input class="form-control" type="text" id="productID" placeholder="Product ID">
                  <small id="productIDError" class="form-text text-danger" style="display:none;">This field is required.</small>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="productName">Name*</label>
                  <input class="form-control" type="text" id="productName" placeholder="Name of the product">
                  <small id="productNameError" class="form-text text-danger" style="display:none;">This field is required.</small>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="productLocation">Location*</label>
                  <select class="form-select" id="productLocation" style="box-shadow:0px 0px 5px 2px;">
                    <option value="" selected>Choose Location</option>
                    <option value="Nakhon Si Thammarat">Nakhon Si Thammarat</option>
                    <option value="Krabi">Krabi</option>
                  </select>
                  <small id="productLocationError" class="form-text text-danger" style="display:none;">This field is required.</small>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="productQuantity">Quantity*</label>
                  <input class="form-control" type="number" id="productQuantity" min="0" placeholder="Quantity">
                  <small id="productQuantityError" class="form-text text-danger" style="display:none;">This field is required.</small>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="productPrice">Prices (THB) / Product*</label>
                  <input class="form-control" type="text" id="productPrice" placeholder="Price (THB)" data-raw-value="">
                  <small id="productPriceError" class="form-text text-danger" style="display:none;">This field is required.</small>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-3 reorder-status-box">
                  <div class="reorder-box">
                    <label class="form-label" for="reorderPoint">Reorder Point*</label>
                    <div class="input-group">
                      <button class="btn btn-outline-secondary decrease-reorder" type="button" id="decreaseReorder">-</button>
                      <input class="form-control text-center" type="text" id="reorderPoint" value="0" style="width: 50px;">
                      <button class="btn btn-outline-secondary increase-reorder" type="button" id="increaseReorder">+</button>
                    </div>
                    <small id="reorderPointError" class="form-text text-danger" style="display:none;">This field is required.</small>
                  </div>
                  <div class="status-box">
                    <label class="form-label">Status*</label>
                    <div class="d-flex justify-content-start align-items-center" style="background:#ffffff;height:40px;width:auto;min-width:200px;border-radius:5px;border:1px solid rgb(0,0,0);box-shadow:0px 0px 2px 1px;">
                      <div class="form-check form-check-inline" style="margin-left:10px;">
                        <input type="radio" checked class="form-check-input" id="statusEnable" name="statusOptions" style="border:2px solid rgb(0,0,0);" value="Enable">
                        <label class="form-check-label" for="statusEnable">Enable</label>
                      </div>
                      <div class="form-check form-check-inline" style="margin-right:0px;">
                        <input type="radio" class="form-check-input" id="statusDisable" name="statusOptions" style="border:2px solid rgb(0,0,0);" value="Disable">
                        <label class="form-check-label" for="statusDisable">Disable</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="d-flex justify-content-end">
                  <button id="closeButton" class="btn btn-secondary me-2" type="button" style="background: #ebe3ce;color: rgb(0,0,0);width: 100px;box-shadow: 0px 0px 2px 1px;padding: 7px 12px;border-radius: 50px;">Close</button>
                  <button id="saveButton" class="btn btn-success" type="button" style="background: #28aa4a;color: rgb(0,0,0);width: 100px;box-shadow: 0px 0px 2px 1px;border-radius: 50px;padding-top: 7px;padding-bottom: 7px;">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `,
    showConfirmButton: false,
    showCancelButton: false,
    padding: "auto",
    margin: "auto",
    width: "600px",
    background: 'transparent',
    didOpen: () => {
      const popup = Swal.getPopup();

      // Price Input Handling
      const priceInput = popup.querySelector("#productPrice");
      if (priceInput) {
        priceInput.addEventListener("input", function(event) {
          const cursorPos = this.selectionStart;
          const originalValue = this.value.replace(/,/g, '');
          
          // Allow only numbers and remove commas
          let cleanValue = originalValue.replace(/[^0-9]/g, '');
          
          // Store raw value in data attribute
          this.dataset.rawValue = cleanValue;
          
          // Format with commas for display
          this.value = cleanValue ? parseInt(cleanValue, 10).toLocaleString('en-US') : '';
          
          // Maintain cursor position
          const diff = this.value.length - originalValue.length;
          this.setSelectionRange(cursorPos + diff, cursorPos + diff);
        });
      }

      // Reorder Point Handling
      const reorderPointInput = popup.querySelector("#reorderPoint");
      if (reorderPointInput) {
        // Allow empty input during editing
        reorderPointInput.addEventListener("input", function(event) {
          this.value = this.value.replace(/[^0-9]/g, '');
        });

        // Set to 0 if empty on blur
        reorderPointInput.addEventListener("blur", function(event) {
          if (this.value === '') {
            this.value = 0;
          }
        });

        // Increase/Decrease buttons
        popup.querySelector("#increaseReorder").addEventListener("click", () => {
          const currentValue = parseInt(reorderPointInput.value || 0, 10);
          reorderPointInput.value = currentValue + 1;
        });

        popup.querySelector("#decreaseReorder").addEventListener("click", () => {
          const currentValue = parseInt(reorderPointInput.value || 0, 10);
          reorderPointInput.value = Math.max(0, currentValue - 1);
        });
      }

      // Quantity Input Validation
      popup.querySelector("#productQuantity").addEventListener("input", (event) => {
        const value = parseInt(event.target.value, 10);
        event.target.value = isNaN(value) || value < 0 ? 0 : value;
      });

      // Save button functionality
      popup.querySelector("#saveButton").addEventListener("click", saveProduct);

      // Close button functionality
      popup.querySelector("#closeButton").addEventListener("click", () => Swal.close());
    },
  });
}

function saveProduct() {
  const productID = document.getElementById("productID").value;
  const productName = document.getElementById("productName").value;
  const productLocation = document.getElementById("productLocation").value;
  const productQuantity = document.getElementById("productQuantity").value;
  const productPrice = document.getElementById("productPrice");
  const reorderPoint = document.getElementById("reorderPoint").value;

  // Reset errors
  document.querySelectorAll(".form-text.text-danger").forEach((el) => (el.style.display = "none"));
  document.querySelectorAll(".form-label").forEach((el) => el.classList.remove("text-danger"));

  let isValid = true;

  // Validation checks
  if (!productID) {
    showError("productIDError");
    isValid = false;
  }
  if (!productName) {
    showError("productNameError");
    isValid = false;
  }
  if (!productLocation) {
    showError("productLocationError");
    isValid = false;
  }
  if (!productQuantity) {
    showError("productQuantityError");
    isValid = false;
  }
  if (!productPrice.dataset.rawValue) {
    showError("productPriceError");
    isValid = false;
  }
  if (!reorderPoint) {
    showError("reorderPointError");
    isValid = false;
  }

  if (!isValid) return;

  // Prepare data for API
  const newProduct = {
    productID,
    name: productName,
    location: productLocation,
    qty: parseInt(productQuantity, 10),
    price: parseInt(productPrice.dataset.rawValue, 10) || 0,
    reorderPoint: parseInt(reorderPoint, 10) || 0,
    categoryName: productID,
  };

  console.log('Sending data:', newProduct);

  const token = localStorage.getItem('token');
  console.log('Token from localStorage:', token);

  fetch('http://localhost:5000/api/items/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(newProduct),
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to save');
    return response.json();
  })
  .then(data => {
    Swal.fire({
      title: 'Success!',
      text: 'Product added successfully',
      icon: 'success',
      confirmButtonText: 'OK'
    }).then(() => {
      Swal.close();
      fetchItems(); // Refresh list
    });
  })
  .catch(error => {
    console.error('Error:', error);
    Swal.fire('Error!', 'Failed to save product', 'error');
  });
}

function showError(elementId) {
  const errorElement = document.getElementById(elementId);
  errorElement.style.display = "block";
  errorElement.previousElementSibling.classList.add("text-danger");
}