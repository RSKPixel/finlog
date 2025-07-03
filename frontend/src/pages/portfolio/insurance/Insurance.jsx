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
                setInsuranceData(data.data.insurance);
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

                <div className="w-full bg-stone-900 border border-sky-900 p-2 rounded-b-sm grid grid-cols-2 gap-2">
                    {insuranceData && insuranceData.length > 0 && insuranceData.map((item, index) => (
                        <div key={item.policy_no} className="border rounded-sm border-sky-700">
                            <div key={item.policy_no} className="text-sm bg-sky-950 px-2 py-1 rounded-t-sm border-b border-sky-700 font-bold">{item.policy_name} ({item.policy_no})</div>
                            <div className="grid grid-cols-3 p-2 text-xs hover:bg-stone-700 hover:cursor-pointer rounded-b">
                                <div className="flex flex-col gap-1">
                                    <div className="font-bold text-center">Insurer</div>
                                    <div className="text-center text-nowrap overflow-hidden text-ellipsis">{item.insurer}</div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="text-center font-bold">Date of Commencement</div>
                                    <div className="text-center">{moment(item.date_of_commencement).format("DD/MM/YYYY")}</div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="text-center font-bold">Sum Assured</div>
                                    <div className="text-center">{numeral(item.sum_assured).format("0,0.00")}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showForm && <PolicyForm showForm={showForm} setShowForm={setShowForm} modifyItem={modifyItem} setInsuranceData={setInsuranceData} />}

            {addTransaction && <PolicyTransactions addTransaction={addTransaction} setAddTransaction={setAddTransaction} insuranceData={modifyItem} />}
        </div >
    );
};

export default Insurance;
