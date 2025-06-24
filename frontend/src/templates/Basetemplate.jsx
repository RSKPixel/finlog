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
      <div className="flex flex-row h-10 w-full justify-between items-center  bg-zinc-800 px-4 py-0 shadow-sm text-white border-b border-zinc-700">
        <h1 className="text-2xl font-bold">FinLog</h1>
        <div className="ms-auto"></div>
        {loggedIn && (
          <span className="font-bold">
            {client.name} ({client.pan})
          </span>
        )}
      </div>
      <div className="flex flex-row text-white h-[calc(100vh-2.5rem)] w-full">
        <div className="flex flex-col w-56 gap-2 h-full text-lg font-semibold pt-4  border-r-0 bg-zinc-950 border-stone-700 overflow-y-auto ">
          <ul>
            {Object.keys(menu).map((section) => (
              <li key={section} className="mb-4">
                <div className="font-bold text-sm w-full text-center border bg-zinc-800 px-2 py-1 border-stone-500">
                  {section}
                </div>
                <ul className="border border-stone-500">
                  {Object.entries(menu[section]).map(([name, path]) => (
                    <li key={name} className="bg-zinc-950 text-white px-2 hover:bg-zinc-600 cursor-pointer">
                      <Link to={path} className="text-xs ">
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col w-full bg-zinc-950 p-4 h-full">{children}</div>
      </div>
    </div>
  );
};

export default Basetemplate;
