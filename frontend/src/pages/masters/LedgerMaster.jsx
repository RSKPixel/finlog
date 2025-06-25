import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../../templates/AuthContext";

const LedgerMaster = () => {
  const newData = {
    instrument_name: "",
    instrument_id: "",
    instrument_group: "",
    folio_no: "",
    folio_name: "",
  };
  const { api, token } = useContext(AuthContext);
  const [formData, setFormData] = useState(newData);
  const [formMessage, setFormMessage] = useState([]);
  const validation = () => {
    const error = [];

    if (!formData.instrument_name.trim()) {
      error.push("Fields Marked * are mandatory");
    }
    if (!formData.instrument_id.trim()) {
      error.push("Fields Marked * are mandatory");
    }
    if (!formData.instrument_group.trim()) {
      error.push("Fields Marked * are mandatory");
    }
    if (!formData.folio_no.trim()) {
      error.push("Fields Marked * are mandatory");
    }
    if (!formData.folio_name.trim()) {
      error.push("Fields Marked * are mandatory");
    }

    return [...new Set(error)];
  };

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
  };

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex flex-col w-2/4 items-center shadow-xl">
        <div className="w-full px-2 text-sm font-bold z-10 border border-sky-900 py-1 rounded-t-sm bg-sky-950">
          Ledger Master
        </div>

        <form
          autoComplete="off"
          className="grid grid-cols-2 gap-2 border bg-stone-900 rounded-b-sm w-full p-3 border-sky-900"
        >
          <div className="flex flex-col gap-2">
            <label>Instrument Name *</label>
            <input
              type="text"
              className="capitalize"
              name="instrument_name"
              value={formData.instrument_name}
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label>Instrument ID *</label>
            <input type="text" name="instrument_id" value={formData.instrument_id} onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-2 col-span-2">
            <label>Instrument Group *</label>
            <select value={formData.instrument_group} onChange={handleChange} name="instrument_group">
              <option value="">Select Ledger Group</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="assets">Assets</option>
              <option value="liabilities">Liabilities</option>
              <option value="mutualfunds">Mutual Funds</option>
              <option value="stocks">Stocks</option>
              <option value="loans">Loans</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label>Folio Number *</label>
            <input type="text" name="folio_no" value={formData.folio_no} onChange={handleChange} />
          </div>
          <div className="flex flex-col gap-2">
            <label>Folio Name *</label>
            <input type="text" name="folio_name" value={formData.folio_name} onChange={handleChange} />
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
            <span className="ms-auto"></span>
            <button type="button" className="button-icon green" onClick={handleSubmit}>
              <i className="bi bi-save"></i>
            </button>
            <button type="button" className="button-icon yellow">
              <i className="bi bi-search"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LedgerMaster;
