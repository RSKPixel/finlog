import React from 'react'

const SubMenu = ({ subMenu, activeSubMenu, setActiveSubMenu }) => {
    return (
        <div className="flex gap-2 w-full justify-center">
            {subMenu.map((item, index) => (
                <button
                    key={index}
                    className={`button-basic font-bold border border-white/70 text-sm text-white ${activeSubMenu === item ? "bg-blue-700 border-blue-700" : "bg-stone-900"}`}
                    onClick={() => setActiveSubMenu(item)}
                >
                    {item}
                </button>
            ))}
        </div>
    );
}

export default SubMenu