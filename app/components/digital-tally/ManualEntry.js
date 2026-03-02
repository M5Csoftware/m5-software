"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { RedLabelHeading } from "../Heading";
import InputBox from "../InputBox";
import RedCheckbox from "../RedCheckBox";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import { LabeledDropdown } from "../Dropdown";
import { DummyInputBoxWithLabelDarkGray } from "../DummyInputBox";
import Table, { TableWithSorting } from "../Table";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { useAuth } from "@/app/Context/AuthContext";

const ManualEntry = ({ register, setValue, errors, trigger, watch }) => {
  const [hold, setHold] = useState(true);
  const [Portal, setPortal] = useState(true);
  const [WhatsApp, setWhatsApp] = useState("");
  const [EMail, setEMail] = useState(true);
  const [rowData, setRowData] = useState([]);
  const { server } = useContext(GlobalContext);
  const { user } = useAuth();
  const [hubList, setHubList] = useState([]);
  const [resetTally, setResetTally] = useState(false);

  useEffect(() => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-GB");
    const formattedTime = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setValue("statusDate", formattedDate);
    setValue("time", formattedTime);
  }, [setValue]);

  useEffect(() => {
    axios
      .get(`${server}/entity-manager`, { params: { entityType: "Hub" } })
      .then((res) => {
        console.log("Hub list data:", res.data);
        setHubList(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const holdReasons = [
    "Damaged Packaging - DPKG",
    "Leaking Content - LEAK",
    "Prohibited Item - PROH",
    "Broken Content - BROK",
    "Packaging Not Secure - PNS",
    "Item Missing - MISI",
    "Tampered Shipment - TAMP",
    "Incomplete Address - INA",
    "Incorrect Address - ICA",
    "Address Change Requested - ADD",
    "Address Not Found - ANF",
    "Wrong Pincode - WPIN",
    "Awaiting Flight - AFD",
    "Hub Delay - HUBD",
    "KYC Not Verified - KYC",
    "Invoice Missing - INV",
    "Content Declaration Needed - CDN",
    "Customs Docs Missing - CDM",
    "Prohibited Country - PRCN",
    "Routing Error - RERR",
    "Lithium Battery Hold - LITH",
    "Liquids Not Allowed - LIQ",
    "Jewellery Not Allowed - JEWL",
    "Perishables Not Allowed - PERI",
    "Restricted Electronics - RELE",
    "Leather Item Restriction - LTHR",
    "Custom Hold - CSTM",
    "Account Deactivated - AC",
    "Payment Pending - PAY",
    "Duplicate Shipment - DUP",
    "Manual Inspection Required - MANI",
    "System Flagged Hold - SYSF",
    "Transit Damage Suspected - TDS",
    "No One Available - NOA",
    "Delivery Rescheduled - DRS",
    "Customer Requested Hold - CRH",
    "Wrong Contact Number - WCN",
  ];

  const columns = [
    { key: "mawbNumber", label: "AWB No." },
    { key: "rcvDate", label: "Rcv Date" },
    { key: "actWgt", label: "Act Wgt " },
    { key: "volwgt", label: "Vol Wgt" },
    { key: "service", label: "Service" },
    { key: "status", label: "Status" },
    { key: "Hold Reason", label: "Hold Reason" },
  ];

  const handleAddRow = () => {
    const currentCode = watch("code");
    const currentClient = watch("client");

    console.log("🔍 Current code:", currentCode);
    console.log("🔍 Current client:", currentClient);

    const newRow = {
      mawbNumber: watch("mawbNumber") || "",
      rcvDate: watch("statusDate") || "",
      actWgt: watch("actualWeight") || "",
      volwgt: watch("volWeight") || "",
      service: watch("service") || "",
      status: hold ? "Hold" : "Active",
      "Hold Reason": hold ? watch("holdReason") || "" : "-",
      cdNumber: watch("cdNumber") || "",
      code: currentCode || "",
      client: currentClient || "",
      email: watch("email") || "",
      phoneNumber: watch("phoneNumber") || "",
    };

    console.log("✅ Row data:", newRow);

    setRowData((prev) => [...prev, newRow]);

    // Clear specified things on Add to Table
    [
      "mawbNumber",
      "actualWeight",
      "volWeight",
      "holdReason",
      "service",
      "code",
      "client",
      "email",
      "phoneNumber",
    ].forEach((field) => setValue(field, ""));

    setHold(false);
  };

  const code = watch("code");

  useEffect(() => {
    if (!code) return;

    const fetchCustomerDetails = async () => {
      try {
        const res = await axios.get(
          `${server}/customer-account?accountCode=${code}`,
        );
        const data = res.data;

        if (data) {
          setValue("client", data.name || "");
          setValue("email", data.email || "");
          setValue("phoneNumber", data.telNo || "");
        }
      } catch (error) {
        console.error("Failed to fetch customer:", error);
      }
    };

    fetchCustomerDetails();
  }, [watch("code")]);

  const handleSendMail = async () => {
    try {
      const selectedChannels = [];
      if (Portal) selectedChannels.push("Portal");
      if (WhatsApp) selectedChannels.push("WhatsApp");
      if (EMail) selectedChannels.push("EMail");

      const transformedTableData = rowData.map((row) => ({
        awbNo: row.mawbNumber || "",
        rcvDate: row.rcvDate || "",
        actWgt: row.actWgt || "",
        volwgt: row.volwgt || "",
        service: row.service || "",
        status: row.status || "",
        holdReason: row["Hold Reason"] || "-",
      }));

      const payload = {
        email: watch("email") || "",
        customerName: watch("client") || "",
        cdNumber: watch("cdNumber") || "",
        tableData: transformedTableData,
        channels: selectedChannels,
        phoneNumber: watch("phoneNumber") || "",
        hubName: watch("hubName") || "",
        holdReason: watch("holdReason") || "",
        remarks: watch("remarks") || "",
      };

      console.log("📧 Sending email with payload:", payload);

      const res = await axios.post(
        `${server}/digital-tally/send-email`,
        payload,
      );

      if (res.data.success) {
        alert("Alert sent successfully!");
        console.log("✅ Email sent:", res.data);
      } else {
        alert("Failed to send alert: " + (res.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("❌ Error sending alert:", error);
      console.error("Error response:", error.response?.data);
      alert(
        "Error sending alert: " +
          (error.response?.data?.message ||
            error.response?.data?.error ||
            error.message),
      );
    }
  };

  const handleSave = async () => {
    try {
      // ✅ Use user from AuthContext instead of localStorage
      const entryUser = user?.userId || "Unknown";
      const entryUserName = user?.userName || "Unknown";

      console.log("🔍 Current user:", { entryUser, entryUserName });

      console.log("🔍 Current form values:", {
        cdNumber: watch("cdNumber"),
        code: watch("code"),
        client: watch("client"),
        email: watch("email"),
        phoneNumber: watch("phoneNumber"),
        hubName: watch("hubName"),
        hubCode: watch("hubCode"),
      });

      console.log("📊 Current rowData:", rowData);

      const payload = {
        cdNumber: watch("cdNumber") || "",
        code: watch("code") || "",
        client: watch("client") || "",
        email: watch("email") || "",
        phoneNumber: watch("phoneNumber") || "",
        hubName: watch("hubName") || "",
        hubCode: watch("hubCode") || "",
        holdReason: watch("holdReason") || "",
        remarks: watch("remarks") || "",
        status: hold ? "Hold" : "Arrived at Hub",
        statusDate:
          watch("statusDate") || new Date().toLocaleDateString("en-GB"),
        time:
          watch("time") ||
          new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        inscanUser: entryUser, // ✅ Changed from entryUser to inscanUser
        inscanUserName: entryUserName, // ✅ Added inscanUserName
        tableData: rowData.map((row) => ({
          mawbNumber: row.mawbNumber,
          actWgt: Number(row.actWgt) || null,
          volwgt: Number(row.volwgt) || null,
          service: row.service,
          "Hold Reason": row["Hold Reason"] || null,
          cdNumber: row.cdNumber,
          client: row.client,
          code: row.code,
          email: row.email,
          phoneNumber: row.phoneNumber,
        })),
      };

      console.log(
        "📤 Final payload being sent:",
        JSON.stringify(payload, null, 2),
      );

      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${server}/digital-tally/manual-entry`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.status === 200) {
        alert("Saved successfully!");
        console.log("✅ Server response:", res.data);
        setRowData([]);
        setResetTally(!resetTally);
        // Clear form fields after save (except cdNumber)
        setValue("code", "");
        setValue("client", "");
        setValue("email", "");
        setValue("phoneNumber", "");
        setValue("remarks", "");
        setValue("mawbNumber", "");
        setValue("actualWeight", "");
        setValue("volWeight", "");
        setValue("service", "");
        setValue("holdReason", "");
      } else {
        alert("Failed to save");
      }
    } catch (error) {
      console.error("❌ Error saving:", error);
      console.error("Error response:", error.response?.data);
      alert(
        "Error saving data: " + (error.response?.data?.error || error.message),
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex w-full gap-4">
        <DummyInputBoxWithLabelDarkGray
          placeholder="--/--/--"
          label={`Status Date`}
          register={register}
          setValue={setValue}
          value={`statusDate`}
        />
        <DummyInputBoxWithLabelDarkGray
          placeholder="00:00"
          label={`Time`}
          register={register}
          setValue={setValue}
          value={`time`}
        />
        <DummyInputBoxWithLabelDarkGray
          placeholder="Hub Code"
          label="Location"
          register={register}
          setValue={setValue}
          value="hubCode"
          disabled
        />
        <LabeledDropdown
          options={hubList.map((hub) => hub.name)}
          register={register}
          setValue={(name, value) => {
            setValue(name, value);
            const hub = hubList.find(
              (h) => h.name.toLowerCase() === value.toLowerCase(),
            );
            setValue("hubCode", hub ? hub.code : "");
          }}
          value="hubName"
          title="Select Hub"
          selectedValue={watch("hubName") || ""}
        />
      </div>
      <div className="flex gap-6 w-full">
        <div className="flex flex-col gap-3 w-full">
          <div className="flex flex-col gap-4">
            <RedLabelHeading label={"Tally Details"} />
            <InputBox
              placeholder="CD Number*"
              register={register}
              setValue={setValue}
              value="cdNumber"
              error={errors.cdNumber}
              trigger={trigger}
              watch={watch}
              validation={{
                required: "CD Number is required",
                minLength: {
                  value: 2,
                  message: "Minimum 2 characters required",
                },
              }}
            />
            <InputBox
              placeholder="HAWB Number"
              register={register}
              setValue={setValue}
              value="mawbNumber"
              error={errors.mawbNumber}
              trigger={trigger}
              watch={watch}
              validation={{
                required: "MAWB Number is required",
                minLength: {
                  value: 2,
                  message: "Minimum 2 characters required",
                },
              }}
              resetFactor={resetTally}
            />
            <InputBox
              placeholder="Service"
              register={register}
              setValue={setValue}
              value="service"
              error={errors.service}
              trigger={trigger}
              watch={watch}
              validation={{
                required: "Service is required",
                minLength: {
                  value: 2,
                  message: "Minimum 2 characters required",
                },
              }}
              resetFactor={resetTally}
            />
          </div>

          <div className="w-full flex flex-col gap-3">
            <div className="flex flex-col gap-4">
              <RedLabelHeading label={"Tally Details"} />
              <InputBox
                placeholder="Actual Weight"
                register={register}
                setValue={setValue}
                value="actualWeight"
                error={errors.actualWeight}
                trigger={trigger}
                watch={watch}
                validation={{
                  required: "Actual weight is required",
                  min: { value: 1, message: "Weight must be at least 1" },
                }}
                resetFactor={resetTally}
              />
            </div>
            <InputBox
              placeholder="Vol. Weight"
              register={register}
              setValue={setValue}
              value="volWeight"
              error={errors.volWeight}
              trigger={trigger}
              watch={watch}
              validation={{
                required: "Volumetric weight is required",
                min: { value: 1, message: "Vol. Weight must be at least 1" },
              }}
              resetFactor={resetTally}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3 w-full">
              <RedCheckbox
                isChecked={hold}
                setChecked={setHold}
                id="hold"
                register={register}
                setValue={setValue}
                label={"Hold"}
              />
              <div className="w-full">
                <LabeledDropdown
                  options={holdReasons}
                  register={register}
                  setValue={setValue}
                  title={`Hold Reason`}
                  value={`holdReason`}
                  selectedValue={watch("holdReason") || ""}
                />
              </div>
            </div>
            <InputBox
              placeholder="Hold Reason"
              register={register}
              setValue={setValue}
              value="holdReason"
              error={errors.holdReason}
              trigger={trigger}
              watch={watch}
              validation={{
                required: "Hold Reason is required",
                minLength: {
                  value: 2,
                  message: "Minimum 2 characters required",
                },
              }}
              resetFactor={resetTally}
            />
          </div>
          <div>
            <SimpleButton name={"Add to table"} onClick={handleAddRow} />
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <div className="flex flex-col gap-4">
            <RedLabelHeading label={"Customer Details"} />
            <div className="flex gap-3">
              <div>
                <InputBox
                  placeholder="Code"
                  register={register}
                  setValue={setValue}
                  value="code"
                  error={errors.code}
                  trigger={trigger}
                  watch={watch}
                  validation={{
                    required: "Code is required",
                  }}
                  resetFactor={resetTally}
                />
              </div>
              <DummyInputBoxWithLabelDarkGray
                label="Client"
                register={register}
                setValue={setValue}
                value="client"
                error={errors.client}
                trigger={trigger}
                watch={watch}
                validation={{
                  required: "Client name is required",
                }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <DummyInputBoxWithLabelDarkGray
              label="E-mail"
              register={register}
              setValue={setValue}
              value="email"
              error={errors.email}
              trigger={trigger}
              watch={watch}
              validation={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              }}
            />
            <DummyInputBoxWithLabelDarkGray
              label="Phone Number"
              register={register}
              setValue={setValue}
              value="phoneNumber"
              error={errors.phoneNumber}
              trigger={trigger}
              watch={watch}
              validation={{
                required: "Phone number is required",
                minLength: {
                  value: 6,
                  message: "Phone number should be at least 6 digits",
                },
              }}
            />
          </div>

          <TableWithSorting
            register={register}
            setValue={setValue}
            name="manualEntry"
            columns={columns}
            rowData={rowData}
            className=" h-[250px]"
          />

          <div className="flex justify-between">
            <RedCheckbox
              isChecked={Portal}
              setChecked={setPortal}
              id="portal"
              register={register}
              setValue={setValue}
              label={"Portal"}
            />
            <RedCheckbox
              isChecked={WhatsApp}
              setChecked={setWhatsApp}
              id="whatsApp"
              register={register}
              setValue={setValue}
              label={"WhatsApp"}
            />
            <RedCheckbox
              isChecked={EMail}
              setChecked={setEMail}
              id="eMail"
              register={register}
              setValue={setValue}
              label={"EMail"}
            />
            <div className="">
              <div>
                <SimpleButton name={"Send Alert"} onClick={handleSendMail} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <InputBox
          placeholder="Remarks"
          register={register}
          setValue={setValue}
          value="remarks"
          error={errors.remarks}
          trigger={trigger}
          watch={watch}
          validation={{
            required: "Remarks are required",
          }}
          resetFactor={resetTally}
        />
        <div>
          <SimpleButton name={"Save"} onClick={handleSave} />
        </div>
      </div>

      <div className="flex flex-row-reverse gap-3">
        <div>{/* <OutlinedButtonRed label={"Close"} type="submit" /> */}</div>
      </div>
    </div>
  );
};

export default ManualEntry;
