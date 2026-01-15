// "use client";
// import React, { useMemo, useState, useContext, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import axios from "axios";
// import { Pencil, Trash2 } from "lucide-react";
// import { GlobalContext } from "@/app/lib/GlobalContext";
// import Heading, { RedLabelHeading } from "@/app/components/Heading";
// import Modal from "@/app/components/Modal";
// import { LabeledDropdown } from "@/app/components/Dropdown";
// import InputBox, { DateInputBox } from "@/app/components/InputBox";
// import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
// import { RedCheckbox } from "@/app/components/Checkbox";
// import { TableWithSorting } from "@/app/components/Table";
// import NotificationFlag from "@/app/components/Notificationflag";
// import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";

// function RTOShipment() {
//   const { server } = useContext(GlobalContext);
//   const { register, setValue, reset, watch, getValues } = useForm();
//   const [refreshKey, setRefreshKey] = useState(0);
//   const [rowData, setRowData] = useState([]);
//   const [showDownloadModal, setShowDownloadModal] = useState(false);
//   const [withPortal, setPortal] = useState(false);
//   const [withEmail, setEmail] = useState(false);
//   const [withEvents, setEvents] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [sendingAlert, setSendingAlert] = useState(false);
//   const [totalWeight, setTotalWeight] = useState(0);
//   const [totalBags, setTotalBags] = useState(0);
//   const [awbNoValue, setAwbNoValue] = useState("");
//   const [customerAccountCode, setCustomerAccountCode] = useState("");
//   const [customerNameFromAccount, setCustomerNameFromAccount] = useState("");
//   const [editingRowIndex, setEditingRowIndex] = useState(null);
//   const [notification, setNotification] = useState({
//     type: "",
//     message: "",
//     visible: false,
//   });

//   // Watch fields for changes
//   const awbNo = watch("awbNo");
//   const customerCode = watch("customerCode");

//   // Fetch customer name when customer code changes
//   useEffect(() => {
//     const delayDebounceFn = setTimeout(() => {
//       if (customerCode && customerCode.trim() !== "" && customerCode !== customerAccountCode) {
//         setCustomerAccountCode(customerCode);
//         fetchCustomerName(customerCode);
//       }
//     }, 500);

//     return () => clearTimeout(delayDebounceFn);
//   }, [customerCode]);

//   // Fetch customer name by account code
//   const fetchCustomerName = async (accountCode) => {
//     if (!accountCode || accountCode.trim() === "") {
//       setCustomerNameFromAccount("");
//       setValue("name", "");
//       return;
//     }

//     try {
//       console.log("Fetching customer for account code:", accountCode);

//       const response = await axios.get(
//         `${server}/customer-account?accountCode=${accountCode}`
//       );

//       console.log("Customer Response:", response.data);

//       // Check if response has data (your API returns data directly, not nested in a success object)
//       if (response.data && response.data.name) {
//         const customerName = response.data.name || "";
//         console.log("Customer name found:", customerName);
//         setCustomerNameFromAccount(customerName);
//         setValue("name", customerName);
//       } else {
//         console.log("Customer not found or name is missing");
//         setNotification({
//           type: "error",
//           message: "Customer name not found",
//           visible: true,
//         });
//         setCustomerNameFromAccount("");
//         setValue("name", "");
//       }
//     } catch (error) {
//       console.error("Error fetching customer name:", error);
//       if (error.response?.status === 404) {
//         setNotification({
//           type: "error",
//           message: "Customer account not found",
//           visible: true,
//         });
//       } else {
//         setNotification({
//           type: "error",
//           message: error.response?.data?.message || "Failed to fetch customer data",
//           visible: true,
//         });
//       }
//       setCustomerNameFromAccount("");
//       setValue("name", "");
//     }
//   };

//   // Fetch shipment data when AWB number changes
//   useEffect(() => {
//     const delayDebounceFn = setTimeout(() => {
//       if (awbNo && awbNo.trim() !== "" && awbNo !== awbNoValue) {
//         setAwbNoValue(awbNo);
//         fetchShipmentData(awbNo);
//       }
//     }, 500);

//     return () => clearTimeout(delayDebounceFn);
//   }, [awbNo]);

//   // Fetch shipment data when AWB number is entered
//   const fetchShipmentData = async (awbNumber) => {
//     if (!awbNumber || awbNumber.trim() === "") return;

//     try {
//       setLoading(true);
//       console.log("Fetching data for AWB:", awbNumber);

//       const response = await axios.get(
//         `${server}/rto-shipment?awbNo=${awbNumber}`
//       );

//       console.log("Response:", response.data);

//       if (response.data.success) {
//         const data = response.data.data;
//         // Auto-fill the form fields
//         setValue("accountCode", data.accountCode);
//         setValue("customerName", data.customerName);
//         setValue("consignorName", data.consignorName);
//         setValue("consigneeName", data.consigneeName);
//         setValue("email", data.email);
//         console.log("Data populated successfully");
//       } else {
//         setNotification({
//           type: "error",
//           message: response.data.message || "Shipment not found",
//           visible: true,
//         });
//       }
//     } catch (error) {
//       console.error("Error fetching shipment data:", error);
//       setNotification({
//         type: "error",
//         message: error.response?.data?.message || "Failed to fetch shipment data",
//         visible: true,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Calculate totals
//   const calculateTotals = (data) => {
//     const weight = data.reduce(
//       (sum, item) => sum + (parseFloat(item.weight) || 0),
//       0
//     );
//     const bagNumbers = data
//       .map((item) => parseFloat(item.bagNo))
//       .filter((num) => !isNaN(num));
//     const maxBag = bagNumbers.length > 0 ? Math.max(...bagNumbers) : 0;
//     setTotalWeight(weight);
//     setTotalBags(maxBag);
//   };

//   // Handle Add button
//   const handleAdd = () => {
//     const formValues = getValues();

//     // Validation
//     if (!formValues.customerCode) {
//       setNotification({
//         type: "error",
//         message: "Please enter Customer Code",
//         visible: true,
//       });
//       return;
//     }

//     if (!formValues.awbNo) {
//       setNotification({
//         type: "error",
//         message: "Please enter AWB Number",
//         visible: true,
//       });
//       return;
//     }

//     if (!formValues.weight) {
//       setNotification({
//         type: "error",
//         message: "Please enter Weight",
//         visible: true,
//       });
//       return;
//     }

//     // Check if AWB already exists in table (only when adding new, not editing)
//     if (editingRowIndex === null) {
//       const exists = rowData.some((row) => row.awbNo === formValues.awbNo);
//       if (exists) {
//         setNotification({
//           type: "error",
//           message: "This AWB Number is already added",
//           visible: true,
//         });
//         return;
//       }

//       // Check if all existing rows have the same customer code
//       if (rowData.length > 0 && rowData[0].accountCode !== formValues.customerCode) {
//         setNotification({
//           type: "error",
//           message: "All shipments must belong to the same customer account",
//           visible: true,
//         });
//         return;
//       }
//     }

//     // Create transporter and CD number string
//     const transporterAndCd = `${formValues.transporter || ""} - ${
//       formValues.cdNumberTable || ""
//     }`.trim();

//     // Create new/updated row
//     const newRow = {
//       awbNo: formValues.awbNo,
//       accountCode: formValues.customerCode || "",
//       customerName: formValues.name || "",
//       consignorName: formValues.consignorName || "",
//       consigneeName: formValues.consigneeName || "",
//       email: formValues.email || "",
//       weight: formValues.weight,
//       bagNo: formValues.bagNo || "",
//       transporterAndCd: transporterAndCd,
//       removedItem: formValues.removedItems || "",
//     };

//     let updatedData;
//     if (editingRowIndex !== null) {
//       // Update existing row
//       updatedData = [...rowData];
//       updatedData[editingRowIndex] = newRow;
//       setEditingRowIndex(null);
//       setNotification({
//         type: "success",
//         message: "Shipment updated successfully",
//         visible: true,
//       });
//     } else {
//       // Add new row
//       updatedData = [...rowData, newRow];
//       setNotification({
//         type: "success",
//         message: "Shipment added successfully",
//         visible: true,
//       });
//     }

//     setRowData(updatedData);
//     calculateTotals(updatedData);

//     // Clear AWB specific fields
//     setValue("awbNo", "");
//     setValue("accountCode", "");
//     setValue("customerName", "");
//     setValue("consignorName", "");
//     setValue("consigneeName", "");
//     setValue("email", "");
//     setValue("weight", "");
//     setValue("removedItems", "");
//     setValue("bagNo", "");
//     setValue("cdNumberTable", "");
//     setAwbNoValue("");
//   };

//   // Handle Edit button
//   const handleEdit = (index) => {
//     const row = rowData[index];
//     setEditingRowIndex(index);

//     // Populate form with row data
//     setValue("awbNo", row.awbNo);
//     setValue("customerCode", row.accountCode);
//     setValue("name", row.customerName);
//     setValue("consignorName", row.consignorName);
//     setValue("consigneeName", row.consigneeName);
//     setValue("email", row.email);
//     setValue("weight", row.weight);
//     setValue("bagNo", row.bagNo);
//     setValue("removedItems", row.removedItem);

//     // Extract CD number from transporterAndCd
//     if (row.transporterAndCd) {
//       const parts = row.transporterAndCd.split(" - ");
//       if (parts.length > 1) {
//         setValue("cdNumberTable", parts[1]);
//       }
//     }

//     setNotification({
//       type: "info",
//       message: "Editing shipment. Modify and click Add to update.",
//       visible: true,
//     });
//   };

//   // Handle Delete button
//   const handleDelete = (index) => {
//     const updatedData = rowData.filter((_, i) => i !== index);
//     setRowData(updatedData);
//     calculateTotals(updatedData);

//     // If we were editing this row, cancel editing
//     if (editingRowIndex === index) {
//       setEditingRowIndex(null);
//       clearAWBFields();
//     }

//     setNotification({
//       type: "success",
//       message: "Shipment deleted successfully",
//       visible: true,
//     });
//   };

//   // Clear AWB specific fields
//   const clearAWBFields = () => {
//     setValue("awbNo", "");
//     setValue("accountCode", "");
//     setValue("customerName", "");
//     setValue("consignorName", "");
//     setValue("consigneeName", "");
//     setValue("email", "");
//     setValue("weight", "");
//     setValue("removedItems", "");
//     setValue("bagNo", "");
//     setValue("cdNumberTable", "");
//     setAwbNoValue("");
//     setEditingRowIndex(null);
//   };

//   // Handle Send Alert
//   const handleSendAlert = async () => {
//     if (!withEmail) {
//       setNotification({
//         type: "error",
//         message: "Please select 'Alert On Email' checkbox",
//         visible: true,
//       });
//       return;
//     }

//     if (rowData.length === 0) {
//       setNotification({
//         type: "error",
//         message: "Please add at least one shipment",
//         visible: true,
//       });
//       return;
//     }

//     const formValues = getValues();

//     try {
//       setSendingAlert(true);

//       // Prepare payload
//       const payload = {
//         transporter: formValues.transporter || "",
//         cdNumber: formValues.cdNumber || "",
//         totalWeight: totalWeight,
//         totalBags: totalBags,
//         shipments: rowData,
//         alertOnPortal: withPortal,
//         alertOnEmail: withEmail,
//         updateInEvents: withEvents,
//       };

//       console.log("Sending alert with payload:", payload);

//       const response = await axios.post(
//         `${server}/rto-shipment/send-alert`,
//         payload
//       );

//       if (response.data.success) {
//         setNotification({
//           type: "success",
//           message: response.data.message,
//           visible: true,
//         });
//       } else {
//         setNotification({
//           type: "error",
//           message: response.data.message || "Failed to send alerts",
//           visible: true,
//         });
//       }
//     } catch (error) {
//       console.error("Error sending alert:", error);
//       setNotification({
//         type: "error",
//         message: error.response?.data?.message || "Failed to send alerts",
//         visible: true,
//       });
//     } finally {
//       setSendingAlert(false);
//     }
//   };

//   // Refresh handler
//   const handleRefresh = () => {
//     reset();
//     setRowData([]);
//     setTotalWeight(0);
//     setTotalBags(0);
//     setPortal(false);
//     setEmail(false);
//     setEvents(false);
//     setAwbNoValue("");
//     setCustomerAccountCode("");
//     setCustomerNameFromAccount("");
//     setEditingRowIndex(null);
//     setRefreshKey((prev) => prev + 1);
//   };

//   const dateFilters = [
//     { label: "This Month", value: "this_month" },
//     { label: "Date Wise", value: "date_wise" },
//     { label: "Last 7 Days", value: "last_7_days" },
//     { label: "Month Name", value: "month_name" },
//     { label: "Last Financial Year", value: "last_fy" },
//     { label: "Custom", value: "custom" },
//   ];

//   // Prepare row data with action buttons
//   const preparedRowData = useMemo(() => {
//     return rowData.map((row, index) => ({
//       ...row,
//       actions: (
//         <div className="flex gap-2 justify-center">
//           <button
//             type="button"
//             onClick={() => handleEdit(index)}
//             className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
//             title="Edit"
//           >
//             <Pencil size={16} />
//           </button>
//           <button
//             type="button"
//             onClick={() => handleDelete(index)}
//             className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
//             title="Delete"
//           >
//             <Trash2 size={16} />
//           </button>
//         </div>
//       ),
//     }));
//   }, [rowData]);

//   const columns = useMemo(
//     () => [
//       { key: "awbNo", label: "AWB No" },
//       { key: "accountCode", label: "Customer Code" },
//       { key: "customerName", label: "Customer Name" },
//       { key: "consignorName", label: "Consignor Name" },
//       { key: "consigneeName", label: "Consignee Name" },
//       { key: "email", label: "Email" },
//       { key: "weight", label: "Weight" },
//       { key: "bagNo", label: "Bag No." },
//       { key: "transporterAndCd", label: "Transporter And CD No." },
//       { key: "removedItem", label: "Removed Items" },
//       { key: "actions", label: "Actions" },
//     ],
//     []
//   );

//   return (
//     <form className="flex flex-col gap-9">
//       <NotificationFlag
//         type={notification.type}
//         message={notification.message}
//         visible={notification.visible}
//         setVisible={(visible) =>
//           setNotification((prev) => ({ ...prev, visible }))
//         }
//       />

//       <Heading
//         title="RTO Shipment"
//         bulkUploadBtn="hidden"
//         downloadBtn
//         codeListBtn={true}
//         fullscreenBtn={false}
//         onRefresh={handleRefresh}
//         onClickDownloadBtn={() => setShowDownloadModal(true)}
//       />

//       {showDownloadModal && (
//         <Modal
//           title="Offload Shipment Report"
//           onClose={() => setShowDownloadModal(false)}
//         >
//           <div className="flex flex-col gap-4">
//             <div className="flex gap-3 items-end">
//               <LabeledDropdown
//                 options={dateFilters.map((option) => option.label)}
//                 register={register}
//                 setValue={setValue}
//                 title="Date Range"
//                 value="dateRange"
//               />

//               <DateInputBox
//                 placeholder="From"
//                 register={register}
//                 setValue={setValue}
//                 value="fromDate"
//               />

//               <DateInputBox
//                 placeholder="To"
//                 register={register}
//                 setValue={setValue}
//                 value="toDate"
//               />
//               <div>
//                 <SimpleButton name="Download" type="button" />
//               </div>
//             </div>
//           </div>
//         </Modal>
//       )}

//       <div className="flex flex-col gap-3">
//         <div className="flex gap-3">
//           <InputBox
//             placeholder="Transporter"
//             register={register}
//             setValue={setValue}
//             value="transporter"
//           />
//           <InputBox
//             placeholder="Customer Code"
//             register={register}
//             setValue={setValue}
//             value="customerCode"
//           />
//           <DummyInputBoxWithLabelDarkGray
//             label="Customer Name"
//             register={register}
//             setValue={setValue}
//             value="name"
//           />

//           <InputBox
//             placeholder="CD Number"
//             register={register}
//             setValue={setValue}
//             value="cdNumber"
//           />
//         </div>
//         <RedLabelHeading label="AWB Details" />
//         <div className="flex gap-3">
//           <InputBox
//             placeholder="Awb No."
//             register={register}
//             setValue={setValue}
//             value="awbNo"
//           />
//           <InputBox
//             placeholder="Weight"
//             register={register}
//             setValue={setValue}
//             value="weight"
//           />
//           <InputBox
//             placeholder="CD Number"
//             register={register}
//             setValue={setValue}
//             value="cdNumberTable"
//           />
//           <InputBox
//             placeholder="Removed Items"
//             register={register}
//             setValue={setValue}
//             value="removedItems"
//           />
//           <InputBox
//             placeholder="Bag No."
//             register={register}
//             setValue={setValue}
//             value="bagNo"
//           />

//           <div className="flex gap-2">
//             <OutlinedButtonRed
//               type="button"
//               label={loading ? "Loading..." : editingRowIndex !== null ? "Update" : "Add"}
//               onClick={handleAdd}
//               disabled={loading}
//             />
//             {editingRowIndex !== null && (
//               <OutlinedButtonRed
//                 type="button"
//                 label="Cancel"
//                 onClick={clearAWBFields}
//               />
//             )}
//           </div>
//         </div>
//       </div>

//       <div className="flex justify-between">
//         <div className="flex gap-6">
//           <RedCheckbox
//             register={register}
//             setValue={setValue}
//             label="Alert On Portal"
//             id="alertPortal"
//             isChecked={withPortal}
//             setChecked={setPortal}
//           />
//           <RedCheckbox
//             register={register}
//             setValue={setValue}
//             label="Alert On Email"
//             id="alertEmail"
//             isChecked={withEmail}
//             setChecked={setEmail}
//           />
//           <RedCheckbox
//             register={register}
//             setValue={setValue}
//             label="Update in Events"
//             id="updateEvents"
//             isChecked={withEvents}
//             setChecked={setEvents}
//           />
//         </div>
//       </div>

//       <div>
//         <TableWithSorting
//           register={register}
//           setValue={setValue}
//           columns={columns}
//           rowData={preparedRowData}
//           className="border-b-0 rounded-b-none h-[45vh]"
//         />
//         <div className="flex justify-end border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0  text-gray-900  bg-[#D0D5DDB8] rounded rounded-t-none  font-sans px-4 py-2 gap-16">
//           <div>
//             <span className="font-sans ">Total Weight :</span>
//             <span className="text-red"> {totalWeight.toFixed(2)}kg </span>
//           </div>
//           <div>
//             <span className="font-sans ">Total Bags :</span>
//             <span className="text-red"> {totalBags} </span>
//           </div>
//         </div>
//       </div>

//       <div className="flex justify-between">
//         <div>
//           <OutlinedButtonRed type="button" label="Close" />
//         </div>
//         <div className="flex gap-2">
//           <SimpleButton
//             type="button"
//             name={sendingAlert ? "Sending..." : "Send Alert"}
//             onClick={handleSendAlert}
//             disabled={sendingAlert}
//           />
//         </div>
//       </div>
//     </form>
//   );
// }

// export default RTOShipment; without delete modal

"use client";
import React, { useMemo, useState, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Pencil, Trash2 } from "lucide-react";
import { GlobalContext } from "@/app/lib/GlobalContext";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import Modal from "@/app/components/Modal";
import { LabeledDropdown } from "@/app/components/Dropdown";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import { show } from "@tauri-apps/api/app";

function RTOShipment() {
  const { server } = useContext(GlobalContext);
  const { register, setValue, reset, watch, getValues } = useForm();
  const [refreshKey, setRefreshKey] = useState(0);
  const [rowData, setRowData] = useState([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [withPortal, setPortal] = useState(false);
  const [withEmail, setEmail] = useState(false);
  const [withEvents, setEvents] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalBags, setTotalBags] = useState(0);
  const [awbNoValue, setAwbNoValue] = useState("");
  const [customerAccountCode, setCustomerAccountCode] = useState("");
  const [customerNameFromAccount, setCustomerNameFromAccount] = useState("");
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Watch fields for changes
  const awbNo = watch("awbNo");
  const customerCode = watch("customerCode");

  // Fetch customer name when customer code changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (
        customerCode &&
        customerCode.trim() !== "" &&
        customerCode !== customerAccountCode
      ) {
        setCustomerAccountCode(customerCode);
        fetchCustomerName(customerCode);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [customerCode]);

  // Fetch customer name by account code
  const fetchCustomerName = async (accountCode) => {
    if (!accountCode || accountCode.trim() === "") {
      setCustomerNameFromAccount("");
      setValue("name", "");
      return;
    }

    try {
      console.log("Fetching customer for account code:", accountCode);

      const response = await axios.get(
        `${server}/customer-account?accountCode=${accountCode}`
      );

      console.log("Customer Response:", response.data);

      if (response.data && response.data.name) {
        const customerName = response.data.name || "";
        console.log("Customer name found:", customerName);
        setCustomerNameFromAccount(customerName);
        setValue("name", customerName);
      } else {
        console.log("Customer not found or name is missing");
        showNotification("error", "Customer name not found");
        setNotification({
          type: "error",
          message: "Customer name not found",
          visible: true,
        });
        setCustomerNameFromAccount("");
        setValue("name", "");
      }
    } catch (error) {
      console.error("Error fetching customer name:", error);
      if (error.response?.status === 404) {
        setNotification({
          type: "error",
          message: "Customer account not found",
          visible: true,
        });
        showNotification("error", "Customer account not found");
      } else {
        setNotification({
          type: "error",
          message:
            error.response?.data?.message || "Failed to fetch customer data",
          visible: true,
        });
        showNotification(
          "error",
          error.response?.data?.message || "Failed to fetch customer data"
        );
      }
      setCustomerNameFromAccount("");
      setValue("name", "");
    }
  };

  // Fetch shipment data when AWB number changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (awbNo && awbNo.trim() !== "" && awbNo !== awbNoValue) {
        setAwbNoValue(awbNo);
        fetchShipmentData(awbNo);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [awbNo]);

  // Fetch shipment data when AWB number is entered
  const fetchShipmentData = async (awbNumber) => {
    if (!awbNumber || awbNumber.trim() === "") return;

    try {
      setLoading(true);
      console.log("Fetching data for AWB:", awbNumber);

      const response = await axios.get(
        `${server}/rto-shipment?awbNo=${awbNumber}`
      );

      console.log("Response:", response.data);

      if (response.data.success) {
        const data = response.data.data;
        setValue("accountCode", data.accountCode);
        setValue("customerName", data.customerName);
        setValue("consignorName", data.consignorName);
        setValue("consigneeName", data.consigneeName);
        setValue("email", data.email);
        console.log("Data populated successfully");
      } else {
        setNotification({
          type: "error",
          message: response.data.message || "Shipment not found",
          visible: true,
        });
        showNotification(
          "error",
          response.data.message || "Shipment not found"
        );
      }
    } catch (error) {
      console.error("Error fetching shipment data:", error);
      setNotification({
        type: "error",
        message:
          error.response?.data?.message || "Failed to fetch shipment data",
        visible: true,
      });
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch shipment data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const calculateTotals = (data) => {
    const weight = data.reduce(
      (sum, item) => sum + (parseFloat(item.weight) || 0),
      0
    );
    const bagNumbers = data
      .map((item) => parseFloat(item.bagNo))
      .filter((num) => !isNaN(num));
    const maxBag = bagNumbers.length > 0 ? Math.max(...bagNumbers) : 0;
    setTotalWeight(weight);
    setTotalBags(maxBag);
  };

  // Handle Add button
  const handleAdd = () => {
    const formValues = getValues();

    // Validation
    if (!formValues.customerCode) {
      setNotification({
        type: "error",
        message: "Please enter Customer Code",
        visible: true,
      });
      showNotification("error", "Please enter Customer Code");
      return;
    }

    if (!formValues.awbNo) {
      setNotification({
        type: "error",
        message: "Please enter AWB Number",
        visible: true,
      });
      showNotification("error", "Please enter AWB Number");
      return;
    }

    if (!formValues.weight) {
      setNotification({
        type: "error",
        message: "Please enter Weight",
        visible: true,
      });
      showNotification("error", "Please enter Weight");
      return;
    }

    // Check if AWB already exists in table (only when adding new, not editing)
    if (editingRowIndex === null) {
      const exists = rowData.some((row) => row.awbNo === formValues.awbNo);
      if (exists) {
        setNotification({
          type: "error",
          message: "This AWB Number is already added",
          visible: true,
        });
        showNotification("error", "This AWB Number is already added");
        return;
      }

      // Check if all existing rows have the same customer code
      if (
        rowData.length > 0 &&
        rowData[0].accountCode !== formValues.customerCode
      ) {
        setNotification({
          type: "error",
          message: "All shipments must belong to the same customer account",
          visible: true,
        });
        showNotification(
          "error",
          "All shipments must belong to the same customer account"
        );
        return;
      }
    }

    // Create transporter and CD number string
    const transporterAndCd = `${formValues.transporter || ""} - ${
      formValues.cdNumberTable || ""
    }`.trim();

    // Create new/updated row
    const newRow = {
      awbNo: formValues.awbNo,
      accountCode: formValues.customerCode || "",
      customerName: formValues.name || "",
      consignorName: formValues.consignorName || "",
      consigneeName: formValues.consigneeName || "",
      email: formValues.email || "",
      weight: formValues.weight,
      bagNo: formValues.bagNo || "",
      transporterAndCd: transporterAndCd,
      removedItem: formValues.removedItems || "",
    };

    let updatedData;
    if (editingRowIndex !== null) {
      // Update existing row
      updatedData = [...rowData];
      updatedData[editingRowIndex] = newRow;
      setEditingRowIndex(null);
      setNotification({
        type: "success",
        message: "Shipment updated successfully",
        visible: true,
      });
      showNotification("success", "Shipment updated successfully");
    } else {
      // Add new row
      updatedData = [...rowData, newRow];
      setNotification({
        type: "success",
        message: "Shipment added successfully",
        visible: true,
      });
      showNotification("success", "Shipment added successfully");
    }

    setRowData(updatedData);
    calculateTotals(updatedData);

    // Clear ALL form fields after successful add/update
    clearAllFields();
  };

  // Handle Edit button
  const handleEdit = (index) => {
    const row = rowData[index];
    setEditingRowIndex(index);

    // Populate form with row data
    setValue("awbNo", row.awbNo);
    setValue("customerCode", row.accountCode);
    setValue("name", row.customerName);
    setValue("consignorName", row.consignorName);
    setValue("consigneeName", row.consigneeName);
    setValue("email", row.email);
    setValue("weight", row.weight);
    setValue("bagNo", row.bagNo);
    setValue("removedItems", row.removedItem);

    // Extract CD number from transporterAndCd
    if (row.transporterAndCd) {
      const parts = row.transporterAndCd.split(" - ");
      if (parts.length > 1) {
        setValue("cdNumberTable", parts[1]);
      }
    }

    setNotification({
      type: "info",
      message: "Editing shipment. Modify and click Add to update.",
      visible: true,
    });
    showNotification(
      "error",
      "Editing shipment. Modify and click Add to update."
    );
  };

  // Handle Delete button click - show confirmation modal
  const handleDeleteClick = (index) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  // Confirm Delete
  const confirmDelete = () => {
    if (deleteIndex !== null) {
      const updatedData = rowData.filter((_, i) => i !== deleteIndex);
      setRowData(updatedData);
      calculateTotals(updatedData);

      // If we were editing this row, cancel editing
      if (editingRowIndex === deleteIndex) {
        setEditingRowIndex(null);
        clearAllFields();
      }

      setNotification({
        type: "success",
        message: "Shipment deleted successfully",
        visible: true,
      });
    }

    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  // Cancel Delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  // Clear ALL form fields
  const clearAllFields = () => {
    setValue("transporter", "");
    setValue("customerCode", "");
    setValue("name", "");
    setValue("cdNumber", "");
    setValue("awbNo", "");
    setValue("accountCode", "");
    setValue("customerName", "");
    setValue("consignorName", "");
    setValue("consigneeName", "");
    setValue("email", "");
    setValue("weight", "");
    setValue("removedItems", "");
    setValue("bagNo", "");
    setValue("cdNumberTable", "");
    setAwbNoValue("");
    setCustomerAccountCode("");
    setCustomerNameFromAccount("");
    setEditingRowIndex(null);
  };

  // Handle key press for Enter key to move to next field
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // Get all input elements in the form
      const form = e.target.form;
      const inputs = Array.from(
        form.querySelectorAll('input:not([type="checkbox"]), select, textarea')
      );
      const currentIndex = inputs.indexOf(e.target);

      // Move to next input
      if (currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
      } else {
        // If last input, trigger Add button
        handleAdd();
      }
    }
  };

  // Handle Send Alert
  const handleSendAlert = async () => {
    if (!withEmail) {
      setNotification({
        type: "error",
        message: "Please select 'Alert On Email' checkbox",
        visible: true,
      });
      showNotification("error", "Please select 'Alert On Email' checkbox");
      return;
    }

    if (rowData.length === 0) {
      setNotification({
        type: "error",
        message: "Please add at least one shipment",
        visible: true,
      });
      showNotification("error", "Please add at least one shipment");
      return;
    }

    const formValues = getValues();

    try {
      setSendingAlert(true);

      const payload = {
        transporter: formValues.transporter || "",
        cdNumber: formValues.cdNumber || "",
        totalWeight: totalWeight,
        totalBags: totalBags,
        shipments: rowData,
        alertOnPortal: withPortal,
        alertOnEmail: withEmail,
        updateInEvents: withEvents,
      };

      console.log("Sending alert with payload:", payload);

      const response = await axios.post(
        `${server}/rto-shipment/send-alert`,
        payload
      );

      if (response.data.success) {
        setNotification({
          type: "success",
          message: response.data.message,
          visible: true,
        });
        showNotification("success", response.data.message);
      } else {
        setNotification({
          type: "error",
          message: response.data.message || "Failed to send alerts",
          visible: true,
        });
        showNotification(
          "error",
          response.data.message || "Failed to send alerts"
        );
      }
    } catch (error) {
      console.error("Error sending alert:", error);
      setNotification({
        type: "error",
        message: error.response?.data?.message || "Failed to send alerts",
        visible: true,
      });
      showNotification(
        "error",
        error.response?.data?.message || "Failed to send alerts"
      );
    } finally {
      setSendingAlert(false);
    }
  };

  // Refresh handler
  const handleRefresh = () => {
    reset();
    setRowData([]);
    setTotalWeight(0);
    setTotalBags(0);
    setPortal(false);
    setEmail(false);
    setEvents(false);
    setAwbNoValue("");
    setCustomerAccountCode("");
    setCustomerNameFromAccount("");
    setEditingRowIndex(null);
    setRefreshKey((prev) => prev + 1);
  };

  const dateFilters = [
    { label: "This Month", value: "this_month" },
    { label: "Date Wise", value: "date_wise" },
    { label: "Last 7 Days", value: "last_7_days" },
    { label: "Month Name", value: "month_name" },
    { label: "Last Financial Year", value: "last_fy" },
    { label: "Custom", value: "custom" },
  ];

  // Prepare row data with action buttons
  const preparedRowData = useMemo(() => {
    return rowData.map((row, index) => ({
      ...row,
      actions: (
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={() => handleEdit(index)}
            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteClick(index)}
            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    }));
  }, [rowData]);

  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB No" },
      { key: "accountCode", label: "Customer Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "consignorName", label: "Consignor Name" },
      { key: "consigneeName", label: "Consignee Name" },
      { key: "email", label: "Email" },
      { key: "weight", label: "Weight" },
      { key: "bagNo", label: "Bag No." },
      { key: "transporterAndCd", label: "Transporter And CD No." },
      { key: "removedItem", label: "Removed Items" },
      { key: "actions", label: "Actions" },
    ],
    []
  );

  return (
    <form className="flex flex-col gap-3" onKeyDown={handleKeyDown}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <Heading
        title="RTO Shipment"
        bulkUploadBtn="hidden"
        tableReportBtn
        codeListBtn={true}
        fullscreenBtn={false}
        onRefresh={handleRefresh}
        onClickTableReportBtn={() => setShowDownloadModal(true)}
      />

      {showDownloadModal && (
        <Modal
          title="Offload Shipment Report"
          onClose={() => setShowDownloadModal(false)}
        >
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-end">
              <LabeledDropdown
                options={dateFilters.map((option) => option.label)}
                register={register}
                setValue={setValue}
                title="Date Range"
                value="dateRange"
              />

              <DateInputBox
                placeholder="From"
                register={register}
                setValue={setValue}
                value="fromDate"
              />

              <DateInputBox
                placeholder="To"
                register={register}
                setValue={setValue}
                value="toDate"
              />
              <div>
                <SimpleButton name="Download" type="button" />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal title="Confirm Delete" onClose={cancelDelete}>
          <div className="flex flex-col gap-6">
            <p className="text-gray-700 text-base">
              Are you sure you want to delete this shipment?
            </p>
            <div className="flex gap-3 justify-end">
              <OutlinedButtonRed
                type="button"
                label="Cancel"
                onClick={cancelDelete}
              />
              <SimpleButton
                type="button"
                name="Delete"
                onClick={confirmDelete}
              />
            </div>
          </div>
        </Modal>
      )}

      <div className="flex flex-col gap-3 mt-3">
        <RedLabelHeading label={`CD Details`} />
        <div className="flex gap-3">
          <InputBox
            placeholder="Transporter"
            register={register}
            setValue={setValue}
            value="transporter"
          />
          <InputBox
            placeholder="Customer Code"
            register={register}
            setValue={setValue}
            value="customerCode"
          />
          <DummyInputBoxWithLabelDarkGray
            label="Customer Name"
            register={register}
            setValue={setValue}
            value="name"
          />

          <InputBox
            placeholder="CD Number"
            register={register}
            setValue={setValue}
            value="cdNumber"
          />
        </div>
        <RedLabelHeading label="AWB Details" />
        <div className="flex gap-3">
          <InputBox
            placeholder="Awb No."
            register={register}
            setValue={setValue}
            value="awbNo"
          />
          <InputBox
            placeholder="Weight"
            register={register}
            setValue={setValue}
            value="weight"
          />
          <InputBox
            placeholder="CD Number"
            register={register}
            setValue={setValue}
            value="cdNumberTable"
          />
          <InputBox
            placeholder="Removed Items"
            register={register}
            setValue={setValue}
            value="removedItems"
          />
          <InputBox
            placeholder="Bag No."
            register={register}
            setValue={setValue}
            value="bagNo"
          />

          <div className="flex gap-2">
            <OutlinedButtonRed
              type="button"
              label={
                loading
                  ? "Loading..."
                  : editingRowIndex !== null
                  ? "Update"
                  : "Add"
              }
              onClick={handleAdd}
              disabled={loading}
            />
            {editingRowIndex !== null && (
              <OutlinedButtonRed
                type="button"
                label="Cancel"
                onClick={clearAllFields}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between my-1">
        <div className="flex gap-6">
          <RedCheckbox
            register={register}
            setValue={setValue}
            label="Alert On Portal"
            id="alertPortal"
            isChecked={withPortal}
            setChecked={setPortal}
          />
          <RedCheckbox
            register={register}
            setValue={setValue}
            label="Alert On Email"
            id="alertEmail"
            isChecked={withEmail}
            setChecked={setEmail}
          />
          <RedCheckbox
            register={register}
            setValue={setValue}
            label="Update in Events"
            id="updateEvents"
            isChecked={withEvents}
            setChecked={setEvents}
          />
        </div>
        <div className="flex gap-2">
          <SimpleButton
            type="button"
            name={sendingAlert ? "Sending..." : "Send Alert"}
            onClick={handleSendAlert}
            disabled={sendingAlert}
          />
        </div>
      </div>

      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={preparedRowData}
          className="border-b-0 rounded-b-none h-[45vh]"
        />
        <div className="flex justify-end border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0  text-gray-900  bg-[#D0D5DDB8] rounded rounded-t-none  font-sans px-4 py-2 gap-16">
          <div>
            <span className="font-sans ">Total Weight :</span>
            <span className="text-red"> {totalWeight.toFixed(2)}kg </span>
          </div>
          <div>
            <span className="font-sans ">Total Bags :</span>
            <span className="text-red"> {totalBags} </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <div>{/* <OutlinedButtonRed type="button" label="Close" /> */}</div>
      </div>
    </form>
  );
}

export default RTOShipment;
