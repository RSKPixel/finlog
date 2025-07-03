import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../../../templates/AuthContext";
import numeral from "numeral";
import PolicyForm from "./PolicyForm";
import PolicyTransactions from "./PolicyTransactions";
import moment from "moment";

const Insurance = () => {
  const { api, token, client } = useContext(AuthContext);
  const [showForm, setShowForm] = useState(false);
  const [addTransaction, setAddTransaction] = useState(false);
  const [insuranceData, setInsuranceData] = useState([]);
  const [modifyItem, setModifyItem] = useState({});

  useEffect(() => {
    fetch(`${api}/portfolio/insurance/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        client_pan: client.pan,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setInsuranceData(data.data);
      });
  }, []);

  const handleModify = (item) => {
    setShowForm(true);
    setModifyItem({
      ...item,
    });
  };

  const handleAddTransaction = (item) => {
    setAddTransaction(true);
    setModifyItem({ ...item });
  };
  return (
    <div className="flex flex-col gap-0 w-full items-center">
      <div className="flex flex-col w-full items-center">
        <div className="w-full px-2 text-sm font-bold z-10 border border-sky-900 py-1 rounded-t-sm bg-sky-950 flex flex-row items-center">
          <span>Mutual Fund Holdings</span>
          <span className="ms-auto"></span>
          <span
            className="cursor-pointer"
            onClick={() => {
              setModifyItem([]);
              setShowForm(true);
            }}
          >
            <i className="bi bi-plus-circle hover:text-yellow-400 font-bold"></i>
          </span>
        </div>
      </div>

      {/* <div className="grid grid-cols-[2fr_1fr_2fr_1fr_0.75fr_0.75fr_1fr_0.5fr] gap-2 w-full py-2 px-2 border-t bg-stone-900 border border-sky-900">
        <div className="font-bold text-sm">Policy Name</div>
        <div className="font-bold text-sm">Policy No</div>
        <div className="font-bold text-sm">Insurer</div>
        <div className="font-bold text-sm text-center">Policy Type</div>
        <div className="font-bold text-sm text-end">Premium</div>
        <div className="font-bold text-sm text-end">Sum Assured</div>
        <div className="font-bold text-sm text-center">Status</div>
        <div className="font-bold text-sm text-center">Action</div>
      </div> */}
      {insuranceData.map((item, index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_1fr_1fr] justify-center gap-1 w-full p-2 bg-stone-800  border-t-0 border border-sky-900 hover:bg-stone-700 cursor-default">
          {/* row 1 */}

          {/* Row 2 */}
          {/* 1 */}
          <div>
            <label>Policy Name</label>
            <div className="text-sm text-yellow-100 text-nowrap overflow-hidden text-ellipsis">{item.policy_name}</div>
          </div>
          <div>
            <label>Frequency</label>
            <div className="text-sm text-yellow-100">{item.frequency}</div>
          </div>
          <div>
            <label>Date of Maturity</label>
            <div className="text-sm text-yellow-100">{moment(item.date_of_maturity).format("DD-MMMM-YYYY")}</div>
          </div>
          <div>
            <label>Premium Amount</label>
            <div className="text-sm text-yellow-100">{numeral(item.premium_amount).format("0,0.00")}</div>
          </div>

          <div>
            <label>Insurer</label>
            <div className="text-sm text-yellow-100 text-nowrap overflow-hidden text-ellipsis">{item.insurer}</div>
          </div>
          <div>
            <label>Policy Status</label>
            <div className="text-sm text-yellow-100">{item.policy_status}</div>
          </div>
          <div>
            <label>Date of Commencement</label>
            <div className="text-sm text-yellow-100">{moment(item.date_of_commencement).format("DD-MMMM-YYYY")}</div>
          </div>
          <div>
            <label>Total Premium Paid</label>
            <div className="text-sm text-yellow-100">{numeral(item.total_premium_paid).format("0,0.00")}</div>
          </div>

          <div>
            <label>Policy No</label>
            <div className="text-sm text-yellow-100">{item.policy_no}</div>
          </div>
          <div>
            <label>Agent Name</label>
            <div className="text-sm text-yellow-100 text-nowrap overflow-hidden text-ellipsis">{item.agent_name}</div>
          </div>
          <div>
            <label>Sum Assured</label>
            <div className="text-sm text-yellow-100">{numeral(item.sum_assured).format("0,0.00")}</div>
          </div>
          <div>
            <label>Current Value</label>
            <div className="text-sm text-yellow-100">{numeral(item.current_value).format("0,0.00")}</div>
          </div>

          {/* <div className="flex flex-row gap-2 justify-center items-center">
            <span className="text-center" onClick={() => handleModify(item)}>
              <i className="bi bi-pencil-square  cursor-pointer hover:text-yellow-400"></i>
            </span>
            <span className="text-center">
              <i className="bi bi-plus-circle  cursor-pointer hover:text-yellow-400" onClick={() => handleAddTransaction(item)}></i>
            </span>
          </div> */}
        </div>
      ))}
      {showForm && <PolicyForm showForm={showForm} setShowForm={setShowForm} modifyItem={modifyItem} setInsuranceData={setInsuranceData} />}

      {addTransaction && <PolicyTransactions addTransaction={addTransaction} setAddTransaction={setAddTransaction} insuranceData={modifyItem} />}
    </div>
  );
};

export default Insurance;
