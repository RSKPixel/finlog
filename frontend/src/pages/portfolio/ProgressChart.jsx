import React, { useContext, useEffect, useState } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import moment from "moment";
import AuthContext from "../../templates/AuthContext";
ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const ProgressChart = ({
  data = [],
  portfolio = "All",
  assetClass = "All",
  instrumentName = "All",
  pot = "All",
  setLoading,
  setLoadingMessage,
}) => {
  const { api, token, client } = useContext(AuthContext);
  const period = {
    "1M": 1,
    "3M": 3,
    "6M": 6,
    "1Y": 12,
    "2Y": 24,
    "3Y": 36,
    "5Y": 60,
    All: 9999,
  };
  const [selectedPeriod, setSelectedPeriod] = useState("24");
  const [investmentProgress, setInvestmentProgress] = useState([]);
  const chartData = ["Investment Progress", "Drawdown", "Holding %", "Profit %"];
  const [selectedChartData, setSelectedChartData] = useState("Investment Progress");
  const [progressData, setprogressData] = useState(data);

  useEffect(() => {
    if (progressData.length > 0) {
      const filteredData = progressData.slice(-selectedPeriod);
      setInvestmentProgress(filteredData);
    }
  }, [selectedPeriod]);

  return (
    <div className="flex flex-col bg-stone-900 rounded-sm shadow-lg border border-sky-900 h-fit w-full mt-4">
      <div className="flex flex-row text-xs justify-between items-center rounded-t-sm bg-sky-950 p-0 border-b-1 border-sky-900">
        <div className="flex flex-row gap-2 px-3">
          {chartData.map((data, index) => (
            <span
              key={index}
              className={`${selectedChartData == data && "bg-amber-300 text-black"
                } font-bold px-2 py-1 rounded-sm cursor-pointer hover:bg-blue-400`}
              onClick={() => setSelectedChartData(data)}
            >
              {data}
            </span>
          ))}
        </div>

        <div className="flex flex-row gap-2 p-1">
          {Object.keys(period).map((per, index) => (
            <span
              key={per}
              className={`${selectedPeriod == period[per] && "bg-amber-300 text-black"
                } font-bold px-2 py-1 rounded-sm cursor-pointer hover:bg-blue-400`}
              onClick={() => setSelectedPeriod(period[per])}
            >
              {per}
            </span>
          ))}
        </div>
      </div>
      <div className="h-[350px] w-full flex flex-col gap-4 border-t-1 border-sky-900">
        {investmentProgress.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No investment progress data available for the selected portfolio.
          </div>
        ) : (
          <LineChartMonthly data={investmentProgress} options={selectedChartData} />
        )}
      </div>
    </div>
  );
};

const LineChartMonthly = ({ data, options = [] }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500">No data available</div>;
  }

  if (options.includes("Investment Progress")) {
    options = ["Investment Value", "Current Value"];
  } else if (options.includes("Holding %")) {
    options = ["Equity Holding %", "Debt Holding %", "Gold Holding %"];
  } else if (options.includes("Drawdown")) {
    options = ["Drawdown"];
  } else if (options.includes("Profit %")) {
    options = ["Gains"];
  }

  const allDatasets = [
    {
      label: "Investment Value",
      data: data.map((item) => item.invested_value / 1000000),
      fill: true,
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      borderColor: "rgba(75, 192, 192, 1)",
      borderWidth: 1,
      tension: 0.2,
      pointRadius: 1,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "rgba(75, 192, 192, 1)",
      pointHoverBorderColor: "rgba(75, 192, 192, 1)",
    },
    {
      label: "Current Value",
      data: data.map((item) => item.current_value / 1000000),
      fill: false,
      backgroundColor: "rgba(153, 102, 255, 0.2)",
      borderColor: "rgba(153, 102, 255, 1)",
      borderWidth: 1,
      tension: 0.2,
      pointRadius: 1,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "rgba(153, 102, 255, 1)",
      pointHoverBorderColor: "rgba(153, 102, 255, 1)",
    },
    // {
    //     label: "Benchmark",
    //     data: data.map((item) => item.benchmark_value),
    //     fill: false,
    //     backgroundColor: "rgba(255, 159, 64, 0.2)",
    //     borderColor: "rgba(255, 159, 64, 1)",
    //     borderWidth: 1,
    //     tension: 0.2,
    //     pointRadius: 2,
    //     pointHoverRadius: 5,
    //     pointHoverBackgroundColor: "rgba(255, 159, 64, 1)",
    //     pointHoverBorderColor: "rgba(255, 159, 64, 1)",
    // },
    {
      label: "Gains",
      data: data.map((item) => item.plp),
      fill: false,
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      borderColor: "rgba(255, 99, 132, 1)",
      borderWidth: 1,
      tension: 0.1,
      pointRadius: 1,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "rgba(255, 99, 132, 1)",
      pointHoverBorderColor: "rgba(255, 99, 132, 1)",
    },
    {
      label: "Drawdown",
      data: data.map((item) => item.drawdown),
      fill: false,
      backgroundColor: "rgba(54, 162, 235, 0.2)",
      borderColor: "rgba(54, 162, 235, 1)",
      borderWidth: 1,
      tension: 0.1,
      pointRadius: 1,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "rgba(54, 162, 235, 1)",
      pointHoverBorderColor: "rgba(54, 162, 235, 1)",
    },
    {
      label: "Equity Holding %",
      data: data.map((item) => item.equity_holding_percentage),
      fill: false,
      backgroundColor: "rgba(255, 206, 86, 0.2)",
      borderColor: "rgba(255, 206, 86, 1)",
      borderWidth: 1,
      tension: 0.1,
      pointRadius: 2,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "rgba(255, 206, 86, 1)",
      pointHoverBorderColor: "rgba(255, 206, 86, 1)",
    },
    {
      label: `Debt Holding %`,
      data: data.map((item) => item.debt_holding_percentage),
      fill: false,
      backgroundColor: "rgba(153, 102, 255, 0.2)",
      borderColor: "rgba(153, 102, 255, 1)",
      borderWidth: 1,
      tension: 0.1,
      pointRadius: 2,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "rgba(153, 102, 255, 1)",
      pointHoverBorderColor: "rgba(153, 102, 255, 1)",
    },
    {
      label: `Gold Holding %`,
      data: data.map((item) => item.gold_holding_percentage),
      fill: false,
      backgroundColor: "rgba(153, 102, 255, 0.2)",
      borderColor: "rgba(183, 202, 105, 1)",
      borderWidth: 1,
      tension: 0.1,
      pointRadius: 2,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "rgba(153, 102, 255, 1)",
      pointHoverBorderColor: "rgba(153, 102, 255, 1)",
    }
  ];

  const chartData = {
    labels: data.map((item) => moment(item.transaction_date).format("YY-MM")),
    datasets: allDatasets.filter((ds) => options.includes(ds.label)),
  };

  if (chartData.datasets.length === 0) {
    return <div className="text-center text-gray-500">No data available for selected options</div>;
  }

  return <Line data={chartData} style={{ maxWidth: "100%", maxHeight: "100%" }} options={{ responsive: true }} />;
};

export default ProgressChart;
