import React, { useContext } from 'react'

const Basetemplate = ({ children }) => {
    return (
        <div className='flex flex-col'>
            <header className='bg-blue-500 text-white p-2'>
                <h1 className='text-2xl'>FinLog</h1>
                <nav className='bg-gray-200 p-4'>
                    <ul className='flex space-x-4'>
                        <li><a href="/" className='text-blue-600'>Home</a></li>
                        <li><a href="/about" className='text-blue-600'>About</a></li>
                        <li><a href="/contact" className='text-blue-600'>Contact</a></li>
                    </ul>
                </nav>
            </header>
            <main className='p-4'>
                {children}
            </main>
            <footer className='bg-gray-800 text-white p-4 mt-4'>
                <p className='text-center'>© 2023 My Application</p>
            </footer>
        </div>
    )
}

export default Basetemplate