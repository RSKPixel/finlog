import React, { useContext, useEffect, useState } from "react";
import StocksUpload from "./StocksUpload";
import AuthContext from "../../../templates/AuthContext";
import numeral from "numeral";
import Loader from "../../../components/Loader";
import DisplayFormMessage from "../../../components/DisplayFormMessage";

const Stocks = () => {
  const { api, token, client } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const blankSummaryData = {
    total_investment: 0,
    total_current_value: 0,
    benchmark: 0,
    pl: 0,
    plp: 0,
    xirr: 0,
  };
  const [summary, setSummary] = useState(blankSummaryData);
  const [holdings, setHoldings] = useState([]);
  const [folios, setFolios] = useState([]);
  const [selectedFolio, setSelectedFolio] = useState("All");

  useEffect(() => {
    setLoading(true);
    setHoldings([]);
    setSummary(blankSummaryData);
    setLoadingMessage("Fetching Stocks Holdings...");
    fetch(`${api}/portfolio/stocks/holdings/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ client_pan: client.pan, folio_id: selectedFolio }),
    })
      .then((response) => response.json())
      .then((data) => {
        data = data.data;
        console.log(data);
        setSummary(data.summary_data.summary || blankSummaryData);
        setHoldings(data.summary_data.holdings || []);
        setFolios(data.folios || []);
        setLoading(false);
      });
  }, [selectedFolio]);

  return (
    <div className="flex flex-col gap-4 w-full items-center">
      <div className="flex flex-col w-full items-center">
        <div className="w-full px-2 text-sm font-bold z-10 border border-sky-900 py-1 rounded-t-sm bg-sky-950 flex flex-row items-center">
          <span>Stock Holdings</span>
          <span className="ms-auto"></span>
          {folios && (
            <span className="flex flex-row gap-2 text-xs ms-2 text-gray-400">
              {folios.map((folio, index) => (
                <span key={index} className="hover:underline underline-offset-4 cursor-pointer" onClick={() => setSelectedFolio(folio)}>
                  {folio}
                </span>
              ))}
            </span>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2 w-full text-xl bg-stone-900 p-4  shadow-lg border border-sky-900">
          <div className="text-gray-500 text-center">Total Investment</div>
          <div className="text-gray-500 text-center">Current Value</div>
          <div className="text-gray-500 text-center">Benchmark</div>
          <div className="text-gray-500 text-center">Return</div>
          <div className="text-gray-500 text-center">XIRR</div>

          <div className="text-center">{numeral(summary.total_investment).format("0,0.00")}</div>
          <div className="text-center">{numeral(summary.total_current_value).format("0,0.00")}</div>
          <div className={`text-center text-blue-500 font-bold`}>{numeral(summary.benchmark).format("0,0.00")}</div>

          <div className={`text-center ${summary.pl >= 0 ? "text-green-500" : "text-red-500"}`}>
            {numeral(summary.pl).format("0,0.00")} ({numeral(summary.plp).format("0.00")}%)
          </div>

          <div className={`text-center ${summary.xirr >= 0 ? "text-green-500" : "text-red-500"}`}>{numeral(summary.xirr).format("0.00")}%</div>
        </div>
        <div className="grid grid-cols-3 gap-2 items-center border border-t-0 bg-stone-900 rounded-b-sm w-full p-3 border-sky-900">
          {loading && (
            <div className="col-span-3 w-full flex items-center justify-center ">
              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          {holdings.length > 0 &&
            holdings.map((holding, index) => {
              return (
                <div
                  key={index}
                  className="flex flex-col gap-2 border bg-neutral-800 border-neutral-950  rounded-lg py-2 px-4 mt-2 shadow-lg hover:bg-neutral-700 cursor-pointer"
                  onClick={() => {
                    setSelectedInstrument(holding.instrument_name);
                  }}
                >
                  <div className="flex flex-row text-sm font-semibold text-nowrap overflow-hidden text-ellipsis">
                    <span>{holding.instrument_name}</span>
                    <span className="ms-auto"></span>
                    <span className="text-xs">{holding.folio_id}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 ">
                    <div className="text-sm text-gray-500 text-center">Market Value</div>
                    <div className="text-sm text-gray-500 text-center">Total Return</div>
                    <div className="text-sm text-gray-500 text-center">XIRR</div>

                    <div className="text-center text-sm">{numeral(holding.current_value / 1000).format("0,0.00")}k</div>
                    <div className={`text-center text-sm ${holding.pl >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {numeral(holding.pl / 1000).format("0,0.00")}k ({numeral(holding.plp).format("0.00")}%)
                    </div>
                    <div className={`text-center text-sm ${holding.xirr >= 0 ? "text-green-500" : "text-red-500"}`}>{numeral(holding.xirr).format("0.00")}%</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <StocksUpload />
    </div>
  );
};

export default Stocks;
