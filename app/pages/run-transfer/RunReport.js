"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { TableWithSortingAndCopy } from "@/app/components/Table";
import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import * as XLSX from "xlsx";
import axios from "axios";
import NotificationFlag from "@/app/components/Notificationflag";

const ChangeConsignee = ({ onReplace, onClose, setVisible }) => {
  const { register, setValue, watch } = useForm();

  const handleReplace = (e) => {
    e.preventDefault();
    const country = watch("country");
    const awbNumbers = watch("awbNumbers");

    if (awbNumbers) {
      setVisible(true);
    }

    // Match all patterns like MPL + digits (e.g., MPL1111150)
    const awbList = (awbNumbers.match(/MPL\d+/g) || [])
      .map((n) => n.trim())
      .filter(Boolean);

    if (onReplace) onReplace(awbList, country);
  };

  const handleClose = (e) => {
    e.preventDefault();
    if (onClose) onClose();
  };

  return (
    <div className="flex gap-3 flex-col">
      <RedLabelHeading label={"Airwaybill Number"} />
      <div className="flex gap-3">
        <div className="flex flex-col gap-3">
          <textarea
            className="w-[283px] max-h-[500px] min-h-[500px] border rounded-md p-2 outline-none"
            {...register("awbNumbers")}
          />
        </div>
        <div className="flex flex-col gap-6 w-full">
          <div className="w-[300px]">
            <LabeledDropdown
              options={["USA", "Netherlands", "UK", "Germany"]}
              register={register}
              setValue={setValue}
              value="country"
              title="Country"
            />
          </div>
          <div className="flex flex-col w-[300px] gap-3">
            <div>
              <OutlinedButtonRed
                label={"Replace"}
                onClick={handleReplace}
                type="button"
              />
            </div>

            <div className="flex gap-8">
              <div>
                <OutlinedButtonRed
                  label={"Back"}
                  onClick={handleClose}
                  type="button"
                />
              </div>
              <div>
                <OutlinedButtonRed label={"Close"} type="button" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RunReport = ({ setCurrentView }) => {
  const { register, setValue, handleSubmit, watch } = useForm({
    defaultValues: {
      runNumber: "",
      bagging: [],
    },
  });

  const [visibleFlag, setVisibleFlag] = useState(false);
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [showChangeConsignee, setShowChangeConsignee] = useState(false);
  const columns = [
    { key: "HAWBNumber", label: "HAWB Number" },
    { key: "ConsignorName", label: "Consignor Name" },
    { key: "ConsignorAddress1", label: "Consignor Address 1" },
    { key: "ConsignorAddress2", label: "Consignor Address 2" },
    { key: "ConsignorCity", label: "Consignor City" },
    { key: "ConsignorState", label: "Consignor State" },
    { key: "ConsignorPostalCode", label: "Consignor Postal Code" },
    { key: "ConsignorCountry", label: "Consignor Country" },
    { key: "ConsigneeName", label: "Consignee Name" },
    { key: "ConsigneeAddress1", label: "Consignee Address 1" },
    { key: "ConsigneeAddress2", label: "Consignee Address 2" },
    { key: "ConsigneeCity", label: "Consignee City" },
    { key: "ConsigneeState", label: "Consignee State" },
    { key: "ConsigneePostalCode", label: "Consignee Postal Code" },
    { key: "ConsigneeCountry", label: "Consignee Country" },
    { key: "PKG", label: "PKG" },
    { key: "Weight", label: "Weight" },
    { key: "DescriptionofGoods", label: "Description of Goods" },
    { key: "Value", label: "Value" },
    { key: "ExportInvoiceNo", label: "Export Invoice No" },
    { key: "GSTInvoiceNo", label: "GST Invoice No" },
    { key: "InvoiceValue", label: "Invoice Value" },
    { key: "CurrencyType", label: "Currency Type" },
    { key: "PayType", label: "Pay Type" },
    { key: "IGSTPaid", label: "IGST Paid" },
    { key: "Bond", label: "Bond" },
    { key: "MHBSNo", label: "MHBS No" },
    { key: "GSTINType", label: "GSTIN Type" },
    { key: "GSTINNumber", label: "GSTIN Number" },
    { key: "GSTDate", label: "GST Date" },
    { key: "ExportDate", label: "Export Date" },
    { key: "ADCode", label: "AD Code" },
    { key: "CRN_NO", label: "CRN NO" },
    { key: "CRN_MHBS_NO", label: "CRN MHBS NO" },
  ];

  const handleChangeConsigneeClick = (e) => {
    e.preventDefault();
    setShowChangeConsignee(true);
  };

  const handleCloseChangeConsignee = () => {
    setShowChangeConsignee(false);
  };

  const handleReplace = async (awbNumbers, newCountry) => {
    if (!awbNumbers || awbNumbers.length === 0) {
      alert("Please enter AWB/HAWB numbers");
      return;
    }

    try {
      console.log(awbNumbers, newCountry);
      for (const awb of awbNumbers) {
        const res = await axios.put(`${server}/run-transfer`, {
          hawbNumber: awb, // or awbNumber if applicable
          country: newCountry,
        });

        console.log(res);

        if (res.status !== 200) {
          console.error(`Failed to update ${awb}`);
          continue;
        }

        // ✅ Update local state table
        setRowData((prev) =>
          prev.map((row) =>
            row.HAWBNumber === awb || row.AWBNumber === awb
              ? { ...row, ConsigneeCountry: newCountry }
              : row
          )
        );
      }

      alert("Update completed");
      setShowChangeConsignee(false);
    } catch (err) {
      console.error("Error updating consignee:", err);
      alert("Update failed. Please try again.");
    }
  };

  const handleClose = (e) => {
    e.preventDefault();
    console.log("Close clicked");
  };

  // 👉 Download CSV
  const handleDownloadCSV = () => {
    if (!rowData || rowData.length === 0) {
      alert("No data to download");
      return;
    }

    const headers = columns.map((col) => col.label);
    const keys = columns.map((col) => col.key);

    const csvRows = [
      headers.join(","), // header row
      ...rowData.map((row) =>
        keys.map((key) => `"${row[key] ?? ""}"`).join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "run_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // 👉 Download Excel
  const handleDownloadExcel = () => {
    if (!rowData || rowData.length === 0) {
      alert("No data to download");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rowData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Run Report");
    XLSX.writeFile(workbook, "run_report.xlsx");
  };

  const onSubmit = (data) => {
    console.log("Form data:", data);
  };

  // 👉 Handle "Show" button click
  const handleShow = async () => {
    try {
      const runNumber = watch("runNumber");
      if (!runNumber) {
        alert("Please enter a Run Number");
        return;
      }

      const res = await fetch(`${server}/run-transfer?runNo=${runNumber.toUpperCase()}`);
      if (!res.ok) throw new Error("Failed to fetch data");

      const data = await res.json();

      if (data.length > 0) {
        // airwayBill is inside each runTransfer object
        setRowData(data[0].airwayBill || []);
      } else {
        setRowData([]);
        alert("No data found for this Run Number");
      }
    } catch (err) {
      console.error("Error fetching run transfer:", err);
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      {!showChangeConsignee && (
        <>
          <Heading
            title={"Run Report"}
            bulkUploadBtn="hidden"
            codeListBtn="hidden"
          />
        </>
      )}

      {showChangeConsignee && (
        <Heading
          title={"Change Country"}
          bulkUploadBtn="hidden"
          codeListBtn="hidden"
        />
      )}

      {!showChangeConsignee && (
        <>
          <div className="flex gap-3">
            <InputBox
              placeholder="Run Number"
              register={register}
              setValue={setValue}
              value="runNumber"
            />
            <div className="flex gap-3">
              <div>
                <OutlinedButtonRed
                  label={"Show"}
                  type="button"
                  onClick={handleShow}
                />
              </div>
              <div className="w-[210px]">
                <OutlinedButtonRed
                  label={"Change Country"}
                  onClick={handleChangeConsigneeClick}
                  type="button"
                />
              </div>
            </div>
          </div>

          <TableWithSortingAndCopy
            register={register}
            setValue={setValue}
            name="bagging"
            columns={columns}
            rowData={rowData}
            className="h-[450px]"
          />

          <div className="flex justify-between">
            <div>
              <OutlinedButtonRed
                label={"Close"}
                onClick={() => {
                  handleClose, setCurrentView("Run Transfer");
                }}
                type="button"
              />
            </div>

            <div>
              <SimpleButton
                name={"Download Excel"}
                onClick={handleDownloadCSV}
                type="button"
              />
            </div>
          </div>
        </>
      )}

      {showChangeConsignee && (
        <>
          <ChangeConsignee
            onReplace={handleReplace}
            onClose={handleCloseChangeConsignee}
            setVisible={setVisibleFlag}
          />
          <NotificationFlag
            message={"Change Country!"}
            subMessage={`Change All AWB No. Country`}
            visible={visibleFlag}
            setVisible={setVisibleFlag}
          />
        </>
      )}
    </form>
  );
};

export default RunReport;
