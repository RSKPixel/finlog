import React, { useContext, useEffect, useState } from "react";
import MutualFundsUpload from "./MutualFundsUpload";
import AuthContext from "../../../templates/AuthContext";
import Loader from "../../../components/Loader";
import numeral from "numeral";
const MutualFunds = () => {
  const { api, token, client } = useContext(AuthContext);
  const [assetClass, setAssetClass] = useState("All");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [holdings, setHoldings] = useState([]);
  const summary_blank = {
    total_investment: 0,
    total_current_value: 0,
    pl: 0,
    plp: 0,
    xirr: 0,
  };
  const [summary, setSummary] = useState(summary_blank);
  const [assetClasses, setAssetClasses] = useState([]);

  useEffect(() => {
    setLoading(true);
    setHoldings([]);
    setSummary(summary_blank);
    setLoadingMessage("Fetching Mutual Funds Holdings...");
    fetch(`${api}/portfolio/mutualfund/holdings/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ client_pan: client.pan, asset_class: assetClass }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);

        setHoldings(data.data.summary_data.holdings || []);
        setSummary(data.data.summary_data.summary);
        setAssetClasses(data.data.asset_classes);
        setLoading(false);
      });
  }, [assetClass]);

  return (
    <div className="flex flex-col gap-4 w-full items-center">
      <div className="flex flex-col w-full items-center">
        <div className="w-full px-2 text-sm font-bold z-10 border border-sky-900 py-1 rounded-t-sm bg-sky-950 flex flex-row items-center">
          <span>MUTUAL FUNDS HOLDINGS</span>
          <span className="ms-auto"></span>
          {assetClasses && (
            <span className="flex flex-row gap-2 text-xs ms-2 text-gray-400">
              <span className={`${assetClass == "All" && "font-bold text-white"} hover:underline underline-offset-4 cursor-pointer`} onClick={() => setAssetClass("All")}>
                All
              </span>
              {assetClasses.map((ac, index) => (
                <span key={index} className={`${assetClass == ac && "font-bold text-white"} hover:underline underline-offset-4 cursor-pointer`} onClick={() => setAssetClass(ac)}>
                  {ac}
                </span>
              ))}
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 mb-0 text-xl w-full bg-stone-900 p-4  border border-b-1 border-sky-900">
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

        <div className="grid grid-cols-2 gap-2 items-center border border-t-0 bg-stone-900 rounded-b-sm w-full p-4 border-sky-900">
          {loading && (
            <div className="col-span-2 w-full flex items-center justify-center ">
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {holdings.length > 0 &&
            holdings.map((holding, index) => {
              return (
                <div key={index} className="flex flex-col gap-2 border bg-neutral-800 border-neutral-950 rounded-lg py-2 px-4 mt-2 shadow-lg hover:bg-neutral-700 cursor-pointer">
                  <div className="flex flex-row text-sm">
                    <span className="font-bold text-nowrap overflow-hidden text-ellipsis">{holding.instrument_name}</span>
                    <span className="ms-auto"></span>
                    <span className="text-xs">{holding.asset_class}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 ">
                    <div className="text-sm text-gray-500 text-center">Market Value</div>
                    <div className="text-sm text-gray-500 text-center">Total Return</div>
                    <div className="text-sm text-gray-500 text-center">XIRR</div>

                    <div className="text-center text-sm">{numeral(holding.current_value).format("0,0.00")}</div>
                    <div className={`text-center text-sm ${holding.pl >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {numeral(holding.pl).format("0,0.00")} ({numeral(holding.plp).format("0.00")}%)
                    </div>
                    <div className={`text-center text-sm ${holding.xirr >= 0 ? "text-green-500" : "text-red-500"}`}>{numeral(holding.xirr).format("0.00")}%</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      <MutualFundsUpload />
    </div>
  );
};

export default MutualFunds;
