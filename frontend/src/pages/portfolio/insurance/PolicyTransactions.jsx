import React, { use, useContext, useEffect, useState } from 'react'
import AuthContext from '../../../templates/AuthContext'
import DisplayFormMessage from '../../../components/DisplayFormMessage'
import numeral from 'numeral'

const PolicyTransactions = ({ addTransaction, setAddTransaction, insuranceData }) => {

    const { api, token, client } = useContext(AuthContext)
    const [formMessage, setFormMessage] = useState([])
    const blankTransaction = {
        action: "new",
        client_pan: client.pan,
        policy_no: insuranceData.policy_no,
        policy_name: insuranceData.policy_name,
        transaction_date: new Date().toISOString().split('T')[0], // Default to today
        transaction_type: "Premium",
        transaction_amount: insuranceData.premium_amount || 0,
    }

    const validation = () => {
        const error = []
        if (!formData.transaction_date) error.push("Fields marked * is mandatory")
        if (!formData.transaction_type) error.push("Fields marked * is mandatory")
        if (!formData.transaction_amount) error.push("Fields marked * is mandatory")
        return [...new Set(error)]
    }

    const [transactions, setTransactions] = useState()
    const [formData, setFormData] = useState(blankTransaction)

    useEffect(() => {
        console.log("Fetching transactions for policy:", insuranceData.policy_no)
        fetch(`${api}/portfolio/insurance/transactions/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            },
            body: JSON.stringify({
                client_pan: client.pan,
                policy_no: insuranceData.policy_no
            })
        })
            .then((response) => response.json())
            .then((data) => {
                setTransactions(data.data || [])
            })
    }, [])

    const handleSubmit = () => {
        const error = validation()
        if (error.length > 0) {
            setFormMessage(error)
        }

        fetch(`${api}/portfolio/insurance/transactions/save/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            },
            body: JSON.stringify(formData)
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.status === "success") {
                    setTransactions((prev) => [...prev, formData])
                }
                setFormMessage([data.message] || [])
            })
    }

    const handleDelete = (item) => {
        if (!window.confirm("Are you sure you want to delete this transaction?")) return
        fetch(`${api}/portfolio/insurance/transactions/save/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            },
            body: JSON.stringify({
                action: "delete",
                client_pan: client.pan,
                transaction_id: item.id,
            })
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.status === "success") {
                    setTransactions((prev) => prev.filter(t => t.id !== item.id))
                }
                setFormMessage([data.message] || [])
            })
    }


    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value
        })
    }
    if (!addTransaction) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
            <div className="flex flex-col bg-neutral-900 border border-white/10 rounded-sm shadow-xl w-2/5 max-h-[100vh]">
                {/* Header */}

                <div className="flex flex-row p-1 items-center font-bold text-sm rounded-t-sm bg-amber-700 z-10">
                    <span>Policy Transactions </span>
                    <span className="ms-auto" />
                    <button type="button" className="button-icon red text-xs" onClick={() => setAddTransaction(false)} >
                        X
                    </button>
                </div>

                <form autoComplete="off" className="grid grid-cols-2 gap-2 border bg-stone-900  w-full p-3 border-sky-900">
                    <div className="flex flex-col gap-2">
                        <label>Policy Name *</label>
                        <input type="text" className="uppercase" name="policy_name" value={formData.policy_name} readOnly />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Policy No *</label>
                        <input type="text" className="uppercase" name="policy_no" value={formData.policy_no} readOnly />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Transaction Date *</label>
                        <input type="date" className="uppercase" name="transaction_date" value={formData.transaction_date} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Transaction Type *</label>
                        <select className="uppercase" name="transaction_type" value={formData.transaction_type} onChange={handleChange}>
                            <option value="">Select Transaction Type</option>
                            <option value="Premium">Premium</option>
                            <option value="Claim">Claim</option>
                            <option value="Surrender">Surrender</option>
                            <option value="Maturity">Maturity</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Transaction Amount *</label>
                        <input type="number" className="uppercase" name="transaction_amount" value={formData.transaction_amount} onChange={handleChange} />
                    </div>
                    <div className='flex flex-col col-span-2'>
                        <DisplayFormMessage formMessage={formMessage} />
                    </div>
                    <div className="flex flex-row gap-2 col-span-2">
                        <span className='ms-auto'></span>
                        <button type="button" className="btn btn-success" onClick={handleSubmit}>Save</button>
                        <button type="button" className="btn btn-secondary" onClick={() => setAddTransaction(false)}>Close</button>
                    </div>
                </form>
                {transactions && transactions.length > 0 && (
                    <div className="relative flex flex-col gap-0 w-full bg-stone-800 border-sky-900 h-fit max-h-[350px] overflow-y-auto">
                        <div className=" top-0 sticky z-10 grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 w-full py-2 px-2 border-t bg-stone-900 border border-sky-900">
                            <div className="font-bold text-sm">Transaction</div>
                            <div className="font-bold text-center text-sm">Transaction Date</div>
                            <div className="font-bold text-end text-sm">Transaction Amount</div>
                            <div className="font-bold text-center text-sm">Action</div>
                        </div>
                        {transactions.map((item, index) => (
                            <div key={index} className="grid grid-cols-[1fr_1fr_1fr_1fr] justify-center items-center gap-2 w-full px-2 py-1 bg-stone-800 border-t-0 border border-sky-900 hover:bg-stone-700 cursor-default">
                                <div className="text-sm">{item.transaction_type}</div>
                                <div className="text-sm text-center">{item.transaction_date}</div>
                                <div className="text-sm text-end">{numeral(item.transaction_amount).format("0,0.00")}</div>
                                <div className='flex flex-row gap-2 justify-center items-center'>
                                    <span className='text-center'>
                                        <i className="bi bi-trash cursor-pointer hover:text-red-400" onClick={() => handleDelete(item)}></i>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>


        </div>
    )
}

export default PolicyTransactions