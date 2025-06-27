import React, { useContext, useRef, useState } from "react";
import AuthContext from "../../../templates/AuthContext";
import DisplayFormMessage from "../../../components/DisplayFormMessage";
import Loader from "../../../components/Loader";

const MutualFundsUpload = () => {
  const { api, token, client } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [formMessage, setFormMessage] = useState("");

  const uploadRef = useRef(null);
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFormMessage("No file selected");
      return;
    }
    setLoading(true);
    setLoadingMessage("Uploading mutual fund data...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("client_pan", client.pan);

    fetch(`${api}/portfolio/mutualfund/upload/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        setFormMessage(data.message);
        setLoading(false);
        setLoadingMessage("");
      });
  };

  return (
    <div className="flex flex-col w-full items-center shadow-xl">
      {loading && <Loader message={loadingMessage} />}
      <div className="w-full  px-2 text-sm font-bold z-10 border border-sky-900 py-1 rounded-t-sm bg-sky-950">Mutual Funds Upload</div>
      <form autoComplete="off" className="flex flex-col items-center border bg-stone-900 rounded-b-sm w-full p-3 border-sky-900">
        <div className="flex items-center gap-2 w-full">
          <label>Select CAMS Statement .pdf file for your PAN</label>
          <input ref={uploadRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
          <span className="ms-auto"></span>
          <button type="button" className="button-icon green" onClick={() => uploadRef.current.click()}>
            <i className="bi bi-upload"></i>
          </button>
        </div>
        {formMessage && (
          <div className="w-full mt-4">
            <DisplayFormMessage formMessage={[formMessage]} />
          </div>
        )}
      </form>
    </div>
  );
};

export default MutualFundsUpload;
