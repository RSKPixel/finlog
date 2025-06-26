import React, { act, useContext, useEffect, useRef, useState } from "react";
import BankStatementUpload from "./BankStatementUpload";
import Brs from "./Brs";
import SubMenu from "../../../components/SubMenu";

const Banking = () => {

    const subMenu = ["Statement Upload", "BRS"];
    const [activeSubMenu, setActiveSubMenu] = useState("Statement Upload");

    return (
        <div className="flex flex-col gap-4 w-full items-center">
            <SubMenu subMenu={subMenu} activeSubMenu={activeSubMenu} setActiveSubMenu={setActiveSubMenu} />

            {activeSubMenu === "Statement Upload" && <BankStatementUpload />}
            {activeSubMenu === "BRS" && <Brs />}
        </div>
    );

}


export default Banking;
