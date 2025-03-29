function showWithdrawnExport() {
  let startDatePickerWithdrawn, endDatePickerWithdrawn;

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
              <h5 style="font-weight: bold;">Export Withdrawn Report</h5>
            </div>
            <div class="card-body">
              <form id="exportWithdrawnForm">
                <div class="mb-3">
                  <label for="location" class="form-label float-start location-label">Location</label>
                  <select name="location" id="locationSelectWithdrawn" class="form-select dropdown-style">
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
                      <input type="text" id="start-date-withdrawn" placeholder="Select Start Date">
                    </div>
                    <div class="date-picker">
                      <input type="text" id="end-date-withdrawn" placeholder="Select End Date">
                    </div>
                  </div>
                </div>

                <div class="text-end mt-4">
                  <button id="closeButtonWithdrawn" class="btn btn-secondary me-2" type="button" style="background: #ebe3ce;color: rgb(0,0,0);width: 100px;box-shadow: 0px 0px 2px 1px;padding: 7px 12px;border-radius: 50px;">Close</button>
                  <button id="saveButtonWithdrawn" class="btn btn-success" type="button" style="background: #28aa4a;color: rgb(0,0,0);width: 100px;box-shadow: 0px 0px 2px 1px;border-radius: 50px;padding-top: 7px;padding-bottom: 7px;">Export</button>
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
      startDatePickerWithdrawn = flatpickr("#start-date-withdrawn", {
        minDate: "2020-01-01",
        dateFormat: "Y-m-d",
        position: "below",
        onChange: function (selectedDates, dateStr) {
          endDatePickerWithdrawn.set("minDate", dateStr);
        },
      });

      endDatePickerWithdrawn = flatpickr("#end-date-withdrawn", {
        minDate: "2020-01-01",
        dateFormat: "Y-m-d",
        position: "below",
      });

      document.getElementById("saveButtonWithdrawn").addEventListener("click", saveWithdrawnExport);
      document.getElementById("closeButtonWithdrawn").addEventListener("click", () => Swal.close());
    },
    willClose: () => {
      if (startDatePickerWithdrawn) {
        startDatePickerWithdrawn.destroy();
        document.querySelectorAll('.flatpickr-calendar').forEach(el => el.remove());
      }
      if (endDatePickerWithdrawn) {
        endDatePickerWithdrawn.destroy();
        document.querySelectorAll('.flatpickr-calendar').forEach(el => el.remove());
      }
    },
  });
}

function saveWithdrawnExport() {
  const location = document.getElementById("locationSelectWithdrawn").value;
  const startDate = document.getElementById("start-date-withdrawn").value;
  const endDate = document.getElementById("end-date-withdrawn").value;

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

  // Format end date with time
  const endDateWithTime = `${endDate}T23:59:59`;

  // Encode parameters correctly
  const pdfUrl = new URL(`/api/items/report/withdrawals/pdf`, window.location.origin);
  pdfUrl.searchParams.append('location', location);
  pdfUrl.searchParams.append('startDate', startDate);
  pdfUrl.searchParams.append('endDate', endDateWithTime);

  // Hidden iframe approach for better PDF handling
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = pdfUrl;
  document.body.appendChild(iframe);

  setTimeout(() => {
    Swal.close();
    Swal.fire({
      title: "Withdrawal report downloaded successfully",
      icon: "success",
      confirmButtonText: "OK"
    });
  }, 3000);
}