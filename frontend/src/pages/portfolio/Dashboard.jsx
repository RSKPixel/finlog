import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../../templates/AuthContext";
import numeral from "numeral";
import Loader from "../../components/Loader";
import ProgressChart from "./ProgressChart";

const Dashboard = () => {
    const { api, token, client } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [summary, setSummary] = useState({
        total_investment: 0,
        total_current_value: 0,
        pl: 0,
        plp: 0,
        xirr: 0,
    });
    const [insuranceSummary, setInsuranceSummary] = useState({
        total_sum_assured: 0,
        total_premium_paid: 0,
        total_current_value: 0,
        pl: 0,
        plp: 0,
        xirr: 0,
    });

    const [progressData, setProgressData] = useState([]);


    useEffect(() => {
        setLoading(true);
        setLoadingMessage("Fetching portfolio summary...");

        fetch(`${api}/portfolio/summary/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ client_pan: client.pan }),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log("Portfolio Summary Data:", data);
                setProgressData(data.data.progress);
                setSummary(
                    data.data.summary || {
                        total_investment: 0,
                        total_current_value: 0,
                        pl: 0,
                        plp: 0,
                        xirr: 0,
                        benchmark: 0,
                    }
                );
                setLoading(false);
                setLoadingMessage("");
            });

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
                setInsuranceSummary(data.data.summary || {
                    total_sum_assured: 0,
                    total_premium_paid: 0,
                    total_current_value: 0,
                    pl: 0,
                    plp: 0,
                    xirr: 0,
                })
            });

    }, []);

    return (
        <div className="flex flex-col  items-center justify-center w-full">
            {loading && <Loader message={loadingMessage} />}

            <div className="w-full px-2 text-sm font-bold z-10 border border-sky-900 py-1 rounded-t-sm bg-sky-950">Portfolio Overview</div>

            {summary && (
                <div className="grid grid-cols-6 gap-2 bg-stone-900 p-4 rounded-b-lg shadow-lg border border-sky-900 w-full  number-font">
                    <div className="text-center">Investment</div>
                    <div className="text-center">Invested</div>
                    <div className="text-center">Current Value</div>
                    <div className="text-center">Gains</div>
                    <div className="text-center">Gains %</div>
                    <div className="text-center">XIRR</div>

                    <div className="text-gray-500 text-center">MF & Stocks Investments</div>
                    <div className="text-center">{numeral(summary.total_investment).format("0,0.00")}</div>
                    <div className="text-center">{numeral(summary.total_current_value).format("0,0.00")}</div>
                    <div className={`text-center ${summary.pl >= 0 ? "text-green-500" : "text-red-500"}`}>{numeral(summary.pl).format("0,0.00")}</div>
                    <div className={`text-center ${summary.plp >= 0 ? "text-green-500" : "text-red-500"}`}>{numeral(summary.plp).format("0.00")}%</div>
                    <div className={`text-center ${summary.xirr >= 0 ? "text-green-500" : "text-red-500"}`}>{numeral(summary.xirr).format("0.00")}%</div>

                    <div className="text-gray-500 text-center">Insurance Investment</div>
                    <div className="text-center">{numeral(insuranceSummary.total_premium_paid).format("0,0.00")}</div>
                    <div className="text-center">{numeral(insuranceSummary.total_current_value).format("0,0.00")}</div>
                    <div className={`text-center ${insuranceSummary.pl >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {numeral(insuranceSummary.pl).format("0,0.00")}
                    </div>
                    <div className={`text-center ${insuranceSummary.plp >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {numeral(insuranceSummary.plp).format("0.00")}%</div>
                    <div className={`text-center ${insuranceSummary.xirr >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {numeral(insuranceSummary.xirr).format("0.00")}%
                    </div>

                    <div className="text-gray-500 text-center">Total</div>
                    <div className="text-center">
                        {numeral(summary.total_investment + insuranceSummary.total_premium_paid).format("0,0.00")}
                    </div>
                    <div className="text-center">
                        {numeral(summary.total_current_value + insuranceSummary.total_current_value).format("0,0.00")}
                    </div>
                    <div className={`text-center ${summary.pl + insuranceSummary.pl >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {numeral(summary.pl + insuranceSummary.pl).format("0,0.00")}
                    </div>
                    <div className={`text-center ${summary.plp + insuranceSummary.plp >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {(() => {
                            const totalInvestment = summary.total_investment + insuranceSummary.total_premium_paid;
                            const totalPl = summary.pl + insuranceSummary.pl;
                            const totalPlp = totalInvestment ? Math.round((totalPl / totalInvestment) * 100, 0) : 0;
                            return numeral(totalPlp).format("0.00");
                        })()}%
                    </div>
                    <div className={`text-center ${summary.xirr + insuranceSummary.xirr >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {numeral(0).format("0.00")}%
                    </div>
                    {/* <div className="flex flex-col items-center gap-1">
                        <div className="text-gray-500 text-center">Investment</div>
                        <div className="text-center">Invested</div>
                        <div className="text-center">Current Value</div>
                        <div className="text-center">Gain</div>
                        <div className="text-center">Gain %</div>
                        <div className="text-center">XIRR</div>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <div className="text-gray-500 text-center">MF & Stocks Investments</div>
                        <div className="text-center">{numeral(summary.total_investment).format("0,0.00")}</div>
                        <div className="text-center">{numeral(summary.total_current_value).format("0,0.00")}</div>
                        <div className={`text-center ${summary.pl >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {numeral(summary.pl).format("0,0.00")}
                        </div>
                        <div className={`flex flex-row gap-10 text-center ${summary.xirr >= 0 ? "text-green-500" : "text-red-500"}`}>
                            <span>{numeral(summary.xirr).format("0.00")}%</span>
                        </div>
                        <div className={`flex flex-row gap-10 text-center ${summary.xirr >= 0 ? "text-green-500" : "text-red-500"}`}>
                            <span>{numeral(summary.plp).format("0.00")}%</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <div className="text-gray-500 text-center">Insurance Investment</div>
                        <div className="text-center">{numeral(insuranceSummary.total_premium_paid).format("0,0.00")}</div>
                        <div className="text-center">{numeral(insuranceSummary.total_current_value).format("0,0.00")}</div>
                        <div className="text-center text-green-500">
                            {numeral(insuranceSummary.pl).format("0,0.00")}
                        </div>
                        <div className={`flex flex-row gap-10 text-center ${insuranceSummary.xirr >= 0 ? "text-green-500" : "text-red-500"}`}>
                            <span>XIRR - {numeral(insuranceSummary.xirr).format("0.00")}%</span>
                            <span>Gain - {numeral(insuranceSummary.plp).format("0.00")}%</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <div className="text-gray-500 text-center">Total</div>
                        <div className="text-center">{numeral(summary.total_investment + insuranceSummary.total_premium_paid).format("0,0.00")}</div>
                        <div className="text-center">{numeral(summary.total_current_value + insuranceSummary.total_current_value).format("0,0.00")}</div>
                        <div className="text-center text-green-500">
                            {numeral(summary.pl + insuranceSummary.pl).format("0,0.00")}
                        </div>
                        <div className={`flex flex-row gap-10 text-center ${insuranceSummary.xirr >= 0 ? "text-green-500" : "text-red-500"}`}>
                            <span>Gain - {(() => {
                                const totalInvestment = summary.total_investment + insuranceSummary.total_premium_paid;
                                const totalPl = summary.pl + insuranceSummary.pl;
                                const totalPlp = totalInvestment ? (totalPl / totalInvestment) * 100 : 0;
                                return numeral(totalPlp).format("0.00");
                            })()} %</span>
                        </div>
                    </div> */}

                    {/* <div className="text-gray-500 text-center">Insurance Investment</div>
                    <div className="text-gray-500 text-center">Current Value</div>
                    <div className="text-gray-500 text-center">Gain</div>
                    <div className="text-gray-500 text-center">XIRR</div>

                    <div className="text-center">{numeral(insuranceSummary.total_premium_paid).format("0,0.00")}</div>
                    <div className="text-center">{numeral(summary.total_current_value + insuranceSummary.total_current_value).format("0,0.00")}</div>

                    <div className={`text-center ${summary.pl >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {numeral(summary.pl).format("0,0.00")} ({numeral(summary.plp).format("0.00")}%)
                    </div>

                    <div className={`text-center ${summary.xirr >= 0 ? "text-green-500" : "text-red-500"}`}>{numeral(summary.xirr).format("0.00")}%</div> */}
                </div>
            )}

            {progressData.length > 0 && (
                <ProgressChart
                    data={progressData}
                    setLoading={setLoading}
                    setLoadingMessage={setLoadingMessage}
                />
            )}

        </div>
    );
};

export default Dashboard;
