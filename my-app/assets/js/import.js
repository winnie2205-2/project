function showimport() {
  Swal.fire({
    html: `
      <link rel="stylesheet" href="assets/css/style.css">
      <link rel="stylesheet" href="assets/css/import.css">
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
                  <select name="fileType" id="fileTypeSelect" class="form-select dropdown-style">
                    <option value="" disabled selected>Choose import types</option>
                    <option value="Excel(CSV)">Excel(CSV)</option>
                    <option value="Excel">Excel(.xls, .xlsx)</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="fileUpload" class="form-label float-start location-label">Upload File</label>
                  <input type="file" id="fileUpload" name="file" class="form-control file-upload-input" accept=".csv, .xls, .xlsx">
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
      const fileTypeSelect = document.getElementById("fileTypeSelect");
      const fileUpload = document.getElementById("fileUpload");

      if (!fileTypeSelect || !fileUpload) {
        console.error("Required elements are missing!");
        return;
      }

      // Ensure elements are interactive
      document.querySelector(".swal2-popup").style.pointerEvents = "auto";
      fileTypeSelect.style.pointerEvents = "auto";
      fileUpload.style.pointerEvents = "auto";
      document.getElementById("saveButton").style.pointerEvents = "auto";
      document.getElementById("closeButton").style.pointerEvents = "auto";

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
  // Set a default import mode since we removed the selection
  const importMode = "normal";

  if (!fileType || !fileUpload) {
    Swal.fire("Error", "Please select a file type and upload a file.", "warning");
    return;
  }

  const formData = new FormData();
  formData.append("fileType", fileType);
  formData.append("file", fileUpload);
  formData.append("importMode", importMode);

  console.log("Processing import with file type:", fileType);

  fetch("http://localhost:5000/api/import", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((text) => {
          throw new Error(`Failed to import data: ${text}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      Swal.fire("Success", data.message, "success").then(() => {
        // Directly refresh items after the success message is acknowledged
        if (typeof window.fetchItems === "function") {
          window.fetchItems();
        } else {
          // Fallback - reload the data through another method or refresh the page
          window.location.reload();
        }
      });
    })
    .catch((error) => {
      console.error("Error during import:", error);
      Swal.fire("Error", error.message, "error");
    });
}

// Helper function to handle the actual import
function importData(formData, mode) {
  return fetch("http://localhost:5000/api/items/import", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((text) => {
          throw new Error(`Failed to import data: ${text}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      // Check if data.stats exists
      if (!data || !data.stats) {
        throw new Error("Invalid response from server: stats not found");
      }

      const stats = data.stats;

      let message = `Imported ${stats.imported} items successfully`;
      if (mode === "normal" && stats.duplicates > 0) {
        message += ` (${stats.duplicates} duplicates detected and imported)`;
      }

      Swal.fire({
        title: "Import Complete",
        html: `
          <div>
            <p>${message}</p>
            <div class="import-stats">
              <p>Total: ${stats.total}</p>
              <p>Failed: ${stats.failed}</p>
            </div>
          </div>
        `,
        icon: "success",
        confirmButtonText: "OK",
      }).then(() => {
        if (typeof fetchItems === "function") fetchItems();
      });
    })
    .catch((error) => {
      console.error("Error during import:", error);
      Swal.fire("Import Error", error.message, "error");
    });
}

// Call the function to show the import modal
showimport();