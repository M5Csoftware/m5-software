"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import React, { useContext, useMemo, useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import NotificationFlag from "@/app/components/Notificationflag";
import { useAuth } from "@/app/Context/AuthContext"; // ✅ Import useAuth
import pushAWBLog from "@/app/lib/pushAWBLog"; // ✅ Import pushAWBLog

function QuickIncan() {
  const { server } = useContext(GlobalContext);
  const { user } = useAuth(); // ✅ Get user from AuthContext
  const { register, setValue, watch, handleSubmit, reset } = useForm();
  const [totalWeight, setTotalWeight] = useState(0);
  const [rowData, setRowData] = useState([]);
  const [cdNumber, setCdNumber] = useState("");
  const [currentClientData, setCurrentClientData] = useState(null);
  const [allClientsData, setAllClientsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formKey, setFormKey] = useState(0);
  const [entryFieldsKey, setEntryFieldsKey] = useState(0);
  const [isFetchingClient, setIsFetchingClient] = useState(false);
  const [clientSearchError, setClientSearchError] = useState(false);

  const notification = useRef({
    type: "success",
    message: "",
    visible: false,
  });
  const [notificationState, setNotificationState] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    notification.current = { type, message, visible: true };
    setNotificationState({ type, message, visible: true });
  };

  const columns = useMemo(
    () => [
      { key: "receiveDate", label: "Receive Date" },
      { key: "clientName", label: "Client Name" },
      { key: "awbNo", label: "AWB No" },
      { key: "receivedWeight", label: "Received Weight" },
      { key: "remark", label: "Remark" },
    ],
    []
  );

  // Watch for changes in form fields
  const watchCdNumber = watch("cdNumber");
  const watchClientCode = watch("client");
  const watchAwb = watch("airwaybill");
  const watchWeight = watch("weight");
  const watchRemark = watch("remark");

  // Handle Refresh - Clear all fields and data
  const handleRefresh = () => {
    // Reset all form fields
    reset();

    // Clear all state
    setTotalWeight(0);
    setRowData([]);
    setCdNumber("");
    setCurrentClientData(null);
    setAllClientsData([]);
    setLoading(false);
    setClientSearchError(false);

    // Force re-render of form
    setFormKey((prev) => prev + 1);
    setEntryFieldsKey((prev) => prev + 1);
    setRefreshKey((prev) => prev + 1);

    showNotification("success", "Form refreshed successfully");
  };

  // Handle New button click - log CD Number
  const handleNewClick = () => {
    if (watchCdNumber) {
      // console.log("CD Number:", watchCdNumber);
      setCdNumber(watchCdNumber);
      showNotification("success", "CD Number locked successfully");
    } else {
      showNotification("error", "Please enter CD Number");
    }
  };

  // Debounce function
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  // Debounced client code
  const debouncedClientCode = useDebounce(watchClientCode, 500);

  // Fetch client details when debounced client code changes
  useEffect(() => {
    const fetchClientData = async () => {
      if (!debouncedClientCode || debouncedClientCode.trim() === "") {
        // Clear fields if client code is empty
        setValue("clientState", "");
        setValue("email", "");
        setCurrentClientData(null);
        setClientSearchError(false);
        return;
      }

      try {
        setIsFetchingClient(true);
        setClientSearchError(false);

        const response = await axios.get(
          `${server}/quick-inscan/client?accountCode=${debouncedClientCode}`,
          { timeout: 5000 }
        );

        if (response.data.success) {
          const client = response.data.data;
          setCurrentClientData(client);

          // Set client name
          setValue("clientState", client.name || "");

          // Set email (handle multiple emails)
          setValue("email", client.email || "");

          // Set today's date
          const today = new Date().toISOString().split("T")[0];
          setValue("receiveAmt", today);

          setClientSearchError(false);
        } else {
          // Client not found but API returned success false
          setValue("clientState", "");
          setValue("email", "");
          setCurrentClientData(null);
          setClientSearchError(true);
        }
      } catch (error) {
        console.error("Error fetching client data:", error);
        // Don't show error notification for debounced searches
        // Only clear fields
        setValue("clientState", "");
        setValue("email", "");
        setCurrentClientData(null);
        setClientSearchError(true);
      } finally {
        setIsFetchingClient(false);
      }
    };

    fetchClientData();
  }, [debouncedClientCode, server, setValue]);

  // Add row to table - Clear Client Code, AWB, Weight, and Remark fields
  const handleAddToTable = () => {
    if (!cdNumber) {
      showNotification(
        "error",
        "Please enter CD Number and click New button first"
      );
      return;
    }

    if (!watchAwb || !watchWeight) {
      showNotification("error", "Please enter AWB and Received Weight");
      return;
    }

    if (!currentClientData) {
      showNotification("error", "Please enter valid Client Code first");
      return;
    }

    const receiveDate =
      watch("receiveAmt") || new Date().toISOString().split("T")[0];

    const newRow = {
      receiveDate: receiveDate,
      clientName: currentClientData.name,
      clientEmail: currentClientData.email,
      clientCode: currentClientData.accountCode,
      awbNo: watchAwb,
      receivedWeight: parseFloat(watchWeight) || 0,
      remark: watchRemark || "",
    };

    const updatedRowData = [...rowData, newRow];
    setRowData(updatedRowData);

    // Add client to allClientsData if not already present
    const clientExists = allClientsData.some(
      (client) => client.accountCode === currentClientData.accountCode
    );

    if (!clientExists) {
      setAllClientsData([...allClientsData, currentClientData]);
    }

    // Calculate total weight
    const total = updatedRowData.reduce(
      (sum, row) => sum + parseFloat(row.receivedWeight || 0),
      0
    );
    setTotalWeight(total.toFixed(2));

    // Clear current client data first
    setCurrentClientData(null);
    setClientSearchError(false);

    // Clear all entry fields
    setValue("client", "", { shouldValidate: false, shouldDirty: false });
    setValue("airwaybill", "", { shouldValidate: false, shouldDirty: false });
    setValue("weight", "", { shouldValidate: false, shouldDirty: false });
    setValue("remark", "", { shouldValidate: false, shouldDirty: false });
    setValue("clientState", "", { shouldValidate: false, shouldDirty: false });
    setValue("email", "", { shouldValidate: false, shouldDirty: false });

    // Force re-render of ONLY entry fields (not CD Number)
    setEntryFieldsKey((prev) => prev + 1);

    // Focus back to Client Code field for quick entry
    setTimeout(() => {
      const clientInput = document.querySelector(
        'input[placeholder="Client Code"]'
      );
      if (clientInput) {
        clientInput.focus();
      }
    }, 100);

    showNotification("success", "Entry added to table successfully");
  };

  // ✅ Helper function to get customer name from account code
  const getCustomerName = async (accountCode) => {
    if (!accountCode) return "";
    try {
      const customerResponse = await axios.get(
        `${server}/customer-account?accountCode=${accountCode}`
      );
      return customerResponse.data?.name || "";
    } catch (err) {
      console.warn("Failed to fetch customer name:", err);
      return "";
    }
  };

  // Send email to all clients and save to EventActivity + AWB Log
  const handleSendMail = async () => {
    // console.log("=== Send Mail Button Clicked ===");
    // console.log("CD Number:", cdNumber);
    // console.log("Row Data:", rowData);
    // console.log("All Clients Data:", allClientsData);

    if (!cdNumber) {
      showNotification("error", "Please enter CD Number and click New button");
      return;
    }

    if (rowData.length === 0) {
      showNotification("error", "Please add at least one entry to the table");
      return;
    }

    if (allClientsData.length === 0) {
      showNotification("error", "No client data available");
      return;
    }

    try {
      setLoading(true);

      // Group rows by client
      const clientGroups = {};

      rowData.forEach((row) => {
        if (!clientGroups[row.clientCode]) {
          clientGroups[row.clientCode] = {
            clientName: row.clientName,
            clientEmail: row.clientEmail,
            clientCode: row.clientCode,
            rows: [],
          };
        }
        clientGroups[row.clientCode].rows.push(row);
      });

      // console.log("Client Groups:", clientGroups);

      const emailData = {
        cdNumber: cdNumber,
        receiveDate:
          watch("receiveAmt") || new Date().toISOString().split("T")[0],
        clientGroups: clientGroups,
        totalWeight: totalWeight,
        totalRows: rowData.length,
      };

      // console.log("Sending email data:", emailData);
      // console.log("API URL:", `${server}/quick-inscan/send-email`);

      const response = await axios.post(
        `${server}/quick-inscan/send-email`,
        emailData
      );

      // console.log("Email response:", response.data);

      if (response.data.success) {
        showNotification(
          "success",
          `Email sent successfully to ${response.data.emailsSent} client(s) and data saved to EventActivity!`
        );

        // ✅ PUSH AWB LOGS FOR EACH ROW
        // console.log("📝 Starting AWB log creation for all entries...");

        for (const row of rowData) {
          if (row.awbNo) {
            try {
              const customer = await getCustomerName(row.clientCode);

              const awbLogPayload = {
                awbNo: row.awbNo,
                accountCode: row.clientCode,
                customer: customer || row.clientName, // Fallback to clientName if fetch fails
                action: "Quick Inscan - Load Receiving",
                actionUser: user?.userId || "System",
              };

              // console.log("📝 Pushing AWB log for:", row.awbNo, awbLogPayload);

              const awbLogResponse = await pushAWBLog(awbLogPayload);

              // console.log("✅ AWB log created for:", row.awbNo, awbLogResponse);
            } catch (awbLogError) {
              console.error(
                "❌ Failed to create AWB log for:",
                row.awbNo,
                awbLogError
              );
              // Continue with other AWBs even if one fails
            }
          }
        }

        // console.log("✅ All AWB logs processed");

        // Refresh form after successful submission
        handleRefresh();
      } else {
        showNotification(
          "error",
          "Failed to send email: " + response.data.message
        );
      }
    } catch (error) {
      console.error("Error sending email:", error);
      console.error("Error response:", error.response?.data);
      showNotification(
        "error",
        "Error sending email: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Get button state based on validation
  const isAddToTableDisabled =
    loading ||
    isFetchingClient ||
    !currentClientData ||
    !cdNumber ||
    !watchAwb ||
    !watchWeight;
  const isSendMailDisabled = loading || rowData.length === 0;

  return (
    <form className="flex flex-col gap-3">
      <NotificationFlag
        type={notificationState.type}
        message={notificationState.message}
        visible={notificationState.visible}
        setVisible={(v) =>
          setNotificationState({ ...notificationState, visible: v })
        }
      />
      <Heading
        title="Quick Scan (Load Receiving)"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="flex flex-col gap-3 mt-3">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <InputBox
              key={`cdNumber-${formKey}`}
              placeholder="CD Number"
              register={register}
              setValue={setValue}
              value="cdNumber"
              disabled={loading}
            />
            <div className="min-w-[120px]">
              <OutlinedButtonRed
                type="button"
                label={"New"}
                onClick={handleNewClick}
                disabled={loading || !watchCdNumber}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-full relative">
              <InputBox
                key={`client-${entryFieldsKey}`}
                placeholder="Client Code"
                register={register}
                setValue={setValue}
                value="client"
                disabled={loading}
              />
              {isFetchingClient && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
              {clientSearchError && watchClientCode && !isFetchingClient && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 text-sm">
                  ❌
                </div>
              )}
            </div>
            <DummyInputBoxWithLabelDarkGray
              key={`clientState-${entryFieldsKey}`}
              label={"Client Name"}
              placeholder={"Client Name"}
              register={register}
              setValue={setValue}
              value={"clientState"}
            />
            <DummyInputBoxWithLabelDarkGray
              key={`email-${entryFieldsKey}`}
              label={"Email"}
              placeholder={"Email"}
              register={register}
              setValue={setValue}
              value={"email"}
            />
            <DummyInputBoxWithLabelDarkGray
              key={`receiveAmt-${entryFieldsKey}`}
              label={"Receive Date"}
              placeholder={"Receive Date"}
              register={register}
              setValue={setValue}
              value={"receiveAmt"}
            />
          </div>
          <div className="flex gap-3">
            <div className="w-full relative">
              <InputBox
                key={`airwaybill-${entryFieldsKey}`}
                placeholder="AWB"
                register={register}
                setValue={setValue}
                value="airwaybill"
                disabled={loading}
              />
            </div>
            <div className="w-full relative">
              <InputBox
                key={`weight-${entryFieldsKey}`}
                placeholder="Received Weight"
                register={register}
                setValue={setValue}
                value="weight"
                disabled={loading}
              />
            </div>
            <div className="w-full relative">
              <InputBox
                key={`remark-${entryFieldsKey}`}
                placeholder="Remark"
                register={register}
                setValue={setValue}
                value="remark"
                disabled={loading}
              />
            </div>
            <div className=" flex gap-2 w-full">
              <OutlinedButtonRed
                type="button"
                label={loading ? "Adding..." : "Add to Table"}
                onClick={handleAddToTable}
                disabled={isAddToTableDisabled}
              />
              <SimpleButton
                type="button"
                name={loading ? "Sending..." : "Send Mail"}
                onClick={handleSendMail}
                disabled={isSendMailDisabled}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
          className="border-b-0 rounded-b-none h-[40vh]"
        />

        <div className="flex justify-end border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 text-gray-900 bg-[#D0D5DDB8] rounded rounded-t-none font-sans px-4 py-2 gap-16">
          <div>
            <span className="font-sans">Total Rows: </span>
            <span className="text-red">{rowData.length}</span>
          </div>
          <div>
            <span className="font-sans">Total Weight: </span>
            <span className="text-red">{totalWeight} kg</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <div>
          {/* <OutlinedButtonRed 
            type="button" 
            label={"Close"} 
            onClick={handleRefresh}
          /> */}
        </div>
        <div className=""></div>
      </div>
    </form>
  );
}

export default QuickIncan;
