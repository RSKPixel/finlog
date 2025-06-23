import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from './pages/Dashboard';
import Basetemplate from './templates/Basetemplate';
import './index.css'
import AuthContext from './templates/AuthContext';
import Authenticator from './components/Authenticator';

function App() {

  const [loggedIn, setLoggedIn] = useState(false);
  const api = "http://127.0.0.1:8000"
  const provider = {
    loggedIn,
    setLoggedIn,
    api
  }

  return (
    <Router>

      <AuthContext.Provider value={provider}>
        <Basetemplate>
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
