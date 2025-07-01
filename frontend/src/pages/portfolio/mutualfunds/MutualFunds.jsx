import React, { useContext, useEffect, useState } from "react";
import MutualFundsUpload from "./MutualFundsUpload";
import AuthContext from "../../../templates/AuthContext";
import Loader from "../../../components/Loader";
import numeral from "numeral";
import moment from "moment";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const MutualFunds = () => {
    const { api, token, client } = useContext(AuthContext);
    const [assetClass, setAssetClass] = useState("All");
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [holdings, setHoldings] = useState([]);
    const [selectedFund, setSelectedFund] = useState(null);
    const summary_blank = {
        total_investment: 0,
        total_current_value: 0,
        pl: 0,
        plp: 0,
        xirr: 0,
    };
    const [summary, setSummary] = useState(summary_blank);
    const [assetClasses, setAssetClasses] = useState([]);

    useEffect(() => {
        setLoading(true);
        setHoldings([]);
        setSummary(summary_blank);
        setLoadingMessage("Fetching Mutual Funds Holdings...");
        fetch(`${api}/portfolio/mutualfund/holdings/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ client_pan: client.pan, asset_class: assetClass }),
        })
            .then((response) => response.json())
            .then((data) => {
                setHoldings(data.data.summary_data.holdings || []);
                setSummary(data.data.summary_data.summary);
                setAssetClasses(data.data.asset_classes);
                setLoading(false);
            });
    }, [assetClass]);

    return (
        <div className="flex flex-col gap-4 w-full items-center">
            <div className="flex flex-col w-full items-center">
                <div className="w-full px-2 text-sm font-bold z-10 border border-sky-900 py-1 rounded-t-sm bg-sky-950 flex flex-row items-center">
                    <span>Mutual Fund Holdings</span>
                    <span className="ms-auto"></span>
                    {assetClasses && (
                        <span className="flex flex-row gap-2 text-xs ms-2 text-gray-400">
                            <span className={`${assetClass == "All" && "font-bold text-white"} hover:underline underline-offset-4 cursor-pointer`} onClick={() => setAssetClass("All")}>
                                All
                            </span>
                            {assetClasses.map((ac, index) => (
                                <span key={index} className={`${assetClass == ac && "font-bold text-white"} hover:underline underline-offset-4 cursor-pointer`} onClick={() => setAssetClass(ac)}>
                                    {ac}
                                </span>
                            ))}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-4 gap-2 mb-0 text-xl w-full bg-stone-900 p-4  border border-b-1 border-sky-900">
                    <div className="text-gray-500 text-center">Total Investment</div>
                    <div className="text-gray-500 text-center">Current Value</div>
                    <div className="text-gray-500 text-center">Gain</div>
                    <div className="text-gray-500 text-center">XIRR</div>

                    <div className="text-center">{numeral(summary.total_investment).format("0,0.00")}</div>
                    <div className="text-center">{numeral(summary.total_current_value).format("0,0.00")}</div>

                    <div className={`text-center ${summary.pl >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {numeral(summary.pl).format("0,0.00")} ({numeral(summary.plp).format("0.00")}%)
                    </div>

                    <div className={`text-center ${summary.xirr >= 0 ? "text-green-500" : "text-red-500"}`}>{numeral(summary.xirr).format("0.00")}%</div>
                </div>

                <div className="grid grid-cols-3 gap-2 items-center border border-t-0 bg-stone-900 rounded-b-sm w-full p-4 border-sky-900">
                    {loading && (
                        <div className="col-span-3 w-full flex items-center justify-center ">
                            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>
                    )}

                    {holdings.length > 0 &&
                        holdings.map((holding, index) => {
                            return (
                                <div
                                    key={index}
                                    className="flex flex-col gap-2 border bg-neutral-800 border-neutral-950 rounded-lg py-2 px-4 mt-2 shadow-lg hover:bg-neutral-700 cursor-pointer"
                                    onClick={() => setSelectedFund(holding)}>
                                    <div className="flex flex-row text-sm">
                                        <span className="font-bold text-nowrap overflow-hidden text-ellipsis">{holding.instrument_name}</span>
                                        <span className="ms-auto"></span>
                                        <span className="text-xs">{holding.asset_class}</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 ">
                                        <div className="text-sm text-gray-500 text-center">Market Value</div>
                                        <div className="text-sm text-gray-500 text-center">Total Return</div>
                                        <div className="text-sm text-gray-500 text-center">XIRR</div>
                                        <div className="text-sm text-gray-500 text-center">Holding %</div>

                                        <div className="text-center text-sm">{numeral(holding.current_value / 1000).format("0,0.00")}k</div>
                                        <div className={`text-center text-sm ${holding.pl >= 0 ? "text-green-500" : "text-red-500"}`}>
                                            {numeral(holding.pl / 1000).format("0,0.00")}k ({numeral(holding.plp).format("0.00")}%)
                                        </div>
                                        <div className={`text-center text-sm ${holding.xirr >= 0 ? "text-green-500" : "text-red-500"}`}>{numeral(holding.xirr).format("0.00")}%</div>
                                        <div className="text-center text-sm">{numeral(holding.holding_percentage).format("0.00")}%</div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
            {selectedFund && (
                <FundDetails selectedFund={selectedFund} setSelectedFund={setSelectedFund} />
            )}

            <MutualFundsUpload />
        </div>
    );
};

const FundDetails = ({ selectedFund, setSelectedFund }) => {
    const { api, token, client } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const holdingSummaryBlank = {
        longterm_holdings: { value: 0, units: 0 },
        shortterm_holdings: { value: 0, units: 0 },
        holding: {
            fund_name: "",
            folio: "",
            isin: "",
            client_pan: "",
        },
        nav_changes: [],
        current_nav_date: "",
        transactions: [],
    }
    const [holdingSummary, setHoldingSummary] = useState(holdingSummaryBlank);
    const [efficecincyRatioData, setEfficencyRatioData] = useState({
        labels: [],
        datasets: [],
    })


    useEffect(() => {

        setLoading(true);
        setLoadingMessage("Fetching Mutual Fund Details...");
        const data = {
            client_pan: client.pan,
            instrument_id: selectedFund.instrument_id,
            folio_id: selectedFund.folio_id,
        }

        fetch(`${api}/portfolio/mutualfund/holdings/details/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        })
            .then((response) => response.json())
            .then((data) => {
                const pa = data.data.purchase_analysis
                setHoldingSummary(data.data || holdingSummaryBlank);
                setEfficencyRatioData({
                    labels: pa.map((item) => item.year),
                    datasets: [
                        {
                            label: "NAV Efficency Ratio (Higher is better)",
                            data: pa.map((item) => item.efficency_ratio),
                            fill: false,
                            backgroundColor: "rgba(75, 192, 192, 0.2)",
                            borderColor: "rgba(75, 192, 192, 1)",
                            borderWidth: 1,
                            tension: 0.2,
                        },
                    ],
                })
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching fund details:", error);
                setLoading(false);
            })

    }, []);


    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log("Updating holding:", name, value);
        fetch(`${api}/portfolio/mutualfund/holdings/update/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                client_pan: client.pan,
                instrument_id: selectedFund.instrument_id,
                folio_id: selectedFund.folio_id,
                [name]: value,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                setHoldingSummary((prev) => ({
                    ...prev,
                    holding: {
                        ...prev.holding,
                        [name]: value,
                    },
                }));
            })

    }
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
            <div className="flex flex-col bg-neutral-900 border border-white/10 rounded-sm shadow-xl w-4/5 max-h-[80vh]">
                {/* Header */}
                <div className="flex flex-row p-1 items-center font-bold text-sm rounded-t-sm bg-amber-700 z-10">
                    <span>{selectedFund.instrument_name}</span>
                    <span className="ms-auto" />
                    <button type="button" className="button-icon red text-xs" onClick={() => setSelectedFund(null)}>
                        X
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4">
                    <div className="grid grid-cols-1 gap-2 text-sm items-center bg-neutral-800 border border-neutral-950 rounded-lg h-fit shadow-lg">
                        <div className="grid grid-cols-14 items-center justify-center p-2">
                            <span className="text-center"></span>
                            <span className="text-center">Jan</span>
                            <span className="text-center">Feb</span>
                            <span className="text-center">Mar</span>
                            <span className="text-center">Apr</span>
                            <span className="text-center">May</span>
                            <span className="text-center">Jun</span>
                            <span className="text-center">Jul</span>
                            <span className="text-center">Aug</span>
                            <span className="text-center">Sep</span>
                            <span className="text-center">Oct</span>
                            <span className="text-center">Nov</span>
                            <span className="text-center">Dec</span>
                        </div>
                        {holdingSummary.nav_changes.map((row, index) => {
                            const rowsum = row.changes.reduce((acc, change) => (change !== null ? acc + change : acc), 0);
                            return (
                                <div key={row.year} className="grid grid-cols-14 items-center p-2">
                                    <div>{row.year}</div>
                                    {row.changes.map((change, idx) => (
                                        <div key={idx} className={`text-center ${change >= 0 ? "text-green-500" : "text-red-500"}`}>
                                            {change === null || change === 0 ? "-" : numeral(change).format("0,0.00")}
                                        </div>
                                    ))}
                                    <div className={`text-end ${rowsum >= 0 ? "text-green-500" : "text-red-500"}`}>
                                        {numeral(rowsum).format("0,0.00")}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm bg-neutral-800 border border-neutral-950 rounded-lg h-full shadow-lg">
                        <LineSummaryChart data={holdingSummary} />
                    </div>

                    <div className="grid grid-cols-2 items-center gap-2 text-sm bg-neutral-800 border border-neutral-950 rounded-lg p-4 shadow-lg">
                        <div>Asset Class</div>
                        <select
                            name="asset_class"
                            onChange={handleChange}
                            value={holdingSummary.holding.asset_class || ""}
                        >
                            <option value="Debt">Debt</option>
                            <option value="Equity">Equity</option>
                            <option value="Gold">Gold</option>
                        </select>
                        <div>Goal Pot</div>
                        <select
                            onChange={handleChange}
                            name="goalpot"
                            value={holdingSummary.holding.goalpot || ""}
                        >
                            <option value="">Select a Pot option</option>
                            <option value="Retirement">Retirement</option>
                            <option value="Child Education">Child Education</option>
                            <option value="Child Marriage">Child Marriage</option>
                            <option value="Wealth Creation">Wealth Creation</option>
                            <option value="Emergency Fund">Emergency Fund</option>
                            <option value="Long Term">Long Term Investment</option>
                            <option value="Short Term">Short Term Investment</option>
                            <option value="Vacation Fund">Vacation Fund</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm bg-neutral-800 border border-neutral-950 rounded-lg p-4 shadow-lg">
                        <div className="text-sm text-gray-500 text-center">Holding Period</div>
                        <div className="text-sm text-gray-500 text-end">Investment Value</div>
                        <div className="text-sm text-gray-500 text-end">Unit</div>
                        <div className="text-sm text-gray-500 text-end">Capital Gains</div>

                        <div className="text-center">Short Term</div>
                        <div className="text-end number">{numeral(holdingSummary.shortterm_holdings.value).format("0,0.00")}</div>
                        <div className="text-end number">{numeral(holdingSummary.shortterm_holdings.units).format("0,0.000")}</div>
                        <div className="text-end number">{numeral(holdingSummary.shortterm_holdings.pl).format("0,0.00")}</div>

                        <div className="text-center">Long Term</div>
                        <div className="text-end number">{numeral(holdingSummary.longterm_holdings.value).format("0,0.00")}</div>
                        <div className="text-end number">{numeral(holdingSummary.longterm_holdings.units).format("0,0.000")}</div>
                        <div className="text-end number">{numeral(holdingSummary.longterm_holdings.pl).format("0,0.00")}</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm items-center bg-neutral-800 border border-neutral-950 rounded-lg p-4 shadow-lg">
                        <div className="text-gray-500 text-center">Transaction Date</div>
                        <div className="text-gray-500 text-end">Transaction Amount</div>
                        <div className="text-gray-500 text-end">Unit</div>
                        <div className="text-gray-500 text-end">NAV</div>

                        {holdingSummary.transactions
                            .slice(-5)
                            .reverse()
                            .map((holding, index) => {
                                return (
                                    <React.Fragment key={index}>
                                        <div className="text-center number">{moment(holding.transaction_date).format("DD-MM-YYYY")}</div>
                                        <div className="text-end number">{numeral(holding.holding_value).format("0,0.00")}</div>
                                        <div className="text-end number">{numeral(holding.balance_units).format("0,0.000")}</div>
                                        <div className="text-end number">{numeral(holding.unit_price).format("0,0.00")}</div>
                                    </React.Fragment>
                                );
                            })}
                    </div>
                    <div className="text-xs text-end">
                        Nav as on {moment(holdingSummary.holding.current_price_date).format("DD-MM-yyyy")}
                    </div>
                </div>
            </div>
        </div>
    );
}

const LineSummaryChart = ({ data }) => {
    data = data.purchase_analysis || [];

    if (!data || data.length === 0) {
        return <div className="text-center text-gray-500">No data available</div>;
    }

    const chartData = {
        labels: data.map((item) => item.year),
        datasets: [
            {
                label: "NAV Efficency Ratio (Higher is better)",
                data: data.map((item) => item.efficency_ratio),
                fill: false,
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
                tension: 0.2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        scales: {
            y: {
                min: 0,
                max: 1,
                ticks: {
                    stepSize: 0.1,
                },
            },
        },
    };

    return <Line data={chartData} style={{ maxWidth: "100%", maxHeight: "100%" }} options={chartOptions} />;
};

export default MutualFunds;
