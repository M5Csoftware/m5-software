// "use client";
// import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
// import { RedCheckbox } from "@/app/components/Checkbox";
// import { LabeledDropdown } from "@/app/components/Dropdown";
// import Heading, { RedLabelHeading } from "@/app/components/Heading";
// import InputBox, { DateInputBox } from "@/app/components/InputBox";
// import NotificationFlag from "@/app/components/Notificationflag";
// import { GlobalContext } from "@/app/lib/GlobalContext";
// import React, { useState, useContext, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import axios from "axios";

// // Editable Input Box Component
// const EditableInputBox = ({
//   placeholder,
//   register,
//   setValue,
//   value,
//   initialValue = "",
//   resetFactor = false,
//   isTextArea = false,
//   className = "",
//   validation = {},
//   error,
//   trigger,
//   type = "input",
//   disabled = false,
// }) => {
//   const [isFocused, setIsFocused] = useState(false);
//   const [inputValue, setInputValue] = useState(initialValue || "");

//   const handleFocus = () => setIsFocused(true);
//   const handleBlur = () => setIsFocused(false);

//   const handleChange = (e) => {
//     let newValue = e.target.value;
//     setInputValue(newValue);
//     setValue(value, newValue);
//     if (trigger) trigger(value);
//   };

//   const isPlaceholderFloating = isFocused || inputValue !== "";

//   useEffect(() => {
//     setInputValue(initialValue || "");
//   }, [initialValue]);

//   useEffect(() => {
//     setInputValue("");
//     setValue(value, null);
//   }, [resetFactor]);

//   return isTextArea ? (
//     <div className="relative w-full">
//       <textarea
//         {...register(value)}
//         value={inputValue}
//         onChange={handleChange}
//         onFocus={handleFocus}
//         onBlur={handleBlur}
//         disabled={disabled}
//         className={`border border-[#979797] outline-none bg-transparent rounded-md h-10 px-4 py-2 w-full ${
//           disabled ? "bg-gray-100" : ""
//         } ${className}`}
//       />
//       {placeholder && (
//         <label
//           htmlFor={value}
//           className={`absolute transition-all px-2 left-4 ${
//             isPlaceholderFloating
//               ? "-top-2 text-xs z-10 pb-0 font-semibold text-[#979797] bg-white h-4"
//               : `${error ? "top-1/3" : "top-1/2"} -translate-y-1/2 -bottom-6 text-sm text-[#979797]`
//           }`}
//         >
//           {placeholder}
//         </label>
//       )}
//       {error && <span className="text-red-500 text-xs">{error.message}</span>}
//     </div>
//   ) : (
//     <div className="relative w-full">
//       <input
//         type={type}
//         {...register(value, validation)}
//         value={inputValue}
//         id={value}
//         onChange={handleChange}
//         onFocus={handleFocus}
//         onBlur={handleBlur}
//         disabled={disabled}
//         autoComplete="off"
//         className={`border outline-none bg-transparent rounded-md h-8 text-sm px-4 py-2 w-full ${
//           error ? "border-red-500" : "border-[#979797]"
//         } ${disabled ? "bg-gray-100" : ""} ${className}`}
//       />
//       {placeholder && (
//         <label
//           htmlFor={value}
//           className={`absolute transition-all px-2 left-4 ${
//             isPlaceholderFloating
//               ? "-top-2 text-xs z-10 pb-0 font-semibold text-[#979797] bg-white h-4"
//               : `${error ? "top-1/3" : "top-1/2"} -translate-y-1/2 text-sm text-[#979797]`
//           }`}
//         >
//           {placeholder}
//         </label>
//       )}
//       {error && <span className="text-red-500 text-xs">{error.message}</span>}
//     </div>
//   );
// };

// // Utility functions
// const validateAWBNumber = (awbNo) => {
//   if (!awbNo) return { valid: false, message: "AWB Number is required" };
//   if (awbNo.startsWith('TEST')) {
//     return { valid: true, isTest: true, message: "Test AWB number" };
//   }
//   if (!/^\d+$/.test(awbNo)) {
//     return { valid: false, message: "AWB Number should contain only digits" };
//   }
//   if (awbNo.length < 8 || awbNo.length > 15) {
//     return { valid: false, message: "AWB Number should be between 8 and 15 digits" };
//   }
//   return { valid: true, isTest: false };
// };

// const getErrorMessage = (error) => {
//   if (error.response) {
//     const data = error.response.data;
//     const status = error.response.status;
    
//     if (status === 400) {
//       if (data.errorCode === 'TD01' || data.message?.includes('AWB does not exist')) {
//         return "AWB Number not found in Xpresion system. Please create AWB first.";
//       }
//       return data.message || "Bad request. Please check your input.";
//     }
//     if (status === 404) return "Shipment not found in database";
//     if (status === 500) return "Server error. Please try again later.";
//     return data.message || `Error: ${status}`;
//   } else if (error.request) {
//     return "No response from server. Please check your network connection.";
//   } else {
//     return error.message || "An unexpected error occurred";
//   }
// };

// const formatDateForDisplay = (dateString) => {
//   if (!dateString) return "";
//   try {
//     const date = new Date(dateString);
//     const dd = String(date.getDate()).padStart(2, "0");
//     const mm = String(date.getMonth() + 1).padStart(2, "0");
//     const yyyy = date.getFullYear();
//     return `${dd}-${mm}-${yyyy}`;
//   } catch (error) {
//     return dateString;
//   }
// };

// const downloadPDF = (labelUrl, filename) => {
//   const link = document.createElement('a');
//   link.href = labelUrl;
//   link.download = filename;
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
// };

// const printPDF = (labelUrl, title = "DPD Label") => {
//   const printWindow = window.open("", "_blank");
//   printWindow.document.write(`
//     <html>
//       <head>
//         <title>${title}</title>
//         <style>
//           body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
//           embed { width: 100%; height: 100%; }
//         </style>
//       </head>
//       <body>
//         <embed src="${labelUrl}" type="application/pdf" width="100%" height="100%" />
//       </body>
//     </html>
//   `);
//   printWindow.document.close();
// };

// const UkDpdPage = () => {
//   const { register, setValue, reset, watch } = useForm();
//   const { server } = useContext(GlobalContext);
//   const [resetFactor, setResetFactor] = useState(false);
//   const [formKey, setFormKey] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [creatingAWB, setCreatingAWB] = useState(false);
//   const [shipmentData, setShipmentData] = useState(null);
//   const [childNumbers, setChildNumbers] = useState([]);
//   const [labelPreviews, setLabelPreviews] = useState([]);
//   const [currentLabelIndex, setCurrentLabelIndex] = useState(0);
//   const [labelsCreated, setLabelsCreated] = useState(false);
//   const [labelsSaved, setLabelsSaved] = useState(false);
//   const [consigneeEdited, setConsigneeEdited] = useState(false);
//   const [xpresionAWB, setXpresionAWB] = useState(null);
//   const [notification, setNotification] = useState({
//     type: "",
//     message: "",
//     visible: false,
//   });

//   const awbNo = watch("awbNo");
//   const consignee = watch("consignee");
//   const addressLine1 = watch("addressLine1");
//   const addressLine2 = watch("addressLine2");
//   const zipcode = watch("zipcode");
//   const city = watch("city");
//   const state = watch("state");
//   const telephone = watch("telephone");

//   const showNotification = (type, message) => {
//     setNotification({ type, message, visible: true });
//     setTimeout(() => {
//       setNotification((prev) => ({ ...prev, visible: false }));
//     }, 4000);
//   };

//   const handleRefresh = async () => {
//     if (labelsCreated && !labelsSaved) {
//       const confirmDelete = window.confirm(
//         "Labels have been created but not saved. Do you want to delete them?"
//       );
//       if (!confirmDelete) return;
//     }

//     if (awbNo) {
//       try {
//         await axios.delete(`${server}/labels/dpd/uk?awbNo=${awbNo}`);
//       } catch (error) {
//         console.error("Error deleting labels:", error);
//       }
//     }

//     setResetFactor(!resetFactor);
//     setFormKey((prev) => prev + 1);
//     reset();
//     setShipmentData(null);
//     setChildNumbers([]);
//     setLabelPreviews([]);
//     setCurrentLabelIndex(0);
//     setLabelsCreated(false);
//     setLabelsSaved(false);
//     setConsigneeEdited(false);
//     setXpresionAWB(null);
//   };

//   const handleSearch = async () => {
//     const validation = validateAWBNumber(awbNo);
//     if (!validation.valid) {
//       showNotification("error", validation.message);
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await axios.get(`${server}/labels/dpd/uk?awbNo=${awbNo}`);

//       if (response.data.success) {
//         const data = response.data.data;
//         setShipmentData(data);
//         setXpresionAWB(data.xpresionAWBNo || null);

//         const extractedChildNumbers = [];

//         if (data.pcs > 1) {
//           if (data.childShipments?.length > 0) {
//             data.childShipments.forEach((childShipment) => {
//               extractedChildNumbers.push({
//                 sno: extractedChildNumbers.length + 1,
//                 childNo: childShipment.childAwbNo,
//                 forwardingNo: childShipment.forwardingNo || "",
//                 xpresionAWB: childShipment.xpresionAWBNo || null,
//                 consigneeName: childShipment.consigneeName || data.receiverFullName || "",
//                 consigneeCity: childShipment.consigneeCity || data.receiverCity || "",
//               });
//             });

//             const hasSavedLabels = extractedChildNumbers.some((child) => child.forwardingNo);
//             setLabelsSaved(hasSavedLabels);
//           }
//         } else {
//           if (data.forwardingNo) setLabelsSaved(true);
//         }

//         setChildNumbers(extractedChildNumbers);

//         setValue("date", data.date || "");
//         setValue("sector", data.sector || "");
//         setValue("origin", data.origin || "");
//         setValue("accountCode", data.accountCode || "");
//         setValue("customer", data.customer || "");
//         setValue("consignor", data.shipperFullName || "");
//         setValue("pcs", data.pcs || 0);
//         setValue("actualWt", data.totalActualWt || 0);
//         setValue("value", data.totalInvoiceValue || 0);
//         setValue("operationRemarks", data.operationRemark || "");
//         setValue("content", data.content?.join(", ") || "");
//         setValue("hold", data.isHold || false);
//         setValue("holdReason", data.holdReason || "");
//         setValue("consignee", data.receiverFullName || "");
//         setValue("addressLine1", data.receiverAddressLine1 || "");
//         setValue("addressLine2", data.receiverAddressLine2 || "");
//         setValue("zipcode", data.receiverPincode || "");
//         setValue("city", data.receiverCity || "");
//         setValue("state", data.receiverState || "");
//         setValue("telephone", data.receiverPhoneNumber || "");
//         setValue("billingService", "DPD LABEL STANDARD");

//         if (data.forwardingNo) {
//           setValue("dpdNo", data.forwardingNo);
//         } else if (extractedChildNumbers.length > 0) {
//           const forwardingNos = extractedChildNumbers
//             .map((child) => child.forwardingNo)
//             .filter(Boolean)
//             .join(", ");
//           if (forwardingNos) setValue("dpdNo", forwardingNos);
//         }

//         if (data.isHold) {
//           showNotification("error", `Shipment is on hold. Reason: ${data.holdReason || "Not specified"}`);
//         } else if (data.pcs > 1 && extractedChildNumbers.length === 0) {
//           showNotification("warning", "Please generate Child AWB Numbers before creating labels");
//         } else {
//           showNotification("success", "Shipment data loaded successfully");
//         }

//         setConsigneeEdited(false);
//       }
//     } catch (error) {
//       console.error("Search error:", error);
//       showNotification("error", getErrorMessage(error));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateAWB = async () => {
//     if (!shipmentData) {
//       showNotification("error", "Please search for a shipment first");
//       return;
//     }

//     setCreatingAWB(true);
//     try {
//       const response = await axios.post(`${server}/labels/dpd/uk`, {
//         awbNo: shipmentData.awbNo,
//         createAWB: true
//       });

//       if (response.data.success) {
//         setXpresionAWB(response.data.data.awbNo);
//         showNotification("success", `AWB created successfully! New AWB: ${response.data.data.awbNo}`);
//       }
//     } catch (error) {
//       console.error("Create AWB error:", error);
//       showNotification("error", getErrorMessage(error));
//     } finally {
//       setCreatingAWB(false);
//     }
//   };

//   const handleCreateLabel = async () => {
//     if (!shipmentData) {
//       showNotification("error", "Please search for a shipment first");
//       return;
//     }
//     if (shipmentData.isHold) {
//       showNotification("error", "Cannot create label - Shipment is on hold");
//       return;
//     }
//     if (shipmentData.pcs > 1 && childNumbers.length === 0) {
//       showNotification("error", "Cannot create label - Please generate Child AWB Numbers first");
//       return;
//     }

//     setLoading(true);
//     try {
//       const consigneeData = {
//         consignee: watch("consignee"),
//         addressLine1: watch("addressLine1"),
//         addressLine2: watch("addressLine2"),
//         zipcode: watch("zipcode"),
//         city: watch("city"),
//         state: watch("state"),
//         telephone: watch("telephone"),
//       };

//       const response = await axios.post(`${server}/labels/dpd/uk`, {
//         awbNo: shipmentData.awbNo,
//         consigneeData,
//       });

//       if (response.data.success) {
//         setLabelPreviews(response.data.labels);
//         setLabelsCreated(true);
//         setLabelsSaved(false);

//         const trackingNumbers = response.data.labels
//           .map((label) => label.trackingNumber)
//           .filter(Boolean)
//           .join(", ");

//         setValue("dpdNo", trackingNumbers);

//         if (response.data.labels.length > 0 && childNumbers.length > 0) {
//           const updatedChildNumbers = childNumbers.map((child) => {
//             const matchingLabel = response.data.labels.find((label) => label.childNo === child.childNo);
//             return { ...child, forwardingNo: matchingLabel?.trackingNumber || "" };
//           });
//           setChildNumbers(updatedChildNumbers);
//         }

//         if (response.data.partialSuccess) {
//           showNotification("warning", response.data.message);
//         } else {
//           showNotification(
//             "success",
//             `DPD labels created successfully! (${response.data.labels.length} label${
//               response.data.labels.length !== 1 ? "s" : ""
//             }) - Click Save to store`
//           );
//         }
//       }
//     } catch (error) {
//       console.error("Create label error:", error);
//       const errorMessage = getErrorMessage(error);
//       showNotification("error", errorMessage);
      
//       // Check if error indicates AWB doesn't exist
//       if (errorMessage.includes("AWB does not exist") || error.response?.data?.requiresAWBCreation) {
//         showNotification("warning", "Please create AWB in Xpresion system first using 'Create AWB' button");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSave = async () => {
//     if (!labelsCreated) {
//       showNotification("error", "No labels to save");
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await axios.post(`${server}/labels/dpd/uk`, {
//         awbNo: shipmentData.awbNo,
//         action: "save",
//         labels: labelPreviews,
//       });

//       if (response.data.success) {
//         setLabelsSaved(true);
//         showNotification("success", "Forwarding numbers saved successfully!");
//       }
//     } catch (error) {
//       console.error("Save error:", error);
//       showNotification("error", getErrorMessage(error));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleUpdateConsignee = async () => {
//     if (!shipmentData) {
//       showNotification("error", "No shipment data to update");
//       return;
//     }

//     setLoading(true);
//     try {
//       const consigneeData = {
//         consignee: watch("consignee"),
//         addressLine1: watch("addressLine1"),
//         addressLine2: watch("addressLine2"),
//         zipcode: watch("zipcode"),
//         city: watch("city"),
//         state: watch("state"),
//         telephone: watch("telephone"),
//       };

//       const response = await axios.put(`${server}/labels/dpd/uk`, {
//         awbNo: shipmentData.awbNo,
//         consigneeData,
//       });

//       if (response.data.success) {
//         setConsigneeEdited(false);
//         showNotification("success", "Consignee details updated successfully!");
        
//         setShipmentData({
//           ...shipmentData,
//           receiverFullName: consigneeData.consignee,
//           receiverAddressLine1: consigneeData.addressLine1,
//           receiverAddressLine2: consigneeData.addressLine2,
//           receiverPincode: consigneeData.zipcode,
//           receiverCity: consigneeData.city,
//           receiverState: consigneeData.state,
//           receiverPhoneNumber: consigneeData.telephone,
//         });
//       }
//     } catch (error) {
//       console.error("Update consignee error:", error);
//       showNotification("error", getErrorMessage(error));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePrint = () => {
//     if (labelPreviews.length === 0) {
//       showNotification("error", "No labels to print");
//       return;
//     }
//     labelPreviews.forEach((label, index) => {
//       printPDF(label.labelUrl, `DPD Label ${index + 1}`);
//     });
//   };

//   const handlePrintSingle = () => {
//     if (labelPreviews.length === 0) {
//       showNotification("error", "No labels to print");
//       return;
//     }
//     const label = labelPreviews[currentLabelIndex];
//     printPDF(label.labelUrl, `DPD Label ${currentLabelIndex + 1}`);
//   };

//   const handleDownload = () => {
//     if (labelPreviews.length === 0) {
//       showNotification("error", "No labels to download");
//       return;
//     }
//     labelPreviews.forEach((label, index) => {
//       const filename = `DPD_Label_${label.trackingNumber || index + 1}.pdf`;
//       downloadPDF(label.labelUrl, filename);
//     });
//   };

//   const handlePreviousLabel = () => {
//     if (currentLabelIndex > 0) setCurrentLabelIndex(currentLabelIndex - 1);
//   };

//   const handleNextLabel = () => {
//     if (currentLabelIndex < labelPreviews.length - 1) setCurrentLabelIndex(currentLabelIndex + 1);
//   };

//   useEffect(() => {
//     if (shipmentData) {
//       const hasChanges =
//         consignee !== (shipmentData.receiverFullName || "") ||
//         addressLine1 !== (shipmentData.receiverAddressLine1 || "") ||
//         addressLine2 !== (shipmentData.receiverAddressLine2 || "") ||
//         zipcode !== (shipmentData.receiverPincode || "") ||
//         city !== (shipmentData.receiverCity || "") ||
//         state !== (shipmentData.receiverState || "") ||
//         telephone !== (shipmentData.receiverPhoneNumber || "");

//       setConsigneeEdited(hasChanges);
//     }
//   }, [consignee, addressLine1, addressLine2, zipcode, city, state, telephone, shipmentData]);

//   return (
//     <div className="p-4">
//       <NotificationFlag
//         type={notification.type}
//         message={notification.message}
//         visible={notification.visible}
//         setVisible={(visible) => setNotification((prev) => ({ ...prev, visible }))}
//       />

//       <Heading
//         title="UK DPD Label"
//         bulkUploadBtn="hidden"
//         codeListBtn="hidden"
//         onRefresh={handleRefresh}
//       />

//       <div className="flex gap-6 mt-4">
//         {/* Left Column - Form */}
//         <div className="w-1/3 flex flex-col">
//           <RedLabelHeading label="Consignor Details" />

//           <div className="flex flex-col gap-3 mt-2">
//             <div className="flex gap-3">
//               <div className="flex-1">
//                 <InputBox
//                   resetFactor={resetFactor}
//                   register={register}
//                   setValue={setValue}
//                   placeholder="Airwaybill Number"
//                   value="awbNo"
//                 />
//               </div>
//               <div>
//                 <OutlinedButtonRed
//                   label={loading ? "Searching..." : "Search"}
//                   onClick={handleSearch}
//                   disabled={loading}
//                 />
//               </div>
//             </div>

//             {xpresionAWB && (
//               <div className="bg-green-50 border border-green-200 rounded-md p-2 text-sm">
//                 <span className="font-semibold">Xpresion AWB:</span> {xpresionAWB}
//               </div>
//             )}

//             <div className="flex gap-3">
//               <div className="flex-1">
//                 <EditableInputBox
//                   key={`sector-${formKey}`}
//                   resetFactor={resetFactor}
//                   register={register}
//                   setValue={setValue}
//                   placeholder="Sector"
//                   value="sector"
//                   initialValue={watch("sector")}
//                   disabled={true}
//                 />
//               </div>
//               <div className="flex-1">
//                 <DateInputBox
//                   key={`date-${formKey}-${watch("date")}`}
//                   register={register}
//                   setValue={setValue}
//                   placeholder="Date"
//                   value="date"
//                   resetFactor={resetFactor}
//                   initialValue={watch("date") || ""}
//                 />
//               </div>
//               <div className="flex-1">
//                 <EditableInputBox
//                   key={`origin-${formKey}`}
//                   register={register}
//                   setValue={setValue}
//                   placeholder="Origin"
//                   value="origin"
//                   resetFactor={resetFactor}
//                   initialValue={watch("origin")}
//                   disabled={true}
//                 />
//               </div>
//             </div>

//             <div className="flex gap-3">
//               <div className="flex-1">
//                 <EditableInputBox
//                   key={`accountCode-${formKey}`}
//                   register={register}
//                   setValue={setValue}
//                   placeholder="Code"
//                   value="accountCode"
//                   resetFactor={resetFactor}
//                   initialValue={watch("accountCode")}
//                   disabled={true}
//                 />
//               </div>
//               <div className="flex-1">
//                 <EditableInputBox
//                   key={`customer-${formKey}`}
//                   register={register}
//                   setValue={setValue}
//                   placeholder="Customer"
//                   value="customer"
//                   resetFactor={resetFactor}
//                   initialValue={watch("customer")}
//                   disabled={true}
//                 />
//               </div>
//             </div>

//             <EditableInputBox
//               key={`consignor-${formKey}`}
//               register={register}
//               setValue={setValue}
//               placeholder="Consignor"
//               value="consignor"
//               resetFactor={resetFactor}
//               initialValue={watch("consignor")}
//               disabled={true}
//             />

//             <RedLabelHeading label="Consignee Details" />

//             <div className="flex flex-col gap-3">
//               <EditableInputBox
//                 key={`consignee-${formKey}`}
//                 register={register}
//                 setValue={setValue}
//                 placeholder="Consignee"
//                 value="consignee"
//                 resetFactor={resetFactor}
//                 initialValue={watch("consignee")}
//               />
//               <EditableInputBox
//                 key={`addressLine1-${formKey}`}
//                 register={register}
//                 setValue={setValue}
//                 placeholder="Address Line 1"
//                 value="addressLine1"
//                 resetFactor={resetFactor}
//                 initialValue={watch("addressLine1")}
//               />
//               <EditableInputBox
//                 key={`addressLine2-${formKey}`}
//                 register={register}
//                 setValue={setValue}
//                 placeholder="Address Line 2"
//                 value="addressLine2"
//                 resetFactor={resetFactor}
//                 initialValue={watch("addressLine2")}
//               />
//               <div className="flex gap-3">
//                 <div className="flex-1">
//                   <EditableInputBox
//                     key={`zipcode-${formKey}`}
//                     register={register}
//                     setValue={setValue}
//                     placeholder="Zipcode"
//                     value="zipcode"
//                     resetFactor={resetFactor}
//                     initialValue={watch("zipcode")}
//                   />
//                 </div>
//                 <div className="flex-1">
//                   <EditableInputBox
//                     key={`city-${formKey}`}
//                     register={register}
//                     setValue={setValue}
//                     placeholder="City"
//                     value="city"
//                     resetFactor={resetFactor}
//                     initialValue={watch("city")}
//                   />
//                 </div>
//                 <div className="flex-1">
//                   <EditableInputBox
//                     key={`state-${formKey}`}
//                     register={register}
//                     setValue={setValue}
//                     placeholder="State"
//                     value="state"
//                     resetFactor={resetFactor}
//                     initialValue={watch("state")}
//                   />
//                 </div>
//               </div>
//               <EditableInputBox
//                 key={`telephone-${formKey}`}
//                 register={register}
//                 setValue={setValue}
//                 placeholder="Telephone"
//                 value="telephone"
//                 resetFactor={resetFactor}
//                 initialValue={watch("telephone")}
//               />

//               {consigneeEdited && (
//                 <div className="mt-2">
//                   <SimpleButton
//                     name={loading ? "Updating..." : "Update Consignee"}
//                     onClick={handleUpdateConsignee}
//                     disabled={loading}
//                   />
//                 </div>
//               )}
//             </div>

//             <RedLabelHeading label="Service Details" />

//             <div className="flex flex-col gap-3">
//               <LabeledDropdown
//                 key={`billingService-${formKey}`}
//                 register={register}
//                 setValue={setValue}
//                 title="Billing Service"
//                 value="billingService"
//                 options={["DPD LABEL STANDARD"]}
//                 resetFactor={resetFactor}
//               />
//               <div className="flex gap-3">
//                 <div className="flex-1">
//                   <EditableInputBox
//                     key={`pcs-${formKey}`}
//                     register={register}
//                     setValue={setValue}
//                     value="pcs"
//                     placeholder="Pcs"
//                     resetFactor={resetFactor}
//                     initialValue={watch("pcs")}
//                     disabled={true}
//                   />
//                 </div>
//                 <div className="flex-1">
//                   <EditableInputBox
//                     key={`actualWt-${formKey}`}
//                     register={register}
//                     setValue={setValue}
//                     value="actualWt"
//                     resetFactor={resetFactor}
//                     placeholder="Actual Wt"
//                     initialValue={watch("actualWt")}
//                     disabled={true}
//                   />
//                 </div>
//                 <div className="flex-1">
//                   <EditableInputBox
//                     key={`value-${formKey}`}
//                     register={register}
//                     setValue={setValue}
//                     value="value"
//                     placeholder="Value"
//                     resetFactor={resetFactor}
//                     initialValue={watch("value")}
//                   />
//                 </div>
//               </div>
//               <EditableInputBox
//                 key={`operationRemarks-${formKey}`}
//                 register={register}
//                 setValue={setValue}
//                 placeholder="Ops Remark"
//                 value="operationRemarks"
//                 resetFactor={resetFactor}
//                 initialValue={watch("operationRemarks")}
//                 disabled={true}
//               />

//               {shipmentData?.isHold && (
//                 <div className="flex gap-3">
//                   <div className="w-1/3">
//                     <RedCheckbox
//                       id="hold"
//                       label="Hold"
//                       register={register}
//                       setValue={setValue}
//                       setChecked={true}
//                       isChecked={true}
//                       disabled
//                     />
//                   </div>
//                   <div className="flex-1">
//                     <EditableInputBox
//                       key={`holdReason-${formKey}`}
//                       register={register}
//                       setValue={setValue}
//                       placeholder="Hold Reason"
//                       value="holdReason"
//                       resetFactor={resetFactor}
//                       initialValue={watch("holdReason")}
//                       disabled={true}
//                     />
//                   </div>
//                 </div>
//               )}

//               <EditableInputBox
//                 key={`content-${formKey}`}
//                 register={register}
//                 setValue={setValue}
//                 placeholder="Content"
//                 value="content"
//                 resetFactor={resetFactor}
//                 initialValue={watch("content")}
//                 disabled={true}
//               />
//             </div>

//             <div className="mt-3 flex gap-3 justify-start flex-wrap">
//               <div className="w-[140px]">
//                 <OutlinedButtonRed label="Remove" onClick={handleRefresh} />
//               </div>
//               <div className="w-[140px]">
//                 <OutlinedButtonRed
//                   label={creatingAWB ? "Creating AWB..." : "Create AWB"}
//                   onClick={handleCreateAWB}
//                   disabled={creatingAWB || !shipmentData || shipmentData?.isHold}
//                 />
//               </div>
//               <div className="w-[140px]">
//                 <OutlinedButtonRed
//                   label="Print All"
//                   onClick={handlePrint}
//                   disabled={labelPreviews.length === 0}
//                 />
//               </div>
//               <div className="w-[140px]">
//                 <OutlinedButtonRed
//                   label="Download All"
//                   onClick={handleDownload}
//                   disabled={labelPreviews.length === 0}
//                 />
//               </div>
//               <div className="w-[140px]">
//                 <SimpleButton
//                   name={
//                     loading
//                       ? labelsCreated
//                         ? "Saving..."
//                         : "Creating..."
//                       : labelsCreated && !labelsSaved
//                       ? "Save"
//                       : "Create Label"
//                   }
//                   onClick={labelsCreated && !labelsSaved ? handleSave : handleCreateLabel}
//                   disabled={loading || !shipmentData || shipmentData?.isHold || labelsSaved}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Middle Column - Label Preview */}
//         <div className="w-1/3">
//           <div className="flex justify-between items-center">
//             <RedLabelHeading
//               label={
//                 labelPreviews.length > 1
//                   ? `DPD Label Preview (${currentLabelIndex + 1}/${labelPreviews.length})`
//                   : "DPD Label Preview"
//               }
//             />
//             <div className="flex gap-2">
//               {labelPreviews.length > 1 && (
//                 <>
//                   <button
//                     onClick={handlePreviousLabel}
//                     disabled={currentLabelIndex === 0}
//                     className={`px-3 py-1 text-sm rounded ${
//                       currentLabelIndex === 0
//                         ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//                         : "bg-red-500 text-white hover:bg-red-600"
//                     }`}
//                   >
//                     Prev
//                   </button>
//                   <button
//                     onClick={handleNextLabel}
//                     disabled={currentLabelIndex === labelPreviews.length - 1}
//                     className={`px-3 py-1 text-sm rounded ${
//                       currentLabelIndex === labelPreviews.length - 1
//                         ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//                         : "bg-red-500 text-white hover:bg-red-600"
//                     }`}
//                   >
//                     Next
//                   </button>
//                 </>
//               )}
//               {labelPreviews.length > 0 && (
//                 <button
//                   onClick={handlePrintSingle}
//                   className="px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600"
//                 >
//                   Print
//                 </button>
//               )}
//             </div>
//           </div>
//           <div className="h-[600px] rounded-md border mt-1 mb-3 shadow-sm overflow-hidden">
//             {labelPreviews.length > 0 && labelPreviews[currentLabelIndex]?.labelUrl ? (
//               <embed
//                 src={labelPreviews[currentLabelIndex].labelUrl}
//                 type="application/pdf"
//                 width="100%"
//                 height="100%"
//               />
//             ) : (
//               <div className="flex items-center justify-center h-full text-gray-400">
//                 No label preview
//               </div>
//             )}
//           </div>
//           <EditableInputBox
//             key={`dpdNo-${formKey}`}
//             register={register}
//             setValue={setValue}
//             placeholder="DPD Tracking Numbers"
//             value="dpdNo"
//             resetFactor={resetFactor}
//             initialValue={watch("dpdNo")}
//             disabled={true}
//           />
//         </div>

//         {/* Right Column - Child Numbers Table */}
//         <div className="w-1/3">
//           <RedLabelHeading
//             label={`Child AWB Numbers ${childNumbers.length > 0 ? `(${childNumbers.length})` : ""}`}
//           />
//           <div className="h-[600px] rounded-md border mb-3 shadow-sm overflow-auto bg-gray-50">
//             {childNumbers.length > 0 ? (
//               <div className="p-3">
//                 <table className="w-full text-sm border-collapse">
//                   <thead>
//                     <tr className="bg-red-50 border-b border-gray-300 sticky top-0">
//                       <th className="p-2 text-left font-semibold text-gray-700 border-r border-gray-300">
//                         S.No
//                       </th>
//                       <th className="p-2 text-left font-semibold text-gray-700 border-r border-gray-300">
//                         Child No
//                       </th>
//                       <th className="p-2 text-left font-semibold text-gray-700">
//                         Forwarding No
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {childNumbers.map((child, index) => (
//                       <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
//                         <td className="p-2 border-r border-gray-200">{child.sno}</td>
//                         <td className="p-2 border-r border-gray-200 font-medium">{child.childNo}</td>
//                         <td className="p-2 text-blue-600">{child.forwardingNo || "-"}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             ) : (
//               <div className="flex items-center justify-center h-full text-gray-400">
//                 {shipmentData
//                   ? shipmentData.pcs > 1
//                     ? "No child AWB numbers found"
//                     : "Single piece shipment - no child AWBs needed"
//                   : "Search for a shipment to view details"}
//               </div>
//             )}
//           </div>
//           <EditableInputBox
//             key={`labelUrl-${formKey}`}
//             register={register}
//             setValue={setValue}
//             placeholder="Label URL"
//             value="labelUrl"
//             resetFactor={resetFactor}
//             initialValue={watch("labelUrl")}
//             disabled={true}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UkDpdPage;

"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useState, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

// Editable Input Box Component
const EditableInputBox = ({
  placeholder,
  register,
  setValue,
  value,
  initialValue = "",
  resetFactor = false,
  isTextArea = false,
  className = "",
  validation = {},
  error,
  trigger,
  type = "input",
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue || "");

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const handleChange = (e) => {
    let newValue = e.target.value;
    setInputValue(newValue);
    setValue(value, newValue);
    if (trigger) trigger(value);
  };

  const isPlaceholderFloating = isFocused || inputValue !== "";

  useEffect(() => {
    setInputValue(initialValue || "");
  }, [initialValue]);

  useEffect(() => {
    setInputValue("");
    setValue(value, null);
  }, [resetFactor]);

  return isTextArea ? (
    <div className="relative w-full">
      <textarea
        {...register(value)}
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={`border border-[#979797] outline-none bg-transparent rounded-md h-10 px-4 py-2 w-full ${
          disabled ? "bg-gray-100" : ""
        } ${className}`}
      />
      {placeholder && (
        <label
          htmlFor={value}
          className={`absolute transition-all px-2 left-4 ${
            isPlaceholderFloating
              ? "-top-2 text-xs z-10 pb-0 font-semibold text-[#979797] bg-white h-4"
              : `${error ? "top-1/3" : "top-1/2"} -translate-y-1/2 -bottom-6 text-sm text-[#979797]`
          }`}
        >
          {placeholder}
        </label>
      )}
      {error && <span className="text-red-500 text-xs">{error.message}</span>}
    </div>
  ) : (
    <div className="relative w-full">
      <input
        type={type}
        {...register(value, validation)}
        value={inputValue}
        id={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        autoComplete="off"
        className={`border outline-none bg-transparent rounded-md h-8 text-sm px-4 py-2 w-full ${
          error ? "border-red-500" : "border-[#979797]"
        } ${disabled ? "bg-gray-100" : ""} ${className}`}
      />
      {placeholder && (
        <label
          htmlFor={value}
          className={`absolute transition-all px-2 left-4 ${
            isPlaceholderFloating
              ? "-top-2 text-xs z-10 pb-0 font-semibold text-[#979797] bg-white h-4"
              : `${error ? "top-1/3" : "top-1/2"} -translate-y-1/2 text-sm text-[#979797]`
          }`}
        >
          {placeholder}
        </label>
      )}
      {error && <span className="text-red-500 text-xs">{error.message}</span>}
    </div>
  );
};

// Utility functions
const validateAWBNumber = (awbNo) => {
  if (!awbNo) return { valid: false, message: "AWB Number is required" };
  if (awbNo.startsWith('TEST')) {
    return { valid: true, isTest: true, message: "Test AWB number" };
  }
  if (!/^\d+$/.test(awbNo)) {
    return { valid: false, message: "AWB Number should contain only digits" };
  }
  if (awbNo.length < 8 || awbNo.length > 15) {
    return { valid: false, message: "AWB Number should be between 8 and 15 digits" };
  }
  return { valid: true, isTest: false };
};

const getErrorMessage = (error) => {
  if (error.response) {
    const data = error.response.data;
    const status = error.response.status;
    
    if (status === 400) {
      if (data.errorCode === 'TD01' || data.message?.includes('AWB does not exist')) {
        return "AWB Number not found in Xpresion system. Please create AWB first.";
      }
      return data.message || "Bad request. Please check your input.";
    }
    if (status === 404) return "Shipment not found in database";
    if (status === 500) return "Server error. Please try again later.";
    return data.message || `Error: ${status}`;
  } else if (error.request) {
    return "No response from server. Please check your network connection.";
  } else {
    return error.message || "An unexpected error occurred";
  }
};

const formatDateForDisplay = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch (error) {
    return dateString;
  }
};

const downloadPDF = (labelUrl, filename) => {
  const link = document.createElement('a');
  link.href = labelUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const printPDF = (labelUrl, title = "DPD Label") => {
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
          embed { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <embed src="${labelUrl}" type="application/pdf" width="100%" height="100%" />
      </body>
    </html>
  `);
  printWindow.document.close();
};

const UkDpdPage = () => {
  const { register, setValue, reset, watch } = useForm();
  const { server } = useContext(GlobalContext);
  const [resetFactor, setResetFactor] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [creatingAWB, setCreatingAWB] = useState(false);
  const [shipmentData, setShipmentData] = useState(null);
  const [childNumbers, setChildNumbers] = useState([]);
  const [labelPreviews, setLabelPreviews] = useState([]);
  const [currentLabelIndex, setCurrentLabelIndex] = useState(0);
  const [labelsCreated, setLabelsCreated] = useState(false);
  const [labelsSaved, setLabelsSaved] = useState(false);
  const [consigneeEdited, setConsigneeEdited] = useState(false);
  const [xpresionAWB, setXpresionAWB] = useState(null);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  const awbNo = watch("awbNo");
  const consignee = watch("consignee");
  const addressLine1 = watch("addressLine1");
  const addressLine2 = watch("addressLine2");
  const zipcode = watch("zipcode");
  const city = watch("city");
  const state = watch("state");
  const telephone = watch("telephone");

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  const handleRefresh = async () => {
    if (labelsCreated && !labelsSaved) {
      const confirmDelete = window.confirm(
        "Labels have been created but not saved. Do you want to delete them?"
      );
      if (!confirmDelete) return;
    }

    if (awbNo) {
      try {
        await axios.delete(`${server}/labels/dpd/uk?awbNo=${awbNo}`);
      } catch (error) {
        console.error("Error deleting labels:", error);
      }
    }

    setResetFactor(!resetFactor);
    setFormKey((prev) => prev + 1);
    reset();
    setShipmentData(null);
    setChildNumbers([]);
    setLabelPreviews([]);
    setCurrentLabelIndex(0);
    setLabelsCreated(false);
    setLabelsSaved(false);
    setConsigneeEdited(false);
    setXpresionAWB(null);
  };

  const handleSearch = async () => {
    const validation = validateAWBNumber(awbNo);
    if (!validation.valid) {
      showNotification("error", validation.message);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${server}/labels/dpd/uk?awbNo=${awbNo}`);

      if (response.data.success) {
        const data = response.data.data;
        setShipmentData(data);
        setXpresionAWB(data.xpresionAWBNo || null);

        const extractedChildNumbers = [];

        if (data.pcs > 1) {
          if (data.childShipments?.length > 0) {
            data.childShipments.forEach((childShipment) => {
              extractedChildNumbers.push({
                sno: extractedChildNumbers.length + 1,
                childNo: childShipment.childAwbNo,
                forwardingNo: childShipment.forwardingNo || "",
                xpresionAWB: childShipment.xpresionAWBNo || null,
                consigneeName: childShipment.consigneeName || data.receiverFullName || "",
                consigneeCity: childShipment.consigneeCity || data.receiverCity || "",
              });
            });

            const hasSavedLabels = extractedChildNumbers.some((child) => child.forwardingNo);
            setLabelsSaved(hasSavedLabels);
          }
        } else {
          if (data.forwardingNo) setLabelsSaved(true);
        }

        setChildNumbers(extractedChildNumbers);

        setValue("date", data.date || "");
        setValue("sector", data.sector || "");
        setValue("origin", data.origin || "");
        setValue("accountCode", data.accountCode || "");
        setValue("customer", data.customer || "");
        setValue("consignor", data.shipperFullName || "");
        setValue("pcs", data.pcs || 0);
        setValue("actualWt", data.totalActualWt || 0);
        setValue("value", data.totalInvoiceValue || 0);
        setValue("operationRemarks", data.operationRemark || "");
        setValue("content", data.content?.join(", ") || "");
        setValue("hold", data.isHold || false);
        setValue("holdReason", data.holdReason || "");
        setValue("consignee", data.receiverFullName || "");
        setValue("addressLine1", data.receiverAddressLine1 || "");
        setValue("addressLine2", data.receiverAddressLine2 || "");
        setValue("zipcode", data.receiverPincode || "");
        setValue("city", data.receiverCity || "");
        setValue("state", data.receiverState || "");
        setValue("telephone", data.receiverPhoneNumber || "");
        setValue("billingService", "DPD LABEL STANDARD");

        if (data.forwardingNo) {
          setValue("dpdNo", data.forwardingNo);
        } else if (extractedChildNumbers.length > 0) {
          const forwardingNos = extractedChildNumbers
            .map((child) => child.forwardingNo)
            .filter(Boolean)
            .join(", ");
          if (forwardingNos) setValue("dpdNo", forwardingNos);
        }

        if (data.isHold) {
          showNotification("error", `Shipment is on hold. Reason: ${data.holdReason || "Not specified"}`);
        } else if (data.pcs > 1 && extractedChildNumbers.length === 0) {
          showNotification("warning", "Please generate Child AWB Numbers before creating labels");
        } else {
          showNotification("success", "Shipment data loaded successfully");
        }

        setConsigneeEdited(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      showNotification("error", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAWB = async () => {
    if (!shipmentData) {
      showNotification("error", "Please search for a shipment first");
      return;
    }

    setCreatingAWB(true);
    try {
      const response = await axios.post(`${server}/labels/dpd/uk`, {
        awbNo: shipmentData.awbNo,
        createAWB: true
      });

      if (response.data.success) {
        setXpresionAWB(response.data.data.awbNo);
        showNotification("success", `AWB created successfully! New AWB: ${response.data.data.awbNo}`);
      }
    } catch (error) {
      console.error("Create AWB error:", error);
      showNotification("error", getErrorMessage(error));
    } finally {
      setCreatingAWB(false);
    }
  };

  const handleCreateLabel = async () => {
    if (!shipmentData) {
      showNotification("error", "Please search for a shipment first");
      return;
    }
    if (shipmentData.isHold) {
      showNotification("error", "Cannot create label - Shipment is on hold");
      return;
    }
    if (shipmentData.pcs > 1 && childNumbers.length === 0) {
      showNotification("error", "Cannot create label - Please generate Child AWB Numbers first");
      return;
    }

    setLoading(true);
    try {
      const consigneeData = {
        consignee: watch("consignee"),
        addressLine1: watch("addressLine1"),
        addressLine2: watch("addressLine2"),
        zipcode: watch("zipcode"),
        city: watch("city"),
        state: watch("state"),
        telephone: watch("telephone"),
      };

      const response = await axios.post(`${server}/labels/dpd/uk`, {
        awbNo: shipmentData.awbNo,
        consigneeData,
      });

      if (response.data.success) {
        setLabelPreviews(response.data.labels);
        setLabelsCreated(true);
        setLabelsSaved(false);

        const trackingNumbers = response.data.labels
          .map((label) => label.trackingNumber)
          .filter(Boolean)
          .join(", ");

        setValue("dpdNo", trackingNumbers);

        if (response.data.labels.length > 0 && childNumbers.length > 0) {
          const updatedChildNumbers = childNumbers.map((child) => {
            const matchingLabel = response.data.labels.find((label) => label.childNo === child.childNo);
            return { ...child, forwardingNo: matchingLabel?.trackingNumber || "" };
          });
          setChildNumbers(updatedChildNumbers);
        }

        if (response.data.partialSuccess) {
          showNotification("warning", response.data.message);
        } else {
          showNotification(
            "success",
            `DPD labels created successfully! (${response.data.labels.length} label${
              response.data.labels.length !== 1 ? "s" : ""
            }) - Click Save to store`
          );
        }
      }
    } catch (error) {
      console.error("Create label error:", error);
      const errorMessage = getErrorMessage(error);
      showNotification("error", errorMessage);
      
      // Check if error indicates AWB doesn't exist
      if (errorMessage.includes("AWB does not exist") || error.response?.data?.requiresAWBCreation) {
        showNotification("warning", "Please create AWB in Xpresion system first using 'Create AWB' button");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!labelsCreated) {
      showNotification("error", "No labels to save");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${server}/labels/dpd/uk`, {
        awbNo: shipmentData.awbNo,
        action: "save",
        labels: labelPreviews,
      });

      if (response.data.success) {
        setLabelsSaved(true);
        showNotification("success", "Forwarding numbers saved successfully!");
      }
    } catch (error) {
      console.error("Save error:", error);
      showNotification("error", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConsignee = async () => {
    if (!shipmentData) {
      showNotification("error", "No shipment data to update");
      return;
    }

    setLoading(true);
    try {
      const consigneeData = {
        consignee: watch("consignee"),
        addressLine1: watch("addressLine1"),
        addressLine2: watch("addressLine2"),
        zipcode: watch("zipcode"),
        city: watch("city"),
        state: watch("state"),
        telephone: watch("telephone"),
      };

      const response = await axios.put(`${server}/labels/dpd/uk`, {
        awbNo: shipmentData.awbNo,
        consigneeData,
      });

      if (response.data.success) {
        setConsigneeEdited(false);
        showNotification("success", "Consignee details updated successfully!");
        
        setShipmentData({
          ...shipmentData,
          receiverFullName: consigneeData.consignee,
          receiverAddressLine1: consigneeData.addressLine1,
          receiverAddressLine2: consigneeData.addressLine2,
          receiverPincode: consigneeData.zipcode,
          receiverCity: consigneeData.city,
          receiverState: consigneeData.state,
          receiverPhoneNumber: consigneeData.telephone,
        });
      }
    } catch (error) {
      console.error("Update consignee error:", error);
      showNotification("error", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (labelPreviews.length === 0) {
      showNotification("error", "No labels to print");
      return;
    }
    labelPreviews.forEach((label, index) => {
      printPDF(label.labelUrl, `DPD Label ${index + 1}`);
    });
  };

  const handlePrintSingle = () => {
    if (labelPreviews.length === 0) {
      showNotification("error", "No labels to print");
      return;
    }
    const label = labelPreviews[currentLabelIndex];
    printPDF(label.labelUrl, `DPD Label ${currentLabelIndex + 1}`);
  };

  const handleDownload = () => {
    if (labelPreviews.length === 0) {
      showNotification("error", "No labels to download");
      return;
    }
    labelPreviews.forEach((label, index) => {
      const filename = `DPD_Label_${label.trackingNumber || index + 1}.pdf`;
      downloadPDF(label.labelUrl, filename);
    });
  };

  const handlePreviousLabel = () => {
    if (currentLabelIndex > 0) setCurrentLabelIndex(currentLabelIndex - 1);
  };

  const handleNextLabel = () => {
    if (currentLabelIndex < labelPreviews.length - 1) setCurrentLabelIndex(currentLabelIndex + 1);
  };

  useEffect(() => {
    if (shipmentData) {
      const hasChanges =
        consignee !== (shipmentData.receiverFullName || "") ||
        addressLine1 !== (shipmentData.receiverAddressLine1 || "") ||
        addressLine2 !== (shipmentData.receiverAddressLine2 || "") ||
        zipcode !== (shipmentData.receiverPincode || "") ||
        city !== (shipmentData.receiverCity || "") ||
        state !== (shipmentData.receiverState || "") ||
        telephone !== (shipmentData.receiverPhoneNumber || "");

      setConsigneeEdited(hasChanges);
    }
  }, [consignee, addressLine1, addressLine2, zipcode, city, state, telephone, shipmentData]);

  return (
    <div className="p-4">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) => setNotification((prev) => ({ ...prev, visible }))}
      />

      <Heading
        title="UK DPD Label LONDON UK"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="flex gap-6 mt-4">
        {/* Left Column - Form */}
        <div className="w-1/3 flex flex-col">
          <RedLabelHeading label="Consignor Details" />

          <div className="flex flex-col gap-3 mt-2">
            <div className="flex gap-3">
              <div className="flex-1">
                <InputBox
                  resetFactor={resetFactor}
                  register={register}
                  setValue={setValue}
                  placeholder="Airwaybill Number"
                  value="awbNo"
                />
              </div>
              <div>
                <OutlinedButtonRed
                  label={loading ? "Searching..." : "Search"}
                  onClick={handleSearch}
                  disabled={loading}
                />
              </div>
            </div>

            {xpresionAWB && (
              <div className="bg-green-50 border border-green-200 rounded-md p-2 text-sm">
                <span className="font-semibold">Xpresion AWB:</span> {xpresionAWB}
              </div>
            )}

            <div className="flex gap-3">
              <div className="flex-1">
                <EditableInputBox
                  key={`sector-${formKey}`}
                  resetFactor={resetFactor}
                  register={register}
                  setValue={setValue}
                  placeholder="Sector"
                  value="sector"
                  initialValue={watch("sector")}
                  disabled={true}
                />
              </div>
              <div className="flex-1">
                <DateInputBox
                  key={`date-${formKey}-${watch("date")}`}
                  register={register}
                  setValue={setValue}
                  placeholder="Date"
                  value="date"
                  resetFactor={resetFactor}
                  initialValue={watch("date") || ""}
                />
              </div>
              <div className="flex-1">
                <EditableInputBox
                  key={`origin-${formKey}`}
                  register={register}
                  setValue={setValue}
                  placeholder="Origin"
                  value="origin"
                  resetFactor={resetFactor}
                  initialValue={watch("origin")}
                  disabled={true}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <EditableInputBox
                  key={`accountCode-${formKey}`}
                  register={register}
                  setValue={setValue}
                  placeholder="Code"
                  value="accountCode"
                  resetFactor={resetFactor}
                  initialValue={watch("accountCode")}
                  disabled={true}
                />
              </div>
              <div className="flex-1">
                <EditableInputBox
                  key={`customer-${formKey}`}
                  register={register}
                  setValue={setValue}
                  placeholder="Customer"
                  value="customer"
                  resetFactor={resetFactor}
                  initialValue={watch("customer")}
                  disabled={true}
                />
              </div>
            </div>

            <EditableInputBox
              key={`consignor-${formKey}`}
              register={register}
              setValue={setValue}
              placeholder="Consignor"
              value="consignor"
              resetFactor={resetFactor}
              initialValue={watch("consignor")}
              disabled={true}
            />

            <RedLabelHeading label="Consignee Details" />

            <div className="flex flex-col gap-3">
              <EditableInputBox
                key={`consignee-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder="Consignee"
                value="consignee"
                resetFactor={resetFactor}
                initialValue={watch("consignee")}
              />
              <EditableInputBox
                key={`addressLine1-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder="Address Line 1"
                value="addressLine1"
                resetFactor={resetFactor}
                initialValue={watch("addressLine1")}
              />
              <EditableInputBox
                key={`addressLine2-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder="Address Line 2"
                value="addressLine2"
                resetFactor={resetFactor}
                initialValue={watch("addressLine2")}
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <EditableInputBox
                    key={`zipcode-${formKey}`}
                    register={register}
                    setValue={setValue}
                    placeholder="Zipcode"
                    value="zipcode"
                    resetFactor={resetFactor}
                    initialValue={watch("zipcode")}
                  />
                </div>
                <div className="flex-1">
                  <EditableInputBox
                    key={`city-${formKey}`}
                    register={register}
                    setValue={setValue}
                    placeholder="City"
                    value="city"
                    resetFactor={resetFactor}
                    initialValue={watch("city")}
                  />
                </div>
                <div className="flex-1">
                  <EditableInputBox
                    key={`state-${formKey}`}
                    register={register}
                    setValue={setValue}
                    placeholder="State"
                    value="state"
                    resetFactor={resetFactor}
                    initialValue={watch("state")}
                  />
                </div>
              </div>
              <EditableInputBox
                key={`telephone-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder="Telephone"
                value="telephone"
                resetFactor={resetFactor}
                initialValue={watch("telephone")}
              />

              {consigneeEdited && (
                <div className="mt-2">
                  <SimpleButton
                    name={loading ? "Updating..." : "Update Consignee"}
                    onClick={handleUpdateConsignee}
                    disabled={loading}
                  />
                </div>
              )}
            </div>

            <RedLabelHeading label="Service Details" />

            <div className="flex flex-col gap-3">
              <LabeledDropdown
                key={`billingService-${formKey}`}
                register={register}
                setValue={setValue}
                title="Billing Service"
                value="billingService"
                options={["DPD LABEL STANDARD"]}
                resetFactor={resetFactor}
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <EditableInputBox
                    key={`pcs-${formKey}`}
                    register={register}
                    setValue={setValue}
                    value="pcs"
                    placeholder="Pcs"
                    resetFactor={resetFactor}
                    initialValue={watch("pcs")}
                    disabled={true}
                  />
                </div>
                <div className="flex-1">
                  <EditableInputBox
                    key={`actualWt-${formKey}`}
                    register={register}
                    setValue={setValue}
                    value="actualWt"
                    resetFactor={resetFactor}
                    placeholder="Actual Wt"
                    initialValue={watch("actualWt")}
                    disabled={true}
                  />
                </div>
                <div className="flex-1">
                  <EditableInputBox
                    key={`value-${formKey}`}
                    register={register}
                    setValue={setValue}
                    value="value"
                    placeholder="Value"
                    resetFactor={resetFactor}
                    initialValue={watch("value")}
                  />
                </div>
              </div>
              <EditableInputBox
                key={`operationRemarks-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder="Ops Remark"
                value="operationRemarks"
                resetFactor={resetFactor}
                initialValue={watch("operationRemarks")}
                disabled={true}
              />

              {shipmentData?.isHold && (
                <div className="flex gap-3">
                  <div className="w-1/3">
                    <RedCheckbox
                      id="hold"
                      label="Hold"
                      register={register}
                      setValue={setValue}
                      setChecked={true}
                      isChecked={true}
                      disabled
                    />
                  </div>
                  <div className="flex-1">
                    <EditableInputBox
                      key={`holdReason-${formKey}`}
                      register={register}
                      setValue={setValue}
                      placeholder="Hold Reason"
                      value="holdReason"
                      resetFactor={resetFactor}
                      initialValue={watch("holdReason")}
                      disabled={true}
                    />
                  </div>
                </div>
              )}

              <EditableInputBox
                key={`content-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder="Content"
                value="content"
                resetFactor={resetFactor}
                initialValue={watch("content")}
                disabled={true}
              />
            </div>

            <div className="mt-3 flex gap-3 justify-start flex-wrap">
              <div className="w-[140px]">
                <OutlinedButtonRed label="Remove" onClick={handleRefresh} />
              </div>
              <div className="w-[140px]">
                <OutlinedButtonRed
                  label={creatingAWB ? "Creating AWB..." : "Create AWB"}
                  onClick={handleCreateAWB}
                  disabled={creatingAWB || !shipmentData || shipmentData?.isHold}
                />
              </div>
              <div className="w-[140px]">
                <OutlinedButtonRed
                  label="Print All"
                  onClick={handlePrint}
                  disabled={labelPreviews.length === 0}
                />
              </div>
              <div className="w-[140px]">
                <OutlinedButtonRed
                  label="Download All"
                  onClick={handleDownload}
                  disabled={labelPreviews.length === 0}
                />
              </div>
              <div className="w-[140px]">
                <SimpleButton
                  name={
                    loading
                      ? labelsCreated
                        ? "Saving..."
                        : "Creating..."
                      : labelsCreated && !labelsSaved
                      ? "Save"
                      : "Create Label"
                  }
                  onClick={labelsCreated && !labelsSaved ? handleSave : handleCreateLabel}
                  disabled={loading || !shipmentData || shipmentData?.isHold || labelsSaved}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Label Preview */}
        <div className="w-1/3">
          <div className="flex justify-between items-center">
            <RedLabelHeading
              label={
                labelPreviews.length > 1
                  ? `DPD Label Preview (${currentLabelIndex + 1}/${labelPreviews.length})`
                  : "DPD Label Preview"
              }
            />
            <div className="flex gap-2">
              {labelPreviews.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousLabel}
                    disabled={currentLabelIndex === 0}
                    className={`px-3 py-1 text-sm rounded ${
                      currentLabelIndex === 0
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    Prev
                  </button>
                  <button
                    onClick={handleNextLabel}
                    disabled={currentLabelIndex === labelPreviews.length - 1}
                    className={`px-3 py-1 text-sm rounded ${
                      currentLabelIndex === labelPreviews.length - 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    Next
                  </button>
                </>
              )}
              {labelPreviews.length > 0 && (
                <button
                  onClick={handlePrintSingle}
                  className="px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600"
                >
                  Print
                </button>
              )}
            </div>
          </div>
          <div className="h-[600px] rounded-md border mt-1 mb-3 shadow-sm overflow-hidden">
            {labelPreviews.length > 0 && labelPreviews[currentLabelIndex]?.labelUrl ? (
              <embed
                src={labelPreviews[currentLabelIndex].labelUrl}
                type="application/pdf"
                width="100%"
                height="100%"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No label preview
              </div>
            )}
          </div>
          <EditableInputBox
            key={`dpdNo-${formKey}`}
            register={register}
            setValue={setValue}
            placeholder="DPD Tracking Numbers"
            value="dpdNo"
            resetFactor={resetFactor}
            initialValue={watch("dpdNo")}
            disabled={true}
          />
        </div>

        {/* Right Column - Child Numbers Table */}
        <div className="w-1/3">
          <RedLabelHeading
            label={`Child AWB Numbers ${childNumbers.length > 0 ? `(${childNumbers.length})` : ""}`}
          />
          <div className="h-[600px] rounded-md border mb-3 shadow-sm overflow-auto bg-gray-50">
            {childNumbers.length > 0 ? (
              <div className="p-3">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-red-50 border-b border-gray-300 sticky top-0">
                      <th className="p-2 text-left font-semibold text-gray-700 border-r border-gray-300">
                        S.No
                      </th>
                      <th className="p-2 text-left font-semibold text-gray-700 border-r border-gray-300">
                        Child No
                      </th>
                      <th className="p-2 text-left font-semibold text-gray-700">
                        Forwarding No
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {childNumbers.map((child, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
                        <td className="p-2 border-r border-gray-200">{child.sno}</td>
                        <td className="p-2 border-r border-gray-200 font-medium">{child.childNo}</td>
                        <td className="p-2 text-blue-600">{child.forwardingNo || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                {shipmentData
                  ? shipmentData.pcs > 1
                    ? "No child AWB numbers found"
                    : "Single piece shipment - no child AWBs needed"
                  : "Search for a shipment to view details"}
              </div>
            )}
          </div>
          <EditableInputBox
            key={`labelUrl-${formKey}`}
            register={register}
            setValue={setValue}
            placeholder="Label URL"
            value="labelUrl"
            resetFactor={resetFactor}
            initialValue={watch("labelUrl")}
            disabled={true}
          />
        </div>
      </div>
    </div>
  );
};

export default UkDpdPage;