import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../templates/AuthContext";
import { Link, Outlet } from "react-router-dom";

const Authenticator = () => {
  const { api, loggedIn, setLoggedIn, setToken, token, setClient } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    pan: "",
    password: "",
  });
  const [formMessage, setFormMessage] = useState([]);
  const [registration, setRegistration] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Validating your credentials...");

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleLogin = () => {
    setFormMessage([]);
    const { pan, password } = formData;
    if (!pan || !password) {
      setFormMessage(["Please fill in all fields"]);
      return;
    }

    fetch(`${api}/user/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pan: pan.toUpperCase(),
        password: password,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status == "success") {
          const jwt = data.data.token;
          localStorage.setItem("finlog_token", jwt);
          setToken(jwt);
          setClient(data.data.client);
          setLoggedIn(true);
        } else {
          setLoading(false);
          setFormMessage([data.message || "Login failed. Please check your credentials."]);
        }
      });
  };

  useEffect(() => {
    setLoading(true);

    if (!token) {
      setLoggedIn(false);
      setLoading(false);
      return;
    }

    fetch(`${api}/user/validate/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setLoggedIn(data.status === "success");

        if (data.status !== "success") {
          localStorage.removeItem("finlog_token");
          setLoadingMessage(data.message || "Session expired. Please login again.");
          setTimeout(() => {
            setLoading(false);
          }, 2000);
        } else {
          setLoadingMessage("Validating your credentials...");
          setClient(data.data.client);
          setToken(token);
          setLoading(false);
        }
      });
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
        <div className="flex flex-col bg-neutral-900 justify-center items-center border border-white/10 rounded-lg shadow-xl w-[400px] relative h-[100px]">
          {loadingMessage}
        </div>
      </div>
    );
  }

  if (registration) {
    return <Registration setRegistration={setRegistration} />;
  }

  if (loggedIn) {
    return <Outlet />;
  } else {
    return (
      <div className="flex flex-col items-center w-full justify-center h-fit mt-4">
        <h1 className="text-xl font-bold pb-2 text-white/80">Welcome to FinLog your Personal Book Keeper</h1>
        <h2 className="text-sm text-white/50">

        </h2>
        <div className="flex flex-col w-[450px] items-center shadow-xl mt-4">
          <div className="w-full px-2 text-sm text-white/50 font-bold z-10 border border-sky-900 py-1 rounded-t-sm bg-sky-950"><i className="bi bi-lock-fill"></i> Please login to access your book</div>
          <form
            autoComplete="off"
            className="flex flex-col gap-2 w-full border border-sky-900 rounded-b-sm text-sm p-4 shadow-lg bg-neutral-900"
          >
            <label>Client PAN</label>
            <input type="text" className="uppercase" name="pan" value={formData.pan} onChange={handleFormChange} />
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleFormChange} />
            {formMessage &&
              formMessage.map((message, index) => (
                <div key={index} className="text-red-600 text-center">
                  {message}
                </div>
              ))}
            <div className="flex flex-row gap-4 mt-4">
              <button type="button" className="button-basic blue" onClick={handleLogin}>
                Log In
              </button>
              <div className="ms-auto"></div>
              <button type="button" className="button-basic yellow" onClick={() => setRegistration(true)}>
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
};

const Registration = ({ setRegistration }) => {
  const { api } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    pan: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [formMessage, setFormMessage] = useState([]);

  const validation = () => {
    const error = [];

    if (!formData.pan.trim()) {
      error.push("Fields marked * are mandatory");
    }
    if (!formData.name.trim()) {
      error.push("Fields marked * are mandatory");
    }
    if (!formData.email.trim()) {
      error.push("Fields marked * are mandatory");
    }
    if (!formData.password.trim()) {
      error.push("Fields marked * are mandatory");
    }
    if (!formData.confirmPassword.trim()) {
      error.push("Fields marked * are mandatory");
    }
    if (formData.password !== formData.confirmPassword) {
      error.push("Passwords do not match");
    }

    return [...new Set(error)];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    const errors = validation();
    if (errors.length > 0) {
      setFormMessage(errors);
      return;
    }

    setFormMessage([]);
    const data = {
      pan: formData.pan.toUpperCase(),
      name: formData.name.toUpperCase(),
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    };

    fetch(`${api}/user/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        setFormMessage(["Registration successful!", "You can now login with your credentials."]);
        setTimeout(() => {
          setRegistration(false);
        }, 5000);
      });
  };

  return (
    <div className="flex flex-col items-center w-full justify-center h-fit mt-4">
      <div className="flex flex-col w-[700px] items-center shadow-xl">
        <div className="w-full px-2 text-sm font-bold z-10 border border-sky-900 py-1 rounded-t-sm bg-sky-950">New Registration</div>

        <form
          autoComplete="off"
          className="grid grid-cols-2 gap-4 w-full border border-sky-900 rounded-b-sm text-sm p-4 shadow-lg bg-neutral-900"
        >
          <div className="flex flex-col gap-2">
            <label>Client PAN *</label>
            <input type="text" className="uppercase" name="pan" value={formData.pan} onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-2">
            <label>Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-2">
            <label>Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-2" value={formData.phone}>
            <label>Phone</label>
            <input type="tel" name="phone" onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-2" value={formData.password}>
            <label>Password *</label>
            <input type="password" name="password" onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-2">
            <label>Confirm Password *</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
          </div>
          <div className="col-span-2 flex flex-col gap-0 text-sm text-white/50">
            {formMessage &&
              formMessage.map((message, index) => (
                <div key={index} className="text-red-600 text-xs text-center">
                  {message}
                </div>
              ))}
          </div>
          <div className="col-span-2 flex flex-row gap-4">
            <button type="button" className="button-basic blue" onClick={() => setRegistration(false)}>
              Login
            </button>
            <span className="ms-auto"></span>
            <button type="button" className="button-basic green" onClick={handleSubmit}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Authenticator;
