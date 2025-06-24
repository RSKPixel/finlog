import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from './pages/Dashboard';
import Basetemplate from './templates/Basetemplate';
import './index.css'
import AuthContext from './templates/AuthContext';
import Authenticator from './components/Authenticator';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Register from './pages/Register';

function App() {

  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("finlog_token") || null);
  const [client, setClient] = useState({
    pan: '',
    name: '',
    email: '',
    phone: '',
  });
  const api = "http://127.0.0.1:8000"
  const provider = {
    api,
    loggedIn, setLoggedIn,
    token, setToken,
    client, setClient,
  }

  return (
    <Router>

      <AuthContext.Provider value={provider}>
        <Basetemplate >
          <Routes>
            <Route element={<Authenticator />} >
              <Route path='/' element={<Dashboard />} />
            </Route>
          </Routes>
        </Basetemplate>
      </AuthContext.Provider>
    </Router >
  )
}

export default App
