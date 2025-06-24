import React, { useContext } from 'react'
import AuthContext from './AuthContext'

const Basetemplate = ({ children }) => {

    const { api, loggedIn, client } = useContext(AuthContext)

    return (
        <div className='flex flex-col'>
            <div className='flex flex-row fixed w-full justify-between items-center  bg-violet-700 px-4 py-1 shadow-sm text-white'>
                <h1 className='text-2xl font-bold'>FinLog</h1>
                <div className='ms-auto'></div>
                {loggedIn &&
                    <span className='font-bold'>{client.name} ({client.pan})</span>
                }
            </div>
            <div className='flex flex-col mt-15 items-center justify-center text-white'>
                {children}
            </div>
        </div>
    )
}

export default Basetemplate