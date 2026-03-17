"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import React, { useEffect, useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";

const RunTransferForm = ({ setCurrentView }) => {
  const { server } = useContext(GlobalContext);
  const { register, setValue, watch } = useForm();
  const [runData, setRunData] = useState([]);
  const [loading, setLoading] = useState(false);
  const runNumber = watch("runNumber");

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const fetchDataByRunNo = async () => {
    if (!runNumber || runNumber.trim() === "") {
      showNotification("error", "Please enter a Run Number");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${server}/portal/create-shipment?runNo=${runNumber.toUpperCase()}`
      );
      const filteredData = response.data;

      if (filteredData.length === 0) {
        // console.log("No data found for the entered Run Number");
        setRunData([]);
        return;
      }

      const transformedData = filteredData.map((item) => ({
        HAWBNumber: item.awbNo || "",
        ConsignorName: item.consignor || "",
        ConsignorAddress1: item["consignor-addressLine1"] || "",
        ConsignorAddress2: item["consignor-addressLine2"] || "",
        ConsignorCity: item["consignor-city"] || "",
        ConsignorState: item["consignor-state"] || "",
        ConsignorPostalCode: item["consignor-pincode"] || "",
        ConsignorCountry: "India",
        ConsigneeName: item.consignee || "",
        ConsigneeAddress1: item["consignee-addressLine1"] || "",
        ConsigneeAddress2: item["consignee-addressLine2"] || "",
        ConsigneeCity: item["consignee-city"] || "",
        ConsigneeState: item["consignee-state"] || "",
        ConsigneePostalCode: item["consignee-zipcode"] || "",
        ConsigneeCountry: "India",
        PKG: Number(item.pcs) || 0,
        Weight: Number(item.actualWt) || 0,
        DescriptionofGoods: Array.isArray(item.content)
          ? item.content.join(", ")
          : item.content || "",
        Value: Number(item.invoiceValue) || 0,
        ExportInvoiceNo: item.awbNo || "",
        GSTInvoiceNo: item.awbNo || "",
        InvoiceValue: Number(item.invoiceValue) || 0,
        CurrencyType: item.currency || "",
        PayType: "N",
        IGSTPaid: item.igst?.toString() || "0",
        Bond: "NA",
        MHBSNo: item.mawbNo || "",
        GSTINType: "",
        GSTINNumber: "",
        GSTDate: null,
        ExportDate: item.date ? new Date(item.date).toISOString() : null,
        ADCode: "",
        CRN_NO: item.awbNo || "",
        CRN_MHBS_NO: "",
      }));

      setRunData(transformedData);
      // console.log(transformedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification("error", "Error fetching data. Please try again.");
      setRunData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (runNumber) fetchDataByRunNo();
  }, [runNumber]);

  const handleTransfer = async () => {
    if (!runData || runData.length === 0) {
      showNotification("error", "No data to transfer");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        runNo: runNumber, // assign your run number here
        airwayBill: runData,
        // optional: runEntry: {...}
      };
      // console.log(payload);

      const response = await axios.post(`${server}/run-transfer`, payload); // correct path
      setCurrentView("Run Report");
      // console.log("Run transfer successful!");
      // console.log("Transfer response:", response.data);
      setRunData([]); // Clear after transfer if needed
    } catch (error) {
      console.error("Transfer failed:", error);
      showNotification("error", "Error transferring data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-[34px]">
      <Heading title={"Run Transfer"} />

      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <InputBox
            placeholder="Run Number"
            register={register}
            setValue={setValue}
            value="runNumber"
          />
          <div>
            <OutlinedButtonRed label={"Transfer"} onClick={handleTransfer} />
          </div>
        </div>
        <div className="flex justify-between">
          <div className="">{/* <OutlinedButtonRed label={"Close"} /> */}</div>

          <div>
            <SimpleButton
              name={"Run Report"}
              className={"px-[40px]"}
              onClick={() => setCurrentView("Run Report")}
            />
          </div>
        </div>
      </div>
    </form>
  );
};

export default RunTransferForm;
