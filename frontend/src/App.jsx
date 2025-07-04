import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/portfolio/Dashboard";
import Basetemplate from "./templates/Basetemplate";
import AuthContext from "./templates/AuthContext";
import Authenticator from "./components/Authenticator";
import Logout from "./components/Logout";
import Banking from "./pages/transactions/banking/Banking";
import LedgerMaster from "./pages/masters/LedgerMaster";
import MutualFunds from "./pages/portfolio/mutualfunds/MutualFunds";
import Stocks from "./pages/portfolio/stocks/Stocks";
import MarketData from "./pages/tools/marketdata/MarketData";
import Insurance from "./pages/portfolio/insurance/Insurance";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("finlog_token") || null);
  const [client, setClient] = useState({
    pan: "",
    name: "",
    email: "",
    phone: "",
  });
  const api = import.meta.env.VITE_API;
  const provider = {
    api,
    loggedIn,
    setLoggedIn,
    token,
    setToken,
    client,
    setClient,
  };

  return (
    <Router>
      <AuthContext.Provider value={provider}>
        <Basetemplate>
          <Routes>
            <Route element={<Authenticator />}>
              <Route path="/" element={<Dashboard />} />

              <Route path="/masters">
                <Route path="ledger" element={<LedgerMaster />} />
              </Route>

              <Route path="/transactions">
                <Route path="banking" element={<Banking />} />
              </Route>

              <Route path="/portfolio">
                <Route path="mutualfunds" element={<MutualFunds />} />
                <Route path="stocks" element={<Stocks />} />
                <Route path="insurance" element={<Insurance />} />
              </Route>

              <Route path="/tools">
                <Route path="marketdata" element={<MarketData />} />
              </Route>
            </Route>
            <Route path="/logout" element={<Logout />} />
          </Routes>
        </Basetemplate>
      </AuthContext.Provider>
    </Router>
  );
}

export default App;
