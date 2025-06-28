import React from "react";

const DisplayFormMessage = ({ formMessage = [] }) => {
  return (
    <div className="flex flex-col gap-0 text-red-500 text-xs italic w-full text-center">
      {formMessage[0].map((msg, index) => (
        <span key={index}>{msg}</span>
      ))}
    </div>
  );
};

export default DisplayFormMessage;
