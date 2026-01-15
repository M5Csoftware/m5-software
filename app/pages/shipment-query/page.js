"use client";
import React, { useState, useCallback } from "react";
import ShipmentQuery from "./ShipmentQuery";
import RegisterComplaint from "../register-complaint/RegisterComplaint";

export default function Page() {
  const [registerComplaint, setRegisterComplaint] = useState(false);

  const handleRegisterComplaint = useCallback((value) => {
    setRegisterComplaint(Boolean(value));
    // console.log("value", value);
  }, []);

  return registerComplaint ? (
    <RegisterComplaint setRegisterComplaint={handleRegisterComplaint} />
  ) : (
    <ShipmentQuery setRegisterComplaint={handleRegisterComplaint} />
  );
}
