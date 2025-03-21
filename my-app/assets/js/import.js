function showimport() {
    Swal.fire({
      html: `
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.1/dist/sweetalert2.min.css"> 
      <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">
      <link rel="stylesheet" href="assets/css/style.css">
      <link rel="stylesheet" href="assets/css/select.css">
        <div class="container justify-content-center mt-5">
          <div class="d-flex justify-content-center">
            <div class="card" style="background: #ebe3ce;width: 600px;max-width: inherit;">
              <div class="card-header text-center" style="background: #ebe3ce;">
                <h5 style="font-weight: bold;">Import</h5>
              </div>
              <div class="card-body">
                <form id="importForm">
                  <div class="mb-3">
                    <label for="fileType" class="form-label float-start location-label">File Type</label>
                    <select name="file" id="fileTypeSelect" class="form-select dropdown-style">
                      <option value="" disabled selected>Choose import types</option>
                      <option value="Excel(CSV)">Excel(CSV)</option>
                      <option value="Excel">Excel(.xls, .xlsx)</option>
                    </select>
                  </div>
                  <div class="mb-3">
                        <label for="fileUpload" class="form-label float-start location-label">Upload File</label>
                        <input type="file" id="fileUpload" class="form-control file-upload-input" accept=".csv, .xls, .xlsx">
                    </div>
                  <div class="text-end mt-4">
                    <button id="closeButton" class="btn btn-secondary me-2" type="button" style="background: #ebe3ce;color: rgb(0,0,0);width: 100px;box-shadow: 0px 0px 2px 1px;padding: 7px 12px;border-radius: 50px;">Close</button>
                    <button id="saveButton" class="btn btn-success" type="button" style="background: #28aa4a;color: rgb(0,0,0);width: 100px;box-shadow: 0px 0px 2px 1px;border-radius: 50px;padding-top: 7px;padding-bottom: 7px;">Import</button>
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
        // Save button functionality
        document.getElementById("saveButton").addEventListener("click", saveimport);
        document.getElementById("closeButton").addEventListener("click", () => Swal.close());
      }
    });
  }
  
  // Save import function
  function saveimport() {
    const fileType = document.getElementById("fileTypeSelect").value;
    const fileUpload = document.getElementById("fileUpload").files[0];
  
    if (!fileType || !fileUpload) {
      Swal.fire('Error', 'Please select a file type and upload a file.', 'warning');
      return;
    }
  
    const formData = new FormData();
    formData.append("fileType", fileType);
    formData.append("file", fileUpload);
  
    console.log("Import data:", formData);
  
    // Simulate API call for importing data
    fetch("http://localhost:5000/api/import", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to import data");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Data received from API:", data);
        Swal.fire({
          title: "Success!",
          text: "Data has been imported successfully.",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          Swal.close();
        });
      })
      .catch((error) => {
        console.error("Error importing data:", error);
        Swal.fire("Error importing data!", "", "error");
      });
  }
  
  // Call the function to show the import modal
  showimport();