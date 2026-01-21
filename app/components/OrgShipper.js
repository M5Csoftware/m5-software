import React, { useContext, useEffect, useMemo, useState } from "react";
import InputBox from "./InputBox";
import { useForm } from "react-hook-form";
import { OutlinedButtonRed, SimpleButton } from "./Buttons";
import { TableWithSorting } from "./Table";

import axios from "axios";
import { GlobalContext } from "../lib/GlobalContext";
import { useAlertCheck } from "@/app/hooks/useAlertCheck";
import { AlertModal } from "@/app/components/AlertModal";
import NotificationFlag from "./Notificationflag";
import { Trash2 } from "lucide-react";
import { DummyInputBoxWithLabelDarkGray } from "./DummyInputBox";

let debounceTimer;

// Delete Confirmation Modal
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, childAwbNo }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5">
          <div className="mb-3 text-center">
            <p className="text-lg font-bold text-red mb-2">Confirm Delete</p>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this child shipment?
            </p>
          </div>

          <div className="bg-[#FAC5C5] border-red rounded-xl p-4 mb-4">
            <p className="text-base text-black font-semibold text-center">
              Child AWB: {childAwbNo}
            </p>
          </div>

          <div className="flex items-start gap-2 text-sm text-gray-600">
            <svg
              className="w-5 h-5 text-red flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p>
              This action cannot be undone. The child shipment will be permanently deleted from the database.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 bg-red text-white rounded-md hover:bg-red-700 active:bg-red-800 transition-colors font-semibold shadow-sm"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Child Existence Modal Component
const ChildExistsModal = ({ isOpen, onClose, masterAwbNo }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5">
          <div className="mb-3 text-center">
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Master AWB Number
            </p>
            <p className="text-lg font-bold text-red">{masterAwbNo}</p>
          </div>

          <div className="bg-[#FAC5C5] border-red rounded-xl p-4 mb-4">
            <p className="text-lg text-black font-semibold">
              Child shipments already exist for this Master AWB
            </p>
          </div>

          <div className="flex items-start gap-2 text-sm text-gray-600">
            <svg
              className="w-5 h-5 text-red flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p>
              This Master AWB already has child shipments created. The existing child data is displayed in the table below.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-red text-white rounded-md hover:bg-red-700 active:bg-red-800 transition-colors font-semibold shadow-sm"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrgShipper = ({
  awbreset,
  onRefresh = () => console.log("No Action!"),
}) => {
  const { handleSubmit, register, setValue, reset, watch, getValues } =
    useForm();
  const [rowData, setRowData] = useState([]);
  const [showDisabled, setShowDisabled] = useState(true);
  const [data, setData] = useState();
  const [boxCount, setBoxCount] = useState();
  const [checkingExistence, setCheckingExistence] = useState(false);
  const [childExistsModalOpen, setChildExistsModalOpen] = useState(false);
  const [hasExistingChildren, setHasExistingChildren] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState(null);

  const masterAwbNo = watch("masterAwbNo");
  const childSrNo = watch("childSrNo");
  const jump = watch("jump");
  const Destination = watch("Destination");
  const { server } = useContext(GlobalContext);
  const { checkAlert } = useAlertCheck();
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertData, setAlertData] = useState({ message: "", awbNo: "" });
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const parentAwbNo = watch("masterAwbNo");

  useEffect(() => {
    const checkForAlerts = async () => {
      if (parentAwbNo && parentAwbNo.trim().length >= 4) {
        const alertResult = await checkAlert(parentAwbNo.trim());

        if (alertResult.hasAlert) {
          setAlertData({
            message: alertResult.message,
            awbNo: alertResult.awbNo,
          });
          showNotification("error", alertResult.message);
          setAlertModalOpen(true);
        }
      }
    };

    const timeoutId = setTimeout(checkForAlerts, 800);
    return () => clearTimeout(timeoutId);
  }, [parentAwbNo, checkAlert]);

  const columns = useMemo(
    () => [
      { key: "childAwbNo", label: "Child AWB No" },
      { key: "shipperName", label: "Shipper Name" },
      { key: "shipperAddress", label: "Shipper Address" },
      { key: "shipperCity", label: "Shipper City" },
      { key: "shipperPin", label: "Shipper Pin" },
      { key: "consigneeName", label: "Consignee Name" },
      { key: "consigneeAdd", label: "Consignee Address" },
      { key: "consigneeCity", label: "Consignee City" },
      { key: "consigneeState", label: "Consignee State" },
      { key: "consigneeZip", label: "Consignee Zip Code" },
      { key: "MAWB", label: "MAWB" },
      { 
        key: "action", 
        label: "Action"
      },
    ],
    []
  );

  const handleDeleteClick = (row) => {
    setChildToDelete(row);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!childToDelete) return;

    try {
      const response = await axios.delete(`${server}/portal/create-child`, {
        data: { childAwbNo: childToDelete.childAwbNo }
      });

      showNotification("success", "Child shipment deleted successfully");
      
      // Remove from local state
      const updatedRowData = rowData.filter(row => row.childAwbNo !== childToDelete.childAwbNo);
      setRowData(updatedRowData);
      
      // Update box count correctly
      setBoxCount(updatedRowData.length);
      
      setDeleteModalOpen(false);
      setChildToDelete(null);
      onRefresh();
    } catch (error) {
      console.error("Error deleting child shipment:", error);
      showNotification("error", "Failed to delete child shipment");
    }
  };

  const checkAndLoadExistingChildren = async (masterAwb) => {
    if (!masterAwb) return;

    try {
      const response = await axios.get(
        `${server}/portal/create-child?masterAwbNo=${masterAwb}`
      );

      if (response.data.length > 0) {
        console.log("Existing child shipments found:", response.data);

        const existingChildren = response.data.map((child) => ({
          _id: child._id,
          childAwbNo: child.childAwbNo,
          shipperName: child.shipperName,
          shipperAddress: child.shipperAddress,
          shipperCity: child.shipperCity,
          shipperPin: child.shipperPin,
          consigneeName: child.consigneeName,
          consigneeAdd: child.consigneeAdd,
          consigneeCity: child.consigneeCity,
          consigneeState: child.consigneeState,
          consigneeZip: child.consigneeZip,
          MAWB: child.MAWB || child.masterAwbNo,
        }));

        setRowData(existingChildren);
        setHasExistingChildren(true);
        setCheckingExistence(true);
        setChildExistsModalOpen(true);
        setBoxCount(existingChildren.length);

        if (response.data[0]?.destination) {
          setValue("Destination", response.data[0].destination);
        }

        showNotification("info", `Found ${existingChildren.length} existing child shipments`);
      } else {
        setHasExistingChildren(false);
        setCheckingExistence(false);
        setRowData([]);
      }
    } catch (error) {
      console.error("Error checking child shipments:", error);
      showNotification("error", "Error checking child shipments");
      setCheckingExistence(false);
      setHasExistingChildren(false);
      setRowData([]);
    }
  };

  const fetchShipmentData = async (awb) => {
    try {
      const res = await axios.get(
        `${server}/portal/create-shipment?awbNo=${awb}`
      );
      const data = res.data;
      console.log(data);

      if (data) {
        // Auto-fetch and set destination
        if (data.destination) {
          setValue("Destination", data.destination);
        }

        const boxes = data.boxes || [];
        const boxCount = boxes.length;
        const childSrNo = parseInt(watch("childSrNo"));
        const jump = parseInt(watch("jump"));

        // Display actual child count (excluding master)
        const actualChildCount = boxCount > 1 ? boxCount - 1 : 0;
        setBoxCount(actualChildCount);

        let generatedRows = [];

        if (boxCount === 1) {
          showNotification("info", "Single piece shipment - no child shipments needed");
          generatedRows = [];
        } else {
          if (!isNaN(childSrNo) && !isNaN(jump)) {
            generatedRows = boxes.slice(1).map((_, i) => {
              const childAwbNo = String(childSrNo + i * jump);

              return {
                childAwbNo,
                shipperName: data.shipperFullName,
                shipperAddress: data.shipperAddressLine1,
                shipperCity: data.shipperCity,
                shipperPin: data.shipperPincode,
                consigneeName: data.receiverFullName,
                consigneeAdd: data.receiverAddressLine1,
                consigneeCity: data.receiverCity,
                consigneeState: data.receiverState,
                consigneeZip: data.receiverPincode,
                MAWB: data.awbNo,
              };
            });
          }
        }

        setData(generatedRows);
        console.log("Generated child rows (excluding master):", generatedRows);
        setShowDisabled(generatedRows.length === 0);
      } else {
        if (!hasExistingChildren) {
          setRowData([]);
          reset({ childSrNo: "", jump: "", childCount: "" });
          setShowDisabled(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch shipment data:", err);
      showNotification("error", "Failed to fetch shipment data");
      if (!hasExistingChildren) {
        setRowData([]);
        reset({ childSrNo: "", jump: "", childCount: "" });
        setValue("childCount", "");
        setShowDisabled(true);
      }
    }
  };

  useEffect(() => {
    if (!masterAwbNo) {
      setRowData([]);
      setHasExistingChildren(false);
      setCheckingExistence(false);
      setValue("Destination", "");
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (masterAwbNo.length >= 3) {
        checkAndLoadExistingChildren(masterAwbNo);
        fetchShipmentData(masterAwbNo);
      }
    }, 800);

    return () => clearTimeout(debounceTimer);
  }, [masterAwbNo]);

  useEffect(() => {
    if (masterAwbNo && (childSrNo || jump)) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchShipmentData(masterAwbNo);
      }, 500);
    }
  }, [childSrNo, jump]);

  const handleSave = async () => {
    if (!rowData || rowData.length === 0) {
      showNotification("error", "No data to save.");
      return;
    }

    if (hasExistingChildren) {
      showNotification("error", "Child shipments already exist for this Master AWB. Cannot save again.");
      return;
    }

    try {
      const response = await axios.post(`${server}/portal/create-child`, {
        children: rowData,
        masterAwbNo: masterAwbNo,
        destination: getValues("Destination"),
      });

      console.log("Saved successfully:", response.data);
      showNotification("success", "Saved successfully");
      setRowData([]);
      setBoxCount(0);
      setHasExistingChildren(false);
      onRefresh();
    } catch (error) {
      console.error(
        "Error saving child data:",
        error.response?.data || error.message
      );
      showNotification("error", "Error saving child data");
    }
  };

  return (
    <form
      className="flex flex-col gap-9"
      onSubmit={handleSubmit((data) => {
        console.log(data);
      })}
    >
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <div className="flex flex-col gap-4">
        <div className="text-sm font-semibold">
          Shipment Origin / Destination
        </div>
        <div className="flex gap-2">
          <InputBox
            placeholder="Master AWB No."
            register={register}
            setValue={setValue}
            value="masterAwbNo"
            resetFactor={awbreset}
          />
          <span className="absolute px-2 py-11 text-sm font-semibold text-red">
            No. of Child : {boxCount}
          </span>
          <InputBox
            placeholder="Child Sr no"
            register={register}
            setValue={setValue}
            value="childSrNo"
            type="number"
            resetFactor={awbreset}
            disabled={hasExistingChildren}
          />
          <InputBox
            placeholder="Jump"
            register={register}
            setValue={setValue}
            value="jump"
            type="number"
            resetFactor={awbreset}
            disabled={hasExistingChildren}
          />
          <DummyInputBoxWithLabelDarkGray
            register={register}
            label="Destination"
            setValue={setValue}
            value="Destination"
          />
          <div>
            <OutlinedButtonRed
              label="Generate"
              onClick={(e) => {
                e.preventDefault();
                if (childSrNo && Destination && jump) {
                  if (data && data.length > 0 && data[0]?.MAWB) {
                    const totalPcs = boxCount ? boxCount + 1 : 1;

                    if (totalPcs <= 1) {
                      showNotification(
                        "error",
                        "Cannot generate child shipments. This shipment has only 1 piece."
                      );
                      return;
                    }
                  }

                  setRowData(data);
                  showNotification("success", "Generated Successfully");
                } else {
                  showNotification("error", "Please fill all fields");
                }
              }}
            />
          </div>
          <div className="">
            <SimpleButton
              name="Save"
              type="submit"
              onClick={handleSave}
              disabled={rowData.length === 0 ? true : false}
            />
          </div>
        </div>
      </div>

      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          name="refShipper"
          columns={columns}
          rowData={rowData.map(row => ({
            ...row,
            action: (
              <button
                onClick={() => handleDeleteClick(row)}
                className="text-red hover:text-red-700 transition-colors p-1"
                title="Delete child shipment"
              >
                <Trash2 size={18} />
              </button>
            )
          }))}
        />
      </div>

      <div className="flex w-full justify-end">
        <div>{/* <OutlinedButtonRed label="Close" /> */}</div>
      </div>

      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        awbNo={alertData.awbNo}
        message={alertData.message}
        title="Master AWB Alert"
      />

      <ChildExistsModal
        isOpen={childExistsModalOpen}
        onClose={() => setChildExistsModalOpen(false)}
        masterAwbNo={masterAwbNo}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setChildToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        childAwbNo={childToDelete?.childAwbNo}
      />
    </form>
  );
};

export default OrgShipper;