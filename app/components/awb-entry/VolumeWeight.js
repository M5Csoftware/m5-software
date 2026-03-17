import React, { useMemo, useState, useEffect, useContext } from "react";
import { AwbWindowHeading } from "../Heading";
import { useForm } from "react-hook-form";
import InputBox, { NumberInputBox } from "../InputBox";
import { OutlinedButtonRed } from "../Buttons";
import { TableWithCTA } from "../Table";
import { DummyInputBoxWithLabelDarkGray } from "../DummyInputBox";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";

function VolumeWeight({
  awbNo,
  window,
  totalKg,
  setTotalKg,
  setVolumeContent,
  serviceData,
}) {
  const {
    register,
    setValue,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();
  const [rowData, setRowData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [division, setDivision] = useState(5000);
  const [volumeWeight, setVolumeWeight] = useState(0.0);
  const [totalPcs, setTotalPcs] = useState(0);
  const [totalVolWeight, setTotalVolWeight] = useState(0);
  const [totalActualWeight, setTotalActualWeight] = useState(0);

  const { server, globalTotalPcs, actualWtt } = useContext(GlobalContext);
  const [resetFactor, setResetFactor] = useState(false);

  // For real-time validation display (not blocking input)
  const [validationStatus, setValidationStatus] = useState({
    pcsMatch: true,
    weightMatch: true,
  });

  // For confirming single item deletion
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // For confirming delete all boxes
  const [showConfirmDeleteAllModal, setShowConfirmDeleteAllModal] =
    useState(false);

  const watchedValues = watch();

  // Fetch data when AWB changes
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    setHasFetched(false); // allow refetch when AWB changes
  }, [awbNo]);

  const fetchData = async () => {
    if (!awbNo || hasFetched) return; // prevent refetch if already done

    try {
      const response = await axios.get(
        `${server}/portal/create-shipment?awbNo=${awbNo}`
      );
      const data = response.data;
      // console.log("data", data);

      if (Array.isArray(data.boxes) && data.boxes.length > 0) {
        const boxes = data.boxes.map((box, i) => {
          const length = Number(box.length) || 0;
          const width = Number(box.width) || 0;
          const height = Number(box.height) || 0;
          const actualWt = Number(box.actualWt) || 0;
          const pcs = Number(box.pcs) || 1;

          // Prefer API's volumetricWeight if available, otherwise calculate manually
          const volumeWeight = box.volumetricWeight
            ? Number(box.volumetricWeight)
            : (length * width * height) / division;

          // Validate this box against service rules
          const validation = validatePerPcs({
            actualWt: actualWt,
            volumeWeight: volumeWeight,
            pcs: pcs,
          });

          return {
            boxNo: i + 1,
            length,
            width,
            height,
            pcs,
            actualWt,
            volumeWeight,
            amount: Number(box.amount) || 0,
            receiverFullName: box.receiverFullName || "",
            validationError: validation.ok ? null : validation.errors[0],
            isValid: validation.ok,
          };
        });

        setRowData(boxes);
        if (setVolumeContent) {
          setVolumeContent(boxes);
        }
      }
      setHasFetched(true);
    } catch (err) {
      console.error("Error fetching data:", err);
      setHasFetched(true);
      setRowData([]);
    }
  };

  useEffect(() => {
    if (awbNo && window) {
      fetchData();
    }
  }, [awbNo, window]);

  // Calculate totals whenever rowData changes
  useEffect(() => {
    const volWeightTotal = rowData.reduce(
      (sum, item) => sum + Number(item.volumeWeight || 0),
      0
    );
    setTotalKg(volWeightTotal.toFixed(2));

    const pcsTotal = rowData.reduce(
      (sum, item) => sum + Number(item.pcs || 0),
      0
    );
    setTotalPcs(pcsTotal);

    const actualWeightTotal = rowData.reduce(
      (sum, item) => sum + Number(item.actualWt || 0),
      0
    );
    setTotalActualWeight(actualWeightTotal);

    setTotalVolWeight(volWeightTotal.toFixed(2));

    // Update validation status with proper type conversion
    const globalPcs = parseInt(globalTotalPcs) || 0;
    const localPcs = parseInt(pcsTotal) || 0;
    const globalWeight = parseFloat(actualWtt) || 0;
    const localWeight = parseFloat(actualWeightTotal) || 0;

    const newValidationStatus = {
      pcsMatch: !globalTotalPcs || localPcs === globalPcs,
      weightMatch: !actualWtt || Math.abs(localWeight - globalWeight) < 0.01, // Allow small decimal differences
    };
    setValidationStatus(newValidationStatus);
  }, [rowData, globalTotalPcs, actualWtt, setTotalKg]);

  // Enhanced columns with validation status

  const columns = useMemo(
    () => [
      { key: "boxNo", label: "Box No" },
      { key: "length", label: "Length" },
      { key: "width", label: "Width" },
      { key: "height", label: "Height" },
      {
        key: "pcs",
        label: "PCs",
        render: (value, row) => (
          <div className="flex flex-col">
            <span>{value}</span>
            {row.validationError && row.validationError.includes("PCS") && (
              <span className="text-red-500 text-xs mt-1">
                {row.validationError} (per piece)
              </span>
            )}
          </div>
        ),
      },
      {
        key: "actualWt",
        label: "Actual Wt.",
        render: (value, row) => (
          <div className="flex flex-col">
            <span>{value}</span>
            {row.validationError &&
              row.validationError.includes("Actual Wt.") && (
                <span className="text-red-500 text-xs mt-1">
                  {row.validationError} (per piece)
                </span>
              )}
          </div>
        ),
      },
      {
        key: "volumeWeight",
        label: "Volume Wt.",
        render: (value, row) => (
          <div className="flex flex-col">
            <span>{value}</span>
            {row.validationError &&
              row.validationError.includes("Volume Wt.") && (
                <span className="text-red-500 text-xs mt-1">
                  {row.validationError} (per piece)
                </span>
              )}
          </div>
        ),
      },
      // ... rest of columns
    ],
    []
  );

  // Calculate volume weight when dimensions change
  useEffect(() => {
    const { length, width, height } = watchedValues;
    if (length && width && height) {
      const calculatedVolumeWeight = (length * width * height) / division;
      setVolumeWeight(calculatedVolumeWeight);
      setValue("volumeWeight", calculatedVolumeWeight.toFixed(2));
    } else {
      setVolumeWeight(0);
      setValue("volumeWeight", "0.00");
    }
  }, [
    watchedValues.length,
    watchedValues.width,
    watchedValues.height,
    division,
    setValue,
  ]);

  // Enhanced validatePerPcs function with PCS validation

  const validatePerPcs = (box) => {
    if (!serviceData || !serviceData.perPcs) return { ok: true, errors: [] };

    const rules = serviceData.perPcs;
    const actual = Number(box.actualWt || 0);
    const vol = Number(box.volumeWeight || 0);
    const pcs = Number(box.pcs || 1);

    const errors = [];

    // Only check perPcs rules here
    if (rules.minPcs && pcs < rules.minPcs)
      errors.push(`PCS per piece cannot be below ${rules.minPcs}`);

    if (rules.maxPcs && pcs > rules.maxPcs)
      errors.push(`PCS per piece cannot exceed ${rules.maxPcs}`);

    if (rules.minActualWeight && actual < rules.minActualWeight)
      errors.push(
        `Actual Wt. per piece cannot be below ${rules.minActualWeight}`
      );

    if (rules.maxActualWeight && actual > rules.maxActualWeight)
      errors.push(
        `Actual Wt. per piece cannot exceed ${rules.maxActualWeight}`
      );

    if (rules.minVolumeWeight && vol < rules.minVolumeWeight)
      errors.push(
        `Volume Wt. per piece cannot be below ${rules.minVolumeWeight}`
      );

    if (rules.maxVolumeWeight && vol > rules.maxVolumeWeight)
      errors.push(
        `Volume Wt. per piece cannot exceed ${rules.maxVolumeWeight}`
      );

    return { ok: errors.length === 0, errors };
  };

  const addToArray = (data) => {
    // Validate before Add/Update
    const validation = validatePerPcs({
      actualWt: Number(data.actualWt),
      volumeWeight: Number(data.volumeWeight),
      pcs: Number(data.pcs) || 1,
    });

    if (!validation.ok) {
      alert(validation.errors.join("\n"));
      return;
    }

    const pcsCount = Number(data.pcs) || 1;
    const actualWt = Number(data.actualWt) || 0;

    setRowData((prev) => {
      let updatedData = [...prev];

      if (editIndex !== null) {
        // If editing, preserve the original box number and update in place
        const originalBoxNo = updatedData[editIndex].boxNo;

        if (pcsCount === 1) {
          // Simple case: just update the existing item
          updatedData[editIndex] = {
            ...data,
            boxNo: originalBoxNo,
            pcs: 1,
            actualWt: actualWt,
            volumeWeight: Number(data.volumeWeight) || 0,
            validationError: null,
            isValid: true,
          };
        } else {
          // Complex case: replace one item with multiple items
          const newEntries = Array.from({ length: pcsCount }, (_, i) => ({
            ...data,
            boxNo: originalBoxNo + i,
            pcs: 1,
            actualWt: actualWt,
            volumeWeight: Number(data.volumeWeight) || 0,
            validationError: null,
            isValid: true,
          }));

          // Remove the original item and insert new entries at the same position
          updatedData.splice(editIndex, 1, ...newEntries);

          // Renumber all boxes after the edited section to maintain sequential numbering
          updatedData = updatedData.map((item, index) => ({
            ...item,
            boxNo: index + 1,
          }));
        }
      } else {
        // Adding new items - add them at the end
        const newEntries = Array.from({ length: pcsCount }, (_, i) => ({
          ...data,
          boxNo: updatedData.length + i + 1,
          pcs: 1,
          actualWt: actualWt,
          volumeWeight: Number(data.volumeWeight) || 0,
          validationError: null,
          isValid: true,
        }));

        updatedData = [...updatedData, ...newEntries];
      }

      // Re-validate all boxes
      const validatedData = updatedData.map((item) => {
        const itemValidation = validatePerPcs({
          actualWt: Number(item.actualWt),
          volumeWeight: Number(item.volumeWeight),
          pcs: Number(item.pcs) || 1,
        });

        return {
          ...item,
          validationError: itemValidation.ok ? null : itemValidation.errors[0],
          isValid: itemValidation.ok,
        };
      });

      if (setVolumeContent) {
        setVolumeContent(validatedData);
      }
      return validatedData;
    });

    // Reset form and edit state
    handleResetForm();
  };

  const handleEdit = (index) => {
    const selectedData = rowData[index];
    if (selectedData) {
      setEditIndex(index);

      // Set form values using setValue
      setValue("length", selectedData.length?.toString() || "");
      setValue("width", selectedData.width?.toString() || "");
      setValue("height", selectedData.height?.toString() || "");
      setValue("pcs", selectedData.pcs?.toString() || "");
      setValue("actualWt", selectedData.actualWt?.toString() || "");
      setValue("volumeWeight", selectedData.volumeWeight?.toString() || "");

      // Update local volume weight state
      setVolumeWeight(selectedData.volumeWeight || 0);
    }
  };

  // Reset form function
  const handleResetForm = () => {
    reset({
      length: "",
      width: "",
      height: "",
      pcs: "",
      actualWt: "",
      volumeWeight: "",
    });
    setEditIndex(null);
    setVolumeWeight(0);
    setResetFactor(!resetFactor);
  };

  // Show confirmation modal before deleting single row
  const handleDelete = (index) => {
    setDeleteTarget(index);
    setShowConfirmModal(true);
  };

  // Confirm single row delete
  const confirmDelete = () => {
    if (deleteTarget !== null) {
      setRowData((prevData) => {
        const newData = prevData
          .filter((_, i) => i !== deleteTarget)
          .map((item, idx) => ({
            ...item,
            boxNo: idx + 1,
          }));

        if (setVolumeContent) {
          setVolumeContent(newData);
        }
        return newData;
      });
    }
    setShowConfirmModal(false);
    setDeleteTarget(null);
  };

  // Show confirmation modal before deleting all rows
  const handleDeleteAll = () => {
    setShowConfirmDeleteAllModal(true);
  };

  // Confirm delete all rows
  const confirmDeleteAll = () => {
    setRowData([]);
    if (setVolumeContent) {
      setVolumeContent([]);
    }
    setShowConfirmDeleteAllModal(false);
  };

  // Function to validate all boxes
  const validateAllBoxes = () => {
    const validatedData = rowData.map((item) => {
      const validation = validatePerPcs({
        actualWt: Number(item.actualWt),
        volumeWeight: Number(item.volumeWeight),
        pcs: Number(item.pcs) || 1,
      });

      return {
        ...item,
        validationError: validation.ok ? null : validation.errors[0],
        isValid: validation.ok,
      };
    });

    setRowData(validatedData);
    return validatedData.filter((item) => !item.isValid).length;
  };

  // Validate boxes when serviceData changes
  useEffect(() => {
    if (rowData.length > 0 && serviceData) {
      validateAllBoxes();
    }
  }, [serviceData]);

  // Summary of validation errors
  const validationSummary = useMemo(() => {
    const invalidBoxes = rowData.filter((item) => !item.isValid);
    return {
      totalInvalid: invalidBoxes.length,
      errors: invalidBoxes.map((item) => ({
        boxNo: item.boxNo,
        error: item.validationError,
      })),
    };
  }, [rowData]);

  return (
    <>
      {/* Confirmation modal for single delete */}
      {showConfirmModal && (
        <ConfirmationModal
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowConfirmModal(false);
            setDeleteTarget(null);
          }}
        />
      )}

      {/* Confirmation modal for delete all */}
      {showConfirmDeleteAllModal && (
        <ConfirmationModal
          onConfirm={confirmDeleteAll}
          onCancel={() => setShowConfirmDeleteAllModal(false)}
          message="Are you sure you want to delete all boxes?"
        />
      )}

      <form
        onSubmit={handleSubmit(addToArray)}
        className={`flex flex-col gap-8 bg-white px-9 py-8 fixed inset-x-48 inset-y-10 z-40 backdrop-blur-sm border rounded-md ${
          window ? "" : "hidden"
        }`}
      >
        <AwbWindowHeading label={`Volume Weight`} awbNo={awbNo} />
        <div className="flex gap-4">
          <NumberInputBox
            placeholder="Length"
            register={register}
            setValue={setValue}
            value="length"
            resetFactor={resetFactor}
            initialValue={watchedValues?.length || ""}
            validation={{
              required: "Length is required",
            }}
          />
          <NumberInputBox
            placeholder="Width"
            register={register}
            setValue={setValue}
            value="width"
            resetFactor={resetFactor}
            initialValue={watchedValues?.width || ""}
            validation={{
              required: "Width is required",
            }}
          />
          <NumberInputBox
            placeholder="Height"
            register={register}
            setValue={setValue}
            value="height"
            resetFactor={resetFactor}
            initialValue={watchedValues?.height || ""}
            validation={{
              required: "Height is required",
            }}
          />
          <div className="flex flex-col w-full">
            <InputBox
              placeholder="Pcs"
              register={register}
              setValue={setValue}
              value="pcs"
              resetFactor={resetFactor}
              initialValue={watchedValues?.pcs || ""}
              validation={{
                required: "Pcs is required",
              }}
            />
            {errors.pcs && (
              <span className="text-red-500 text-xs mt-1">
                {errors.pcs.message}
              </span>
            )}
          </div>
          <div className="flex flex-col w-full">
            <InputBox
              placeholder="Actual Wt."
              register={register}
              setValue={setValue}
              value="actualWt"
              resetFactor={resetFactor}
              initialValue={watchedValues?.actualWt || ""}
              validation={{
                required: "Actual weight is required",
              }}
            />
            {errors.actualWt && (
              <span className="text-red-500 text-xs mt-1">
                {errors.actualWt.message}
              </span>
            )}
          </div>
          <DummyInputBoxWithLabelDarkGray
            watch={watch}
            label="Volume Wt."
            register={register}
            setValue={setValue}
            value="volumeWeight"
            inputValue={volumeWeight}
            resetFactor={resetFactor}
            initialValue={watchedValues?.volumeWeight || ""}
          />
          <OutlinedButtonRed
            type="submit"
            label={editIndex !== null ? `Update(${editIndex + 1})` : "Add"}
          />
          {/* Add Cancel button when editing */}
          {editIndex !== null && (
            <OutlinedButtonRed
              type="button"
              onClick={handleResetForm}
              label="Cancel"
            />
          )}
        </div>

        <div className="bg-white-smoke border border-silver rounded-lg py-3.5 px-5 flex flex-col gap-3">
          <div className="flex justify-end gap-9">
            <div className="flex bg-[#7676801F] px-5 py-1.5 text-sm gap-5 items-center rounded-md">
              <span className="text-[#667085]">Total Kg</span>
              <span>{totalKg} Kg</span>
            </div>
            <div className="flex bg-[#7676801F] px-5 py-1.5 text-sm gap-5 items-center rounded-md">
              <span className="text-[#667085]">Division</span>
              <span>{division}</span>
            </div>
          </div>
        
          {validationSummary.totalInvalid > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-r">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-yellow-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-yellow-800 font-medium">
                  {validationSummary.totalInvalid} box
                  {validationSummary.totalInvalid > 1 ? "es" : ""} violate per
                  piece limits
                </span>
              </div>
              <div className="mt-1 text-sm text-yellow-700">
                {validationSummary.errors.slice(0, 3).map((err, idx) => (
                  <div key={idx}>
                    Box {err.boxNo}: {err.error} (per piece limit)
                  </div>
                ))}
                {validationSummary.errors.length > 3 && (
                  <div>... and {validationSummary.errors.length - 3} more</div>
                )}
              </div>
            </div>
          )}
          <TableWithCTA
            columns={columns}
            name={`volumeWeight`}
            register={register}
            setValue={setValue}
            rowData={rowData}
            handleDelete={handleDelete}
            handleEdit={handleEdit}
            rowClassName={(row) =>
              row.isValid ? "" : "bg-red-50 hover:bg-red-100"
            }
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <OutlinedButtonRed
              label={`Delete All Boxes`}
              onClick={handleDeleteAll}
            />
          </div>

          <div className="flex gap-4">
            <div
              className={`py-[10px] px-4 rounded-md flex gap-5 text-center items-center ${
                !validationStatus.pcsMatch
                  ? "bg-red-100 border-2 border-red-300"
                  : "bg-[#FFE5E9]"
              }`}
            >
              <h1 className="text-base font-medium text-red">Total Pcs</h1>
              <span className="text-black">
                {totalPcs} {globalTotalPcs && `/ ${globalTotalPcs}`}
              </span>
            </div>
            <div className="bg-[#FFE5E9] py-[10px] px-4 rounded-md flex gap-5 items-center">
              <h1 className="text-base font-medium text-red">
                Total Vol. Weight
              </h1>
              <span>{totalVolWeight} kg</span>
            </div>
            <div
              className={`py-[10px] px-4 rounded-md flex gap-5 items-center ${
                !validationStatus.weightMatch
                  ? "bg-red-100 border-2 border-red-300"
                  : "bg-[#FFE5E9]"
              }`}
            >
              <h1 className="text-base font-medium text-red">
                Total Act. Weight
              </h1>
              <span className="font-normal">
                {totalActualWeight.toFixed(2)} {actualWtt && `/ ${actualWtt}`}{" "}
                kg
              </span>
            </div>
          </div>
        </div>

        {/* Compact one-line validation banner */}
        {rowData.length > 0 && (globalTotalPcs || actualWtt) && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis
      ${
        validationStatus.pcsMatch && validationStatus.weightMatch
          ? "bg-green-800 text-white border border-green-800"
          : "bg-red text-white border border-red"
      }`}
          >
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold shrink-0
        ${
          validationStatus.pcsMatch && validationStatus.weightMatch
            ? "bg-green-500 text-white"
            : "bg-white text-red"
        }`}
            >
              {validationStatus.pcsMatch && validationStatus.weightMatch
                ? "✓"
                : "!"}
            </span>

            <span className="truncate">
              {validationStatus.pcsMatch && validationStatus.weightMatch
                ? `Validation successful — ${totalPcs} pcs & ${totalActualWeight.toFixed(
                    2
                  )} kg match expected values.`
                : `Validation error — ${
                    !validationStatus.pcsMatch
                      ? `Pieces (${totalPcs}/${globalTotalPcs}) `
                      : ""
                  }${
                    !validationStatus.weightMatch
                      ? `Weight (${totalActualWeight.toFixed(
                          2
                        )}/${actualWtt} kg)`
                      : ""
                  }`}
            </span>
          </div>
        )}
      </form>
    </>
  );
}

export default VolumeWeight;

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
