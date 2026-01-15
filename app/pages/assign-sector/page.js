"use client";
import BulkUploadModal from "@/app/components/BulkUploadModal";
import { SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, {
  DisplayInput,
  SearchInputBox,
} from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import { GlobalContext } from "@/app/lib/GlobalContext";
import Image from "next/image";
import React, { useContext, useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";

const AssignSector = () => {
  const { setValue, register, watch } = useForm();
  const { server } = useContext(GlobalContext);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleString("default", { month: "long", year: "numeric" })
  );
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success", // "success" or "error"
    onRetry: null,
  });

  const showNotification = (message, type = "success", onRetry = null) => {
    setNotification({
      visible: true,
      message,
      type,
      onRetry,
    });
  };

  // refs to manage debounce / dedupe notifications / last successful id
  const debounceTimerRef = useRef(null);
  const lastSuccessIdRef = useRef(null); // id for which last fetch was successful
  const lastNotifRef = useRef(null); // last notification key so we don't spam same message

  // ADD THESE STATES
  const [csEmployees, setCsEmployees] = useState([]);
  const [ssEmployees, setSsEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectors, setSectors] = useState([]);
  const [assignedSectorsMap, setAssignedSectorsMap] = useState({});
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [demoRadio, setDemoRadio] = useState("CS");

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const res = await fetch(`${server}/entity-manager?entityType=Sector`);
        const data = await res.json();
        // adapt if your API structure differs
        setSectors(data.map((item) => item.name));
      } catch (err) {
        console.error("Failed to fetch sectors:", err);
        setSectors([]);
      }
    };
    fetchSectors();
  }, [server]);

  // FETCH EMPLOYEES (INSIDE useEffect)
  useEffect(() => {
    const fetchCsEmployees = async () => {
      try {
        const res = await fetch(
          `${server}/assign-sector?department=Customer Support`
        );
        const data = await res.json();

        const employeesWithSectors = await Promise.all(
          data.map(async (emp) => {
            try {
              const assignedRes = await fetch(
                `${server}/assign-sector?userId=${
                  emp.userId
                }&month=${encodeURIComponent(selectedMonth)}`
              );
              const assignedData = await assignedRes.json();
              return {
                ...emp,
                assignedSectors: assignedData?.assignedSectors || [],
              };
            } catch {
              return { ...emp, assignedSectors: [] };
            }
          })
        );

        setCsEmployees(employeesWithSectors);
      } catch (err) {
        console.error(err);
        setCsEmployees([]);
      }
    };

    const fetchSsEmployees = async () => {
      try {
        const res = await fetch(`${server}/assign-sector/ss`); // defaults to Sale Support
        const data = await res.json();

        const employeesWithSectors = await Promise.all(
          data.map(async (emp) => {
            try {
              const assignedRes = await fetch(
                `${server}/assign-sector?userId=${
                  emp.userId
                }&month=${encodeURIComponent(selectedMonth)}`
              );
              const assignedData = await assignedRes.json();
              return {
                ...emp,
                assignedSectors: assignedData?.assignedSectors || [],
              };
            } catch {
              return { ...emp, assignedSectors: [] };
            }
          })
        );

        setSsEmployees(employeesWithSectors);
      } catch (err) {
        console.error(err);
        setSsEmployees([]);
      }
    };

    if (demoRadio === "CS") fetchCsEmployees();
    else if (demoRadio === "SS") fetchSsEmployees();
  }, [server, selectedMonth, demoRadio]);

  // FILTERED LIST
  const filteredEmployees = (
    demoRadio === "CS" ? csEmployees : ssEmployees
  ).filter((emp) =>
    emp.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // helper that actually fetches employee by id and handles notifications
  const fetchEmployee = async (id) => {
    if (!id) return;

    if (
      lastSuccessIdRef.current?.id === id &&
      lastSuccessIdRef.current?.month === selectedMonth
    )
      return;

    try {
      const endpoint =
        demoRadio === "CS"
          ? `${server}/assign-sector?userId=${encodeURIComponent(
              id
            )}&month=${encodeURIComponent(selectedMonth)}`
          : `${server}/assign-sector/ss?userId=${encodeURIComponent(
              id
            )}&month=${encodeURIComponent(selectedMonth)}`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        showNotification("User not found.", "error");
        setValue("userNameSalePerson", "");
        return;
      }

      const data = await res.json();

      // Dynamic department check
      if (
        (demoRadio === "SS" && data.department !== "Sale Support") ||
        (demoRadio === "CS" && data.department !== "Customer Support")
      ) {
        showNotification(
          `Only ${
            demoRadio === "SS" ? "Sale Support" : "Customer Support"
          } Executives can be assigned sectors.`,
          "error"
        );
        setValue("userNameSalePerson", "");
        return;
      }

      setValue("userNameSalePerson", data.userName || "");
      setValue("assignedSectors", data.assignedSectors || []);
      setValue("remarks", data.remarks || "");
      lastSuccessIdRef.current = { id, month: selectedMonth };
    } catch (err) {
      console.error(err);
      showNotification("Error fetching employee.", "error");
      setValue("userNameSalePerson", "");
    }
  };

  // debounced fetch: only when userId length >= 8
  useEffect(() => {
    const userId = watch("userId")?.trim() || "";

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (!userId || userId.length < 8) {
      lastSuccessIdRef.current = null;
      setValue("userNameSalePerson", "");
      return;
    }

    debounceTimerRef.current = setTimeout(() => fetchEmployee(userId), 500);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [watch("userId"), selectedMonth]);

  useEffect(() => {
    const fetchSsEmployees = async () => {
      try {
        const res = await fetch(`${server}/assign-sector/ss`); // defaults to Sale Support
        const data = await res.json();

        const employeesWithSectors = await Promise.all(
          data.map(async (emp) => {
            try {
              const assignedRes = await fetch(
                `${server}/assign-sector?userId=${
                  emp.userId
                }&month=${encodeURIComponent(selectedMonth)}`
              );
              const assignedData = await assignedRes.json();
              return {
                ...emp,
                assignedSectors: assignedData?.assignedSectors || [],
              };
            } catch {
              return { ...emp, assignedSectors: [] };
            }
          })
        );

        setSsEmployees(employeesWithSectors);
      } catch (err) {
        console.error(err);
        setSsEmployees([]);
      }
    };

    if (demoRadio === "SS") fetchSsEmployees();
  }, [server, selectedMonth, demoRadio]);

  const handleSaveSector = async () => {
    const userId = watch("userId")?.trim();
    const userName = watch("userNameSalePerson")?.trim();
    const assignedSectors = watch("assignedSectors") || [];
    const remarks = watch("remarks")?.trim();

    if (!userId || !userName) {
      showNotification("Please select a valid Executive.", "error");
      return;
    }

    if (assignedSectors.length === 0) {
      showNotification("Please assign at least one sector.", "error");
      return;
    }

    const payload = {
      userId,
      userName,
      month: selectedMonth,
      sectors: assignedSectors,
      remarks,
    };

    try {
      // ✅ Use correct route depending on department type
      const endpoint =
        demoRadio === "CS"
          ? `${server}/assign-sector`
          : `${server}/assign-sector/ss`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification(data?.error || "Failed to save sectors.", "error");
        return;
      }

      showNotification("Sectors updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Server error while saving sectors.", "error");
    }
  };

  const currentMonth = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const isDisabled = selectedMonth !== currentMonth;

  useEffect(() => {
    register("assignedSectors"); // register it with react-hook-form
  }, [register]);

  // refetch when month changes (if userId already filled)
  useEffect(() => {
    const userId = watch("userId")?.trim();
    if (userId && userId.length >= 8) {
      fetchEmployee(userId);
    }
  }, [selectedMonth]);

  const handleSectorAddition = (selected) => {
    const currentSectors = watch("assignedSectors") || [];
    if (!currentSectors.includes(selected)) {
      const updated = [...currentSectors, selected];
      setValue("assignedSectors", updated);
    }
  };

  const handleRefresh = async () => {
    // Reset last successful fetch and notifications
    lastSuccessIdRef.current = null;
    lastNotifRef.current = null;

    // Clear form fields
    setValue("userId", "");
    setValue("userNameSalePerson", "");
    setValue("assignedSectors", []);
    setValue("sector", "");
    setValue("remarks", "");

    // Optional: clear search term
    setSearchTerm("");
  };

  useEffect(() => {
    const map = {};
    const list = demoRadio === "CS" ? csEmployees : ssEmployees;
    list.forEach((emp) => {
      map[emp.userId] = emp.assignedSectors || [];
    });
    setAssignedSectorsMap(map);
  }, [csEmployees, ssEmployees, demoRadio]);

  const bulkUpload = async (file) => {
    try {
      if (!file) return;

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      const res = await fetch(`${server}/assign-sector/bulk-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream", // raw binary
        },
        body: arrayBuffer,
      });

      const data = await res.json();

      if (!res.ok) {
        // if validation fails, show row errors
        if (data.failedRows) {
          const errorText = data.failedRows
            .map((r) => `Row ${r.row}: ${r.error}`)
            .join("\n");
          showNotification(
            `Upload failed: please check sectors and try again!`,
            "error"
          );
          console.log(errorText);
        } else {
          showNotification(data?.error || "Upload failed", "error");
          console.log(data?.error);
        }
        return;
      }

      showNotification(data.message || "Bulk upload successful!", "success");

      // optional: refetch employees to update UI
      const refreshed = await fetch(`${server}/assign-sector`);
      const refreshedData = await refreshed.json();
      setEmployees(refreshedData);
    } catch (err) {
      console.error(err);
      showNotification(err.message || "Bulk upload failed", "error");
    }
  };

  const handleRadioChange = (value) => {
    setDemoRadio(value);
    let converted = "";
    if (value === "CS") converted = "CS";
    else if (value === "SS") converted = "SS";
  };

  return (
    <>
      <NotificationFlag
        visible={notification.visible}
        setVisible={(v) => setNotification((prev) => ({ ...prev, visible: v }))}
        type={notification.type}
        message={notification.message}
        onRetry={notification.onRetry}
      />
      <div>
        <Heading
          title={`Assign Sector`}
          codeListBtn="hidden"
          onRefresh={handleRefresh}
          onClickBulkUploadBtn={() => setIsUploadModalOpen(true)}
        />

        <div className="flex gap-3 mt-6">
          <RadioButtonLarge
            setValue={setValue}
            register={register}
            name={`CS`}
            id={`CS`}
            label={`CS Executives`}
            selectedValue={demoRadio}
            setSelectedValue={handleRadioChange}
          />
          <RadioButtonLarge
            setValue={setValue}
            register={register}
            name={`SS`}
            id={`SS`}
            label={`SS Executives`}
            selectedValue={demoRadio}
            setSelectedValue={handleRadioChange}
          />
        </div>

        {/* Customer Support */}
        {demoRadio === "CS" && (
          <div className="flex items-start gap-4 mt-6">
            {/* left side */}
            <div className="w-[300px] bg-white border-2 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <SearchInputBox
                  key="search-cs-executive"
                  placeholder="Search CS Executive"
                  name="searchCSExecutive"
                  register={register}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className=" space-y-1 h-[55vh] table-scrollbar overflow-y-auto">
                {filteredEmployees.map((emp) => {
                  const sectorCount =
                    assignedSectorsMap[emp.userId]?.length || 0; // get count

                  return (
                    <div
                      key={emp._id}
                      className="flex items-center justify-between px-8 p-3 border-b hover:bg-gray-50 rounded"
                    >
                      <span className="text-sm font-medium text-gray-800">
                        {emp.userId}
                      </span>
                      <span className="bg-[#EA1B4033] text-[#EA1B40] px-2 py-1 rounded text-xs font-medium">
                        {sectorCount} {/* show count here */}
                      </span>
                      <Image
                        src="/link.svg"
                        alt="Select"
                        width={12}
                        height={12}
                        className="cursor-pointer"
                        onClick={() => {
                          setValue("userId", emp.userId);
                          setValue("userNameSalePerson", emp.userName);

                          // optionally fetch employee to get latest assignedSectors
                          fetchEmployee(emp.userId);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* right side */}
            <div className="w-full flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <RedLabelHeading label={`Assign Sector`} />
                <div className="flex gap-1 text-center rounded">
                  <h2 className="text-[16px] font-semibold">Month :</h2>
                  <select
                    className="text-[16px] rounded bg-[#FFE5E9] text-red px-[10px] py-[2px] font-semibold"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {Array.from({ length: 12 }).map((_, i) => {
                      const d = new Date();
                      d.setMonth(d.getMonth() - i);
                      const monthStr = d.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      });
                      return (
                        <option
                          key={monthStr}
                          value={monthStr}
                          className="bg-gray-100 rounded-md text-eerie-black"
                        >
                          {monthStr}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <InputBox
                  placeholder="User ID (CS Executive)"
                  register={register}
                  setValue={setValue}
                  value="userId"
                  initialValue={watch("userId")}
                  onBlur={(e) => setValue("userId", e.target.value.trim())}
                  maxLength={8}
                />

                <DummyInputBoxWithLabelDarkGray
                  label="User Name (CS Executive)"
                  register={register}
                  setValue={setValue}
                  value="userNameSalePerson"
                />
                <LabeledDropdown
                  register={register}
                  setValue={setValue}
                  options={sectors}
                  value="sector" // this is temporary, only used to pick
                  title={`Select Sector`}
                  disabled={isDisabled}
                  onChange={handleSectorAddition}
                />
              </div>
              <DisplayInput
                label="Assigned Sectors"
                valueArray={watch("assignedSectors") || []}
                setValue={(val) => setValue("assignedSectors", val)}
                disabled={isDisabled}
              />

              <div className="flex gap-3">
                <InputBox
                  setValue={setValue}
                  register={register}
                  value={"remarks"}
                  placeholder={`Remarks`}
                  disabled={isDisabled}
                  initialValue={watch("remarks")}
                />
              </div>
              <div className="flex justify-end items-center">
                <div>
                  {" "}
                  <SimpleButton
                    name={`Save Sector`}
                    onClick={handleSaveSector}
                    disabled={isDisabled}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sale Support */}
        {demoRadio === "SS" && (
          <div className="flex items-start gap-4 mt-6">
            {/* left side */}
            <div className="w-[300px] bg-white border-2 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <SearchInputBox
                  key="search-ss-executive"
                  placeholder="Search SS Executive"
                  name="searchSSExecutive"
                  register={register}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className=" space-y-1 h-[55vh] table-scrollbar overflow-y-auto">
                {filteredEmployees.map((emp) => {
                  const sectorCount =
                    assignedSectorsMap[emp.userId]?.length || 0; // get count

                  return (
                    <div
                      key={emp._id}
                      className="flex items-center justify-between px-8 p-3 border-b hover:bg-gray-50 rounded"
                    >
                      <span className="text-sm font-medium text-gray-800">
                        {emp.userId}
                      </span>
                      <span className="bg-[#EA1B4033] text-[#EA1B40] px-2 py-1 rounded text-xs font-medium">
                        {sectorCount} {/* show count here */}
                      </span>
                      <Image
                        src="/link.svg"
                        alt="Select"
                        width={12}
                        height={12}
                        className="cursor-pointer"
                        onClick={() => {
                          setValue("userId", emp.userId);
                          setValue("userNameSalePerson", emp.userName);

                          // optionally fetch employee to get latest assignedSectors
                          fetchEmployee(emp.userId);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* right side */}
            <div className="w-full flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <RedLabelHeading label={`Assign Sector`} />
                <div className="flex gap-1 text-center rounded">
                  <h2 className="text-[16px] font-semibold">Month :</h2>
                  <select
                    className="text-[16px] rounded bg-[#FFE5E9] text-red px-[10px] py-[2px] font-semibold"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {Array.from({ length: 12 }).map((_, i) => {
                      const d = new Date();
                      d.setMonth(d.getMonth() - i);
                      const monthStr = d.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      });
                      return (
                        <option
                          key={monthStr}
                          value={monthStr}
                          className="bg-gray-100 rounded-md text-eerie-black"
                        >
                          {monthStr}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <InputBox
                  placeholder="User ID (SS Executive)"
                  register={register}
                  setValue={setValue}
                  value="userId"
                  initialValue={watch("userId")}
                  onBlur={(e) => setValue("userId", e.target.value.trim())}
                  maxLength={8}
                />

                <DummyInputBoxWithLabelDarkGray
                  label="User Name (SS Executive)"
                  register={register}
                  setValue={setValue}
                  value="userNameSalePerson"
                />
                <LabeledDropdown
                  register={register}
                  setValue={setValue}
                  options={sectors}
                  value="sector" // this is temporary, only used to pick
                  title={`Select Sector`}
                  disabled={isDisabled}
                  onChange={handleSectorAddition}
                />
              </div>
              <DisplayInput
                label="Assigned Sectors"
                valueArray={watch("assignedSectors") || []}
                setValue={(val) => setValue("assignedSectors", val)}
                disabled={isDisabled}
              />

              <div className="flex gap-3">
                <InputBox
                  setValue={setValue}
                  register={register}
                  value={"remarks"}
                  placeholder={`Remarks`}
                  disabled={isDisabled}
                  initialValue={watch("remarks")}
                />
              </div>
              <div className="flex justify-end items-center">
                <div>
                  {" "}
                  <SimpleButton
                    name={`Save Sector`}
                    onClick={handleSaveSector}
                    disabled={isDisabled}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {isUploadModalOpen && (
          <BulkUploadModal
            onClose={() => setIsUploadModalOpen(false)}
            setVisible={setIsUploadModalOpen} // optional
            sampleFileLink="/Sample-Data.xlsx"
            onFileUpload={bulkUpload}
          />
        )}
      </div>
    </>
  );
};

export default AssignSector;
