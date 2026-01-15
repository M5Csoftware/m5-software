"use client";
import React, { useEffect, useRef, useState, useContext } from "react";
import Image from "next/image";
import axios from "axios";
import KycVerificationTable from "./kycVerificationTable";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";

function KycVerification({ onBack }) {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("All");
  const [lineLeft, setLineLeft] = useState(0);
  const [lineWidth, setLineWidth] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });
  const lineRef = useRef(null);
  const { server } = useContext(GlobalContext);

  const tabs = ["All", "Pending", "Approved", "Rejected"];

  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  // Fetch KYC data from API
  useEffect(() => {
    const fetchKycData = async () => {
      try {
        const response = await axios.get(`${server}/kyc-software`);
        
        // Handle array response
        const data = Array.isArray(response.data) ? response.data : [response.data];

        // Map accounts to customer format
        const kycAccounts = data.map((account) => ({
          id: account._id,
          accountCode: account.accountCode,
          fullName: account.name || account.contactPerson,
          emailId: account.email,
           accountType: account.accountType, 
          mobileNumber: account.telNo,
          kycStatus: account.kycVerification?.status || "not_started",
          verificationType:
            account.kycVerification?.method === "digilocker"
              ? "DigiLocker"
              : "Manual Upload",
          businessType: account.kycVerification?.businessType || "",
          aadharNumber: account.kycVerification?.aadharNumber || "",
          documents: account.kycVerification?.documents || [],
          submittedAt: account.kycVerification?.submittedAt,
          verifiedAt: account.kycVerification?.verifiedAt,
          rejectedAt: account.kycVerification?.rejectedAt,
          rejectionReason: account.kycVerification?.rejectionReason || "",
        }));

        setCustomers(kycAccounts);
        setFilteredCustomers(kycAccounts);
      } catch (error) {
        console.error("Error fetching KYC data:", error);
        showNotification("error", "Failed to fetch KYC data");
      }
    };

    fetchKycData();
  }, [fetching, server]);

  // Filter logic
  useEffect(() => {
    let filtered = [...customers];

    // Filter by tab
    if (selectedTab !== "All") {
      const statusMap = {
        Pending: "under_review",
        Approved: "verified",
        Rejected: "rejected",
      };
      const status = statusMap[selectedTab];
      filtered = filtered.filter((customer) => customer.kycStatus === status);
    }

    // Filter by search
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (customer) =>
          (customer.fullName &&
            customer.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (customer.accountCode &&
            customer.accountCode.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, selectedTab, searchQuery]);

  // Animated underline for tabs
  useEffect(() => {
    const selectedElement = document.querySelector(
      `.kyc-tabs > li[data-tab='${selectedTab}']`
    );
    if (selectedElement && lineRef.current) {
      const ulElement = selectedElement.parentElement;
      setLineWidth(selectedElement.offsetWidth);
      setLineLeft(selectedElement.offsetLeft - ulElement.offsetLeft);
    }
  }, [selectedTab]);

  return (
    <div className="flex flex-col gap-8">
      {/* Notification Flag */}
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      {/* Header */}
      <div className="justify-center items-center overflow-hidden w-full">
        <div className="flex justify-between">
          <div className="flex items-start gap-3">
            {onBack && (
              <span onClick={onBack} className="cursor-pointer mt-1">
                <Image
                  src="./back-filled.svg"
                  alt="back_arrow"
                  width={15}
                  height={13}
                />
              </span>
            )}
            <div className="flex flex-col gap-1">
              <h1 className="text-[24px] font-bold">KYC Verification</h1>
              <p className="text-sm font-sans text-[#979797]">
                Manage all customer account kyc to be approved/not-approved here.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Content */}
      <div>
        {/* Tabs */}
        <div>
          <ul className="kyc-tabs list-none flex gap-6 font-sans font-semibold px-2">
            {tabs.map((tab) => (
              <li
                key={tab}
                data-tab={tab}
                style={{
                  cursor: "pointer",
                  fontSize: "14px",
                  color: selectedTab === tab ? "black" : "inherit",
                }}
                onClick={() => setSelectedTab(tab)}
              >
                {tab}
              </li>
            ))}
          </ul>
          <div className="relative mt-1">
            <div
              ref={lineRef}
              className="transition-all duration-400 rounded-t-lg absolute bottom-[1px] bg-[#EA1B40]"
              style={{ width: lineWidth, height: "3px", left: lineLeft }}
            ></div>
          </div>
        </div>

        {/* Search and Table */}
        <div className="bg-gray-100 border-gray-200 rounded-lg shadow-sm">
          <div className="flex justify-between p-3">
            {/* Search Bar */}
            <div className="border rounded-md overflow-hidden font-sans bg-white border-french-gray flex items-center gap-4 pl-6 text-sm">
              <Image alt="search" src="/search.svg" width={18} height={18} />
              <input
                className="outline-none h-9 pr-4 placeholder:font-semibold w-full"
                type="search"
                placeholder="Search customer"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <KycVerificationTable
            customers={filteredCustomers}
            refetchData={setFetching}
            showNotification={showNotification}
          />

          {/* No Results Message */}
          {filteredCustomers.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No customers found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default KycVerification;