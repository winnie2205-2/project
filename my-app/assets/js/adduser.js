function showadduser() {
  console.log("Add User button clicked");
  let latestID = "Em";  
  let num = parseInt(latestID.replace("Em", "")); 
  num = isNaN(num) ? 1 : num + 1;
  latestID = "Em" + num;  

  Swal.fire({
    html: `
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.1/dist/sweetalert2.min.css"> 
    <link rel="stylesheet" href="bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/popup.css">
    <link rel="stylesheet" href="assets/css/dropdown.css">
    <div class="container justify-content-center mt-5">
      <div class="d-flex justify-content-center">
        <div class="card" style="background: #ebe3ce;width: 500px;max-width: inherit;">
          <div class="card-header text-center" style="background: #ebe3ce;">
            <h5 style="font-weight: bold;">Add User Information</h5>
          </div>
          <div class="card-body">
            <form id="UserForm">
              <div class="mb-3">
                <label class="form-label" for="Username">Username*</label>
                <input class="form-control" type="text" id="Username" placeholder="Username">
                <small id="usernameError" class="form-text text-danger" style="display:none;">This field is required.</small>
              </div>
              <div class="mb-4">
                <label class="form-label" for="Gmail">Gmail*</label>
                <input class="form-control" type="email" id="Gmail" placeholder="Enter your Gmail">
                <small id="gmailError" class="form-text text-danger" style="display:none;">This field is required.</small>
              </div>
              <div class="mb-3">
                <label class="form-label" for="Password">Password*</label>
                <div class="input-group">
                  <input class="form-control" type="password" id="Password" placeholder="Password">
                  <span class="input-group-text toggle-password" style="cursor: pointer;">
                    <i class="bi bi-eye-slash"></i>
                  </span>
                </div>
                <small id="passwordError" class="form-text text-danger" style="display:none;">This field is required.</small>
              </div>
              <div class="mb-3">
                <label class="form-label" for="Confirmpassword">Confirm password*</label>
                <div class="input-group">
                  <input class="form-control" type="password" id="Confirmpassword" placeholder="Confirm Password">
                  <span class="input-group-text toggle-password" style="cursor: pointer;">
                    <i class="bi bi-eye-slash"></i>
                  </span>
                </div>
                <small id="confirmPasswordError" class="form-text text-danger" style="display:none;">Passwords do not match.</small>
              </div>
              <div class="d-flex justify-content-between flex-wrap mb-3">
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
                <div class="mb-3">
                  <label class="form-label" for="selectRole">Role*</label>
                  <select class="form-select" id="selectRole" style="width:200px;">
                    <option value="" selected disabled>Select a role</option>
                    <option value="Admin">Admin</option>
                    <option value="Owner">Owner</option>
                    <option value="Employee">Employee</option>
                  </select>
                  <small id="roleError" class="form-text text-danger" style="display:none;">Please select a role.</small>
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
    </div>`,
    showConfirmButton: false,
    showCancelButton: false,
    width: "600px",
    background: 'transparent',
    customClass: {
      popup: 'my-popup-class'
    },
    didOpen: () => {
      // Set up password visibility toggle
      document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
          const input = this.previousElementSibling;
          const icon = this.querySelector('i');
          
          if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
          } else {
            input.type = 'password';
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
          }
        });
      });

      document.getElementById("saveButton").addEventListener("click", saveUser);
      document.getElementById("closeButton").addEventListener("click", () => Swal.close());
    },
  });
}

function saveUser() {
  // Reset all error messages and red labels
  document.querySelectorAll(".form-text.text-danger").forEach((el) => (el.style.display = "none"));
  document.querySelectorAll(".form-label").forEach((el) => el.classList.remove("text-danger"));

  let isValid = true;

  // Get form values
  const Username = document.getElementById("Username").value.trim();
  const Gmail = document.getElementById("Gmail").value.trim();
  const Password = document.getElementById("Password").value;
  const Confirmpassword = document.getElementById("Confirmpassword").value;
  const status = document.querySelector('input[name="statusOptions"]:checked').value;
  const selectedRole = document.getElementById("selectRole").value;

  // Validate Username
  if (!Username) {
    document.getElementById("usernameError").style.display = "block";
    document.getElementById("Username").previousElementSibling.classList.add("text-danger");
    isValid = false;
  }

  // Validate Gmail
  if (!Gmail) {
    document.getElementById("gmailError").textContent = "This field is required.";
    document.getElementById("gmailError").style.display = "block";
    document.getElementById("Gmail").previousElementSibling.classList.add("text-danger");
    isValid = false;
  } else if (!validateEmail(Gmail)) {
    document.getElementById("gmailError").textContent = "Please enter a valid Gmail address (@gmail.com).";
    document.getElementById("gmailError").style.display = "block";
    document.getElementById("Gmail").previousElementSibling.classList.add("text-danger");
    isValid = false;
  }

  // Validate Password
  if (!Password) {
    document.getElementById("passwordError").style.display = "block";
    document.getElementById("Password").closest('.input-group').previousElementSibling.classList.add("text-danger");
    isValid = false;
  }

  // Validate Confirm Password
  if (!Confirmpassword) {
    document.getElementById("confirmPasswordError").textContent = "This field is required.";
    document.getElementById("confirmPasswordError").style.display = "block";
    document.getElementById("Confirmpassword").closest('.input-group').previousElementSibling.classList.add("text-danger");
    isValid = false;
  } else if (Password !== Confirmpassword) {
    document.getElementById("confirmPasswordError").textContent = "Passwords do not match.";
    document.getElementById("confirmPasswordError").style.display = "block";
    document.getElementById("Confirmpassword").closest('.input-group').previousElementSibling.classList.add("text-danger");
    isValid = false;
  }

  // Validate Role
  if (!selectedRole) {
    document.getElementById("roleError").style.display = "block";
    document.getElementById("selectRole").previousElementSibling.classList.add("text-danger");
    isValid = false;
  }

  // If any field is invalid, stop the process
  if (!isValid) {
    return;
  }

  // Prepare data for API
  const newUser = {
    Username: Username,
    Gmail: Gmail,
    Password: Password,
    status: status || 'Enable',
    Role: selectedRole,
  };

  console.log('Sending data to API:', newUser);

  // Send data to API
  fetch('http://localhost:5000/api/users/create',  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(newUser),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to save user: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Data received from API:', data);
    Swal.fire({
      title: 'Success!',
      text: 'User has been added successfully.',
      icon: 'success',
      confirmButtonText: 'OK'
    }).then(() => {
      Swal.close();
      fetchUsers(); // Refresh the user list
    });
  })
  .catch((error) => {
    console.error('Error saving user:', error);
    Swal.fire('Error saving user!', error.message, 'error');
  });
}

function validateEmail(email) {
  // Simple validation to check if the email ends with @gmail.com
  return email.toLowerCase().endsWith('@gmail.com');
}

// Function to update user
function updateUser(userId) {
  // Reset all error messages and red labels
  document.querySelectorAll(".form-text.text-danger").forEach((el) => (el.style.display = "none"));
  document.querySelectorAll(".form-label").forEach((el) => el.classList.remove("text-danger"));

  let isValid = true;

  // Get form values
  const Username = document.getElementById("Username").value.trim();
  const Gmail = document.getElementById("Gmail").value.trim();
  const Password = document.getElementById("Password").value;
  const ConfirmPassword = document.getElementById("ConfirmPassword").value;
  const status = document.querySelector('input[name="statusOptions"]:checked').value;
  const selectedRole = document.getElementById("selectRole").value;

  // Validate Username
  if (!Username) {
    document.getElementById("usernameError").style.display = "block";
    document.getElementById("Username").previousElementSibling.classList.add("text-danger");
    isValid = false;
  }

  // Validate Gmail
  if (!Gmail) {
    document.getElementById("gmailError").textContent = "This field is required.";
    document.getElementById("gmailError").style.display = "block";
    document.getElementById("Gmail").previousElementSibling.classList.add("text-danger");
    isValid = false;
  } else if (!validateEmail(Gmail)) {
    document.getElementById("gmailError").textContent = "Please enter a valid Gmail address (@gmail.com).";
    document.getElementById("gmailError").style.display = "block";
    document.getElementById("Gmail").previousElementSibling.classList.add("text-danger");
    isValid = false;
  }

  // Validate Password (optional for edit)
  if (Password) {
    if (!ConfirmPassword) {
      document.getElementById("confirmPasswordError").textContent = "Please confirm your password.";
      document.getElementById("confirmPasswordError").style.display = "block";
      document.getElementById("ConfirmPassword").closest('.input-group').previousElementSibling.classList.add("text-danger");
      isValid = false;
    } else if (Password !== ConfirmPassword) {
      document.getElementById("confirmPasswordError").textContent = "Passwords do not match.";
      document.getElementById("confirmPasswordError").style.display = "block";
      document.getElementById("ConfirmPassword").closest('.input-group').previousElementSibling.classList.add("text-danger");
      isValid = false;
    }
  }

  // Validate Role
  if (!selectedRole) {
    document.getElementById("roleError").style.display = "block";
    document.getElementById("selectRole").previousElementSibling.classList.add("text-danger");
    isValid = false;
  }

  // If any field is invalid, stop the process
  if (!isValid) {
    return;
  }

  // Prepare data for API
  fetch(`http://localhost:5000/api/users/edit/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(userData),
  })

  // Only include password if it's provided
  if (Password) {
    userData.Password = Password;
  }

  console.log('Sending data to API:', userData);

  // Send data to API
  fetch("http://localhost:5000/api/users/users", {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(userData),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to update user: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Data received from API:', data);
    Swal.fire({
      title: 'Success!',
      text: 'User has been updated successfully.',
      icon: 'success',
      confirmButtonText: 'OK'
    }).then(() => {
      Swal.close();
      fetchUsers(); // Refresh the user list
    });
  })
  .catch((error) => {
    console.error('Error saving user:', error);
    Swal.fire('Error saving user!', '', 'error');
  });
}

let currentPage = 1; // Track the current page
const usersPerPage = 10; // Number of users to display per page
let allUsers = []; // Store all users fetched from the API

// Fetch users from the API
function fetchUsers() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error('❌ Token is missing! Please login again.');
    return;
  }

  fetch("http://localhost:5000/api/users/users", {
    method: "GET",
    headers: {
      'Authorization': `Bearer ${token}`
    },
  })
    .then(response => {
      if (!response.ok) {
        if (response.status === 403) {
          console.error("⛔ Unauthorized! Token expired or invalid.");
          localStorage.removeItem('token');
          alert("Session expired. Please login again.");
        }
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(users => {
      console.log("👥 Users:", users); // Log the users array
      if (Array.isArray(users)) {
        allUsers = users; // Store all users
        displayUsers(allUsers); // Render the first page
      } else {
        console.error("Error: Expected an array but got:", users);
      }
    })
    .catch(error => console.error("🚨 Error fetching users:", error));
}

// Function to render users for the current page
function displayUsers(users) {
  const tbody = document.querySelector('tbody');
  if (!tbody) {
    console.error("❌ Table body element not found!");
    return;
  }

  tbody.innerHTML = ''; // Clear existing rows

  if (!Array.isArray(users) || users.length === 0) {
    console.warn("⚠️ No users found or data format is incorrect.");
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">No users available</td></tr>';
    return;
  }

  // Calculate the start and end index for the current page
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const usersToDisplay = users.slice(startIndex, endIndex);

  usersToDisplay.forEach(user => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td class="text-center">${user.username || '-'}</td>
      <td class="text-center">${user.role || '-'}</td>
      <td class="text-center">${user.email || '-'}</td>
      <td class="text-center">${user.status || '-'}</td>
      <td class="text-center">${formatDate(user.updatedAt)}</td>
      <td class="text-center">${formatDate(user.createdAt)}</td>
      <td class="text-center" style="white-space: nowrap;">
        <div class="d-flex justify-content-center gap-2">
          <button class="btn text-primary border-0 bg-transparent p-1 fs-4" 
            data-user='${JSON.stringify(user)}' 
            onclick="showEditUser(this)">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn text-danger border-0 bg-transparent p-1 fs-4" onclick="deleteUser('${user._id}')">
            <i class="bi bi-trash3-fill"></i>
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(row);
  });

  // Update pagination buttons
  updatePaginationButtons(users.length);
}
// Function to update pagination buttons
function updatePaginationButtons(totalUsers) {
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const pagination = document.querySelector(".pagination");
  if (!pagination) {
    console.error("❌ Pagination element not found!");
    return;
  }

  pagination.innerHTML = ""; // Clear existing pagination buttons

  // Previous button
  pagination.innerHTML += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;" tabindex="-1">«</a>
    </li>
  `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `
      <li class="page-item ${currentPage === i ? 'active' : ''}">
        <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
      </li>
    `;
  }

  // Next button
  pagination.innerHTML += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;" tabindex="-1">»</a>
    </li>
  `;
}

// Function to change page
function changePage(page) {
  if (page < 1 || page > Math.ceil(allUsers.length / usersPerPage)) return;
  currentPage = page;
  displayUsers(allUsers); // Re-render users for the new page
}

// Placeholder for date formatting function
function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

// Placeholder for the delete function
function deleteUser(userId) {
  console.log('Deleting user with ID:', userId);
  // Add your delete logic here
}

// Call fetchUsers on page load
window.onload = function () {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in first.");
    window.location.href = '/index.html';
    return;
  }

  fetchUsers(); // Fetch users when the page loads
};

function showEditUser(button) {
  const user = JSON.parse(button.getAttribute('data-user'));

  // Ensure user is an object
  if (typeof user !== 'object' || user === null) {
    console.error("Invalid user data:", user);
    Swal.fire('Error', 'Invalid user data. Please try again.', 'error');
    return;
  }

  Swal.fire({
    html: `
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11.7.1/dist/sweetalert2.min.css">
      <link rel="stylesheet" href="bootstrap/css/bootstrap.min.css">
      <link rel="stylesheet" href="assets/css/style.css">
      <link rel="stylesheet" href="assets/css/popup.css">
      <link rel="stylesheet" href="assets/css/dropdown.css">
      <div class="d-flex justify-content-center">
        <div class="card" style="background: #ebe3ce;width: 500px;max-width: inherit;">
          <div class="card-header text-center" style="background: #ebe3ce;">
            <h5 style="font-weight: bold;">Edit User Information</h5>
          </div>
          <div class="card-body">
            <form id="UserForm">
              <div class="mb-3">
                <label class="form-label" for="Username">Username*</label>
                <input class="form-control" type="text" id="Username" value="${user.username || ''}">
                <small id="usernameError" class="form-text text-danger" style="display:none;">This field is required.</small>
              </div>
              <div class="mb-3">
                <label class="form-label" for="Gmail">Gmail*</label>
                <input class="form-control" type="email" id="Gmail" value="${user.email || ''}">
                <small id="gmailError" class="form-text text-danger" style="display:none;">Please enter a valid Gmail address (@gmail.com).</small>
              </div>
              <div class="mb-3">
                <label class="form-label" for="Password">New Password (optional)</label>
                <div class="input-group">
                  <input class="form-control" type="password" id="Password" placeholder="Leave blank if not changing">
                  <span class="input-group-text toggle-password" style="cursor: pointer;">
                    <i class="bi bi-eye-slash"></i>
                  </span>
                </div>
                <small id="passwordError" class="form-text text-danger" style="display:none;">This field is required.</small>
              </div>
              <div class="mb-3">
                <label class="form-label" for="ConfirmPassword">Confirm Password</label>
                <div class="input-group">
                  <input class="form-control" type="password" id="ConfirmPassword">
                  <span class="input-group-text toggle-password" style="cursor: pointer;">
                    <i class="bi bi-eye-slash"></i>
                  </span>
                </div>
                <small id="confirmPasswordError" class="form-text text-danger" style="display:none;">Passwords do not match.</small>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-3 reorder-status-box">
                <div class="status-box">
                  <label class="form-label">Status*</label>
                  <div class="d-flex justify-content-start align-items-center" style="background:#ffffff;height:40px;width:auto;min-width:200px;border-radius:5px;border:1px solid rgb(0,0,0);box-shadow:0px 0px 2px 1px;">
                    <div class="form-check form-check-inline" style="margin-left:10px;">
                      <input type="radio" class="form-check-input" id="statusEnable" name="statusOptions" style="border:2px solid rgb(0,0,0);" value="Enable" ${user.status === 'Enable' ? 'checked' : ''}>
                      <label class="form-check-label" for="statusEnable">Enable</label>
                    </div>
                    <div class="form-check form-check-inline" style="margin-right:0px;">
                      <input type="radio" class="form-check-input" id="statusDisable" name="statusOptions" style="border:2px solid rgb(0,0,0);" value="Disable" ${user.status === 'Disable' ? 'checked' : ''}>
                      <label class="form-check-label" for="statusDisable">Disable</label>
                    </div>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="selectRole">Role*</label>
                  <select class="form-select" id="selectRole" style="width:200px;">
                    <option value="" disabled>Select a role</option>
                    <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option>
                    <option value="Owner" ${user.role === 'Owner' ? 'selected' : ''}>Owner</option>
                    <option value="Employee" ${user.role === 'Employee' ? 'selected' : ''}>Employee</option>
                  </select>
                  <small id="roleError" class="form-text text-danger" style="display:none;">Please select a role.</small>
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
    </div>`,
    showConfirmButton: false,
    showCancelButton: false,
    width: "600px",
    background: 'transparent',
    didOpen: () => {
      // Set up password visibility toggle
      document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
          const input = this.previousElementSibling;
          const icon = this.querySelector('i');
          
          if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
          } else {
            input.type = 'password';
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
          }
        });
      });

      // Save button logic
      document.getElementById("saveButton").addEventListener("click", () => {
        const Username = document.getElementById("Username").value.trim();
        const Gmail = document.getElementById("Gmail").value.trim();
        const Password = document.getElementById("Password").value;
        const ConfirmPassword = document.getElementById("ConfirmPassword").value;
        const status = document.querySelector('input[name="statusOptions"]:checked').value;
        const selectedRole = document.getElementById("selectRole").value;

        // Check if any field has changed
        const isUsernameChanged = Username !== user.username;
        const isGmailChanged = Gmail !== user.email;
        const isPasswordChanged = Password !== "" || ConfirmPassword !== "";
        const isStatusChanged = status !== user.status;
        const isRoleChanged = selectedRole !== user.role;

        if (
          !isUsernameChanged &&
          !isGmailChanged &&
          !isPasswordChanged &&
          !isStatusChanged &&
          !isRoleChanged
        ) {
          Swal.fire('No Changes', 'No changes were made to the user.', 'info');
        } else {
          updateUser(user._id); // Save changes
        }
      });

      // Close button logic with confirmation
      document.getElementById("closeButton").addEventListener("click", () => {
        Swal.fire({
          title: 'Are you sure?',
          text: 'Are you sure you want to cancel? The changes haven\'t been saved.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, cancel',
          cancelButtonText: 'No, keep editing'
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.close(); // Close the edit modal
          }
        });
      });
    }
  });
}
function saveUser() {
  // Reset all error messages and red labels
  document.querySelectorAll(".form-text.text-danger").forEach((el) => (el.style.display = "none"));
  document.querySelectorAll(".form-label").forEach((el) => el.classList.remove("text-danger"));

  let isValid = true;

  // Get form values
  const Username = document.getElementById("Username").value.trim();
  const Gmail = document.getElementById("Gmail").value.trim();
  const Password = document.getElementById("Password").value;
  const Confirmpassword = document.getElementById("Confirmpassword").value;
  const status = document.querySelector('input[name="statusOptions"]:checked').value.toLowerCase(); // Convert to lowercase
  const selectedRole = document.getElementById("selectRole").value;

  // Validate Username
  if (!Username) {
    document.getElementById("usernameError").style.display = "block";
    document.getElementById("Username").previousElementSibling.classList.add("text-danger");
    isValid = false;
  }

  // Validate Gmail
  if (!Gmail) {
    document.getElementById("gmailError").textContent = "This field is required.";
    document.getElementById("gmailError").style.display = "block";
    document.getElementById("Gmail").previousElementSibling.classList.add("text-danger");
    isValid = false;
  } else if (!validateEmail(Gmail)) {
    document.getElementById("gmailError").textContent = "Please enter a valid Gmail address (@gmail.com).";
    document.getElementById("gmailError").style.display = "block";
    document.getElementById("Gmail").previousElementSibling.classList.add("text-danger");
    isValid = false;
  }

  // Validate Password
  if (!Password) {
    document.getElementById("passwordError").style.display = "block";
    document.getElementById("Password").closest('.input-group').previousElementSibling.classList.add("text-danger");
    isValid = false;
  }

  // Validate Confirm Password
  if (!Confirmpassword) {
    document.getElementById("confirmPasswordError").textContent = "This field is required.";
    document.getElementById("confirmPasswordError").style.display = "block";
    document.getElementById("Confirmpassword").closest('.input-group').previousElementSibling.classList.add("text-danger");
    isValid = false;
  } else if (Password !== Confirmpassword) {
    document.getElementById("confirmPasswordError").textContent = "Passwords do not match.";
    document.getElementById("confirmPasswordError").style.display = "block";
    document.getElementById("Confirmpassword").closest('.input-group').previousElementSibling.classList.add("text-danger");
    isValid = false;
  }

  // Validate Role
  if (!selectedRole) {
    document.getElementById("roleError").style.display = "block";
    document.getElementById("selectRole").previousElementSibling.classList.add("text-danger");
    isValid = false;
  }

  // If any field is invalid, stop the process
  if (!isValid) {
    return;
  }

  // Prepare data for API - use lowercase field names to match backend expectations
  const newUser = {
    username: Username,
    email: Gmail,
    password: Password,
    status: status || 'enable', // lowercase to match backend
    role: selectedRole,
  };

  console.log('Sending data to API:', newUser);

  // Use the correct API endpoint based on other working API calls
  fetch('http://localhost:5000/api/users/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(newUser),
  })
  .then(response => {
    console.log('Response status:', response.status);
    if (!response.ok) {
      return response.text().then(text => {
        console.error('Error response body:', text);
        throw new Error(`Failed to save user: ${response.status}`);
      });
    }
    return response.json();
  })
  .then(data => {
    console.log('Data received from API:', data);
    Swal.fire({
      title: 'Success!',
      text: 'User has been added successfully.',
      icon: 'success',
      confirmButtonText: 'OK'
    }).then(() => {
      Swal.close();
      fetchUsers(); // Refresh the user list
    });
  })
  .catch((error) => {
    console.error('Error saving user:', error);
    Swal.fire('Error saving user!', error.message, 'error');
  });
}


// Function to delete a user
// Function to delete a user
function deleteUser(userId) {
  console.log("🆔 Trying to delete user:", userId); // Log userId for debugging

  const token = localStorage.getItem('token');
  if (!token) {
      Swal.fire('Please log in first', '', 'warning');
      return;
  }

  // Confirmation dialog before deletion
  Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
  }).then((result) => {
      if (result.isConfirmed) {
          fetch(`http://localhost:5000/api/users/delete/${userId}`, {
              method: 'DELETE',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              }
          })
          .then(response => response.json().then(data => ({ status: response.status, body: data }))) // Extract status & body
          .then(({ status, body }) => {
              if (status !== 200) {
                  console.error(`❌ Error: ${body.error || "Failed to delete user"}`);
                  Swal.fire('Error', body.error || 'Failed to delete user', 'error');
                  return;
              }
              
              console.log("✅ User deleted successfully:", body);
              Swal.fire('Deleted!', 'User has been deleted.', 'success');
              fetchUsers(); // Refresh the user list
          })
          .catch(error => {
              console.error("🚨 Error deleting user:", error);
              Swal.fire('Error', 'Something went wrong!', 'error');
          });
      }
  });
}

document.addEventListener("DOMContentLoaded", fetchUsers);

