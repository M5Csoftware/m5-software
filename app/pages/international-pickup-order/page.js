"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useState, useRef, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as XLSX from "xlsx";

function InternationalPickupOrder() {
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [excelHeaders, setExcelHeaders] = useState([]);
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

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [d, m, y] = val.split("/");
      return `${y}-${m}-${d}`;
    }

    return null;
  };

  const { accounts } = useContext(GlobalContext);

  const { register, setValue, watch } = useForm();

  const fromRaw = watch("from");
  const toRaw = watch("to");

  const fromDate = normalizeDate(fromRaw);
  const toDate = normalizeDate(toRaw);

  const customerCode = watch("Customer");

  // auto fill customer name
  useEffect(() => {
    if (!customerCode) {
      setValue("name", "");
      return;
    }

    const found = accounts?.find(
      (item) => item?.accountCode?.toLowerCase() === customerCode.toLowerCase()
    );

    setValue("name", found?.name || "");
  }, [customerCode, accounts, setValue]);

  const handleShow = () => {
    // Logic removed
  };

  const handleSubmit = () => {
    // Logic removed
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);

      // Read and parse Excel file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length > 0) {
            setExcelHeaders(jsonData[0]); // First row as headers
            setExcelData(jsonData.slice(1)); // Rest as data
            setNotification({
              type: "success",
              message: `File "${file.name}" uploaded successfully with ${
                jsonData.length - 1
              } rows`,
              visible: true,
            });
            showNotification("success", "File uploaded successfully");
          }
        } catch (error) {
          setNotification({
            type: "error",
            message: "Failed to parse Excel file",
            visible: true,
          });
          showNotification("error", "Failed to parse Excel file");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setExcelData([]);
    setExcelHeaders([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <form className="flex flex-col gap-9">
        <Heading
          title={`International Pickup Order`}
          bulkUploadBtn="hidden"
          codeListBtn={true}
          browseBtn={true}
          onClickBrowseBtn={handleBrowseClick}
          fileInputRef={fileInputRef}
          handleBrowseFileChange={handleFileChange}
          onRefresh={() => {
            setValue("Customer", "");
            setValue("name", "");
            setValue("from", "");
            setValue("to", "");
            handleRemoveFile();
          }}
          fullscreenBtn={false}
        />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            {/* {uploadedFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {(uploadedFile.size / 1024).toFixed(2)} KB • {excelData.length} rows
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            )} */}

            <div className="flex gap-3">
              <div className="w-full">
                <InputBox
                  placeholder={`Customer Code`}
                  register={register}
                  setValue={setValue}
                  value={`Customer`}
                />
              </div>

              <DummyInputBoxWithLabelDarkGray
                placeholder={"Customer Name"}
                register={register}
                setValue={setValue}
                value={"name"}
                inputValue={watch("Customer")}
              />

              <DateInputBox
                register={register}
                setValue={setValue}
                value={`from`}
                placeholder="From"
              />

              <DateInputBox
                register={register}
                setValue={setValue}
                value={`to`}
                placeholder="To"
              />

              <div>
                <OutlinedButtonRed
                  type="button"
                  label={loading ? "Loading..." : "Show"}
                  onClick={handleShow}
                  disabled={loading}
                />
              </div>
              <div className="flex gap-2">
                <SimpleButton
                  type="button"
                  name={loading ? "Processing..." : "Submit"}
                  onClick={handleSubmit}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-h-[40vh] max-h-[50vh] overflow-auto">
          {excelData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {excelHeaders.map((header, index) => (
                      <th
                        key={index}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200"
                      >
                        {header || `Column ${index + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {excelData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                        >
                          {cell !== null && cell !== undefined
                            ? String(cell)
                            : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg
                className="w-16 h-16 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg font-medium">No file uploaded</p>
              <p className="text-sm mt-1">
                Click the browse button to upload an Excel file
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <div>
            {/* <OutlinedButtonRed
              type="button"
              label={"Close"}
              onClick={() => window.history.back()}
            /> */}
          </div>
        </div>
      </form>
    </>
  );
}

export default InternationalPickupOrder;
