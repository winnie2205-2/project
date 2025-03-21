function showCreateBox() {
  Swal.fire({
    html: `
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.1/dist/sweetalert2.min.css"> 
    <link rel="stylesheet" href="/bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" href="assets/css/style.css">
    <div class="container justify-content-left">
      <div class="d-flex justify-content-center">
        <div class="card" style="background:#ebe3ce;width:800px;max-width:inherit;">
          <div class="card-header text-center">
            <h5 style="font-weight:bold;">Add Product Information</h5>
          </div>
          <div class="card-body">
            <form id="productForm">
              <div class="mb-3">
                <label class="form-label" for="productID" style="color:#ca0000;text-align:left;">ID*</label>
                <input class="form-control" type="text" id="categoryName" placeholder="Enter new or existing category name" style="box-shadow:0px 0px 5px 2px;">
              </div>
              <div class="mb-3">
                <label class="form-label" for="productName" style="color:#ca0000;text-align:left;">Name*</label>
                <input class="form-control" type="text" id="productName" placeholder="Name of the product" style="box-shadow:0px 0px 5px 2px;">
              </div>
              <div class="mb-3">
                <label class="form-label" for="productLocation" style="color:#ca0000;text-align:left;">Location*</label>
                <select class="form-select" id="productLocation" style="box-shadow:0px 0px 5px 2px;">
                  <option value="" selected>Choose Location</option>
                  <option value="Nakhon Si Thammarat">Nakhon Si Thammarat</option>
                  <option value="Krabi">Krabi</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label" for="productQuantity" style="color:#ca0000;text-align:left;">Quantity*</label>
                <input class="form-control" type="number" id="productQuantity" min="0" placeholder="Quantity" style="box-shadow:0px 0px 5px 2px;">
              </div>
              <div class="mb-3">
                <label class="form-label" for="productPrice" style="color:#ca0000;text-align:left;">Prices (THB) / Product*</label>
                <input class="form-control" type="number" id="productPrice" placeholder="Price (THB)" style="box-shadow:0px 0px 5px 2px;">
              </div>
              <div class="d-flex justify-content-between align-items-center mb-3 reorder-status-box">
                <div class="reorder-box">
                  <label class="form-label" for="reorderPoint" style="color:#ca0000;text-align:left;">Reorder Point*</label>
                  <div class="input-group">
                    <button class="btn btn-outline-secondary" type="button" id="decreaseReorder" style="width:50px;background:#dc7b09;color:rgb(255,255,255);font-weight:bold;font-size:16px;border-style:solid;border-color:rgb(0,0,0);">-</button>
                    <input class="form-control text-center" type="text" id="reorderPoint" readonly style="width:50px;border:1px solid rgb(0,0,0);" value="0">
                    <button class="btn btn-outline-secondary" type="button" id="increaseReorder" style="width:50px;background:#dc7b09;color:rgb(255,255,255);font-weight:bold;font-size:16px;border-style:solid;border-color:rgb(0,0,0);">+</button>
                  </div>
                </div>
                <div class="status-box">
                  <label class="form-label" style="color:#ca0000;text-align:left;">Status*</label>
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
              <div class="text-end mt-4">
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
    background: 'transparent' , // hide white background
    didOpen: () => {
      document.getElementById("increaseReorder").addEventListener("click", () => {
        const reorderInput = document.getElementById("reorderPoint");
        reorderInput.value = parseInt(reorderInput.value, 10) + 1;
      });

      document.getElementById("decreaseReorder").addEventListener("click", () => {
        const reorderInput = document.getElementById("reorderPoint");
        const value = parseInt(reorderInput.value, 10);
        reorderInput.value = value > 0 ? value - 1 : 0;
      });

      document.getElementById("productQuantity").addEventListener("input", (event) => {
        const value = parseInt(event.target.value, 10);
        event.target.value = isNaN(value) || value < 0 ? 0 : value;
      });

      document.getElementById("saveButton").addEventListener("click", saveProduct);
      document.getElementById("closeButton").addEventListener("click", () => Swal.close());
    },
  });
}

function saveProduct() {
  const productName = document.getElementById("productName").value;
  const productLocation = document.getElementById("productLocation").value;
  const productQuantity = document.getElementById("productQuantity").value;
  const productPrice = document.getElementById("productPrice").value;
  const reorderPoint = document.getElementById("reorderPoint").value;
  const status = document.querySelector('input[name="statusOptions"]:checked').value;
  const categoryName = document.getElementById("categoryName").value; // Category Name

  // ตรวจสอบว่า user ป้อนข้อมูลครบถ้วน
  if (!productName || !productLocation || !productQuantity || !productPrice || !reorderPoint || !categoryName) {
    Swal.fire('กรุณากรอกข้อมูลให้ครบถ้วน', '', 'warning');
    return;
  }

  const newProduct = {
    name: productName,
    location: productLocation,
    qty: parseInt(productQuantity, 10),
    price: parseFloat(productPrice),
    status: status || 'Enable',
    reorderPoint: parseInt(reorderPoint, 10),
    categoryName, // ส่ง categoryName ไปด้วย
  };

  console.log('Sending data to API:', newProduct);

  fetch('http://localhost:5000/api/items/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newProduct),
  })
  .then(response => response.json())
  .then(data => {
    console.log('Data received from API:', data);
    Swal.fire({
      title: 'Success!',
      text: 'Product has been added successfully.',
      icon: 'success',
      confirmButtonText: 'OK'
    }).then(() => {
      Swal.close();
      fetchItems(); // Call function to refresh the list
    });
  })
  .catch(error => {
    console.error('Error saving product:', error);
    Swal.fire('Error saving product!', '', 'error');
  });
}


showCreateBox();
