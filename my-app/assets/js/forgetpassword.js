const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleResetPassword = async () => {
    if (!email || !password || !newPassword) {
      Swal.fire("Error", "Please fill all fields", "error");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/user/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        Swal.fire("Success", data.message, "success");
      } else {
        Swal.fire("Error", data.error || "Something went wrong", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Failed to connect to server", "error");
    }
  };

  return (
    <div className="container-fluid" style={{ background: "#b3c799" }}>
      <div className="row">
        <div className="col-md-7 col-xl-6 left-column">
          <img src="/assets/img/log%20sky.png" alt="Logo" style={{ width: "100px", margin: "20px" }} />
        </div>
        <div className="col-md-5 d-flex justify-content-center align-items-center p-4">
          <div className="card" style={{ width: "485px", padding: "20px", background: "#EBE3CE", height: "540px" }}>
            <div className="card-body">
              <h4 className="card-title" style={{ fontWeight: "bold", fontSize: "55px" }}>Forgot Password?</h4>
              <input
                className="form-control mb-2"
                type="email"
                placeholder="Gmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="form-control mb-2"
                type="password"
                placeholder="Current Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                className="form-control mb-2"
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button className="btn btn-warning w-100 py-2" onClick={handleResetPassword}>
                Reset Password
              </button>
              <a href="/index.html" className="d-flex align-items-center me-2 ms-2" style={{ color: "#000", fontWeight: "bold", fontSize: "25px" }}>
                <i className="icon ion-android-arrow-back d-flex align-items-center me-2"></i>Back to login
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
