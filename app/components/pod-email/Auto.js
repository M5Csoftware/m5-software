"use client";
import React, { useState, useContext } from "react";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import { TableWithCheckbox } from "../Table";
import InputBox, { SearchInputBox } from "../InputBox";
import { RedLabelHeading } from "../Heading";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import NotificationFlag from "../Notificationflag";

const Auto = () => {
  const { register, setValue, watch } = useForm();
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const columns = [
    { key: "awbNo", label: "AWB No." },
    { key: "accountCode", label: "Customer Code" },
    { key: "customerName", label: "Customer Name" },
    { key: "weight", label: "Weight" },
    { key: "destination", label: "Destination" },
    { key: "receiverName", label: "Receiver Name" },
    { key: "email", label: "Email" },
    { key: "branchCode", label: "Branch Code" },
    { key: "salePerson", label: "Sales Person" },
  ];

  const handleSearch = async () => {
    const sector = watch("sector");

    if (!sector) {
      toast.error("Please enter a sector");
      showNotification("error", "Please enter a sector");
      return;
    }

    setSearchLoading(true);
    try {
      const response = await axios.get(`${server}/pod-email`, {
        params: { sector },
      });

      if (response.data.success) {
        setRowData(response.data.data);
        setFilteredData(response.data.data);
        setSelectedItems([]);
        toast.success(`Found ${response.data.data.length} delivered shipments`);
        showNotification(
          "success",
          `Found ${response.data.data.length} delivered shipments`
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(error.response?.data?.message || "Failed to fetch data");
      showNotification("error", error.response?.data?.message);
      setRowData([]);
      setFilteredData([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchAWB = (value) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setFilteredData(rowData);
      return;
    }

    const filtered = rowData.filter((row) =>
      row.awbNo.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleExcludeSelected = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select rows to exclude");
      showNotification("error", "Please select rows to exclude");
      return;
    }

    // Get AWB numbers of selected items
    const selectedAWBs = selectedItems.map((item) => item.awbNo);

    // Filter out selected items from filteredData
    const remaining = filteredData.filter(
      (row) => !selectedAWBs.includes(row.awbNo)
    );

    // Update both filteredData and rowData to keep them in sync
    setFilteredData(remaining);
    setRowData(remaining);
    setSelectedItems([]);

    toast.success(`Excluded ${selectedItems.length} shipment(s)`);
    showNotification(
      "success",
      `Excluded ${selectedItems.length} shipments(s)`
    );
  };

  const handleSendEmail = async () => {
    if (filteredData.length === 0) {
      toast.error("No data available to send emails");
      showNotification("error", "No data available to send emails");
      return;
    }

    setEmailLoading(true);
    try {
      const response = await axios.post(`${server}/pod-email/send-email`, {
        shipments: filteredData,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        showNotification("success", response.data.message);
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      toast.error(error.response?.data?.message || "Failed to send emails");
      showNotification(
        "error",
        error.response?.data?.message || "Failed to send emails"
      );
    } finally {
      setEmailLoading(false);
    }
  };

  const handleClose = () => {
    setRowData([]);
    setFilteredData([]);
    setSelectedItems([]);
    setSearchTerm("");
    setValue("sector", "");
  };

  return (
    <div className="flex flex-col gap-6">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <div className="flex flex-col gap-3">
        <RedLabelHeading label={`Search Airwaybills`} />
        <div className="flex gap-2">
          <div className="w-full">
            <InputBox
              placeholder="Sector"
              register={register}
              setValue={setValue}
              value="sector"
            />
          </div>
          <div className="flex gap-2">
            <OutlinedButtonRed
              label={searchLoading ? "Searching..." : "Search"}
              onClick={handleSearch}
              disabled={searchLoading}
            />
           
            <SimpleButton
              name={emailLoading ? "Sending..." : "Send Email"}
              onClick={handleSendEmail}
              disabled={emailLoading || filteredData.length === 0}
            />
          
          </div>
        </div>

        <div>
          <SearchInputBox
            placeholder="Search Airwaybill Below"
            onChange={(e) => handleSearchAWB(e.target.value)}
            value={searchTerm}
          />
        </div>

        <div>
          <TableWithCheckbox
            register={register}
            setValue={setValue}
            name="bagging"
            columns={columns}
            rowData={filteredData}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
          />
        </div>
        <div>
          <OutlinedButtonRed
            label={`Exclude Selected (${selectedItems.length})`}
            onClick={handleExcludeSelected}
            disabled={selectedItems.length === 0}
          />
        </div>
      </div>
    </div>
  );
};

export default Auto;