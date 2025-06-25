import React, { useContext, useEffect } from "react";
import AuthContext from "../templates/AuthContext";

const Logout = () => {
  const { setLoggedIn, setToken } = useContext(AuthContext);

  useEffect(() => {
    localStorage.removeItem("finlog_token");
    setToken(null);
    setLoggedIn(false);

    window.location.href = "/"; // Redirect to login page
  }, []);

  return <div>Logged Out</div>;
};

export default Logout;
