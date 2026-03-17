"use client";
import {
  AddButton,
  DeleteButton,
  EditButton,
} from "@/app/components/AddUpdateDeleteButton";
import { OutlinedButtonWithLeftImage } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import {
  DateInputBox,
  FractionNumberInputBox,
} from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

function FuelSetting() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const { server } = useContext(GlobalContext);
  const [awbreset, setAwbreset] = useState(false);
  const [visibleFlag, setVisibleFlag] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");
  const [customers, setCustomers] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [rowData, setRowData] = useState();

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const selectedService = watch("service");
  const selectedCustomer = watch("customer");

  // Fetch customer names with account codes
  const fetchCustomerNames = async () => {
    try {
      const response = await axios.get(`${server}/customer-account`);
      const customerData = response.data;

      const customerOptions = customerData
        .filter((item) => item.name?.trim())
        .map((item) => ({
          label: `${item.name.trim()}${item.accountCode ? ` (${item.accountCode})` : ""
            }`,
          value: item.name.trim(),
          accountCode: item.accountCode || "",
        }));

      // Remove duplicates
      const uniqueCustomers = customerOptions.filter(
        (customer, index, self) =>
          index === self.findIndex((c) => c.value === customer.value)
      );

      setCustomers(uniqueCustomers);
    } catch (error) {
      console.error("Error fetching customer data:", error);
      showNotification("error", "Error fetching customer data");
    }
  };

  // Fetch services data
  const fetchZonesData = async () => {
    try {
      const response = await axios.get(
        `${server}/shipper-tariff/get-all-zones`
      );
      // console.log("Zones response:", response.data);
      setServiceOptions(response.data?.services || []);
    } catch (error) {
      console.error("Error fetching zones data:", error);
      setServiceOptions([]);
    }
  };

  // OnSubmit functions
  const onSubmit = async (data) => {
    const formattedData = {
      ...data,
      taxAmount: parseFloat(data.taxAmount) / 100,
    };
    // console.log("Form data:", formattedData);

    try {
      const res = await axios.post(`${server}/fuel-setting`, formattedData);
      // console.log("Fuel settings saved:", res.data);
      showNotification("success", "fuel settings data updated successfully!");
      handleRefresh();
    } catch (error) {
      // console.log(
//         "Error saving fuel settings:",
//         error.response?.data || error.message
//       );

      showNotification("error", "fuel settings data update failed!");
      handleRefresh();
    }
  };

  const columns = [
    { key: "customer", label: "Customer Details" },
    { key: "service", label: "Service Name" },
    { key: "taxAmount", label: "Tax Amount" },
    { key: "effectiveDate", label: "Effective Date" },
  ];

  const fetchFuelSetting = async () => {
    try {
      const response = await axios.get(
        `${server}/fuel-setting/get-fuelSetting`
      );

      const formatted = response.data.map((item) => ({
        ...item,
        effectiveDate: item.effectiveDate
          ? new Date(item.effectiveDate).toLocaleDateString("en-GB")
          : "",
      }));

      setRowData(formatted);
    } catch (error) {
      console.error("Error fetching data:", error);
      setRowData([]);
    }
  };

  // handle useEffect method
  useEffect(() => {
    fetchCustomerNames();
    fetchZonesData();
  }, []);

  useEffect(() => {
    fetchFuelSetting();
  }, [rowData]);

  //handle refresh btn
  const handleRefresh = () => {
    setAwbreset(!awbreset);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className=" flex flex-col gap-4">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title="Fuel Setting"
        bulkUploadBtn="hidden"
        onRefresh={handleRefresh}
        codeListBtn="hidden"
      />

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 items-center">
        <AddButton disabled={false} />
        <EditButton disabled={!selectedCustomer || !selectedService} />
        <DeleteButton disabled={!selectedCustomer || !selectedService} />
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-3">
        <div>
          <LabeledDropdown
            options={customers.map((customer) => customer.label || customer)}
            selectedOption={selectedCustomer}
            setValue={setValue}
            title="Customer"
            register={register}
            value="customer"
            resetFactor={awbreset}
          />
        </div>

        <div>
          <LabeledDropdown
            options={serviceOptions}
            selectedOption={selectedService}
            setValue={setValue}
            title="Service"
            register={register}
            value="service"
            resetFactor={awbreset}
          />
        </div>

        <div className="flex justify-between gap-3">
          <FractionNumberInputBox
            placeholder="Tax Amount"
            value="taxAmount"
            register={register}
            setValue={setValue}
            resetFactor={awbreset}
          />
          <DateInputBox
            placeholder="Effective Date"
            value="effectiveDate"
            register={register}
            setValue={setValue}
            resetFactor={awbreset}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <OutlinedButtonWithLeftImage
          label="Update Fuel Setting"
          icon="/update.svg"
          type="submit"
        />
      </div>

      <TableWithSorting
        register={register}
        setValue={setValue}
        name="bagging"
        columns={columns}
        rowData={rowData}
      />
    </form>
  );
}

export default FuelSetting;
