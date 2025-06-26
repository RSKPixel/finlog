import React, { useContext, useEffect, useRef, useState } from "react";
import AuthContext from "../../../templates/AuthContext";
import numeral from "numeral";

const Banking = () => {
    const { api, token, client } = useContext(AuthContext);

    const [ledgerAccounts, setLedgerAccounts] = useState([]);
    const [selectedFile, setSelectedFile] = useState("");
    const uploadRef = useRef(null);
    const ledgerRef = useRef(null);
    const [formMessage, setFormMessage] = useState([]);
    const [uploadedData, setUploadedData] = useState([]);
    const [uploadDataReconfirmation, setUploadDataReconfirmation] = useState(false);

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

    useEffect(() => {
        if (uploadDataReconfirmation && uploadedData) {

            fetch(`${api}/transactions/banking/upload-reconfirm/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    transactions: uploadedData,
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    setFormMessage([data.message]);
                    setTimeout(() => {
                        setFormMessage([]);
                        setUploadDataReconfirmation(false);
                        setUploadedData([]);
                    }, 5000);
                });
        }
    }, [uploadDataReconfirmation]);

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
                if (data.status === "error") {
                    setFormMessage([data.message]);
                } else {
                    setFormMessage(["Waiting for Re-Confirmation"]);
                }
                setUploadedData(data.data || []);
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
                    <DisplayUploadedData uploadedData={uploadedData} setUploadedData={setUploadedData} setUploadDataReconfirmation={setUploadDataReconfirmation} />
                </form>
            </div>
        </div>
    );
};

const DisplayUploadedData = ({ uploadedData, setUploadedData, setUploadDataReconfirmation }) => {

    console.log("Uploaded Data:", uploadedData);

    if (uploadedData.length === 0) {
        return null
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
            <div className="flex flex-col bg-neutral-900 border border-white/10 rounded-sm shadow-xl w-2/3 max-h-[80vh]">
                {/* Header */}
                <div className="flex flex-row p-1 items-center font-bold text-sm rounded-t-sm bg-amber-700 z-10">
                    <span>Search Result</span>
                    <span className="ms-auto" />
                    <button type="button" className="button-icon red" onClick={() => setUploadedData([])}>X</button>
                </div>

                {/* Column Headers */}
                <div className="pe-8 grid grid-cols-[0.5fr_2fr_1fr_1fr] border border-sky-900 p-1 bg-sky-950">
                    <span>Date</span>
                    <span>Description</span>
                    <span className="text-end">Debit</span>
                    <span className="text-end">Credit</span>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto border bg-stone-900 border-sky-900">
                    {uploadedData.map((data, index) => (
                        <div key={index} className="hover:bg-sky-800 text-sm cursor-pointer p-1 pe-8 grid grid-cols-[0.5fr_2fr_1fr_1fr] border-b-0">
                            <span>{data.transaction_date}</span>
                            <span className="truncate">{data.description}</span>
                            <span className="text-end">{data.debit > 0 ? numeral(data.debit).format("0,0.00") : "-"}</span>
                            <span className="text-end">{data.credit > 0 ? numeral(data.credit).format("0,0.00") : "-"}</span>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex flex-row justify-end p-2">
                    <button type="button" className="button-icon green" onClick={() => setUploadDataReconfirmation(true)}>
                        <i className="bi bi-upload"></i>
                    </button>
                </div>
            </div>
        </div>
    )
}

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
