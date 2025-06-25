import React from 'react'

const LedgerMaster = () => {
    return (
        <div className='flex flex-col w-full items-center'>
            {/* <h1 className='text-lg font-bold'>Ledger Master</h1> */}
            <div className='relative grid grid-cols-2 gap-4 w-2/4 border bg-stone-900 rounded-lg p-4 mt-4 border-stone-700'>
                <h1 className="absolute -top-4 w-fit left-4 px-2 text-sm font-bold z-10 border border-sky-700 p-0.5 rounded-lg bg-sky-950">Ledger Master</h1>
                <div className='mt-0.5'></div>
                <div className='mt-0.5'></div>
                <div className='flex flex-col gap-2'>
                    <label>Instrument Name</label>
                    <input type="text" className='capitalize' />
                </div>
                <div className='flex flex-col gap-2'>
                    <label>Instrument ID</label>
                    <input type="text" readOnly />
                </div>
                <div className='flex flex-col gap-2 col-span-2'>
                    <label>Instrument Group</label>
                    <select >
                        <option value="">Select Ledger Group</option>
                        <option value="cash">Cash</option>
                        <option value="bank">Bank</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                        <option value="assets">Assets</option>
                        <option value="liabilities">Liabilities</option>
                    </select>
                </div>
                <div className='flex flex-col gap-2'>
                    <label>Folio Number</label>
                    <input type="text" readOnly />
                </div>
                <div className='flex flex-col gap-2'>
                    <label>Folio Name</label>
                    <input type="text" readOnly />
                </div>
            </div>
        </div>
    )
}

export default LedgerMaster