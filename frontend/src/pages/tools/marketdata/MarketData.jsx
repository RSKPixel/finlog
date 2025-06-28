import React, { useContext, useEffect, useState } from "react";
import DisplayFormMessage from "../../../components/DisplayFormMessage";
import Loader from "../../../components/Loader";
import AuthContext from "../../../templates/AuthContext";

const MarketData = () => {
  const { api, token, client } = useContext(AuthContext);

  const [formMessage, setFormMessage] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const handleAmfiEodDownload = () => {
    setLoading(true);
    setLoadingMessage("Downloading AMFI EOD Data...");

    fetch(`${api}/marketdata/amfi/eod/download/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setLoading(false);
        setLoadingMessage("");
        setFormMessage([data.message]);
      })
      .catch((error) => {
        setLoading(false);
        setLoadingMessage("");
        setFormMessage(["Error downloading AMFI EOD Data. Please try again later."]);
      });
  };

  const handleAmfiHistoricalDownload = () => {
    setLoading(true);
    setLoadingMessage("Downloading AMFI Historical Data...");
    fetch(`${api}/marketdata/amfi/historical/download/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setLoading(false);
        setLoadingMessage("");
        setFormMessage([data.message]);
      })
      .catch((error) => {
        setLoading(false);
        setLoadingMessage("");
        setFormMessage(["Error downloading AMFI Historical Data. Please try again later."]);
      });
  };

  return (
    <div className="flex flex-col gap-4 w-full items-center">
      {loading && <Loader message={loadingMessage} />}

      <div className="flex flex-col w-full items-center">
        <div className="w-full px-2 text-sm font-bold z-10 border border-sky-900 py-1 rounded-t-sm bg-sky-950 flex flex-row items-center">
          <span>MARKET DATA GRABBER</span>
        </div>

        <div className="grid grid-cols-4 gap-2 w-full text-xl bg-stone-900 py-4 px-4 items-center justify-center rounded-b-sm shadow-lg border border-sky-900">
          <div className="col-span-4 flex justify-center items-center gap-4">
            <button className="button-basic green text-sm text-gray-400" onClick={handleAmfiEodDownload}>
              Download AMFI EOD
            </button>
            <button className="button-basic green text-sm text-gray-400" onClick={handleAmfiHistoricalDownload}>
              Download AMFI Historical
            </button>
            <button className="button-basic green text-sm text-gray-400">Download AMFI EOD</button>
            <button className="button-basic green text-sm text-gray-400">Download AMFI EOD</button>
          </div>
          {formMessage && (
            <div className="w-full mt-4 col-span-4">
              <DisplayFormMessage formMessage={formMessage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketData;
