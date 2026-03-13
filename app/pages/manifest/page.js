// pages/index.js
"use client";
import BranchManifest from "@/app/components/BranchManifest";
import {
  OutlinedButtonRed,
  RadioRedButton,
  SimpleButton,
} from "@/app/components/Buttons";
import ClientManifest from "@/app/components/ClientManifest";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, {
  DateInputBox,
  SearchInputBox,
} from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import {
  RadioButtonLarge,
  RadioMidRedButton,
} from "@/app/components/RadioButton";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import Image from "next/image";
import { useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";

// Loading states
const LOADING_STATES = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

// View Details Modal Component
const ViewDetailsModal = ({ isOpen, onClose, manifest, server, manifestType }) => {
  const [shipmentDetails, setShipmentDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accountNames, setAccountNames] = useState({});
  const [baggingLookup, setBaggingLookup] = useState({});

  useEffect(() => {
    if (isOpen && manifest) {
      fetchShipmentDetails();
    }
  }, [isOpen, manifest]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  const fetchAccountName = async (accountCode) => {
    try {
      console.log("Fetching account name for:", accountCode);
      const response = await axios.get(
        `${server}/customer-account?accountCode=${accountCode}`
      );

      console.log("Account response for", accountCode, ":", response.data);

      const name = response.data?.name || "N/A";

      console.log("Extracted name for", accountCode, ":", name);

      return name;
    } catch (err) {
      console.error("Error fetching account name for", accountCode, ":", err);
      return "N/A";
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const fetchShipmentDetails = async () => {
    if (!manifest) {
      setError("Invalid manifest data");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // For Branch manifests, fetch using runNo
      if (manifestType === "Branch") {
        console.log("Fetching branch shipments for runNo:", manifest.runNumber);
        
        // Fetch both bagging and branch bagging data
        const [baggingResponse, branchBaggingResponse] = await Promise.all([
          axios.get(`${server}/bagging?runNo=${manifest.runNumber.toUpperCase()}`).catch(() => null),
          axios.get(`${server}/branch-bagging?runNo=${manifest.runNumber.toUpperCase()}`).catch(() => null),
        ]);
        
        console.log("Bagging response:", baggingResponse?.data);
        console.log("Branch Bagging response:", branchBaggingResponse?.data);
        
        // Create bagging lookup
        const lookup = {};
        
        // Process regular bagging data
        if (baggingResponse?.data && baggingResponse.data.rowData) {
          baggingResponse.data.rowData.forEach((item) => {
            const awb = item.awbNo || item.childShipment;
            if (awb) {
              lookup[awb] = {
                bagNo: item.bagNo,
                mhbsNo: baggingResponse.data.mhbsNo,
              };
            }
          });
        }
        
        // Process branch bagging data
        if (branchBaggingResponse?.data && branchBaggingResponse.data.rowData) {
          branchBaggingResponse.data.rowData.forEach((item) => {
            const awb = item.awbNo || item.childShipment;
            if (awb) {
              lookup[awb] = {
                bagNo: item.bagNo,
                mhbsNo: branchBaggingResponse.data.mawb || "",
              };
            }
          });
        }
        
        setBaggingLookup(lookup);
        
        // Get unique AWB numbers from both bagging sources
        const awbNumbers = [...new Set(Object.keys(lookup))];
        
        console.log("Extracted AWB numbers:", awbNumbers);
        
        if (awbNumbers.length === 0) {
          setShipmentDetails([]);
          setLoading(false);
          return;
        }

        // Fetch shipments for each AWB number
        const allShipments = [];
        
        for (const awbNo of awbNumbers) {
          try {
            const shipmentResponse = await axios.get(
              `${server}/portal/get-shipments?awbNo=${awbNo}`
            );
            
            const shipment = shipmentResponse.data?.shipment;
            
            if (shipment) {
              allShipments.push(shipment);
            }
          } catch (err) {
            console.error("Error fetching shipment for AWB:", awbNo, err);
          }
        }

        console.log("Fetched shipments:", allShipments);
        setShipmentDetails(allShipments);

        // Fetch account names for all unique account codes
        const uniqueAccountCodes = [
          ...new Set(allShipments.map((s) => s.accountCode).filter(Boolean)),
        ];
        
        console.log("Unique account codes:", uniqueAccountCodes);
        
        const names = {};
        await Promise.all(
          uniqueAccountCodes.map(async (accountCode) => {
            const name = await fetchAccountName(accountCode);
            names[accountCode] = name;
          })
        );

        console.log("Fetched account names:", names);
        setAccountNames(names);
      } 
      // For Client manifests
      else {
        if (!manifest.mfuser) {
          setError("Invalid manifest data");
          setLoading(false);
          return;
        }

        console.log("Fetching shipments for account code:", manifest.mfuser);
        console.log("Manifest AWB numbers:", manifest.awbNumbers);

        const response = await axios.get(
          `${server}/portal/get-shipments?accountCode=${manifest.mfuser}`
        );

        console.log("Shipment response:", response.data);

        const shipments = response.data?.shipments || [];

        console.log("All shipments:", shipments);

        // Filter shipments that are in the manifest's AWB list
        const filteredShipments =
          manifest.awbNumbers && manifest.awbNumbers.length > 0
            ? shipments.filter((shipment) =>
                manifest.awbNumbers.includes(shipment.awbNo)
              )
            : shipments;

        console.log("Filtered shipments:", filteredShipments);

        setShipmentDetails(filteredShipments);

        // Fetch account names for all unique account codes
        const uniqueAccountCodes = [
          ...new Set(filteredShipments.map((s) => s.accountCode).filter(Boolean)),
        ];
        console.log("Unique account codes:", uniqueAccountCodes);

        const names = {};
        await Promise.all(
          uniqueAccountCodes.map(async (accountCode) => {
            const name = await fetchAccountName(accountCode);
            names[accountCode] = name;
          })
        );

        console.log("Fetched account names:", names);
        setAccountNames(names);
      }
    } catch (err) {
      console.error("Error fetching shipment details:", err);
      setError("Failed to fetch shipment details");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Function to download table data as Excel
  const downloadExcel = () => {
    if (shipmentDetails.length === 0) {
      alert("No data to download");
      return;
    }

    let excelData;
    
    if (manifestType === "Branch") {
      // Branch - Use Shipper table format
      excelData = shipmentDetails.map((shipment) => {
        const baggingInfo = baggingLookup[shipment.awbNo] || {};
        return {
          "AWB No": shipment.awbNo || "N/A",
          "Date": formatDate(shipment.date),
          "Bag No": baggingInfo.bagNo || "N/A",
          "Weight": shipment.totalActualWt || "0",
          "Shipper Name": shipment.shipperFullName || "N/A",
          "Shipper Address": [
            shipment.shipperAddressLine1,
            shipment.shipperAddressLine2,
            shipment.shipperCity,
            shipment.shipperState,
            shipment.shipperPincode,
          ]
            .filter(Boolean)
            .join(", ") || "N/A",
          "Shipper Phone": shipment.shipperPhoneNumber || "N/A",
          "Destination": shipment.destination || shipment.receiverCity || "N/A",
          "State": shipment.receiverState || "N/A",
          "Zip Code": shipment.receiverPincode || "N/A",
          "Service": shipment.service || "N/A",
          "Forwarding No": shipment.reference || "N/A",
          "Shipment Remark": shipment.shipmentType || "N/A",
        };
      });
    } else {
      // Client - Use existing format
      excelData = shipmentDetails.map((shipment) => ({
        "Account Code": shipment.accountCode || "N/A",
        "Customer Name": accountNames[shipment.accountCode] || "N/A",
        "AWB No": shipment.awbNo || "N/A",
        Service: shipment.service || "N/A",
        "Actual Weight (kg)": shipment.totalActualWt || "0",
        "Volume Weight (kg)": shipment.totalVolWt || "0",
      }));
    }

    // Convert to CSV format
    const headers = Object.keys(excelData[0]).join(",");
    const rows = excelData.map((row) => 
      Object.values(row).map(val => {
        const stringValue = String(val);
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(",")
    );
    const csv = [headers, ...rows].join("\n");

    // Create blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${manifestType}_${manifestType === "Branch" ? manifest?.runNumber : manifest?.manifestNo}_Details.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg w-[95%] max-w-[1600px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {manifestType === "Branch" ? "Run" : "Manifest"} Details - {manifestType === "Branch" ? manifest?.runNumber : manifest?.manifestNo}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-auto flex-1">
          {loading ? (
            <div className="text-center py-8">Loading shipment details...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    {manifestType === "Branch" ? (
                      <>
                        <th className="border p-2 text-left font-semibold whitespace-nowrap min-w-[100px]">
                          AWB No
                        </th>
                        <th className="border p-2 text-left font-semibold whitespace-nowrap min-w-[80px]">
                          Date
                        </th>
                        <th className="border p-2 text-left font-semibold whitespace-nowrap min-w-[70px]">
                          Bag No
                        </th>
                        <th className="border p-2 text-left font-semibold whitespace-nowrap min-w-[60px]">
                          Weight
                        </th>
                        <th className="border p-2 text-left font-semibold whitespace-nowrap min-w-[120px]">
                          Shipper Name
                        </th>
                        <th className="border p-2 text-left font-semibold whitespace-nowrap min-w-[200px]">
                          Shipper Address
                        </th>
                        <th className="border p-2 text-left font-semibold whitespace-nowrap min-w-[100px]">
                          Shipper Phone
                        </th>
                        <th className="border p-2 text-left font-semibold whitespace-nowrap min-w-[100px]">
                          Destination
                        </th>
                        <th className="border p-2 text-left font-semibold whitespace-nowrap min-w-[80px]">
                          State
                        </th>
                        <th className="border p-2 text-left font-semibold whitespace-nowrap min-w-[70px]">
                          Zip Code
                        </th>
                        <th className="border p-2 text-left font-semibold whitespace-nowrap min-w-[80px]">
                          Service
                        </th>
                        <th className="border p-2 text-left font-semibold whitespace-nowrap min-w-[100px]">
                          Forwarding No
                        </th>
                        <th className="border p-2 text-left font-semibold whitespace-nowrap min-w-[120px]">
                          Shipment Remark
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="border p-3 text-left font-semibold">
                          Account Code
                        </th>
                        <th className="border p-3 text-left font-semibold">
                          Customer Name
                        </th>
                        <th className="border p-3 text-left font-semibold">
                          AWB No
                        </th>
                        <th className="border p-3 text-left font-semibold">
                          Service
                        </th>
                        <th className="border p-3 text-left font-semibold">
                          Actual Wt
                        </th>
                        <th className="border p-3 text-left font-semibold">
                          Volume Weight
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {shipmentDetails.length === 0 ? (
                    <tr>
                      <td
                        colSpan={manifestType === "Branch" ? "13" : "6"}
                        className="border p-4 text-center text-gray-500"
                      >
                        No shipment details found
                      </td>
                    </tr>
                  ) : manifestType === "Branch" ? (
                    shipmentDetails.map((shipment, index) => {
                      const baggingInfo = baggingLookup[shipment.awbNo] || {};
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border p-2">
                            {shipment.awbNo || "N/A"}
                          </td>
                          <td className="border p-2 whitespace-nowrap">
                            {formatDate(shipment.date)}
                          </td>
                          <td className="border p-2">
                            {baggingInfo.bagNo || "N/A"}
                          </td>
                          <td className="border p-2">
                            {shipment.totalActualWt || "0"}
                          </td>
                          <td className="border p-2">
                            {shipment.shipperFullName || "N/A"}
                          </td>
                          <td className="border p-2 max-w-[200px] truncate" title={[
                              shipment.shipperAddressLine1,
                              shipment.shipperAddressLine2,
                              shipment.shipperCity,
                              shipment.shipperState,
                              shipment.shipperPincode,
                            ]
                              .filter(Boolean)
                              .join(", ")}>
                            {[
                              shipment.shipperAddressLine1,
                              shipment.shipperAddressLine2,
                              shipment.shipperCity,
                              shipment.shipperState,
                              shipment.shipperPincode,
                            ]
                              .filter(Boolean)
                              .join(", ") || "N/A"}
                          </td>
                          <td className="border p-2">
                            {shipment.shipperPhoneNumber || "N/A"}
                          </td>
                          <td className="border p-2">
                            {shipment.destination || shipment.receiverCity || "N/A"}
                          </td>
                          <td className="border p-2">
                            {shipment.receiverState || "N/A"}
                          </td>
                          <td className="border p-2">
                            {shipment.receiverPincode || "N/A"}
                          </td>
                          <td className="border p-2">
                            {shipment.service || "N/A"}
                          </td>
                          <td className="border p-2">
                            {shipment.reference || "N/A"}
                          </td>
                          <td className="border p-2">
                            {shipment.shipmentType || "N/A"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    shipmentDetails.map((shipment, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border p-3">
                          {shipment.accountCode || "N/A"}
                        </td>
                        <td className="border p-3">
                          {accountNames[shipment.accountCode] || "Loading..."}
                        </td>
                        <td className="border p-3">
                          {shipment.awbNo || "N/A"}
                        </td>
                        <td className="border p-3">
                          {shipment.service || "N/A"}
                        </td>
                        <td className="border p-3">
                          {shipment.totalActualWt || "0"} kg
                        </td>
                        <td className="border p-3">
                          {shipment.totalVolWt || "0"} kg
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center p-6 border-t">
          <button
            onClick={downloadExcel}
            className="px-6 py-2 bg-red text-white rounded flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Download Excel
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Manifest() {
  const { register, setValue, watch, reset } = useForm();

  // State management
  const [demoRadio, setDemoRadio] = useState("Client");
  const [selectedManifest, setSelectedManifest] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowData, setRowData] = useState([]);
  const [clientManifestData, setClientManifestData] = useState([]);
  const [branchManifestData, setBranchManifestData] = useState([]);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.IDLE);
  const { server } = useContext(GlobalContext);
  const [error, setError] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedManifestForView, setSelectedManifestForView] = useState(null);

  const { accounts } = useContext(GlobalContext);

  const customerCode = watch("code");
  const customerName = watch("customerName");
  const branchName = watch("branch");

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const normalizeDate = (val) => {
    if (!val) return null;

    // already ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [d, m, y] = val.split("/");
      return `${y}-${m}-${d}`;
    }

    return null;
  };

  // Watch form values for filtering
  const fromRaw = watch("from");
  const toRaw = watch("to");

  const fromDate = normalizeDate(fromRaw);
  const toDate = normalizeDate(toRaw);

  // Auto-populate customer name based on code
  useEffect(() => {
    if (!customerCode) {
      setValue("customerName", "");
      return;
    }

    const matchedAccount = accounts?.find(
      (account) =>
        account.accountCode?.toUpperCase() === customerCode.toUpperCase()
    );

    setValue("customerName", matchedAccount?.name || "");
  }, [customerCode, accounts, setValue]);

  // Table columns configuration
  const columns = useMemo(
    () => ({
      Branch: [
        { key: "runNumber", label: "Run Number" },
        { key: "mfdate", label: "MF Date" },
        { key: "mode", label: "Mode" },
        { key: "obc", label: "OBC" },
        { key: "branch", label: "Branch" },
        { key: "origin", label: "Origin" },
        { key: "destination", label: "Destination" },
        { key: "status", label: "Status" },
        { key: "noOfBags", label: "No of Bags" },
        { key: "noOfAwb", label: "No of AWB" },
        { key: "totalWeight", label: "Total Weight" },
        { key: "view", label: "View", isAction: true },
      ],
      Client: [
        { key: "manifestNo", label: "Manifest No." },
        { key: "mfdate", label: "MF Date" },
        { key: "mfbranch", label: "MF Branch" },
        { key: "tobranch", label: "To Branch" },
        { key: "countShip", label: "Count Ship" },
        { key: "toPcs", label: "To Pcs" },
        { key: "toWeight", label: "To Weight" },
        { key: "mfuser", label: "MF User" },
        { key: "mfdispatch", label: "MF Dispatch" },
        { key: "mfstatus", label: "MF Status" },
        { key: "view", label: "View", isAction: true },
      ],
    }),
    []
  );

  // Utility function to check if date is within range
  const isDateInRange = useCallback((dateString, fromDate, toDate) => {
    if (!fromDate && !toDate) return true;
    if (!dateString) return false;

    // Convert dateString to ISO format
    const manifestISO = normalizeDate(
      new Date(dateString).toISOString().split("T")[0]
    );

    if (!manifestISO) return false;

    if (fromDate && manifestISO < fromDate) return false;
    if (toDate && manifestISO > toDate) return false;

    return true;
  }, []);

  // Fetch origin and destination from run-entry
  const fetchRunDetails = useCallback(async (runNo) => {
    try {
      const response = await axios.get(`${server}/run-entry?runNo=${runNo.toUpperCase()}`);
      return {
        origin: response.data?.origin || "N/A",
        destination: response.data?.destination || "N/A",
      };
    } catch (error) {
      console.error("Error fetching run details:", error);
      return { origin: "N/A", destination: "N/A" };
    }
  }, [server]);

  // Transform branch manifest data for table display
  const transformBranchManifestForTable = useCallback(
    async (manifest) => {
      // Fetch origin and destination
      const runDetails = await fetchRunDetails(manifest.runNo);
      
      return {
        runNumber: manifest.runNo || "N/A",
        mfdate:
          manifest.date || new Date(manifest.createdAt).toLocaleDateString(),
        mode: manifest.transportType || "N/A",
        obc: manifest.obc || "NO",
        branch: manifest.origin || manifest.destination || "N/A",
        origin: runDetails.origin,
        destination: runDetails.destination,
        status: "Active",
        noOfBags: manifest.noOfBags?.toString() || "0",
        noOfAwb: manifest.noOfAwb?.toString() || "0",
        totalWeight:
          manifest.runWeight?.toString() ||
          manifest.totalWeight?.toString() ||
          "0",
        view: "View",
        _id: manifest._id,
      };
    },
    [fetchRunDetails]
  );

  // Transform client manifest data for table display
  const transformClientManifestForTable = useCallback((manifest) => {
    console.log(manifest);
    return {
      manifestNo: manifest.manifestNumber || "N/A",
      mfdate: new Date(manifest.createdAt).toLocaleDateString(),
      mfbranch: manifest.pickupAddress?.city || "N/A",
      tobranch: manifest.pickupAddress?.state || "N/A",
      countShip: manifest.awbNumbers?.length?.toString() || "0",
      toPcs: manifest.totalPcs?.toString() || "0",
      toWeight: manifest.totalWeight?.toString() || "0",
      mfuser: manifest.accountCode || "System",
      mfdispatch: manifest.pickupType || "pickup",
      mfstatus: manifest.status || "Active",
      view: "View",
      _id: manifest._id,
      awbNumbers: manifest.awbNumbers,
    };
  }, []);

  // Check if we should show manifests
  const shouldShowManifests = useMemo(() => {
    return fromDate || toDate || customerCode || branchName || searchTerm;
  }, [fromDate, toDate, customerCode, branchName, searchTerm]);

  // Filter manifests based on current tab and filters
  const filteredManifests = useMemo(() => {
    if (!shouldShowManifests) {
      return [];
    }

    const currentData =
      demoRadio === "Branch" ? branchManifestData : clientManifestData;

    return currentData.filter((manifest) => {
      let searchField = "";
      if (demoRadio === "Branch") {
        searchField = manifest.runNo?.toLowerCase() || "";
      } else {
        searchField = manifest.manifestNumber?.toLowerCase() || "";
      }

      const matchesSearch = searchField.includes(searchTerm.toLowerCase());

      const dateField =
        demoRadio === "Branch" ? manifest.createdAt : manifest.createdAt;
      const matchesDateRange = isDateInRange(dateField, fromDate, toDate);

      let matchesCustomer = true;
      if (demoRadio === "Client" && customerCode) {
        matchesCustomer = manifest.accountCode
          ?.toUpperCase()
          .includes(customerCode.toUpperCase());
      }

      let matchesBranch = true;
      if (demoRadio === "Branch" && branchName) {
        const searchTerm = branchName.toLowerCase();
        const runNo = (manifest.runNo || "").toLowerCase();
        const hub = (manifest.hub || "").toLowerCase();
        const destination = (manifest.destination || "").toLowerCase();
        const origin = (manifest.origin || "").toLowerCase();

        matchesBranch =
          runNo.includes(searchTerm) ||
          hub.includes(searchTerm) ||
          destination.includes(searchTerm) ||
          origin.includes(searchTerm);
      }

      return (
        matchesSearch && matchesDateRange && matchesCustomer && matchesBranch
      );
    });
  }, [
    shouldShowManifests,
    demoRadio,
    branchManifestData,
    clientManifestData,
    searchTerm,
    fromDate,
    toDate,
    customerCode,
    branchName,
    isDateInRange,
  ]);

  // API call functions
  const fetchClientManifestData = useCallback(async () => {
    try {
      const response = await axios.get(`${server}/portal/get-manifest`);
      const { data } = response;
      console.log("Client Manifest Data:", data);

      if (data.success && data.manifests) {
        const manifestsWithWeights = await Promise.all(
          data.manifests.map(async (manifest) => {
            let totalWeight = 0;
            let totalPcs = 0;

            if (
              Array.isArray(manifest.awbNumbers) &&
              manifest.awbNumbers.length > 0
            ) {
              try {
                const shipmentResponse = await axios.get(
                  `${server}/portal/get-shipments?accountCode=${manifest.accountCode}`
                );

                const shipments = shipmentResponse.data?.shipments || [];
                console.log("Shipments for", manifest.accountCode, shipments);

                shipments.forEach((shipment) => {
                  console.log("Processing shipment:", shipment);
                  totalWeight += Number(shipment.totalActualWt || 0);
                  totalPcs += Number(shipment.pcs || 1);
                });
              } catch (shipmentError) {
                console.error(
                  "Error fetching shipment data for manifest:",
                  manifest._id,
                  shipmentError
                );
              }
            }

            return {
              ...manifest,
              totalWeight,
              totalPcs,
            };
          })
        );
        setClientManifestData(manifestsWithWeights);
      }
    } catch (error) {
      console.error("Error fetching client manifest data:", error);
      setError("Failed to fetch client manifests");
      showNotification("error", "Failed to fetch client manifests");
      throw error;
    }
  }, [server]);

  const fetchBranchManifestData = useCallback(async () => {
    try {
      const response = await axios.get(`${server}/branch-bagging`);

      const manifests = Array.isArray(response.data)
        ? response.data
        : response.data.manifests || response.data.data || [];

      setBranchManifestData(manifests);
    } catch (error) {
      console.error("Error fetching branch manifest data:", error);
      setError("Failed to fetch branch manifests");
      showNotification("error", "Failed to fetch branch manifests");
      throw error;
    }
  }, [server]);

  // Combined fetch function
  const fetchManifestData = useCallback(
    async (manifestType = null) => {
      const typeToFetch = manifestType || demoRadio;
      setLoadingState(LOADING_STATES.LOADING);
      setError(null);

      try {
        if (typeToFetch === "Branch") {
          await fetchBranchManifestData();
        } else {
          await fetchClientManifestData();
        }
        setLoadingState(LOADING_STATES.SUCCESS);
      } catch (error) {
        setLoadingState(LOADING_STATES.ERROR);
      }
    },
    [demoRadio, fetchBranchManifestData, fetchClientManifestData]
  );

  // Handle radio button change
  const handleRadioChange = useCallback(
    (value) => {
      setDemoRadio(value);
      setRowData([]);
      setSelectedManifest(null);
      setSearchTerm("");
      setError(null);

      reset({
        code: "",
        customerName: "",
        branch: "",
        from: "",
        to: "",
      });

      fetchManifestData(value);
    },
    [reset, fetchManifestData]
  );

  // Handle view button click
  const handleViewClick = (row) => {
    setSelectedManifestForView(row);
    setIsViewModalOpen(true);
  };

  // Handle show button click
  const handleShowClick = useCallback(async () => {
    if (!fromDate && !toDate && !customerCode && !branchName && !searchTerm) {
      showNotification("error", "Enter date range or filter");
      return;
    }

    if ((fromRaw && !fromDate) || (toRaw && !toDate)) {
      showNotification("error", "Invalid date format");
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      showNotification("error", "From date cannot be after To date");
      return;
    }

    let transformedData;
    if (demoRadio === "Branch") {
      // For Branch, we need to fetch run details for each manifest
      transformedData = await Promise.all(
        filteredManifests.map(transformBranchManifestForTable)
      );
    } else {
      transformedData = filteredManifests.map(transformClientManifestForTable);
    }

    setRowData(transformedData);

    showNotification("success", `Loaded ${transformedData.length} record(s)`);
  }, [
    demoRadio,
    filteredManifests,
    fromDate,
    toDate,
    fromRaw,
    toRaw,
    customerCode,
    branchName,
    searchTerm,
    transformBranchManifestForTable,
    transformClientManifestForTable,
  ]);

  // Handle manifest selection from sidebar
  const handleManifestSelect = useCallback(
    async (manifest) => {
      setSelectedManifest(manifest);

      if (demoRadio === "Branch") {
        const manifestDetails = [await transformBranchManifestForTable(manifest)];
        setRowData(manifestDetails);
      } else if (demoRadio === "Client") {
        const manifestDetails = [transformClientManifestForTable(manifest)];
        setRowData(manifestDetails);
      }
    },
    [
      demoRadio,
      transformBranchManifestForTable,
      transformClientManifestForTable,
    ]
  );

  // Initialize data on component mount
  useEffect(() => {
    fetchManifestData();
  }, [fetchManifestData]);

  // Get current columns based on selected radio button
  const currentColumns = columns[demoRadio] || [];

  // Search placeholder based on current tab
  const searchPlaceholder = demoRadio === "Branch" ? "Run No" : "Manifest No";

  return (
    <div className="w-full flex flex-col gap-[17px]">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading title="Manifest" bulkUploadBtn="hidden" codeListBtn="hidden" />

      {/* View Details Modal */}
      <ViewDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        manifest={selectedManifestForView}
        server={server}
        manifestType={demoRadio}
      />

      {/* Radio Button Selection */}
      <div className="flex w-full gap-3">
        {["Client", "Branch"].map((type) => (
          <RadioButtonLarge
            key={type}
            id={type}
            label={type}
            name="accountType"
            register={register}
            setValue={setValue}
            selectedValue={demoRadio}
            setSelectedValue={handleRadioChange}
          />
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filter Section */}
      <div className="flex flex-col gap-4 w-full mt-3">
        <div className="flex gap-4 w-full">
          <div className="flex gap-6 w-full">
            <div className="w-[300px] bg-white border-2 rounded-lg h-[56.2vh]">
              <div className="p-3 border-b border-gray-200">
                <SearchInputBox
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {loadingState === LOADING_STATES.LOADING ? (
                  <div className="text-center text-gray-500 py-4">
                    Loading...
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredManifests.map((manifest) => (
                      <div
                        key={manifest._id}
                        className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer ${
                          selectedManifest?._id === manifest._id
                            ? "bg-blue-50 border border-blue-200"
                            : ""
                        }`}
                        onClick={() => handleManifestSelect(manifest)}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-800">
                            {demoRadio === "Branch"
                              ? manifest.runNo
                              : manifest.manifestNumber}
                          </span>
                          <span className="text-xs text-gray-500">
                            {demoRadio === "Branch"
                              ? `${manifest.noOfAwb || 0} AWBs`
                              : `${manifest.awbNumbers?.length || 0} AWBs`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Image
                            src="/link.svg"
                            alt="Edit"
                            width={12}
                            height={12}
                          />
                        </div>
                      </div>
                    ))}
                    {filteredManifests.length === 0 && shouldShowManifests && (
                      <div className="text-center text-gray-500 py-4">
                        No manifests found for the selected criteria
                      </div>
                    )}
                    {!shouldShowManifests && (
                      <div className="text-center text-gray-500 py-4">
                        Enter date range or filter criteria to view manifests
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full flex flex-col gap-3">
              <div className="flex gap-3">
                {/* Date Range Inputs */}
                <div className="w-[20%]">
                  <DateInputBox
                    register={register}
                    setValue={setValue}
                    value="from"
                    placeholder="From"
                  />
                </div>
                <div className="w-[20%]">
                  <DateInputBox
                    register={register}
                    setValue={setValue}
                    value="to"
                    placeholder="To"
                  />
                </div>

                {/* Client-specific inputs */}
                {demoRadio === "Client" && (
                  <>
                    <div className="w-[20%]">
                      <InputBox
                        placeholder="Code"
                        register={register}
                        setValue={setValue}
                        value="code"
                      />
                    </div>
                    <div className="w-[25%]">
                      <DummyInputBoxWithLabelDarkGray
                        register={register}
                        label="Customer Name"
                        setValue={setValue}
                        value="customerName"
                        inputValue={customerName || ""}
                      />
                    </div>
                  </>
                )}

                {/* Branch-specific input */}
                {demoRadio === "Branch" && (
                  <div className="w-[536px]">
                    <InputBox
                      placeholder="Branch"
                      register={register}
                      setValue={setValue}
                      value="branch"
                    />
                  </div>
                )}

                {/* Show Button */}
                <div className="w-[15%]">
                  <OutlinedButtonRed label={"Show"} onClick={handleShowClick} />
                </div>
              </div>
              <div className="">
                {/* Table for both Client and Branch */}
                <div className="h-[50.7vh] overflow-x-auto table-scrollbar rounded-lg border border-battleship-gray text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        {currentColumns.map((col) => (
                          <th
                            key={col.key}
                            className="p-3 text-left text-xs font-semibold border-b"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rowData.map((row, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          {currentColumns.map((col) => (
                            <td key={col.key} className="p-3 text-xs">
                              {col.isAction && col.key === "view" ? (
                                <button
                                  onClick={() => handleViewClick(row)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                                >
                                  View
                                </button>
                              ) : (
                                row[col.key]
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}