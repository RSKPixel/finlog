import React, { useContext, useEffect, useRef, useState } from "react";
import AuthContext from "../../../templates/AuthContext";

const Banking = () => {
  const { api, token, client } = useContext(AuthContext);

  const [ledgerAccounts, setLedgerAccounts] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const uploadRef = useRef(null);
  const ledgerRef = useRef(null);
  const [formMessage, setFormMessage] = useState([]);

  useEffect(() => {
    fetch(`${api}/masters/ledger/fetch-groupwise/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ client_pan: client.pan, ledger_group: "Bank" }),
    })
      .then((response) => response.json())
      .then((data) => {
        setLedgerAccounts(data.data || []);
      });
  }, []);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("ledger_name", ledgerRef.current.value);
    formData.append("client_pan", client.pan);

    fetch(`${api}/transactions/banking/upload-statement/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        setFormMessage(["File uploaded successfully."]);
      });
  };

  const handleUploadClick = () => {
    if (!ledgerRef.current.value) {
      setFormMessage(["Please select a ledger account."]);
      setTimeout(() => {
        setFormMessage([]);
      }, 5000);
      return;
    }
    if (uploadRef.current) {
      uploadRef.current.click();
    }
  };

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex flex-col w-[700px] items-center shadow-xl">
        <div className="w-full  px-2 text-sm font-bold z-10 border border-sky-900 py-1 rounded-t-sm bg-sky-950">Upload Statement</div>
        <form autoComplete="off" className="flex flex-col gap-2 border bg-stone-900 rounded-b-sm w-full p-3 border-sky-900">
          <div className=" flex flex-row gap-2">
            <select name="ledger" ref={ledgerRef}>
              <option value="">Select Ledger</option>
              {ledgerAccounts.map((account) => (
                <option key={account.ledger_name} value={account.ledger_name}>
                  {account.ledger_name}
                </option>
              ))}
            </select>
            <input ref={uploadRef} type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleUpload} />
            <span className="ms-auto"></span>
            <button type="button" className="button-icon green" onClick={handleUploadClick}>
              <i className="bi bi-upload"></i>
            </button>
          </div>
          <DisplayFormMessage formMessage={formMessage} />
        </form>
      </div>
    </div>
  );
};

const DisplayFormMessage = ({ formMessage = [] }) => {
  return (
    <div className="text-red-500 text-xs italic w-full text-center">
      {formMessage.map((msg, index) => (
        <p key={index}>{msg}</p>
      ))}
    </div>
  );
};

export default Banking;
