function showexport() {
    let startDatePicker, endDatePicker; // Variables to store Flatpickr instances
  
    Swal.fire({
      html: `
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/flatpickr/4.6.9/flatpickr.min.css">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.1/dist/sweetalert2.min.css"> 
      <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">
      <link rel="stylesheet" href="assets/css/style.css">
      <link rel="stylesheet" href="assets/css/select.css">
      <link rel="stylesheet" href="assets/fonts/material-icons.min.css">
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      <script src="assets/bootstrap/js/bootstrap.min.js"></script>
        <div class="container justify-content-center mt-5">
          <div class="d-flex justify-content-center">
            <div class="card" style="background: #ebe3ce;width: 600px;max-width: inherit;">
              <div class="card-header text-center" style="background: #ebe3ce;">
                <h5 style="font-weight: bold;">Export Report</h5>
              </div>
              <div class="card-body">
                <form id="exportForm">
                  <div class="mb-3">
                    <label for="fileType" class="form-label float-start location-label">File Type</label>
                    <select name="file" id="fileTypeSelect" class="form-select dropdown-style">
                      <option value="" disabled selected>Choose file types</option>
                      <option value="Excel(CSV)">Excel(CSV)</option>
                      <option value="PDF">PDF</option>
                    </select>
                  </div>
  
                  <div class="mb-3">
                    <label for="location" class="form-label float-start location-label">Location</label>
                    <select name="location" id="locationSelect" class="form-select dropdown-style">
                      <option value="" disabled selected>Choose Location</option>
                      <option value="Nakorn Si Thammarat">Nakorn Si Thammarat</option>
                      <option value="Krabi">Krabi</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label for="Timeline" class="form-label">Choose Timeline</label>
                    <div class="date-picker-container">
                      <div class="date-picker">
                        <input type="text" id="start-date" placeholder="Select Start Date">
                      </div>
                      <div class="date-picker">
                        <input type="text" id="end-date" placeholder="Select End Date">
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
      background: 'transparent',
      didOpen: () => {
        // Initialize Flatpickr for start and end dates
        startDatePicker = flatpickr("#start-date", {
          minDate: "2020-01-01", // Allow dates from 2020 and onwards
          dateFormat: "Y-m-d",
          position: "below", // Force calendar to open below the input
          onChange: function (selectedDates, dateStr, instance) {
            endDatePicker.set("minDate", dateStr);
          },
        });
  
        endDatePicker = flatpickr("#end-date", {
          minDate: "2024-01-01", // Allow dates from 2024 and onwards
          dateFormat: "Y-m-d",
          position: "below", // Force calendar to open below the input
        });
  
        // Save button functionality
        document.getElementById("saveButton").addEventListener("click", saveExport);
        document.getElementById("closeButton").addEventListener("click", () => Swal.close());
      },
      willClose: () => {
        // Destroy Flatpickr instances when the modal is closed
        if (startDatePicker) {
          startDatePicker.destroy();
        }
        if (endDatePicker) {
          endDatePicker.destroy();
        }
      },
    });
  }
  
  // Save export function
  function saveExport() {
    const fileType = document.getElementById("fileTypeSelect").value;
    const location = document.getElementById("locationSelect").value;
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
  
    const exportData = {
      fileType,
      location,
      startDate,
      endDate,
    };
  
    console.log("Export data:", exportData);
  
    // Simulate API call for exporting data
    fetch("http://localhost:5000/api/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(exportData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to export data");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Data received from API:", data);
        Swal.fire({
          title: "Success!",
          text: "Data has been exported successfully.",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          Swal.close();
        });
      })
      .catch((error) => {
        console.error("Error exporting data:", error);
        Swal.fire("Error exporting data!", "", "error");
      });
  }
  
  // Call the function to show the export modal
  showexport();