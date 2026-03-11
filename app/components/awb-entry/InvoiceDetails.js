import React, { useMemo, useState, useEffect, useContext, useRef } from "react";
import { AwbWindowHeading } from "../Heading";
import InputBox, { NumberInputBox } from "../InputBox";
import { OutlinedButtonRed } from "../Buttons";
import { useForm } from "react-hook-form";
import Image from "next/image";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { DummyInputBoxWithLabelDarkGray } from "../DummyInputBox";

function InvoiceDetails({
  awbNo,
  window,
  setInvoiceContent,
  setInvoiceTotalValue,
  setInvContent,
}) {
  const { register, setValue, handleSubmit, reset, watch } = useForm();

  const columns = useMemo(
    () => [
      { key: "context", label: "Description" },
      { key: "sku", label: "SKU" },
      { key: "hsnNo", label: "HSN No" },
      { key: "qty", label: "Qty" },
      { key: "rate", label: "Rate" },
      { key: "amount", label: "Amount" },
    ],
    []
  );

  const [rowData, setRowData] = useState({});
  const [boxNo, setBoxNo] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editBoxNumber, setEditBoxNumber] = useState(null);
  const [resetForm, setResetForm] = useState(false);
  const [totalValue, setTotalvalue] = useState(0);
  const [totalPcs, setTotalPcs] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const [validationStatus, setValidationStatus] = useState({
    pcsMatch: true,
    boxMatch: true,
  });

  const { server, globalTotalPcs } = useContext(GlobalContext);
  const [showConfirmDeleteAllModal, setShowConfirmDeleteAllModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const watchedValues = watch();

  // ── Autocomplete dropdown state ──────────────────────────────────
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggestionRef = useRef(null);
  const contextInputRef = useRef(null);
  // ─────────────────────────────────────────────────────────────────

  const generateId = () => Date.now().toString() + Math.random().toString(36).slice(2);

  useEffect(() => {
    setHasFetched(false);
  }, [awbNo]);

  // Keep boxNo synced and remove empty boxes
  useEffect(() => {
    const nonEmpty = {};
    const boxes = [];

    Object.entries(rowData).forEach(([num, items]) => {
      if (items.length > 0) {
        nonEmpty[num] = items;
        boxes.push(Number(num));
      }
    });

    const sorted = boxes.sort((a, b) => a - b);
    if (JSON.stringify(sorted) !== JSON.stringify(boxNo)) {
      setBoxNo(sorted);
    }
  }, [rowData]);

  // Calculate totals + validation
  useEffect(() => {
    const total = Object.values(rowData).reduce((sum, items) => {
      return (
        sum +
        items.reduce((boxSum, item) => {
          const qty = parseFloat(item.qty || 0);
          const rate = parseFloat(item.rate || 0);
          return boxSum + qty * rate;
        }, 0)
      );
    }, 0);

    const pcsTotal = Object.values(rowData).reduce((sum, items) => {
      return (
        sum +
        items.reduce((boxSum, item) => {
          const qty = parseFloat(item.qty || 0);
          return boxSum + qty;
        }, 0)
      );
    }, 0);

    const formattedTotal = total.toFixed(2);
    setTotalvalue(formattedTotal);
    setTotalPcs(pcsTotal);
    setInvoiceTotalValue(formattedTotal);

    const globalPcs = parseInt(globalTotalPcs) || 0;
    const newValidationStatus = (Object.keys(rowData).length == globalPcs);
    setValidationStatus(newValidationStatus);
  }, [rowData, globalTotalPcs]);

  const fetchAwbData = async (awbNumber) => {
    if (!awbNumber || hasFetched) return;
    try {
      const response = await axios.get(
        `${server}/portal/create-shipment?awbNo=${awbNumber}`
      );
      const data = response.data;
      if (data && data.shipmentAndPackageDetails) {
        populateInvoiceData(data.shipmentAndPackageDetails);
      }
      setHasFetched(true);
    } catch (err) {
      console.error("Error fetching AWB data:", err);
      setHasFetched(true);
      populateInvoiceData({});
    }
  };

  useEffect(() => {
    if (awbNo && window) {
      fetchAwbData(awbNo);
    }
  }, [awbNo, window, hasFetched]);

  const populateInvoiceData = (shipmentAndPackageDetails) => {
    const newRowData = {};
    const newBoxNumbers = [];

    Object.keys(shipmentAndPackageDetails).forEach((boxNumber) => {
      const boxNum = parseInt(boxNumber, 10);
      if (isNaN(boxNum)) return;
      newBoxNumbers.push(boxNum);

      newRowData[boxNum] = shipmentAndPackageDetails[boxNumber].map((item) => ({
        id: generateId(),
        context: item.context || "",
        sku: item.sku || "",
        hsnNo: item.hsnNo || "",
        qty: item.qty?.toString() || "0",
        rate: item.rate?.toString() || "0",
        amount: item.amount?.toString() || "0",
      }));
    });

    const contexts = Object.values(newRowData)
      .flat()
      .map((item) => item.context?.trim())
      .filter(Boolean);

    setRowData(newRowData);
    setBoxNo(newBoxNumbers);
    setInvoiceContent(newRowData);
    setInvContent(contexts);
  };

  // ── Autocomplete helpers ─────────────────────────────────────────
  const getProductSuggestions = (input) => {
    if (!input || input.trim().length < 1) return [];
    const searchTerm = input.toLowerCase().trim();
    const seen = new Set();
    const results = [];

    for (const product of PRODUCT_DATABASE) {
      if (seen.has(product.name)) continue;
      const nameMatch = product.name.toLowerCase().includes(searchTerm);
      const keywordMatch = product.keywords.some((kw) =>
        kw.toLowerCase().includes(searchTerm)
      );
      if (nameMatch || keywordMatch) {
        seen.add(product.name);
        results.push(product);
        if (results.length >= 8) break;
      }
    }
    return results;
  };

  const handleContextChange = (value) => {
    setValue("context", value);
    setValue("hsnNo", ""); // clear HSN when typing manually

    const matched = getProductSuggestions(value);
    setSuggestions(matched);
    setShowSuggestions(matched.length > 0 && value.trim().length > 0);
    setHighlightedIndex(-1);
  };

  const handleSelectSuggestion = (product) => {
    setValue("context", product.name);
    setValue("hsnNo", product.hsnCode);
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleContextKeyDown = (e) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target) &&
        contextInputRef.current &&
        !contextInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // ─────────────────────────────────────────────────────────────────

  const handleFormSubmit = (data) => {
    const { boxNo: enteredBoxNo, ...rest } = data;
    const boxNumber = parseInt(enteredBoxNo, 10);

    setRowData((prevData) => {
      let updatedData = { ...prevData };
      const items = updatedData[boxNumber] || [];

      if (isEditing && editId) {
        updatedData[editBoxNumber] = updatedData[editBoxNumber].map((item) =>
          item.id === editId ? { ...item, ...rest } : item
        );

        if (boxNumber !== editBoxNumber) {
          const movedItem = {
            ...updatedData[editBoxNumber].find((i) => i.id === editId),
            ...rest,
          };
          updatedData[editBoxNumber] = updatedData[editBoxNumber].filter(
            (i) => i.id !== editId
          );
          updatedData[boxNumber] = [...(updatedData[boxNumber] || []), movedItem];
        }
      } else {
        updatedData[boxNumber] = [
          ...items,
          { id: generateId(), ...rest },
        ];
      }

      const contexts = Object.values(updatedData)
        .flat()
        .map((item) => item.context?.trim())
        .filter(Boolean);

      setInvoiceContent(updatedData);
      setInvContent(contexts);
      return updatedData;
    });

    if (!boxNo.includes(boxNumber)) {
      setBoxNo((prev) => [...prev, boxNumber].sort((a, b) => a - b));
    }

    handleResetForm();
  };

  const handleEdit = (boxNumber, id) => {
    const rowToEdit = rowData[boxNumber]?.find((item) => item.id === id);
    if (!rowToEdit) return;

    setIsEditing(true);
    setEditId(id);
    setEditBoxNumber(boxNumber);

    setValue("boxNo", boxNumber.toString());
    setValue("context", rowToEdit.context || "");
    setValue("sku", rowToEdit.sku || "");
    setValue("hsnNo", rowToEdit.hsnNo || "");
    setValue("qty", rowToEdit.qty || "");
    setValue("rate", rowToEdit.rate || "");
    setValue("amount", rowToEdit.amount || "");
  };

  const handleDelete = (boxNumber, id) => {
    setRowData((prev) => {
      const updated = { ...prev };
      updated[boxNumber] = updated[boxNumber].filter((item) => item.id !== id);
      if (updated[boxNumber].length === 0) delete updated[boxNumber];
      setInvoiceContent(updated);
      return updated;
    });
  };

  const handleDeleteAll = () => {
    const cleared = {};
    setRowData(cleared);
    setBoxNo([]);
    setTotalvalue(0);
    setInvoiceTotalValue(0);
    setTotalPcs(0);
    setShowConfirmDeleteAllModal(false);
    setInvoiceContent(cleared);
  };

  const handleResetForm = () => {
    reset({
      boxNo: "",
      context: "",
      sku: "",
      hsnNo: "",
      qty: "",
      rate: "",
      amount: "",
    });
    setSuggestions([]);
    setShowSuggestions(false);
    setIsEditing(false);
    setEditId(null);
    setEditBoxNumber(null);
    setResetForm((prev) => !prev);
  };

  // Auto-calc amount
  useEffect(() => {
    const qty = parseFloat(watchedValues.qty || 0);
    const rate = parseFloat(watchedValues.rate || 0);
    if (qty > 0 && rate > 0) {
      setValue("amount", (qty * rate).toFixed(2));
    } else {
      setValue("amount", "0.00");
    }
  }, [watchedValues.qty, watchedValues.rate]);

  return (
    <>
      <div
        className={`flex flex-col gap-4 bg-white px-9 py-8 fixed inset-x-48 inset-y-10 z-40 border rounded-md ${
          window ? "" : "hidden"
        }`}
      >
        <AwbWindowHeading label={`Invoice Details`} awbNo={awbNo} />

        {/* form */}
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          <div className="flex gap-2">
            <div className="w-[31vw]">
              <NumberInputBox
                placeholder="Box No."
                register={register}
                setValue={setValue}
                value="boxNo"
                initialValue={watchedValues?.boxNo || ""}
                resetFactor={resetForm}
                validation={{ required: "boxNumber is required" }}
              />
            </div>

            {/* ── Replaced InputBox with custom autocomplete input ── */}
            <div className="relative w-full">
              <input
                ref={contextInputRef}
                type="text"
                placeholder="Content"
                autoComplete="off"
                value={watchedValues?.context || ""}
                onChange={(e) => handleContextChange(e.target.value)}
                onKeyDown={handleContextKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0 && watchedValues?.context?.trim()) {
                    setShowSuggestions(true);
                  }
                }}
                // Match your existing InputBox styling as closely as possible
                className="w-full h-8 border border-[#979797] rounded-md px-3 py-3 text-sm outline-none"
              />

              {/* Suggestion Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionRef}
                  className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto"
                >
                  {suggestions.map((product, idx) => (
                    <div
                      key={product.name}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(product);
                      }}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer text-xs transition-colors ${
                        idx === highlightedIndex
                          ? "bg-[#FFE5E9] text-[#EA1B40]"
                          : "hover:bg-[#FFF5F7] text-gray-700"
                      }`}
                    >
                      <span className="font-medium">{product.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                          idx === highlightedIndex
                            ? "bg-[#EA1B40] text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {product.hsnCode}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* ─────────────────────────────────────────────────────── */}

            <InputBox
              placeholder="SKU"
              register={register}
              setValue={setValue}
              value="sku"
              initialValue={watchedValues?.sku || ""}
              resetFactor={resetForm}
            />
          </div>
          <div className="flex gap-2">
            <DummyInputBoxWithLabelDarkGray
              placeholder="HSN Code"
              register={register}
              setValue={setValue}
              value="hsnNo"
              disabled={isEditing && watchedValues.hsnNo ? true : false}
            />
            <NumberInputBox
              placeholder="Qty"
              register={register}
              setValue={setValue}
              value="qty"
              initialValue={watchedValues?.qty || ""}
              resetFactor={resetForm}
              validation={{ required: "qty is required" }}
            />
            <NumberInputBox
              placeholder="Rate"
              register={register}
              setValue={setValue}
              value="rate"
              initialValue={watchedValues?.rate || ""}
              resetFactor={resetForm}
              validation={{ required: "rate is required" }}
            />
            <DummyInputBoxWithLabelDarkGray
              placeholder="Amount"
              register={register}
              setValue={setValue}
              value="amount"
              disabled={true}
            />
            <OutlinedButtonRed
              type="submit"
              label={isEditing ? "Update" : "Add to Box"}
            />
            {isEditing && (
              <OutlinedButtonRed
                type="button"
                onClick={handleResetForm}
                label="Cancel"
              />
            )}
          </div>
        </form>

        <div className="flex flex-col justify-between h-full">
          {/* table section */}
          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pb-4">
            {boxNo.map((boxNumber) => (
              <div
                key={boxNumber}
                className="bg-white-smoke rounded-lg py-3.5 px-5 border border-silver flex flex-col gap-1.5"
              >
                <h3 className="flex justify-between text-sm items-center">
                  <span className="text-eerie-black font-bold">
                    Box {boxNumber}
                  </span>
                  <div className="flex gap-5 bg-silver rounded-md py-1.5 px-5">
                    <span className="text-slate-600">Total value</span>
                    <span>
                      {rowData[boxNumber]
                        ?.reduce((sum, item) => {
                          const qty = parseFloat(item.qty || 0);
                          const rate = parseFloat(item.rate || 0);
                          return sum + qty * rate;
                        }, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </h3>
                <table className="w-full rounded-lg text-xs text-eerie-black bg-white">
                  <TableHeader columns={columns} />
                  <tbody>
                    {(rowData[boxNumber] || []).map((item) => (
                      <TableRow
                        key={item.id}
                        rowData={item}
                        columns={columns}
                        handleDelete={() => handleDelete(boxNumber, item.id)}
                        handleEdit={() => handleEdit(boxNumber, item.id)}
                        isEditing={isEditing && editId === item.id}
                        setShowConfirmModal={setShowConfirmModal}
                        showConfirmModal={showConfirmModal}
                        boxNumber={boxNumber}
                        setDeleteTarget={setDeleteTarget}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* footer */}
          <div className="flex justify-between bottom-0">
            <div>
              <OutlinedButtonRed
                onClick={() => setShowConfirmDeleteAllModal(true)}
                label={"Delete All Contents"}
              />
            </div>
            <div className="flex gap-4 items-center">
              <div
                className={`py-2 px-4 rounded-md flex gap-5 text-center items-center ${
                  !validationStatus.pcsMatch || !validationStatus.boxMatch
                    ? "bg-red-100 border-2 border-red-300"
                    : "bg-green-100 border-2 border-green-300"
                }`}
              >
                <h1 className="text-sm font-medium">Total Pcs</h1>
                <span className="text-black font-semibold">{totalPcs}</span>
              </div>

              <span className="text-red px-4 py-2.5 rounded-md bg-misty-rose">
                Total Value {totalValue}
              </span>
            </div>
          </div>
        </div>

        {/* Validation status */}
        {Object.keys(rowData).length > 0 && (
          <div
            className={`flex items-center justify-between px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all duration-300 ${
              validationStatus
                ? "bg-green-800 text-white border border-green-800"
                : "bg-red text-white border border-red"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                  validationStatus
                    ? "bg-green-500 text-white"
                    : "bg-white text-red"
                }`}
              >
                {validationStatus ? "✓" : "!"}
              </span>
              <span>
                {validationStatus
                  ? "Validation successful — all boxes and quantities match."
                  : `Validation error — check box count or total pieces. ${globalTotalPcs}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Delete All Modal */}
      {showConfirmDeleteAllModal && (
        <ConfirmationModal
          onConfirm={handleDeleteAll}
          onCancel={() => setShowConfirmDeleteAllModal(false)}
          message="Are you sure you want to delete all boxes?"
        />
      )}

      {showConfirmModal && deleteTarget && (
        <ConfirmationModal
          onConfirm={() => {
            handleDelete(deleteTarget.boxNumber, deleteTarget.id);
            setShowConfirmModal(false);
            setDeleteTarget(null);
          }}
          onCancel={() => {
            setShowConfirmModal(false);
            setDeleteTarget(null);
          }}
        />
      )}
    </>
  );
}

export default InvoiceDetails;

/* ---------- helpers ---------- */
function TableHeader({ columns }) {
  return (
    <thead className="sticky top-0">
      <tr className="h-12 border-b border-alice-blue font-medium">
        {columns.map((column) => (
          <th
            key={column.key}
            className="text-left pl-6 cursor-pointer select-none border-r"
          >
            <div className="flex items-center gap-2 text-nowrap">
              {column.label}
            </div>
          </th>
        ))}
        <th className="text-left text-transparent w-24"></th>
      </tr>
    </thead>
  );
}

function TableRow({
  rowData,
  columns,
  handleDelete,
  handleEdit,
  isEditing,
  setShowConfirmModal,
  showConfirmModal,
  setDeleteTarget,
  boxNumber,
}) {
  return (
    <tr
      className={`border-b border-alice-blue h-11 ${
        isEditing ? "bg-blue-50" : ""
      }`}
    >
      {columns.map((column, index) => (
        <td key={index} className="text-gray-600 pl-6 border-r">
          <span>{rowData[column.key]}</span>
        </td>
      ))}
      <td className="flex gap-3 items-center justify-center mt-2">
        <button
          onClick={() => {
            setDeleteTarget({ boxNumber, id: rowData.id });
            setShowConfirmModal(true);
          }}
        >
          <Image src={`/delete.svg`} alt="Delete" width={18} height={18} />
        </button>
        <button onClick={handleEdit}>
          <Image src={`/edit.svg`} alt="Edit" width={20} height={20} />
        </button>
      </td>
    </tr>
  );
}

function ConfirmationModal({ onConfirm, onCancel, message }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center w-80">
        <h2 className="text-lg font-semibold mb-4">
          {message || "Are you sure you want to delete this item?"}
        </h2>
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className="bg-red text-white px-4 py-2 rounded"
          >
            Yes
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- PRODUCT DATABASE ---------- */
const PRODUCT_DATABASE = [
  { name: "ARTIFICIAL JEWELLERY", hsnCode: "71171100", keywords: ["artificial jewellery", "fake jewellery", "fashion jewellery"] },
  { name: "AUTO PARTS", hsnCode: "87080000", keywords: ["auto parts", "car parts", "vehicle parts"] },
  { name: "BAG", hsnCode: "63053300", keywords: ["bag", "carry bag", "hand bag", "shopping bag"] },
  { name: "BANGLE", hsnCode: "70181010", keywords: ["bangle", "bangles", "glass bangle", "chooda"] },
  { name: "BELT", hsnCode: "42033000", keywords: ["belt", "leather belt", "waist belt"] },
  { name: "BINDI", hsnCode: "33049940", keywords: ["bindi", "bindis", "forehead decoration"] },
  { name: "BLANKET", hsnCode: "63014000", keywords: ["blanket", "woolen blanket", "cotton blanket"] },
  { name: "BOOKS", hsnCode: "49011010", keywords: ["books", "book", "notebook", "copy"] },
  { name: "BRUSH", hsnCode: "85030090", keywords: ["brush", "hair brush", "paint brush"] },
  { name: "CANDY", hsnCode: "17040000", keywords: ["candy", "candies", "sweet", "toffee"] },
  { name: "CAP", hsnCode: "65050090", keywords: ["cap", "hat", "baseball cap"] },
  { name: "CLIP", hsnCode: "83059020", keywords: ["clip", "paper clip", "hair clip"] },
  { name: "COMB", hsnCode: "96151900", keywords: ["comb", "hair comb"] },
  { name: "COSMETIC", hsnCode: "33030000", keywords: ["cosmetic", "makeup", "beauty product"] },
  { name: "COTTON BABY DRESS", hsnCode: "61112000", keywords: ["cotton baby dress", "baby dress", "infant dress"] },
  { name: "COTTON BEDSHEET", hsnCode: "63023100", keywords: ["cotton bedsheet", "bedsheet", "bed sheet"] },
  { name: "COTTON CLOTH", hsnCode: "61142000", keywords: ["cotton cloth", "fabric", "textile"] },
  { name: "COTTON CURTAIN", hsnCode: "63039100", keywords: ["cotton curtain", "curtain", "window curtain"] },
  { name: "COTTON DUPATTA", hsnCode: "62171090", keywords: ["cotton dupatta", "dupatta", "scarf"] },
  { name: "COTTON HANKY", hsnCode: "62132000", keywords: ["cotton hanky", "handkerchief", "hanky"] },
  { name: "COTTON KURTA PAJAMA", hsnCode: "62031910", keywords: ["cotton kurta pajama", "kurta pajama", "kurta pyjama"] },
  { name: "COTTON LADIES SUIT", hsnCode: "62041290", keywords: ["cotton ladies suit", "ladies suit", "salwar suit"] },
  { name: "COTTON LOWER", hsnCode: "62046290", keywords: ["cotton lower", "lower", "pajama", "pyjama"] },
  { name: "COTTON NIGHT DRESS", hsnCode: "62082190", keywords: ["cotton night dress", "night dress", "nightgown"] },
  { name: "COTTON PANT", hsnCode: "62034290", keywords: ["cotton pant", "pant", "trousers", "pants"] },
  { name: "COTTON PILLOW COVER", hsnCode: "63049231", keywords: ["cotton pillow cover", "pillow cover", "pillow case"] },
  { name: "COTTON SHIRT", hsnCode: "62052090", keywords: ["cotton shirt", "shirt", "formal shirt"] },
  { name: "COTTON SHORTS", hsnCode: "62046290", keywords: ["cotton shorts", "shorts", "bermuda"] },
  { name: "COTTON T SHIRT", hsnCode: "61091000", keywords: ["cotton t shirt", "t-shirt", "tshirt", "tee"] },
  { name: "COTTON THREAD", hsnCode: "52041190", keywords: ["cotton thread", "thread", "sewing thread"] },
  { name: "COTTON TIE", hsnCode: "62159010", keywords: ["cotton tie", "tie", "necktie"] },
  { name: "COTTON TOP", hsnCode: "62063090", keywords: ["cotton top", "top", "blouse"] },
  { name: "COTTON TOWEL", hsnCode: "63049260", keywords: ["cotton towel", "towel", "bath towel"] },
  { name: "COTTON UNDERGARMENTS", hsnCode: "61071100", keywords: ["cotton undergarments", "undergarments", "innerwear"] },
  { name: "DENIM JEANS", hsnCode: "62034290", keywords: ["denim jeans", "jeans", "dungaree"] },
  { name: "DRY FRUITS", hsnCode: "8135020", keywords: ["dry fruits", "dry fruit", "nuts", "almonds"] },
  { name: "EMPTY BOX", hsnCode: "48191090", keywords: ["empty box", "box", "cardboard box"] },
  { name: "ENVELOPE", hsnCode: "48171000", keywords: ["envelope", "letter envelope"] },
  { name: "GIFT CARD", hsnCode: "49090010", keywords: ["gift card", "greeting card"] },
  { name: "GLOVES", hsnCode: "61169990", keywords: ["gloves", "glove", "hand gloves"] },
  { name: "GOGGLES", hsnCode: "90041000", keywords: ["goggles", "sunglasses", "eye protection"] },
  { name: "HAIR BAND", hsnCode: "40169920", keywords: ["hair band", "hairband", "headband"] },
  { name: "HOME DECORATIVE", hsnCode: "68159990", keywords: ["home decorative", "decoration", "home decor"] },
  { name: "HOMEMADE SWEET", hsnCode: "17049090", keywords: ["homemade sweet", "mithai", "sweets"] },
  { name: "HOUSEHOLD ITEMS", hsnCode: "39240000", keywords: ["household items", "houseware", "home items"] },
  { name: "LADIES PURSE", hsnCode: "42022110", keywords: ["ladies purse", "purse", "handbag"] },
  { name: "LEHENGA", hsnCode: "62041390", keywords: ["lehenga", "lehenga choli"] },
  { name: "MOBILE ACCESSORIES", hsnCode: "85170000", keywords: ["mobile accessories", "phone accessories"] },
  { name: "MOSQUITO NET", hsnCode: "63049270", keywords: ["mosquito net", "mosquito netting"] },
  { name: "OPTICAL", hsnCode: "90011000", keywords: ["optical", "spectacles", "glasses"] },
  { name: "PAPER", hsnCode: "48020000", keywords: ["paper", "sheets", "paper sheets"] },
  { name: "PEN DRIVE", hsnCode: "85230000", keywords: ["pen drive", "usb drive", "flash drive"] },
  { name: "POLYESTER COAT", hsnCode: "62014090", keywords: ["polyester coat", "coat", "overcoat"] },
  { name: "PRINTING CARD", hsnCode: "49090000", keywords: ["printing card", "printed card"] },
  { name: "SANITARY PAD", hsnCode: "96190010", keywords: ["sanitary pad", "sanitary napkin", "pad"] },
  { name: "SHOES", hsnCode: "64035119", keywords: ["shoes", "shoe", "footwear"] },
  { name: "SILK SAREE", hsnCode: "50072010", keywords: ["silk saree", "sari", "silk sari"] },
  { name: "SLIPPER", hsnCode: "64052000", keywords: ["slipper", "chappal", "sandals"] },
  { name: "SNACKS", hsnCode: "95049090", keywords: ["snacks", "chips", "namkeen"] },
  { name: "SOCKS", hsnCode: "61159500", keywords: ["socks", "sock", "foot socks"] },
  { name: "SPICES", hsnCode: "13019044", keywords: ["spices", "masala", "herbs"] },
  { name: "STICKERS", hsnCode: "48210000", keywords: ["stickers", "sticker", "decal"] },
  { name: "SYNTHETIC COAT", hsnCode: "62031200", keywords: ["synthetic coat", "raincoat", "jacket"] },
  { name: "TABLE COVER", hsnCode: "63071090", keywords: ["table cover", "table cloth"] },
  { name: "TOY", hsnCode: "95030099", keywords: ["toy", "toys", "plaything"] },
  { name: "UMBRELLA", hsnCode: "66010000", keywords: ["umbrella", "rain umbrella"] },
  { name: "UTENSILS", hsnCode: "73239990", keywords: ["utensils", "utensil", "kitchenware"] },
  { name: "WOOLEN BLANKET", hsnCode: "63012000", keywords: ["woolen blanket", "wool blanket"] },
  { name: "WOOLEN HOODIE", hsnCode: "61101120", keywords: ["woolen hoodie", "hoodie", "hoody"] },
  { name: "WOOLEN INNER", hsnCode: "61079920", keywords: ["woolen inner", "thermal wear"] },
  { name: "WOOLEN JACKET", hsnCode: "61101120", keywords: ["woolen jacket", "jacket", "wool jacket"] },
  { name: "WOOLEN MUFFLER", hsnCode: "62142090", keywords: ["woolen muffler", "muffler", "scarf"] },
  { name: "WOOLEN SHAWL", hsnCode: "62142010", keywords: ["woolen shawl", "shawl", "wool shawl"] },
  { name: "WOOLEN SWEATER", hsnCode: "61101120", keywords: ["woolen sweater", "sweater", "wool sweater"] },
  { name: "WOOLEN TRACK SUIT", hsnCode: "61121920", keywords: ["woolen track suit", "tracksuit", "sportswear"] },
  { name: "BANDAGE", hsnCode: "30059040", keywords: ["bandage", "gauze", "medical bandage"] },
  { name: "CERAMIC UTENSIL", hsnCode: "69111029", keywords: ["ceramic utensil", "ceramic ware"] },
  { name: "COTTON LONG DRESS", hsnCode: "62044290", keywords: ["cotton long dress", "long dress", "gown"] },
  { name: "COTTON NIGHT SUIT", hsnCode: "61083100", keywords: ["cotton night suit", "night suit", "pajama set"] },
  { name: "COTTON PILLOW", hsnCode: "94049099", keywords: ["cotton pillow", "pillow", "cushion"] },
  { name: "COTTON SAREE", hsnCode: "52085900", keywords: ["cotton saree", "cotton sari"] },
  { name: "COTTON STOLE", hsnCode: "62149099", keywords: ["cotton stole", "stole", "wrap"] },
  { name: "MEN PURSE", hsnCode: "42023120", keywords: ["men purse", "wallet", "money purse"] },
  { name: "PHOTO FRAME", hsnCode: "44149000", keywords: ["photo frame", "picture frame"] },
  { name: "PLASTIC UTENSILS", hsnCode: "39249090", keywords: ["plastic utensils", "plastic ware"] },
  { name: "RUBBER BAND", hsnCode: "40169920", keywords: ["rubber band", "elastic band"] },
  { name: "STATIONARY", hsnCode: "48209090", keywords: ["stationary", "stationery", "office supplies"] },
  { name: "STEEL UTENSILS", hsnCode: "73239990", keywords: ["steel utensils", "steel ware"] },
  { name: "SUN GLASS", hsnCode: "90041000", keywords: ["sun glass", "sunglasses", "shades"] },
  { name: "WOOLEN COAT", hsnCode: "62012010", keywords: ["woolen coat", "wool coat"] },
  { name: "COTTON FROCK", hsnCode: "62044290", keywords: ["cotton frock", "frock", "dress"] },
  { name: "COTTON HAIR BAND", hsnCode: "40169920", keywords: ["cotton hair band", "hair band"] },
  { name: "COTTON LACE", hsnCode: "58043000", keywords: ["cotton lace", "lace", "trimming"] },
  { name: "COTTON MAT", hsnCode: "57050042", keywords: ["cotton mat", "mat", "rug"] },
  { name: "COTTON SOCKS", hsnCode: "61159500", keywords: ["cotton socks", "socks"] },
  { name: "HAND GLOVES", hsnCode: "61169990", keywords: ["hand gloves", "gloves"] },
  { name: "KITCHENWARE", hsnCode: "39249090", keywords: ["kitchenware", "kitchen utensils"] },
  { name: "PAPER BAG", hsnCode: "48191090", keywords: ["paper bag", "carry bag"] },
  { name: "PHOTOFRAME", hsnCode: "44149000", keywords: ["photoframe", "frame"] },
  { name: "PLASTIC MOBILE COVER", hsnCode: "39269099", keywords: ["plastic mobile cover", "phone cover"] },
  { name: "SILK LEHENGA", hsnCode: "62042919", keywords: ["silk lehenga", "silk lehnga"] },
  { name: "TOWEL", hsnCode: "63049260", keywords: ["towel", "bath towel"] },
  { name: "WOOLEN LOWER", hsnCode: "61034990", keywords: ["woolen lower", "wool pajama"] },
  { name: "ALBUM", hsnCode: "48205000", keywords: ["album", "photo album"] },
  { name: "COTTON TRACK SUIT", hsnCode: "61121100", keywords: ["cotton track suit", "tracksuit"] },
  { name: "TEA", hsnCode: "21012010", keywords: ["tea", "chai"] },
  { name: "CRICKET BAT", hsnCode: "95069920", keywords: ["cricket bat", "bat"] },
  { name: "CRICKET BALL", hsnCode: "95066920", keywords: ["cricket ball", "ball"] },
  { name: "COTTON MASK", hsnCode: "63079090", keywords: ["cotton mask", "face mask"] },
  { name: "SYNTHETIC STONE", hsnCode: "68100000", keywords: ["synthetic stone", "artificial stone"] },
  { name: "COTTON SCARF", hsnCode: "62149040", keywords: ["cotton scarf", "scarf"] },
  { name: "POUCH", hsnCode: "39230000", keywords: ["pouch", "small bag"] },
  { name: "DOOR HANGING", hsnCode: "39269099", keywords: ["door hanging", "door decor"] },
  { name: "PAMPHLET", hsnCode: "49011020", keywords: ["pamphlet", "brochure"] },
  { name: "TAPE ROLL", hsnCode: "39190000", keywords: ["tape roll", "adhesive tape"] },
  { name: "RAINCOAT", hsnCode: "62011210", keywords: ["raincoat", "rain coat"] },
  { name: "MIRROR", hsnCode: "70090000", keywords: ["mirror", "looking glass"] },
  { name: "SHERWANI", hsnCode: "62031910", keywords: ["sherwani", "traditional wear"] },
  { name: "ADAPTER", hsnCode: "85366990", keywords: ["adapter", "electric adapter"] },
  { name: "ROPE", hsnCode: "56070000", keywords: ["rope", "cord"] },
  { name: "BATHWARE", hsnCode: "39220000", keywords: ["bathware", "bathroom ware"] },
  { name: "BUCKRAM", hsnCode: "59019090", keywords: ["buckram", "stiff cloth"] },
  { name: "PLASTIC PHONE COVER", hsnCode: "39269099", keywords: ["plastic phone cover", "mobile cover"] },
  { name: "ROTI MAKER", hsnCode: "85166000", keywords: ["roti maker", "chapati maker"] },
  { name: "STICKER", hsnCode: "48211010", keywords: ["sticker", "adhesive sticker"] },
  { name: "POUCHES", hsnCode: "39232990", keywords: ["pouches", "small bags"] },
  { name: "PLUG", hsnCode: "85360000", keywords: ["plug", "electric plug"] },
  { name: "ROLL", hsnCode: "48030000", keywords: ["roll", "paper roll"] },
  { name: "PILLOW COVER", hsnCode: "63040000", keywords: ["pillow cover", "pillow case"] },
  { name: "PILLOW", hsnCode: "94040000", keywords: ["pillow", "cushion"] },
  { name: "CABLE", hsnCode: "85440000", keywords: ["cable", "wire", "cord"] },
  { name: "GROCERIES", hsnCode: "19040000", keywords: ["groceries", "food items"] },
  { name: "RAIN COAT", hsnCode: "62011210", keywords: ["rain coat", "raincoat"] },
  { name: "BANGLES", hsnCode: "70181010", keywords: ["bangles", "bangle"] },
  { name: "POLY BAG", hsnCode: "39232100", keywords: ["poly bag", "plastic bag"] },
  { name: "CALENDAR", hsnCode: "49100000", keywords: ["calendar", "desk calendar"] },
  { name: "JUMP ROPE", hsnCode: "95069990", keywords: ["jump rope", "skipping rope"] },
  { name: "LUNCH BOX", hsnCode: "39240000", keywords: ["lunch box", "tiffin box"] },
  { name: "WOOLEN SCARF", hsnCode: "62140000", keywords: ["woolen scarf", "wool scarf"] },
  { name: "RUBBER PIPE", hsnCode: "40090000", keywords: ["rubber pipe", "hose"] },
  { name: "POSTER", hsnCode: "49111010", keywords: ["poster", "wall poster"] },
  { name: "MUSICAL INSTRUMENT", hsnCode: "92010000", keywords: ["musical instrument", "instrument"] },
  { name: "TISSUE PAPER", hsnCode: "48025450", keywords: ["tissue paper", "tissue"] },
  { name: "COTTON", hsnCode: "52010000", keywords: ["cotton", "raw cotton"] },
  { name: "STATUE", hsnCode: "97030020", keywords: ["statue", "sculpture"] },
  { name: "PARANDI", hsnCode: "63079090", keywords: ["parandi", "hair accessory"] },
  { name: "COOKER GASKET", hsnCode: "73219000", keywords: ["cooker gasket", "pressure cooker gasket"] },
  { name: "PLASTIC SHEET", hsnCode: "39200000", keywords: ["plastic sheet", "plastic film"] },
  { name: "KNEE SUPPORT", hsnCode: "90211000", keywords: ["knee support", "knee guard"] },
  { name: "TOOTH BRUSH", hsnCode: "96032100", keywords: ["tooth brush", "toothbrush"] },
  { name: "SCRUB", hsnCode: "33049990", keywords: ["scrub", "body scrub"] },
  { name: "MASK", hsnCode: "63079090", keywords: ["mask", "face mask"] },
  { name: "INHALER", hsnCode: "30040000", keywords: ["inhaler", "asthma inhaler"] },
  { name: "BRASS UTENSILS", hsnCode: "74181021", keywords: ["brass utensils", "brass ware"] },
  { name: "BUTTON", hsnCode: "96062100", keywords: ["button", "shirt button"] },
  { name: "CARPET", hsnCode: "57031010", keywords: ["carpet", "rug", "mat"] },
  { name: "COTTON APRON", hsnCode: "42034010", keywords: ["cotton apron", "apron"] },
  { name: "COTTON KITCHEN TOWEL", hsnCode: "63049260", keywords: ["cotton kitchen towel", "kitchen towel"] },
  { name: "COTTON KURTI", hsnCode: "61149090", keywords: ["cotton kurti", "kurti"] },
  { name: "COTTON SKIRT", hsnCode: "62045290", keywords: ["cotton skirt", "skirt"] },
  { name: "COTTON TABLE COVER", hsnCode: "63071090", keywords: ["cotton table cover", "table cloth"] },
  { name: "CRICKET HELMET", hsnCode: "65061090", keywords: ["cricket helmet", "helmet"] },
  { name: "CRICKET PAD", hsnCode: "95069920", keywords: ["cricket pad", "leg pad"] },
  { name: "CURTAIN", hsnCode: "63039990", keywords: ["curtain", "drape"] },
  { name: "DECORATIVE ITEMS", hsnCode: "69139000", keywords: ["decorative items", "decor"] },
  { name: "GLASS UTENSILS", hsnCode: "70131000", keywords: ["glass utensils", "glass ware"] },
  { name: "HANGER", hsnCode: "39269099", keywords: ["hanger", "clothes hanger"] },
  { name: "KEY RING", hsnCode: "42023120", keywords: ["key ring", "keychain"] },
  { name: "MUSIC INSTRUMENT TABLA", hsnCode: "92071000", keywords: ["music instrument tabla", "tabla"] },
  { name: "PLASTIC BAG", hsnCode: "39232100", keywords: ["plastic bag", "polythene bag"] },
  { name: "PLASTIC BASKET", hsnCode: "39249090", keywords: ["plastic basket", "basket"] },
  { name: "PLASTIC BOTTLE", hsnCode: "39233090", keywords: ["plastic bottle", "bottle"] },
  { name: "PLASTIC UTENSIL", hsnCode: "39249090", keywords: ["plastic utensil", "plastic spoon"] },
  { name: "TEMPERED GLASS", hsnCode: "70071900", keywords: ["tempered glass", "safety glass"] },
  { name: "WAX STRIPS", hsnCode: "48236900", keywords: ["wax strips", "hair removal strips"] },
  { name: "WOOLEN BABY DRESS", hsnCode: "61119090", keywords: ["woolen baby dress", "wool baby dress"] },
  { name: "WOOLEN SHRUG", hsnCode: "62114999", keywords: ["woolen shrug", "shrug"] },
  { name: "WOOLEN SOCKS", hsnCode: "61159400", keywords: ["woolen socks", "wool socks"] },
  { name: "WOOLEN SWEATSHIRT", hsnCode: "61059090", keywords: ["woolen sweatshirt", "sweatshirt"] },
  { name: "WRIST BAND", hsnCode: "40169920", keywords: ["wrist band", "wristband"] },
];