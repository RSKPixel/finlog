import React from 'react'

const DisplayFormMessage = ({ formMessage = [] }) => {
    return (
        <div className="text-red-500 text-xs italic w-full text-center">
            {formMessage.map((msg, index) => (
                <p key={index}>{msg}</p>
            ))}
        </div>
    );
};

export default DisplayFormMessage