"use client";
import React, { useState, useCallback } from "react";
import ShipmentQuery from "./ShipmentQuery";
import RegisterComplaint from "../register-complaint/RegisterComplaint";

export default function Page() {
  const [showRegisterComplaint, setShowRegisterComplaint] = useState(false);
  const [selectedAwbNo, setSelectedAwbNo] = useState("");

  const handleRegisterComplaint = useCallback((value, awbNo = "") => {
    if (typeof value === "boolean") {
      setShowRegisterComplaint(value);
      if (awbNo) {
        setSelectedAwbNo(awbNo);
      }
    } else {
      setShowRegisterComplaint(false);
      setSelectedAwbNo("");
    }
  }, []);

  return showRegisterComplaint ? (
    <RegisterComplaint
      setRegisterComplaint={handleRegisterComplaint}
      initialAwbNo={selectedAwbNo}
    />
  ) : (
    <ShipmentQuery setRegisterComplaint={handleRegisterComplaint} />
  );
}
