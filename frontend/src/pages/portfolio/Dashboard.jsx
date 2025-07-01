import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../../templates/AuthContext";
import numeral from "numeral";
import Loader from "../../components/Loader";
import ProgressChart from "./ProgressChart";

const Dashboard = () => {
  const { api, token, client } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [summary, setSummary] = useState({
    total_investment: 0,
    total_current_value: 0,
    pl: 0,
    plp: 0,
    xirr: 0,
  });
  const [progressData, setProgressData] = useState([]);


  useEffect(() => {
    setLoading(true);
    setLoadingMessage("Fetching portfolio summary...");

    fetch(`${api}/portfolio/summary/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ client_pan: client.pan }),
    })
      .then((response) => response.json())
      .then((data) => {
        setProgressData(data.data.progress);
        setSummary(
          data.data.summary || {
            total_investment: 0,
            total_current_value: 0,
            pl: 0,
            plp: 0,
            xirr: 0,
            benchmark: 0,
          }
        );
        setLoading(false);
        setLoadingMessage("");
      });
  }, []);

  return (
    <div className="flex flex-col  items-center justify-center w-full">
      {loading && <Loader message={loadingMessage} />}

      <div className="w-full px-2 text-sm font-bold z-10 border border-sky-900 py-1 rounded-t-sm bg-sky-950">Portfolio Overview</div>

      {summary && (
        <div className="grid grid-cols-4 gap-2 text-xl bg-stone-900 p-4 rounded-b-lg shadow-lg border border-sky-900 w-full">
          <div className="text-gray-500 text-center">Total Investment</div>
          <div className="text-gray-500 text-center">Current Value</div>
          <div className="text-gray-500 text-center">Gain</div>
          <div className="text-gray-500 text-center">XIRR</div>

          <div className="text-center">{numeral(summary.total_investment).format("0,0.00")}</div>
          <div className="text-center">{numeral(summary.total_current_value).format("0,0.00")}</div>

          <div className={`text-center ${summary.pl >= 0 ? "text-green-500" : "text-red-500"}`}>
            {numeral(summary.pl).format("0,0.00")} ({numeral(summary.plp).format("0.00")}%)
          </div>

          <div className={`text-center ${summary.xirr >= 0 ? "text-green-500" : "text-red-500"}`}>{numeral(summary.xirr).format("0.00")}%</div>
        </div>
      )}

      {progressData.length > 0 && (
        <ProgressChart
          data={progressData}
          setLoading={setLoading}
          setLoadingMessage={setLoadingMessage}
        />
      )}

    </div>
  );
};

export default Dashboard;
