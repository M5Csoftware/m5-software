"use client";
import React, { useContext, useEffect, useMemo, useState, useRef } from "react";
import Heading from "@/app/components/Heading";
import { Dropdown, LabeledDropdown } from "@/app/components/Dropdown";
import {
  AddButton,
  DeleteButton,
  EditButton,
} from "@/app/components/AddUpdateDeleteButton";
import InputBox from "@/app/components/InputBox";
import Checkbox from "@/app/components/Checkbox";
import {
  OutlinedButtonWithRightImage,
  SimpleButton,
} from "@/app/components/Buttons";
import { useForm, useWatch } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { EntityContext } from "@/app/Context/EntityContext";
import Image from "next/image";
import * as XLSX from "xlsx";
import UploadModal from "@/app/components/UploadModal";
import NotificationFlag from "@/app/components/Notificationflag";
import ConfirmModal from "@/app/components/ConfirmModal";

export default function EntityManager({ setCurrentView }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [Added, setAdded] = useState(false);
  const [addButton, setAddButton] = useState(false);
  const [updateButton, setUpdateButton] = useState(false);
  const [deleteButton, setDeleteButton] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");
  const [data, setData] = useState([]);
  const [dataUpdate, setDataUpdate] = useState(false);
  const [matchedEntity, setMatchedEntity] = useState(null);
  const [showDelCol, setShowDelCol] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showListDeleteModal, setShowListDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const fileInputRef = useRef(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [visibleFlag, setVisibleFlag] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Added refresh key

  const {
    handleSubmit,
    register,
    setValue,
    reset,
    control,
    trigger,
    formState: { errors },
  } = useForm();

  const { selectedEntity, setSelectedEntity } = useContext(EntityContext);
  const { toggleCodeList, setToggleCodeList, setCodeListConfig, server, sectors } =
    useContext(GlobalContext);

  const codeValue = useWatch({ control, name: "code" });
  const nameValue = useWatch({ control, name: "name" });

  // Watch extra fields
  const sectorValue = useWatch({ control, name: "sector" });
  const activeOnPortalValue = useWatch({ control, name: "activeOnPortal" });
  const activeOnSoftwareValue = useWatch({ control, name: "activeOnSoftware" });
  const hsnValue = useWatch({ control, name: "hsn" });
  const taxChargesValue = useWatch({ control, name: "taxCharges" });
  const fuelChargesValue = useWatch({ control, name: "fuelCharges" });

  // Handle refresh functionality
  const handleRefresh = () => {
    // Reset form
    reset({
      code: "",
      name: "",
      sector: "",
      activeOnPortal: false,
      activeOnSoftware: false,
      hsn: "",
      taxCharges: false,
      fuelCharges: false,
    });

    // Clear states
    setSelectedOption(null);
    setSelectedEntity(null);
    setMatchedEntity(null);
    setData([]);
    setAddButton(false);
    setUpdateButton(false);
    setDeleteButton(false);
    setResponseMsg("");
    setShowDelCol(false);

    // Force re-render
    setRefreshKey((prev) => prev + 1);

    // Show success message
    setResponseMsg("Page refreshed successfully");
    setVisibleFlag(true);

    // Clear message after 5 seconds
    setTimeout(() => setResponseMsg(""), 5000);
  };

  useEffect(() => {
    if (!codeValue || !selectedOption || data.length === 0) return;

    const checkDuplicate = () => {
      const match = data.find(
        (item) => item.code?.toLowerCase() === codeValue.toLowerCase(),
      );

      setDeleteButton(!!match);

      if (match) {
        setMatchedEntity(match);
        setValue("name", match.name || "");
        setResponseMsg("This code already exists.");
        setAddButton(true);
      } else {
        // NO MATCH FOUND — RESET EVERYTHING
        setMatchedEntity(null);
        setResponseMsg("");
        setAddButton(false);

        // 🔥 RESET EXTRA FIELDS WHEN CODE IS REMOVED OR DOES NOT MATCH
        if (selectedOption === "Service") {
          setValue("sector", "");
          setValue("activeOnPortal", false);
          setValue("activeOnSoftware", false);
        }

        if (selectedOption === "Misc Charges") {
          setValue("hsn", "");
          setValue("taxCharges", false);
          setValue("fuelCharges", false);
        }
      }

      setTimeout(() => setResponseMsg(""), 5000);
    };

    const debounce = setTimeout(checkDuplicate, 300);
    return () => clearTimeout(debounce);
  }, [codeValue, selectedOption, data, setValue, refreshKey]);

  // Enhanced update button logic to check extra fields
  useEffect(() => {
    if (matchedEntity && codeValue) {
      const isSameCode =
        matchedEntity.code?.toLowerCase() === codeValue.toLowerCase();

      let hasChanges = false;

      // Check name change
      if (
        nameValue &&
        matchedEntity.name?.toLowerCase() !== nameValue.toLowerCase()
      ) {
        hasChanges = true;
      }

      // Check extra fields based on entity type
      if (selectedOption === "Service") {
        if (sectorValue !== matchedEntity.sector) hasChanges = true;
        if (
          Boolean(activeOnPortalValue) !== Boolean(matchedEntity.activeOnPortal)
        )
          hasChanges = true;
        if (
          Boolean(activeOnSoftwareValue) !==
          Boolean(matchedEntity.activeOnSoftware)
        )
          hasChanges = true;
      }

      if (selectedOption === "Misc Charges") {
        if (hsnValue !== matchedEntity.hsn) hasChanges = true;
        if (Boolean(taxChargesValue) !== Boolean(matchedEntity.taxCharges))
          hasChanges = true;
        if (Boolean(fuelChargesValue) !== Boolean(matchedEntity.fuelCharges))
          hasChanges = true;
      }

      setUpdateButton(isSameCode && hasChanges);
      setAddButton(isSameCode && !hasChanges);
    } else {
      setUpdateButton(false);
    }
  }, [
    nameValue,
    sectorValue,
    activeOnPortalValue,
    activeOnSoftwareValue,
    hsnValue,
    taxChargesValue,
    fuelChargesValue,
    matchedEntity,
    codeValue,
    selectedOption,
    refreshKey,
  ]);

  const handleAction = async (action, rowData) => {
    if (action === "edit") {
      setSelectedEntity(rowData);
      setValue("code", rowData.code);
      setValue("name", rowData.name);

      // Populate extra fields when editing from code list
      if (selectedOption === "Service") {
        setValue("sector", rowData.sector || "");
        setValue("activeOnPortal", Boolean(rowData.activeOnPortal));
        setValue("activeOnSoftware", Boolean(rowData.activeOnSoftware));
      }

      if (selectedOption === "Misc Charges") {
        setValue("hsn", rowData.hsn || "");
        setValue("taxCharges", Boolean(rowData.taxCharges));
        setValue("fuelCharges", Boolean(rowData.fuelCharges));
      }

      setToggleCodeList(false);
      setResponseMsg("Data loaded for editing!");
      setVisibleFlag(true);
    } else if (action === "delete") {
      setItemToDelete(rowData);
      setShowListDeleteModal(true);
    }
  };

  const confirmDeleteFromList = async () => {
    if (!itemToDelete || !itemToDelete.code) return;
    const { code } = itemToDelete;

    try {
      await axios.delete(`${server}/entity-manager`, {
        params: { code, entityType: selectedOption },
      });
      setResponseMsg("Deleted");
      setVisibleFlag(true);
      setDataUpdate(!dataUpdate);
    } catch (error) {
      console.error(
        "Error during deletion:",
        error.response?.data || error.message,
      );
      setResponseMsg("Data deletion failed!");
      setVisibleFlag(true);
    } finally {
      setShowListDeleteModal(false);
      setItemToDelete(null);
    }
  };

  useEffect(() => {
    const fetchEntity = async (entityType) => {
      try {
        const response = await axios.get(`${server}/entity-manager`, {
          params: { entityType },
        });
        setData(response.status === 200 ? response.data : []);
        // console.log(response.data);
      } catch (error) {
        console.error("Error fetching entities:", error);
        setData([]);
      }
    };
    if (selectedOption) fetchEntity(selectedOption);
  }, [selectedOption, dataUpdate, Added, refreshKey]);

  const addEntity = async (formData) => {
    try {
      const payload = { ...formData, entityType: selectedOption };
      const response = await axios.post(`${server}/entity-manager`, payload);
      reset();
      setSelectedEntity(null);
      setMatchedEntity(null);
      setResponseMsg("Added");
      setVisibleFlag(true);
    } catch (error) {
      console.error("Error adding entity:", error);
      setResponseMsg("Failed to add entity!");
      setVisibleFlag(true);
    } finally {
      setAdded(!Added);
      setTimeout(() => setResponseMsg(""), 5000);
    }
  };

  const updateEntity = async (formData) => {
    try {
      const payload = { ...formData, entityType: selectedOption };
      const response = await axios.put(
        `${server}/entity-manager?code=${formData.code}`,
        payload,
      );
      setResponseMsg("Updated");
      setVisibleFlag(true);
      reset();
      setSelectedEntity(null);
      setMatchedEntity(null);
    } catch (error) {
      console.error("Error updating entity:", error);
      setResponseMsg("Failed to update entity!");
      setVisibleFlag(true);
    } finally {
      setAdded(!Added);
      setTimeout(() => setResponseMsg(""), 5000);
    }
  };

  const deleteEntity = async () => {
    if (!codeValue) return;
    try {
      await axios.delete(`${server}/entity-manager`, {
        params: { code: codeValue, entityType: selectedOption },
      });
      setShowDelCol(true);
      setResponseMsg("Deleted");
      setVisibleFlag(true);
      reset();
      setSelectedEntity(null);
      setMatchedEntity(null);
    } catch (error) {
      console.error("Error deleting entity:", error);
      setResponseMsg("Failed to delete entity!");
      setVisibleFlag(true);
    } finally {
      setAdded(!Added);
      setTimeout(() => setResponseMsg(""), 5000);
    }
  };

  const columns = useMemo(() => {
    const columnMapping = {
      Country: [
        { key: "code", label: "Country Code" },
        { key: "name", label: "Country Name" },
      ],
      State: [
        { key: "code", label: "State Code" },
        { key: "name", label: "State Name" },
      ],
      City: [
        { key: "code", label: "City Code" },
        { key: "name", label: "City Name" },
      ],
      Sector: [
        { key: "code", label: "Sector Code" },
        { key: "name", label: "Sector Name" },
      ],
      Event: [
        { key: "code", label: "Event Code" },
        { key: "name", label: "Event Name" },
      ],
      Currency: [
        { key: "code", label: "Currency Code" },
        { key: "name", label: "Currency Name" },
      ],
      Network: [
        { key: "code", label: "Network Code" },
        { key: "name", label: "Network Name" },
      ],
      Service: [
        { key: "code", label: "Service Code" },
        { key: "name", label: "Service Name" },
        { key: "sector", label: "Sector" },
      ],
      Tax: [
        { key: "code", label: "Tax Code" },
        { key: "name", label: "Tax Name" },
      ],
      Hub: [
        { key: "code", label: "Hub Code" },
        { key: "name", label: "Hub Name" },
      ],
      "Sale Type": [
        { key: "code", label: "Sale Type Code" },
        { key: "name", label: "Sale Type Name" },
      ],
      "Misc Charges": [
        { key: "code", label: "Charge Code" },
        { key: "name", label: "Charge Name" },
        { key: "hsn", label: "HSN No." },
        { key: "taxCharges", label: "Tax Charges" },
        { key: "fuelCharges", label: "Fuel Charges" },
      ],
      "Counter Part": [
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
      ],
    };
    return columnMapping[selectedOption] || [];
  }, [selectedOption, Added, refreshKey]);

  const handleBulkUploadBtnClick = () => {
    if (!selectedOption) {
      alert("Please select an entity type before uploading.");
      return;
    }
    setShowUploadModal(true);
    fileInputRef.current?.click();
  };

  const handleBulkFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const rawPayload = jsonData.map((entry) => ({
        ...entry,
        entityType: selectedOption,
      }));

      const seen = new Set();
      const uniquePayload = rawPayload.filter((item) => {
        const codeStr = String(item.code || "")
          .trim()
          .toLowerCase();
        if (!codeStr) return false;
        if (seen.has(codeStr)) return false;
        seen.add(codeStr);
        return true;
      });

      const dbCodes = new Set(
        data.map((d) =>
          String(d.code || "")
            .trim()
            .toLowerCase(),
        ),
      );
      const finalPayload = uniquePayload.filter(
        (item) =>
          !dbCodes.has(
            String(item.code || "")
              .trim()
              .toLowerCase(),
          ),
      );

      if (finalPayload.length === 0) {
        setResponseMsg("No new entries found (all duplicates).");
        return;
      }

      try {
        await axios.post(`${server}/entity-manager/bulk`, finalPayload, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        setResponseMsg(
          `${finalPayload.length} entries uploaded successfully! (duplicates ignored)`,
        );
        setAdded(!Added);
      } catch (err) {
        console.error("Bulk upload failed", err);
        setResponseMsg("Bulk upload failed!");
      } finally {
        setTimeout(() => setResponseMsg(""), 5000);
        e.target.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const openCodeList = () => {
    if (!selectedOption) return;

    setCodeListConfig({
      data,
      columns,
      name: selectedOption,
      handleAction,
    });

    setToggleCodeList(true);
  };

  // Keep CodeList Config in sync if it's already open
  useEffect(() => {
    if (toggleCodeList && selectedOption) {
      setCodeListConfig({
        data,
        columns,
        name: selectedOption,
        handleAction,
      });
    }
  }, [
    data,
    columns,
    selectedOption,
    handleAction,
    toggleCodeList,
    setCodeListConfig,
  ]);

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      autoComplete="off"
      className="flex flex-col gap-5"
      key={refreshKey}
    >
      <Heading
        title="Entity Manager"
        disabled={selectedOption === null}
        onRefresh={handleRefresh} // Added refresh handler
        bulkUploadBtn="cursor-pointer"
        onClickBulkUploadBtn={handleBulkUploadBtnClick}
        onClickCodeList={openCodeList}
      />

      <div className="flex justify-between items-center">
        <div className="w-[255px]">
          <Dropdown
            options={[
              "Country",
              "State",
              "City",
              "Sector",
              "Hub",
              "Event",
              "Currency",
              "Network",
              "Service",
              "Tax",
              "Sale Type",
              "Misc Charges",
              "Counter Part",
            ]}
            register={register}
            setValue={(name, value) => {
              setValue(name, value);
              setSelectedOption(value);
            }}
            value="entityType"
            title="Choose Entity"
          />
        </div>
        <div className="flex gap-3">
          <AddButton
            onClick={handleSubmit(addEntity)}
            disabled={addButton || updateButton}
          />

          <EditButton
            onClick={handleSubmit(updateEntity)}
            disabled={!updateButton}
          />

          <div className="flex gap-3 relative">
            <DeleteButton
              onClick={() => setShowConfirmModal(true)}
              disabled={!deleteButton}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <InputBox
          placeholder="Code"
          register={register}
          setValue={setValue}
          value="code"
          initialValue={selectedEntity?.code || ""}
          resetFactor={Added}
          reset={reset}
          error={errors.code}
          trigger={trigger}
          validation={{
            required: "Code is required",
            minLength: { value: 2, message: "Minimum 3 characters required" },
          }}
        />
        <InputBox
          placeholder="Name"
          register={register}
          setValue={setValue}
          value="name"
          initialValue={selectedEntity?.name || matchedEntity?.name || ""}
          resetFactor={Added}
          error={errors.name}
          trigger={trigger}
          // validation={{
          //   required: "Name is required",
          //   minLength: { value: 3, message: "Minimum 3 characters required" },
          // }}
        />
        <ExtraFields
          selectedField={selectedEntity}
          selectedEntity={selectedOption}
          register={register}
          setValue={setValue}
          control={control}
          Added={Added}
          errors={errors}
          setCurrentView={setCurrentView}
          matchedEntity={matchedEntity}
          sectors={sectors}
          refreshKey={refreshKey}
        />

        <NotificationFlag
          message={responseMsg}
          visible={visibleFlag}
          setVisible={setVisibleFlag}
        />
      </div>

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onFileChange={handleBulkFileChange}
          setVisible={setVisibleFlag}
          entityType={selectedOption}
        />
      )}

      {showListDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black bg-opacity-30">
          <ConfirmModal
            isOpen={showListDeleteModal}
            onClose={() => {
              setShowListDeleteModal(false);
              setItemToDelete(null);
            }}
            onConfirm={confirmDeleteFromList}
            title="Delete Entity"
            message={`Are you sure you want to delete ${itemToDelete?.name || "this entity"}?`}
            confirmLabel="Delete"
          />
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={deleteEntity}
        title="Delete Entity"
        message={`Are you sure you want to delete ${nameValue || "this entity"}?`}
        confirmLabel="Delete"
      />
    </form>
  );
}

function ExtraFields({
  selectedEntity,
  register,
  setValue,
  control,
  Added,
  selectedField,
  errors,
  setCurrentView,
  matchedEntity,
  sectors,
  refreshKey,
}) {
  const [activeOnPortal, setActiveOnPortal] = useState(false);
  const [activeOnSoftware, setActiveOnSoftware] = useState(false);
  const [taxCharges, setTaxCharges] = useState(false);
  const [fuelCharges, setFuelCharges] = useState(false);

  // Watch the form values to sync with checkboxes
  const activeOnPortalWatch = useWatch({ control, name: "activeOnPortal" });
  const activeOnSoftwareWatch = useWatch({ control, name: "activeOnSoftware" });
  const taxChargesWatch = useWatch({ control, name: "taxCharges" });
  const fuelChargesWatch = useWatch({ control, name: "fuelCharges" });

  // Update checkbox states when matchedEntity or selectedField changes
  useEffect(() => {
    const data = matchedEntity;

    if (data && selectedEntity === "Service") {
      const portalValue = Boolean(data.activeOnPortal);
      const softwareValue = Boolean(data.activeOnSoftware);

      // console.log(matchedEntity)

      setActiveOnPortal(portalValue);
      setActiveOnSoftware(softwareValue);
      setValue("activeOnPortal", portalValue);
      setValue("activeOnSoftware", softwareValue);
      setValue("sector", data.sector || "");
    }

    if (data && selectedEntity === "Misc Charges") {
      const taxValue = Boolean(data.taxCharges);
      const fuelValue = Boolean(data.fuelCharges);

      setTaxCharges(taxValue);
      setFuelCharges(fuelValue);
      setValue("taxCharges", taxValue);
      setValue("fuelCharges", fuelValue);
      setValue("hsn", data.hsn || "");
    }
  }, [selectedField, matchedEntity, selectedEntity, setValue, refreshKey]);

  // Sync checkbox UI with form values
  useEffect(() => {
    if (selectedEntity === "Service") {
      setActiveOnPortal(Boolean(activeOnPortalWatch));
      setActiveOnSoftware(Boolean(activeOnSoftwareWatch));
      // console.log(selectedEntity)
    }
  }, [activeOnPortalWatch, activeOnSoftwareWatch, selectedEntity, refreshKey]);

  useEffect(() => {
    if (selectedEntity === "Misc Charges") {
      setTaxCharges(Boolean(taxChargesWatch));
      setFuelCharges(Boolean(fuelChargesWatch));
    }
  }, [taxChargesWatch, fuelChargesWatch, selectedEntity, refreshKey]);

  // Reset checkboxes when form is reset
  useEffect(() => {
    setActiveOnPortal(false);
    setActiveOnSoftware(false);
    setTaxCharges(false);
    setFuelCharges(false);
    setValue("activeOnPortal", false);
    setValue("activeOnSoftware", false);
    setValue("taxCharges", false);
    setValue("fuelCharges", false);
    setValue("sector", "");
  }, [Added, setValue, refreshKey]);

  switch (selectedEntity) {
    case "Service":
      return (
        <div className="flex flex-col gap-3">
          <LabeledDropdown
            options={sectors.map((sector) => sector.name)}
            register={register}
            setValue={setValue}
            value="sector"
            title="Choose Sector"
            resetFactor={Added}
            defaultValue={selectedField?.sector || matchedEntity?.sector || ""}
          />
          <div className="flex justify-between">
            <div className="flex gap-4">
              <div className="flex gap-5 items-center">
                <span>Activate on Portal</span>
                <Checkbox
                  isChecked={activeOnPortal}
                  setChecked={(val) => {
                    setActiveOnPortal(val);
                    setValue("activeOnPortal", val);
                  }}
                  id="activeOnPortal"
                  register={register}
                  setValue={setValue}
                />
              </div>
              <div className="flex gap-5 items-center">
                <span>Activate on Software</span>
                <Checkbox
                  isChecked={activeOnSoftware}
                  setChecked={(val) => {
                    setActiveOnSoftware(val);
                    setValue("activeOnSoftware", val);
                  }}
                  id="activeOnSoftware"
                  register={register}
                  setValue={setValue}
                />
              </div>
            </div>
            <div>
              <SimpleButton
                name={"Advance Settings"}
                onClick={() => setCurrentView("service")}
              />
            </div>
          </div>
        </div>
      );
    case "Tax":
      return (
        <div className="flex justify-end">
          <OutlinedButtonWithRightImage
            label="Manage Tax Settings"
            icon="/goto.svg"
          />
        </div>
      );
    case "Misc Charges":
      return (
        <div className="flex flex-col gap-3">
          <InputBox
            placeholder="HSN"
            register={register}
            setValue={setValue}
            value="hsn"
            initialValue={selectedField?.hsn || matchedEntity?.hsn || ""}
            resetFactor={Added}
            error={errors?.hsn}
            validation={{ required: "HSN is required" }}
          />
          <div className="flex gap-11">
            <div className="flex gap-5 items-center">
              <span>Tax Charges</span>
              <Checkbox
                id="taxCharges"
                isChecked={taxCharges}
                setChecked={(val) => {
                  setTaxCharges(val);
                  setValue("taxCharges", val);
                }}
                register={register}
                setValue={setValue}
              />
            </div>
            <div className="flex gap-5 items-center">
              <span>Fuel Charges</span>
              <Checkbox
                id="fuelCharges"
                isChecked={fuelCharges}
                setChecked={(val) => {
                  setFuelCharges(val);
                  setValue("fuelCharges", val);
                }}
                register={register}
                setValue={setValue}
              />
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}
