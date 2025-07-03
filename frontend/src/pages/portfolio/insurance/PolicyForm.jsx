import React, { useContext, useEffect, useState } from 'react'
import AuthContext from '../../../templates/AuthContext'
import DisplayFormMessage from '../../../components/DisplayFormMessage'

const PolicyForm = ({ showForm, setShowForm, modifyItem, setInsuranceData }) => {
    const { api, token, client } = useContext(AuthContext)
    const newData = {
        action: "new",
        client_pan: client.pan,
        policy_name: "",
        policy_no: "",
        insurer: "",
        policy_type: "",
        date_of_commencement: "",
        date_of_last_premium: "",
        date_of_maturity: "",
        premium_amount: "",
        sum_assured: "",
        frequency: "",
        agent_name: "",
        policy_status: "",
        remarks: "",
        total_premium_paid: "",
        current_value: "",
    }
    const [formData, setFormData] = useState(newData)
    const [formMessage, setFormMessage] = useState([])
    const [loading, setLoading] = useState(true)
    const validation = () => {
        const error = []
        if (!formData.policy_name.trim()) error.push("Fields Marked * are mandatory")
        if (!formData.policy_no.trim()) error.push("Fields Marked * are mandatory")
        if (!formData.insurer.trim()) error.push("Fields Marked * are mandatory")
        if (!formData.policy_type.trim()) error.push("Fields Marked * are mandatory")
        if (!formData.date_of_commencement.trim()) error.push("Fields Marked * are mandatory")
        if (!formData.date_of_last_premium.trim()) error.push("Fields Marked * are mandatory")
        if (!formData.date_of_maturity.trim()) error.push("Fields Marked * are mandatory")
        if (!formData.premium_amount) error.push("Fields Marked * are mandatory")
        if (!formData.sum_assured) error.push("Fields Marked * are mandatory")
        if (!formData.frequency.trim()) error.push("Fields Marked * are mandatory")
        if (!formData.policy_status.trim()) error.push("Fields Marked * are mandatory")
        return [...new Set(error)]
    }

    useEffect(() => {
        if (modifyItem && Object.keys(modifyItem).length > 0) {
            setFormData({
                ...newData,
                ...modifyItem,
                action: "modify",
            })
        } else {
            setFormData(newData)
        }
    }, [modifyItem])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }))
    }

    const handleSubmit = () => {
        const errors = validation()
        if (errors.length > 0) {
            setFormMessage(errors)
            return
        }
        console.log("Submitting form data:", formData)
        fetch(`${api}/portfolio/insurance/save/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            },
            body: JSON.stringify(formData),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log(data)
                if (data.status === "success") {
                    setFormMessage([data.message] || ["Policy saved successfully"])
                    setInsuranceData((prevData) => {
                        if (formData.action === "modify") {
                            return prevData.map((item) =>
                                item.policy_no === formData.policy_no ? formData : item
                            )
                        }
                        return [...prevData, formData]
                    })
                } else {
                    setFormMessage([data.message] || ["An error occurred while saving the policy"])
                }
            })
    }

    if (!showForm) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
            <div className="flex flex-col bg-neutral-900 border border-white/10 rounded-sm shadow-xl w-2/5 max-h-[100vh]">
                {/* Header */}
                <div className="flex flex-row p-1 items-center font-bold text-sm rounded-t-sm bg-amber-700 z-10">
                    <span>Insurance {formData.action}</span>
                    <span className="ms-auto" />
                    <button type="button" className="button-icon red text-xs" onClick={() => setShowForm(false)} >
                        X
                    </button>
                </div>

                <form autoComplete="off" className="grid grid-cols-2 gap-2 border bg-stone-900 rounded-b-sm w-full p-3 border-sky-900">
                    <div className="flex flex-col gap-2">
                        <label>Policy Name *</label>
                        <input type="text" className="uppercase" name="policy_name" value={formData.policy_name} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Policy No *</label>
                        <input type="text" name="policy_no" value={formData.policy_no} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Insurer *</label>
                        <input type="text" name="insurer" className=' uppercase' value={formData.insurer} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Policy Type *</label>
                        <select name="policy_type" value={formData.policy_type} onChange={handleChange}>
                            <option value="">Select Policy Type</option>
                            <option value="Endownment">Endownment</option>
                            <option value="ULOP">ULIP</option>
                            <option value="Term Insurance">Term Insurance</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Date of Commencement *</label>
                        <input type="date" name="date_of_commencement" value={formData.date_of_commencement} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Date of Last Premium *</label>
                        <input type="date" name="date_of_last_premium" value={formData.date_of_last_premium} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Date of Maturity *</label>
                        <input type="date" name="date_of_maturity" value={formData.date_of_maturity} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Premium Amount *</label>
                        <input type="number" name="premium_amount" value={formData.premium_amount} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Sum Assured *</label>
                        <input type="number" name="sum_assured" value={formData.sum_assured} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Frequency *</label>
                        <select name="frequency" value={formData.frequency} onChange={handleChange}>
                            <option value="">Select Frequency</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Half-Yearly">Half-Yearly</option>
                            <option value="Yearly">Yearly</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Agent Name</label>
                        <input type="text" name="agent_name" className='uppercase' value={formData.agent_name} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Policy Status</label>
                        <select name="policy_status" value={formData.policy_status} onChange={handleChange}>
                            <option value="">Select Policy Status</option>
                            <option value="Active">Active</option>
                            <option value="Lapsed">Lapsed</option>
                            <option value="Matured">Matured</option>
                            <option value="Claimed">Claimed</option>
                            <option value="Premium Fully Paid">Premium Full Paid</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2 col-span-2">
                        <label>Remarks</label>
                        <input type="text" name="remarks" value={formData.remarks} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Total Premium Paid</label>
                        <input type="number" name="total_premium_paid" value={formData.total_premium_paid} onChange={handleChange} readOnly />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label>Current Value</label>
                        <input type="number" name="current_value" value={formData.current_value} onChange={handleChange} />
                    </div>


                    {formMessage && (
                        <div className="col-span-2">
                            <DisplayFormMessage formMessage={formMessage} />
                        </div>
                    )}

                    <div className="flex flex-row gap-2 col-span-2 mt-2">
                        {formData.action == 'modify' && (

                            <button type="button" className="button-basic blue">
                                Delete
                            </button>
                        )}
                        <span className='ms-auto'></span>
                        <button type="button" className="button-basic green" onClick={handleSubmit}>
                            Save
                        </button>
                        <button type='button' className="button-basic red" onClick={() => setShowForm(false)}>
                            Cancel
                        </button>
                    </div>
                </form>
                {/* </div> */}
            </div>
        </div>
    )
}
export default PolicyForm