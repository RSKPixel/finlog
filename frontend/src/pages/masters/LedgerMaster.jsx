import React, { useContext, useEffect, useRef, useState } from "react";
import AuthContext from "../../templates/AuthContext";

const LedgerMaster = () => {
    const { api, token, client } = useContext(AuthContext);
    const newData = {
        action: "new",
        client_pan: client.pan,
        ledger_name: "",
        ledger_ref_no: "",
        ledger_group: "",
        folio_no: "",
        folio_name: "",
    };
    const [formData, setFormData] = useState(newData);
    const [formMessage, setFormMessage] = useState([]);
    const validation = () => {
        const error = [];
        if (!formData.ledger_name.trim()) error.push("Fields Marked * are mandatory");
        // if (!formData.ledger_ref_no.trim()) error.push("Fields Marked * are mandatory");
        if (!formData.ledger_group.trim()) error.push("Fields Marked * are mandatory");
        if (!formData.folio_no.trim()) error.push("Fields Marked * are mandatory");
        if (!formData.folio_name.trim()) error.push("Fields Marked * are mandatory");
        return [...new Set(error)];
    };
    const [showSearch, setShowSearch] = useState(false);
    const ledgerNameRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        const errors = validation();

        if (errors.length > 0) {
            setFormMessage(errors);
            setTimeout(() => {
                setFormMessage([]);
            }, 5000);
            return;
        }

        fetch(`${api}/masters/ledger/update/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
        })
            .then((response) => response.json())
            .then((data) => {
                setFormMessage([data.message]);
                setTimeout(() => {
                    setFormMessage([]);
                }, 5000);
            });
    };

    const handleDelete = (e) => {
        const deleteData = {
            action: "delete",
            ledger_name: formData.ledger_name,
        };

        fetch(`${api}/masters/ledger/update/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(deleteData),
        })
            .then((response) => response.json())
            .then((data) => {
                setFormMessage([data.message]);
                if (data.status === "success") {
                    setFormData(newData);
                }
                setTimeout(() => {
                    setFormMessage([]);
                }, 5000);
            });
    };

    return (
        <div className="flex flex-col w-full items-center">
            <div className="flex flex-col w-[700px] items-center shadow-xl">
                <div className="w-full px-2 text-sm font-bold z-10 border border-sky-900 py-1 rounded-t-sm bg-sky-950">Ledger Master</div>

                <form autoComplete="off" className="grid grid-cols-2 gap-2 border bg-stone-900 rounded-b-sm w-full p-3 border-sky-900">
                    <div className="flex flex-col gap-2">
                        <label>Ledger Name *</label>
                        <input ref={ledgerNameRef} type="text" className="uppercase" name="ledger_name" value={formData.ledger_name} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>A/c No, Policy no, etc..</label>
                        <input type="text" name="ledger_ref_no" value={formData.ledger_ref_no} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-2 col-span-2">
                        <label>Ledger Group *</label>
                        <select value={formData.ledger_group} onChange={handleChange} name="ledger_group">
                            <option value="">Select Ledger Group</option>
                            <option value="Bank">Bank</option>
                            <option value="Cash">Cash</option>
                            <option value="Drawings">Drawings</option>
                            <option value="Income">Income</option>
                            <option value="Expense">Expense</option>
                            <option value="Assets">Assets</option>
                            <option value="Liabilities">Liabilities</option>
                            <option value="Investments">Investments</option>
                            <option value="Loans">Loans</option>
                            <option value="Fund Transfer">Fund Transfer</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Folio Number *</label>
                        <input type="text" className=" uppercase" name="folio_no" value={formData.folio_no} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Folio Name *</label>
                        <input type="text" className="uppercase" name="folio_name" value={formData.folio_name} onChange={handleChange} />
                    </div>

                    <div className="flex flex-col gap-2 col-span-2 text-center mt-1">
                        {formMessage && formMessage.length > 0 ? (
                            formMessage.map((message, index) => (
                                <div key={index} className="text-red-300 text-xs italic text-center">
                                    {message}
                                </div>
                            ))
                        ) : (
                            <div className="text-xs italic invisible">placeholder</div>
                        )}
                    </div>
                    <div className="flex flex-row gap-2 col-span-2">
                        <button type="button" className="button-icon red" onClick={handleDelete}>
                            <i className="bi bi-x-circle"></i>
                        </button>
                        <span className="ms-auto"></span>
                        <button type="button" className="button-icon green" onClick={handleSubmit}>
                            <i className="bi bi-save"></i>
                        </button>
                        <button type="button" className="button-icon blue" onClick={() => {
                            setFormData(newData);
                            LedgerNameRef.current.focus()
                        }}><i className="bi bi-plus-square"></i></button>
                        <button type="button" className="button-icon yellow" onClick={() => setShowSearch(true)}>
                            <i className="bi bi-search"></i>
                        </button>
                    </div>
                </form>
            </div>

            {/* modal */}
            <LedgerSearch setFormData={setFormData} showSearch={showSearch} setShowSearch={setShowSearch} />
        </div>
    );
};

const LedgerSearch = ({ setFormData, setShowSearch, showSearch }) => {
    const { api, token, client } = useContext(AuthContext);
    const [searchResults, setSearchResults] = useState([]);
    // const [selected, setSelected] = useState(show);

    useEffect(() => {
        fetch(`${api}/masters/ledger/search/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ client_pan: client.pan }),
        })
            .then((response) => response.json())
            .then((data) => {
                setSearchResults(data.data || []);
            });
    }, []);

    if (!showSearch) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
            <div
                className={`flex flex-col bg-neutral-900 border border-white/10 rounded-sm shadow-xl max-h-2/3 relative w-2/3 h-fit overflow-auto`}
            >
                <div className="absolut w-full flex flex-row p-1 items-center font-bold text-sm bg-amber-700">
                    <span>Search Result</span>
                    <span className="ms-auto"></span>
                    <button type="button" className="button-icon red" onClick={() => setShowSearch(false)}>X</button>
                </div>
                <div className="grid grid-cols-3 border w-full border-sky-900 p-1  bg-sky-950">
                    <span>Ledger Name</span>
                    <span>A/c No, Policy no, etc..</span>
                    <span>Ledger Group</span>
                </div>
                <div className="border bg-stone-900 p-1 w-full border-sky-900">
                    {searchResults.map((result) => (
                        <div key={result.ledger_ref_no} className="hover:bg-sky-800 cursor-pointer p-1 grid grid-cols-3"
                            onClick={() => {
                                setFormData(result);
                                setShowSearch(false);
                            }}>
                            <span>{result.ledger_name}</span>
                            <span>{result.ledger_ref_no}</span>
                            <span>{result.ledger_group}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
};

export default LedgerMaster;
