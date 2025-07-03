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
    const [summaryData, setSummaryData] = useState({
        total_sum_assured: 0,
        total_premium_paid: 0,
        total_current_value: 0,
    });

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
                setSummaryData({
                    total_sum_assured: data.data.summary.total_sum_assured,
                    total_premium_paid: data.data.summary.total_premium_paid,
                    total_current_value: data.data.summary.total_current_value,
                });
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
                    <span>Insurance Policies</span>
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

                <div className="grid grid-cols-3 gap-2 mb-0 text-xl w-full bg-stone-900 p-4  border border-b-0 border-sky-900">
                    <div className="text-gray-500 text-center">Total Premium Paid</div>
                    <div className="text-gray-500 text-center">Total Current Value</div>
                    <div className="text-gray-500 text-center">Sum Assured</div>

                    <div className="text-center">{numeral(summaryData.total_premium_paid).format("0,0.00")}</div>
                    <div className="text-center">{numeral(summaryData.total_current_value).format("0,0.00")}</div>
                    <div className="text-center">{numeral(summaryData.total_sum_assured).format("0,0.00")}</div>
                </div>


                <div className="w-full bg-stone-900 border border-sky-900 p-2 rounded-b-sm grid grid-cols-2 gap-4">
                    {insuranceData && insuranceData.length > 0 && insuranceData.map((item, index) => (
                        <div key={item.policy_no} className="flex flex-col gap-0 border rounded-sm border-sky-700 group cursor-default" >
                            <div key={item.policy_no} className="flex flex-row gap-2 text-sm bg-sky-950 px-2 py-1 rounded-t-sm border-b border-sky-700 font-bold">
                                <div>{item.policy_name}</div>
                                <span className="ms-auto"></span>
                                <div onClick={() => handleModify(item)} className="underline underline-offset-2 cursor-pointer">{item.policy_no}</div>
                            </div>

                            <div className="grid grid-cols-3 p-1.5 text-xs group-hover:bg-stone-700  ">
                                <div className="flex flex-col gap-1">
                                    <div className="font-bold text-center">Insurer</div>
                                    <div className="text-center text-nowrap overflow-hidden text-ellipsis">{item.insurer}</div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="text-center font-bold">Policy Type</div>
                                    <div className="text-center">{item.policy_type}</div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="text-center font-bold">Sum Assured</div>
                                    <div className="text-center">{numeral(item.sum_assured).format("0,0.00")}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 p-1.5 text-xs group-hover:bg-stone-700  ">
                                <div className="flex flex-col gap-1">
                                    <div className="text-center font-bold">Date of Commencement</div>
                                    <div className="text-center">{moment(item.date_of_commencement).format("DD-MMMM-YYYY")}</div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="font-bold text-center">Date of Maturity</div>
                                    <div className="text-center text-nowrap overflow-hidden text-ellipsis">{moment(item.date_of_maturity).format('DD-MMMM-YYYY')}</div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="text-center font-bold">Last Premium Date</div>
                                    <div className="text-center">{moment(item.date_of_last_premium).format("DD-MMMM-YYYY")}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 p-1.5 text-xs group-hover:bg-stone-700  ">
                                <div className="flex flex-col gap-1">
                                    <div className="font-bold text-center">Premium</div>
                                    <div className="text-center">
                                        <span className="cursor-pointer  underline underline-offset-4" onClick={() => handleAddTransaction(item)}>
                                            {numeral(item.premium_amount).format("0,0.00")}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="text-center font-bold">Last Premium Paid Date</div>
                                    <div className="text-center">{ }</div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="text-center font-bold">Frequency</div>
                                    <div className="text-center">{item.frequency}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 p-1.5 text-xs group-hover:bg-stone-700  rounded-b">
                                <div className="flex flex-col gap-1">
                                    <div className="font-bold text-center">Total Premium Paid</div>
                                    <div className="text-center text-nowrap overflow-hidden text-ellipsis">{numeral(item.total_premium_paid).format("0,0.00")}</div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="text-center font-bold">Current Value</div>
                                    <div className="text-center">{numeral(item.current_value).format("0,0.00")}</div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="text-center font-bold">Policy Status</div>
                                    <div className="text-center">{item.policy_status}</div>
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
