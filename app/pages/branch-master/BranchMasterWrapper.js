"use client";
import { BranchProvider } from "@/app/Context/BranchContext";
import React from "react";

const BranchMasterWrapper = ({ children }) => {
  return <BranchProvider>{children}</BranchProvider>;
};

export default BranchMasterWrapper;
