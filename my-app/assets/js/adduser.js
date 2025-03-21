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
                <label class="form-label" for="User_ID">ID*</label>
                <input class="form-control" type="text" id="User_ID" placeholder="User_ID" value="${latestID}" disabled>
              </div>
              <div class="mb-3">
                <label class="form-label" for="Username">Username*</label>
                <input class="form-control" type="text" id="Username" placeholder="Username">
              </div>
              <div class="mb-4"> <!-- Added mb-4 for extra space -->
                <label class="form-label" for="Gmail">Gmail*</label>
                <input class="form-control" type="text" id="Gmail" placeholder="Enter your Gmail">
              </div>
              <div class="mb-3">
                <label class="form-label" for="Password">Password*</label>
                <input class="form-control" type="password" id="Password" placeholder="Password">
              </div>
              <div class="mb-3">
                <label class="form-label" for="Confirmpassword">Confirm password*</label>
                <input class="form-control" type="password" id="Confirmpassword" placeholder="Confirm Password">
              </div>
              <div class="d-flex justify-content-between align-items-center mb-3 reorder-status-box">
                <div class="status-box">
                  <label class="form-label">Status*</label>
                  <div class="justify-content-center align-items-center align-content-center" style="background: #ffffff;height: 50px;width: 220px;border-radius: 5px;border: 1px solid rgb(0,0,0);box-shadow: 0px 0px 2px 1px;">
                    <div class="justify-content-center align-items-center align-content-center form-check form-check-inline me-2" style="margin-left: 5px;">
                      <input type="radio" checked class="form-check-input" id="statusEnable" name="statusOptions" value="Enable" style="border: 2px solid rgb(0,0,0);">
                      <label class="form-check-label" for="statusEnable">Enable</label>
                    </div>
                    <div class="justify-content-center align-items-center align-content-center form-check form-check-inline" style="margin-right: 0px;">
                      <input type="radio" class="form-check-input" id="statusDisable" name="statusOptions" value="Disable" style="border: 2px solid rgb(0,0,0);">
                      <label class="form-check-label" for="statusDisable">Disable</label>
                    </div>
                  </div>
                </div>
                <div class="mb-3">
                  <div class="dropdown" style="margin-top:50px;">
                    <button class="btn btn-light dropdown-toggle" type="button" id="roleDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                      Choose Roles
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="roleDropdown">
                      <li><label class="dropdown-item"><input type="checkbox" class="role-checkbox" value="Admin"> Admin</label></li>
                      <li><label class="dropdown-item"><input type="checkbox" class="role-checkbox" value="Owner"> Owner</label></li>
                      <li><label class="dropdown-item"><input type="checkbox" class="role-checkbox" value="Employee"> Employee</label></li>
                    </ul>
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
    </div>`,
    showConfirmButton: false,
    showCancelButton: false,
    width: "600px",
    background: 'transparent',
    customClass: {
      popup: 'my-popup-class'  // เพิ่มคลาสสำหรับจัดการกับ CSS เอง
    },
    didOpen: () => {
      const dropdownElement = document.getElementById('roleDropdown');
      const dropdownMenu = document.querySelector('.dropdown-menu');
    
      if (!dropdownElement || !dropdownMenu) {
        console.error("Dropdown elements not found.");
        return;
      }
    
      const dropdown = new bootstrap.Dropdown(dropdownElement);
      dropdownElement.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent modal from interfering with dropdown
        dropdown.toggle(); // Manually toggle the dropdown
      });
    
      document.addEventListener('click', (event) => {
        if (!dropdownElement.contains(event.target) && !dropdownMenu.contains(event.target)) {
          dropdown.hide();
        }
      });
    
      const dropdownButton = document.getElementById("roleDropdown");
      const checkboxes = document.querySelectorAll(".role-checkbox");
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
          const selectedRoles = Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value)
            .join(", ");
          
          dropdownButton.textContent = selectedRoles || "Choose Roles";
        });
      });

      document.getElementById("saveButton").addEventListener("click", saveProduct);
      document.getElementById("closeButton").addEventListener("click", () => Swal.close());
    },
  });
}

function saveProduct() {
  const User_ID = document.getElementById('User_ID').value;
  const Username = document.getElementById("Username").value;
  const Gmail = document.getElementById("Gmail").value;
  const Password = document.getElementById("Password").value;
  const Confirmpassword = document.getElementById("Confirmpassword").value;
  const status = document.querySelector('input[name="statusOptions"]:checked').value;
  const selectedRole = document.getElementById("roleDropdown").textContent;

  if (!User_ID || !Username || !Gmail || !Password || !Confirmpassword || selectedRole === "Choose Roles") {
    Swal.fire('Please fill in all fields and select a role', '', 'warning');
    return;
  }

  const newUser = {
    User_ID: User_ID,
    Username: Username,
    Gmail: Gmail,
    Password: Password,
    status: status || 'Enable',
    Role: selectedRole,
  };

  console.log('Sending data to API:', newUser);

  // ดึง token จาก localStorage
  const token = localStorage.getItem('token');  // หรือ sessionStorage.getItem('authToken')

  if (!token) {
    Swal.fire('Please log in first', '', 'warning');
    return;
  }

  fetch('http://localhost:5000/api/users/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,  // ส่ง token ใน headers
    },
    body: JSON.stringify(newUser),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to save user');
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
      fetchUsers();
    });
  })
  .catch((error) => {
    console.error('Error saving user:', error);
    Swal.fire('Error saving user!', '', 'error');
  });
}

const token = localStorage.getItem('token');

let currentPage = 1; // Track the current page
const usersPerPage = 6; // Number of users to display per page
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
          <button class="btn text-primary border-0 bg-transparent p-1 fs-4" onclick="showEditBox('${user.username}')">
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
      <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">«</a>
    </li>
  `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `
      <li class="page-item ${currentPage === i ? 'active' : ''}">
        <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
      </li>
    `;
  }

  // Next button
  pagination.innerHTML += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">»</a>
    </li>
  `;
}

// Function to change page
function changePage(page) {
  if (page < 1 || page > Math.ceil(allUsers.length / usersPerPage)) return;
  currentPage = page;
  displayUsers(allUsers); // Re-render users for the new page
}

// Function to format date
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB'); // Format as DD/MM/YYYY
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

// ฟังก์ชันสำหรับแก้ไข (ต้องเขียนเพิ่ม)
function editUser(userId) {
  const Username = document.getElementById("editUsername").value;
  const Gmail = document.getElementById("editGmail").value;
  const Password = document.getElementById("editPassword").value;
  const Confirmpassword = document.getElementById("editConfirmpassword").value;
  const status = document.querySelector('input[name="editStatusOptions"]:checked').value;
  const selectedRole = document.getElementById("editRoleDropdown").textContent;

  if (!Username || !Gmail || !Password || !Confirmpassword || selectedRole === "Choose Roles") {
    Swal.fire('Please fill in all fields and select a role', '', 'warning');
    return;
  }

  const updatedUser = {
    Username,
    Gmail,
    Password,
    status,
    Role: selectedRole,
  };

  console.log("Updating user:", updatedUser);

  fetch(`http://localhost:5000/api/users/update/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedUser),
  })
  .then(response => response.json())
  .then(data => {
    console.log("User updated:", data);
    Swal.fire({
      title: "Success!",
      text: "User has been updated successfully.",
      icon: "success",
      confirmButtonText: "OK"
    }).then(() => {
      Swal.close();
      fetchUsers();  // โหลดข้อมูลใหม่หลังอัปเดต
    });
  })
  .catch(error => {
    console.error("Error updating user:", error);
    Swal.fire("Error updating user!", "", "error");
  });
}


function updateUser(userId, newUsername) {
  // ตัวอย่างการส่งข้อมูลไปยัง API
  fetch(`http://localhost:5000/users/${userId}`, {
      method: 'PUT',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          username: newUsername
      })
  })
  .then(response => response.json())
  .then(data => {
      // อัปเดตข้อมูลในตารางหลังจากแก้ไข
      document.getElementById(`username-${userId}`).innerText = newUsername;
      console.log('data::',data)
      // แจ้งเตือนการอัปเดตสำเร็จ
      Swal.fire({
          icon: 'success',
          title: 'User updated!',
          showConfirmButton: false,
          timer: 1500
      });
  })
  .catch(error => {
      // แจ้งเตือนหากเกิดข้อผิดพลาด
      Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Something went wrong while updating the user.'
      });
  });
}

// ฟังก์ชันลบผู้ใช้
function deleteUser(userId) {
  console.log("🆔 Trying to delete user:", userId); // ✅ ตรวจสอบค่า userId
  const token = localStorage.getItem('token');
  if (!token) {
      Swal.fire('Please log in first', '', 'warning');
      return;
  }

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
          fetch(`http://localhost:5000/api/users/delete/${userId}`, {  // ✅ ตรงกับ Backend
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(response => {
              if (!response.ok) throw new Error('Failed to delete user');
              return response.json();
          })
          .then(() => {
              Swal.fire('Deleted!', 'User has been deleted.', 'success');
              fetchUsers(); // โหลดข้อมูลใหม่
          })
          .catch(error => {
              console.error('Error deleting user:', error);
              Swal.fire('Error deleting user!', '', 'error');
          });
      }
  });
}


document.addEventListener("DOMContentLoaded", fetchUsers);

