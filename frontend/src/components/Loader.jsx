import React from 'react'

const Loader = ({ message }) => {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 animate-fade-in">
            <div className="flex flex-col items-center gap-4 bg-neutral-900 border border-white/10 rounded-sm shadow-xl p-6 w-[300px]">

                {/* Spinner */}
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />

                {/* Text */}
                <div className="text-white text-lg font-semibold">{message ? message : "Loading..."}</div>
            </div>
        </div>
    )
}

export default Loader