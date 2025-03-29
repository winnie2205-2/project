function showLowStockExport() {
  let startDatePickerLowStock, endDatePickerLowStock;

  Swal.fire({
    html: `
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/flatpickr/4.6.9/flatpickr.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.1/dist/sweetalert2.min.css"> 
    <link rel="stylesheet" href="bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/select.css">
    <link rel="stylesheet" href="assets/fonts/material-icons.min.css">
      <div class="container justify-content-center mt-5">
        <div class="d-flex justify-content-center">
          <div class="card" style="background: #ebe3ce;width: 600px;max-width: inherit;">
            <div class="card-header text-center" style="background: #ebe3ce;">
              <h5 style="font-weight: bold;">Export Low Stock Report</h5>
            </div>
            <div class="card-body">
              <form id="exportLowStockForm">
                <div class="mb-3">
                  <label for="location" class="form-label float-start location-label">Location</label>
                  <select name="location" id="locationSelectLowStock" class="form-select dropdown-style">
                      <option value="" disabled selected>Choose Location</option>
                      <option value="Nakhon Si Thammarat">Nakhon Si Thammarat</option>
                      <option value="Krabi">Krabi</option>
                      <option value="Both">Both</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="Timeline" class="form-label">Choose Timeline</label>
                  <div class="date-picker-container">
                    <div class="date-picker">
                      <input type="text" id="start-date-lowstock" placeholder="Select Start Date">
                    </div>
                    <div class="date-picker">
                      <input type="text" id="end-date-lowstock" placeholder="Select End Date">
                    </div>
                  </div>
                </div>

                <div class="text-end mt-4">
                  <button id="closeButtonLowStock" class="btn btn-secondary me-2" type="button" style="background: #ebe3ce;color: rgb(0,0,0);width: 100px;box-shadow: 0px 0px 2px 1px;padding: 7px 12px;border-radius: 50px;">Close</button>
                  <button id="saveButtonLowStock" class="btn btn-success" type="button" style="background: #28aa4a;color: rgb(0,0,0);width: 100px;box-shadow: 0px 0px 2px 1px;border-radius: 50px;padding-top: 7px;padding-bottom: 7px;">Export</button>
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
      startDatePickerLowStock = flatpickr("#start-date-lowstock", {
          minDate: "2020-01-01",
          dateFormat: "Y-m-d",
          position: "below",
          onChange: function (selectedDates, dateStr) {
              endDatePickerLowStock.set("minDate", dateStr);
          },
      });

      endDatePickerLowStock = flatpickr("#end-date-lowstock", {
          minDate: "2020-01-01",
          dateFormat: "Y-m-d",
          position: "below",
      });

      document.getElementById("saveButtonLowStock").addEventListener("click", saveLowStockExport);
      document.getElementById("closeButtonLowStock").addEventListener("click", () => Swal.close());
    },
    willClose: () => {
      if (startDatePickerLowStock) {
        startDatePickerLowStock.destroy();
        document.querySelectorAll('.flatpickr-calendar').forEach(el => el.remove());
      }
      if (endDatePickerLowStock) {
        endDatePickerLowStock.destroy();
        document.querySelectorAll('.flatpickr-calendar').forEach(el => el.remove());
      }
    },
  });
}

function saveLowStockExport() {
  const location = document.getElementById("locationSelectLowStock").value;
  const startDate = document.getElementById("start-date-lowstock").value;
  const endDate = document.getElementById("end-date-lowstock").value;

  if (!location || !startDate || !endDate) {
    Swal.fire({
      title: "Please fill in all required fields",
      icon: "warning",
      confirmButtonText: "OK"
    });
    return;
  }

  Swal.fire({
    title: "Generating PDF Report...",
    text: "Please wait...",
    icon: "info",
    showConfirmButton: false,
    didOpen: () => Swal.showLoading(),
  });

  const pdfUrl = new URL(`/api/items/report/low-stock/pdf`, window.location.origin);
  pdfUrl.searchParams.append('location', location);
  pdfUrl.searchParams.append('startDate', startDate);
  pdfUrl.searchParams.append('endDate', endDate);

  const link = document.createElement('a');
  link.href = pdfUrl;
  link.target = '_blank';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    Swal.close();
    Swal.fire({
      title: "Low stock report downloaded successfully",
      icon: "success",
      confirmButtonText: "OK"
    });
  }, 2000);
}