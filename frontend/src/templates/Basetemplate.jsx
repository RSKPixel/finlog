import React, { useContext } from "react";
import AuthContext from "./AuthContext";
import { Link } from "react-router-dom";

const Basetemplate = ({ children }) => {
    const { api, loggedIn, client } = useContext(AuthContext);
    const menu = {
        Masters: {
            "Ledger Master": "/masters/ledger",
        },
        Transactions: {
            "Bank & Cash": "/transactions/bankcash",
            Investments: "/transactions/investments",
            Assets: "/transactions/assets",
            "Capital Gains": "/transactions/capitalgains",
            Loans: "/transactions/loans",
            "Opening Balance": "/transactions/openingbalance",
        },
    };

    return (
        <div className="flex flex-col h-screen w-full">
            {/* Top Bar */}
            <div className="flex flex-row h-10 w-full justify-between items-center bg-sky-950 px-4 py-0 shadow text-stone-100 border-b border-stone-700">
                <h1 className="text-2xl font-bold">FinLog</h1>
                <div className="ms-auto" />
                {loggedIn && (
                    <span className="font-bold">
                        {client.name} ({client.pan})
                    </span>
                )}
            </div>

            {/* Main Layout */}
            <div className="flex flex-row text-stone-200 h-[calc(100vh-2.5rem)] w-full">
                {/* Sidebar */}
                {loggedIn && (
                    <div className="flex flex-col w-72 gap-2 h-full text-sm font-medium p-4 pe-6 border-r border-stone-700 bg-stone-900 overflow-y-auto">
                        <ul>
                            {Object.keys(menu).map((section) => (
                                <li key={section} className="mb-4">
                                    <div className="font-bold text-xs text-center border border-stone-700 bg-sky-950 text-stone-100 px-2 py-1 rounded-t-sm uppercase tracking-wide">
                                        {section}
                                    </div>
                                    <ul className="border border-stone-700 rounded-b-sm">
                                        {Object.entries(menu[section]).map(([name, path]) => (
                                            <Link to={path} className="block text-sm text-stone-100">
                                                <li key={name} className="bg-stone-900 px-2 py-1 hover:bg-stone-700 cursor-pointer">
                                                    {name}
                                                </li>
                                            </Link>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex flex-col w-full bg-stone-800 p-4 h-full overflow-auto">
                    {children}
                </div>
            </div>
        </div>

    );
};

export default Basetemplate;
