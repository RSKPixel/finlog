import React, { useContext, useEffect, useRef, useState } from 'react'
import AuthContext from '../../../templates/AuthContext';
import Loader from '../../../components/Loader';
import DisplayFormMessage from '../../../components/DisplayFormMessage';

const StocksUpload = () => {
    const { api, token, client } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [formMessage, setFormMessage] = useState("");
    const uploadRef = useRef(null);
    const [tradingAccounts, setTradingAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState("");


    useEffect(() => {

        setLoading(true);
        setLoadingMessage("Fetching Trading Accounts...");
        fetch(`${api}/masters/ledger/fetch-groupwise/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ client_pan: client.pan, ledger_group: "Trading Account" }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                setTradingAccounts(data.data || []);
                setLoading(false);
            })
    }, []);

    const handleUpload = (e) => {

        if (!selectedAccount) {
            setFormMessage("Please select a trading account before uploading.");
            return;
        }
        const file = uploadRef.current.files[0];
        if (!file) {
            setFormMessage("Please select a file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("client_pan", client.pan);
        formData.append("ledger_ref_no", selectedAccount);


        setLoading(true);
        setLoadingMessage("Uploading File...");
        setFormMessage("");
        fetch(`${api}/portfolio/stocks/upload/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        })
            .then((response) => response.json())
            .then((data) => {
                setLoading(false);
                if (data.status === "success") {
                    setFormMessage("File uploaded successfully!");
                } else {
                    setFormMessage(data.message || "Failed to upload file.");
                }
            })
    }


    return (
        <div className="flex flex-col w-full items-center shadow-xl">
            {loading && <Loader message={loadingMessage} />}
            <div className="w-full  px-2 text-sm font-bold z-10 border border-sky-900 py-1 rounded-t-sm bg-sky-950">Stocks Trade Book Upload</div>
            <form autoComplete="off" className="flex flex-col items-center border bg-stone-900 rounded-b-sm w-full p-3 border-sky-900">
                <div className="flex items-center gap-2 w-full">
                    <select onChange={(e) => setSelectedAccount(e.target.value)} value={selectedAccount} className="select w-full bg-stone-800 text-white border border-sky-900">
                        <option value="">Select Trading Account</option>
                        {tradingAccounts.map((account, index) => (
                            <option key={index} value={account.ledger_ref_no}>
                                {account.ledger_name} ({account.ledger_ref_no})
                            </option>
                        ))}
                    </select>
                    <input ref={uploadRef} type="file" accept=".css .pdf" className="hidden" onChange={handleUpload} />
                    <span className="ms-auto"></span>
                    <button type="button" className="button-icon green" onClick={() => uploadRef.current.click()}>
                        <i className="bi bi-upload"></i>
                    </button>
                </div>
                {formMessage && (
                    <div className="w-full mt-4">
                        <DisplayFormMessage formMessage={[formMessage]} />
                    </div>
                )}
            </form>
        </div>

    )
}

export default StocksUpload