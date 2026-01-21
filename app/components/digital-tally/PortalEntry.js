"use client";
import React, { useEffect, useState, useContext } from "react";
import { RedLabelHeading } from "../Heading";
import InputBox from "../InputBox";
import { DummyInputBoxWithLabelDarkGray } from "../DummyInputBox";
import RedCheckbox from "../RedCheckBox";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import axios from "axios";
import { TableWithSorting } from "../Table";
import { LabeledDropdown } from "../Dropdown";
import Image from "next/image";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "../Notificationflag";
import { useAuth } from "@/app/Context/AuthContext";
import pushHoldLog from "@/app/lib/pushHoldLog";
import pushAWBLog from "@/app/lib/pushAWBLog";

const PortalEntry = ({ register, setValue, watch, trigger, errors }) => {
  const { user } = useAuth();
  const [hold, setHold] = useState(false);
  const [portal, setPortal] = useState(true);
  const [whatsApp, setWhatsApp] = useState(false);
  const [eMail, setEMail] = useState(true);
  const [holdReasons, setHoldReasons] = useState([]);
  const [boxOptions, setBoxOptions] = useState([]);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(0);
  const [rowData, setRowData] = useState([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const { server } = useContext(GlobalContext);
  const [selectedTally, setSelectedTally] = useState(null);
  const [consigneeDetails, setConsigneeDetails] = useState("");
  const [consignorDetails, setConsignorDetails] = useState("");
  const [calculatedVolWeight, setCalculatedVolWeight] = useState("");
  const [mawbOptions, setMawbOptions] = useState([]);
  const [hubList, setHubList] = useState([]);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  useEffect(() => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-GB"); // DD/MM/YYYY
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

  const mawbNumber = watch("mawbNumber");
  const actualWeight = watch("actualWeight");
  const length = watch("length");
  const breadth = watch("breadth");
  const height = watch("height");
  const manifestNumber = watch("manifestNumber");

  useEffect(() => {
    const fetchManifestNumbers = async () => {
      try {
        const res = await axios.get(
          `${server}/portal/manifest?manifestNumber=${manifestNumber}`
        );
        const data = res.data;

        console.log("Fetched manifest numbers:", data.manifest.awbNumbers);

        setMawbOptions(data.manifest.awbNumbers || []);
      } catch (error) {
        console.error("Failed to fetch manifest numbers:", error);
      }
    };

    if (manifestNumber) {
      fetchManifestNumbers();
    }
  }, [manifestNumber, server]);

  const fetchPortalData = async () => {
    if (!mawbNumber) return;

    try {
      const res = await axios.get(
        `${server}/portal/get-shipments?awbNo=${mawbNumber}`
      );
      const data = res.data.shipment;
      const boxes = data.boxes || [];
      setBoxOptions(boxes);

      if (boxes.length > 0) {
        setSelectedBoxIndex(0);
        applyBoxData(boxes[0]);
      }
    } catch (err) {
      console.error("Portal data fetch failed:", err);
    }
  };

  const fetchShipmentData = async () => {
    if (!mawbNumber) return;

    try {
      const res = await axios.get(
        `${server}/portal/get-shipments?awbNo=${mawbNumber}`
      );

      const data = res.data.shipment;

      setSelectedTally(data);
      console.log("Shipment data:", data);

      if (mawbNumber === data.awbNo) {
        setValue("code", data.accountCode);
        setValue("client", data.receiverFullName);
        setValue("phoneNumber", data.receiverPhoneNumber);
        setValue("service", data.service);

        // Fetch email from customer-accounts based on accountCode
        if (data.accountCode) {
          try {
            const customerRes = await axios.get(
              `${server}/customer-account?accountCode=${data.accountCode}`
            );
            const customerEmail = customerRes.data.email || "";
            setValue("email", customerEmail);
          } catch (error) {
            console.error("Failed to fetch customer email:", error);
            setValue("email", "");
          }
        }

        const consigneeData = `
${data.receiverFullName || ""}
${data.receiverPhoneNumber || ""}, ${data.receiverEmail || ""}
${data.receiverAddressLine1 || ""}, ${data.receiverAddressLine2 || ""}
${data.receiverCity || ""}, ${data.receiverState || ""}, ${
          data.receiverCountry || ""
        } - ${data.receiverPincode || ""}
`.trim();

        const consignorData = `
${data.shipperFullName || ""}
${data.shipperPhoneNumber || ""}, ${data.shipperEmail || ""}
${data.shipperAddressLine1 || ""}, ${data.shipperAddressLine2 || ""}
${data.shipperCity || ""}, ${data.shipperState || ""}, ${
          data.shipperCountry || ""
        } - ${data.shipperPincode || ""}
`.trim();

        setConsigneeDetails(consigneeData);
        setConsignorDetails(consignorData);

        setValue("ConsigneeDetails", consigneeData);
        setValue("ConsignorDetails", consignorData);
      } else {
        console.warn("MAWB number mismatch:", mawbNumber, data.awbNo);
      }
    } catch (err) {
      console.error("Shipment data fetch failed:", err);
    }
  };

  const applyBoxData = (box) => {
    if (!box) return;

    setValue("portalActualWeight", box.actualWt || "");
    setValue("portalLength", box.length || "");
    setValue("portalBreadth", box.width || "");
    setValue("portalHeight", box.height || "");
    setValue("portalVolWeight", box.volumeWeight || "");

    compareValues(box);
  };

  // const compareValues = (portalData) => {
  //   const reasons = [];
  //   const calculatedVolWeightData = (
  //     (Number(length) * Number(breadth) * Number(height)) /
  //     5000
  //   ).toFixed(2);
  //   setCalculatedVolWeight(calculatedVolWeightData);
  //   setValue("volWeight", calculatedVolWeightData);

  //   if (Number(actualWeight) !== Number(portalData.totalWeight))
  //     reasons.push("Actual Weight Mismatch");
  //   if (Number(length) !== Number(portalData.length))
  //     reasons.push("Length Mismatch");
  //   if (Number(breadth) !== Number(portalData.width))
  //     reasons.push("Breadth Mismatch");
  //   if (Number(height) !== Number(portalData.height))
  //     reasons.push("Height Mismatch");

  //   const epsilon = 0.01;
  //   if (
  //     Math.abs(
  //       Number(calculatedVolWeight) - Number(portalData.volumetricWeight)
  //     ) > epsilon
  //   ) {
  //     reasons.push("Vol. Weight Mismatch");
  //   }

  //   setHold(reasons.length > 0);
  //   setHoldReasons(reasons);
  //   setValue("holdReason", reasons.join(", "));
  // };

  const compareValues = (portalData) => {
    if (!actualWeight || !length || !breadth || !height) {
      setHold(false);
      setHoldReasons([]);
      setValue("holdReason", "");
      return;
    }

    const calculatedVolWeightData = (
      (Number(length) * Number(breadth) * Number(height)) /
      5000
    ).toFixed(2);

    setCalculatedVolWeight(calculatedVolWeightData);
    setValue("volWeight", calculatedVolWeightData);

    const reasons = [];
    const epsilon = 0.01;

    if (portalData) {
      if (Number(actualWeight) !== Number(portalData.actualWt || 0)) {
        reasons.push("Actual Weight Mismatch");
      }
      const epsilon = 0.01;
      const portalVol = Number(portalData.volumeWeight || 0);
      if (Math.abs(Number(calculatedVolWeightData) - portalVol) > epsilon) {
        reasons.push("Vol. Weight Mismatch");
      }
    }

    setHold(reasons.length > 0);
    setHoldReasons(reasons);
    setValue("holdReason", reasons.join(", "));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (boxOptions[selectedBoxIndex]) {
        compareValues(boxOptions[selectedBoxIndex]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [actualWeight, length, breadth, height]);

  // const handleAddToTable = () => {
  //   const newRow = {
  //     awbNo: mawbNumber,
  //     rcvDate: new Date().toLocaleDateString("en-GB"),
  //     actWgt: actualWeight,
  //     volwgt: watch("volWeight"),
  //     service: watch("service"),
  //     status: hold ? "Hold" : "Matched",
  //     "Hold Reason": holdReasons.join(", "),
  //   };
  //   setRowData((prev) => [...prev, newRow]);
  // };
  const handleAddToTable = () => {
    // ✅ FIX: Determine correct status for table display
    const shouldHold = hold && holdReasons.length > 0;
    const status = shouldHold ? "Hold" : "Arrived at Origin Gateway Hub";

    const newRow = {
      awbNo: mawbNumber,
      rcvDate: new Date().toLocaleDateString("en-GB"),
      actWgt: actualWeight,
      volwgt: watch("volWeight"),
      service: watch("service"),
      status: status, // ✅ Use the corrected status
      "Hold Reason": shouldHold ? holdReasons.join(", ") : "-",
    };
    setRowData((prev) => [...prev, newRow]);
  };

  const handleSendEmail = async () => {
    // Validate email checkbox
    if (!eMail) {
      console.log("Please enable Email checkbox to send email");
      return;
    }

    // Validate table data
    if (rowData.length === 0) {
      console.log("Please add data to the table before sending email");
      return;
    }

    const customerEmail = watch("email");
    const customerName = watch("client");
    const cdNumber = watch("manifestNumber");

    // Validate email
    if (!customerEmail) {
      showNotification("error", "Customer email is required");
      return;
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      showNotification("error", "Please enter a valid email address");
      return;
    }

    setIsSendingEmail(true);

    try {
      const response = await axios.post(`${server}/digital-tally/send-email`, {
        email: customerEmail,
        customerName: customerName || "Customer",
        cdNumber: cdNumber || "N/A",
        tableData: rowData,
      });

      if (response.data.success) {
        showNotification("success", "Email sent successfully!");
        console.log("Email sent:", response.data);
      } else {
        showNotification(
          "error",
          "Failed to send email: " + (response.data.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Email sending failed:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      showNotification("error", "Failed to send email. " + errorMessage);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSave = async () => {
    try {
      // ✅ Get both userId and userName from AuthContext
      const entryUser = user?.userId || "Unknown";
      const entryUserName = user?.userName || "Unknown";

      console.log("Entry User:", { entryUser, entryUserName, user });

      // ✅ Validate required fields
      if (!watch("manifestNumber")) {
        showNotification("error", "Manifest Number is required");
        return;
      }

      if (rowData.length === 0) {
        showNotification("error", "Please add at least one entry to the table");
        return;
      }

      // ✅ Use first AWB number as per requirement
      const firstAwb = rowData[0]?.awbNo || "";

      // ✅ Determine correct status
      const status =
        hold && holdReasons.length > 0
          ? "Hold"
          : "Arrived at Origin Gateway Hub";

      // ✅ Build payload
      const payload = {
        entryType: "Portal",
        manifestNumber: watch("manifestNumber") || "",
        mawbNumber: firstAwb, // must be string
        code: watch("code") || "",
        client: watch("client") || "",
        email: watch("email") || "",
        phoneNumber: watch("phoneNumber") || "",
        service: watch("service") || "",
        hubName: watch("hubName") || "",
        hubCode: watch("hubCode") || "",
        statusDate:
          watch("statusDate") || new Date().toLocaleDateString("en-GB"), // DD/MM/YYYY
        time:
          watch("time") ||
          new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        remarks: watch("remarks") || "",
        status: status, // ✅ Use correct status
        hold: !!hold,
        holdReason: holdReasons.length ? holdReasons.join(", ") : "",
        actualWeight: watch("actualWeight") || null,
        length: watch("length") || null,
        breadth: watch("breadth") || null,
        height: watch("height") || null,
        volWeight: watch("volWeight") || null,
        portalActualWeight: watch("portalActualWeight") || null,
        portalLength: watch("portalLength") || null,
        portalBreadth: watch("portalBreadth") || null,
        portalHeight: watch("portalHeight") || null,
        portalVolWeight: watch("portalVolWeight") || null,
        consigneeDetails: watch("ConsigneeDetails") || "",
        consignorDetails: watch("ConsignorDetails") || "",
        baggingTable: rowData, // all AWBs included here
        inscanUser: entryUser, // ✅ Send inscanUser
        inscanUserName: entryUserName, // ✅ Send inscanUserName
      };

      console.log("Payload:", JSON.stringify(payload, null, 2));

      const token = localStorage.getItem("token");
      if (!token) {
        showNotification("error", "User authentication token missing!");
        return;
      }

      // ✅ Send payload to API
      const res = await axios.post(`${server}/digital-tally`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Response received:", res);

      if (res.status === 200 || res.status === 201) {
        showNotification("success", "Portal entry saved successfully! ✅");
        console.log("✅ Response:", res.data);

        // ✅ SAVE TO EVENT ACTIVITY FOR EACH AWB IN ROWDATA
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString("en-GB");
        const formattedTime = currentDate.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Save EventActivity for each AWB in the table
        for (const row of rowData) {
          if (row.awbNo) {
            const eventCode = "OGH";
            const eventLocation = payload.hubName || "Unknown Hub";

            console.log("📝 Saving to EventActivity:", {
              awbNo: row.awbNo,
              eventCode,
              status: status,
              eventLocation,
              entryUser,
            });

            try {
              // Save EventActivity for this AWB
              const eventActivityPayload = {
                awbNo: row.awbNo,
                eventCode: eventCode,
                status: status,
                eventDate: currentDate.toISOString(),
                eventTime: formattedTime,
                eventUser: entryUser,
                eventLocation: eventLocation,
                eventLogTime: currentDate.toISOString(),
                remark: payload.remarks || null,
                receiverName: payload.client || null,
              };

              const eventRes = await axios.post(
                `${server}/event-activity`,
                eventActivityPayload,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              console.log(
                "✅ EventActivity saved for AWB:",
                row.awbNo,
                eventRes.data
              );
            } catch (eventError) {
              console.error(
                "❌ Failed to save EventActivity for AWB:",
                row.awbNo,
                eventError
              );
              // Continue with other AWBs even if one fails
            }
          }
        }

        // ✅ Reset form after save
        setRowData([]);
        setHoldReasons([]);
        setHold(false);
        [
          "manifestNumber",
          "mawbNumber",
          "actualWeight",
          "length",
          "breadth",
          "height",
          "volWeight",
          "remarks",
        ].forEach((field) => setValue(field, ""));
        setSelectedTally(null);
        setConsigneeDetails("");
        setConsignorDetails("");
      }

      // ✅ Extract response safely
      const responseData = res.data || {};
      const accountCode = responseData.code || payload.code;

      console.log("Response Data for logs:", responseData);
      console.log("Account Code for logs:", accountCode);

      // ✅ Helper: Get customer name
      const getCustomerName = async (accountCode) => {
        if (!accountCode) return "";
        try {
          const customerResponse = await axios.get(
            `${server}/customer-account?accountCode=${accountCode}`
          );
          return customerResponse.data?.name || "";
        } catch (err) {
          console.warn("Failed to fetch customer name:", err);
          return "";
        }
      };

      // ✅ Log AWB activity only for successful new creation (201)
      if (res.status === 200 || res.status === 201) {
        const customer = await getCustomerName(accountCode);
        const awbNo = responseData.awbNo || firstAwb;

        // ✅ Push AWB log
        const awbLogPayload = {
          awbNo,
          accountCode,
          customer,
          action: "Digital Tally",
          actionUser: user?.userId || "System",
        };

        console.log("AWB log payload:", awbLogPayload);
        const awbLogResponse = await pushAWBLog(awbLogPayload);
        console.log("AWB log response:", awbLogResponse);

        // ✅ Push hold log (only if hold reason exists)
        if (payload.hold && payload.holdReason) {
          const holdLogPayload = {
            awbNo,
            accountCode,
            customer,
            action: "Hold",
            actionUser: user?.userId || "System",
            departmentName: user?.department || "Operations",
            holdReason: payload.holdReason || "Initial Creation",
          };

          const holdLogResponse = await pushHoldLog(holdLogPayload);
          console.log("Hold log response:", holdLogResponse);
        }
      }
    } catch (error) {
      console.error("❌ Error:", error);
      console.error("Error response:", error.response?.data);
      showNotification(
        "error",
        "Error: " + (error.response?.data?.details || error.message)
      );
    }
  };

  useEffect(() => {
    if (mawbNumber) {
      fetchPortalData();
      fetchShipmentData();
    }
  }, [mawbNumber]);

  useEffect(() => {
    if (boxOptions[selectedBoxIndex]) {
      applyBoxData(boxOptions[selectedBoxIndex]);
    }
  }, [selectedBoxIndex]);

  const columns = [
    { key: "awbNo", label: "AWB No." },
    { key: "rcvDate", label: "Rcv Date" },
    { key: "actWgt", label: "Act Wgt " },
    { key: "volwgt", label: "Vol Wgt" },
    { key: "service", label: "Service" },
    { key: "status", label: "Status" },
    { key: "Hold Reason", label: "Hold Reason" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <div className="flex w-full gap-4">
        {" "}
        <div className="flex gap-4 w-1/2">
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
        </div>{" "}
        <div className="flex gap-4 w-1/2">
          <DummyInputBoxWithLabelDarkGray
            placeholder="Hub Code"
            label="Location"
            register={register}
            setValue={setValue}
            value="hubCode"
            disabled
          />
          <LabeledDropdown
            options={hubList.map((hub) => hub.name)} // show hub names
            register={register}
            setValue={(name, value) => {
              setValue(name, value);
              // find matching hub code
              const hub = hubList.find(
                (h) => h.name.toLowerCase() === value.toLowerCase()
              );
              setValue("hubCode", hub ? hub.code : "");
            }}
            value="hubName"
            title="Select Hub"
          />
        </div>
      </div>
      <div className="flex gap-6 w-full">
        <div className="flex flex-col gap-3 w-1/2">
          {/* MAWB + Box selector + Total boxes row */}
          <div className="flex gap-3 items-end">
            <div className="flex flex-col w-full gap-4">
              <RedLabelHeading label="Shipment Details" />
              <InputBox
                placeholder="Manifest Number"
                register={register}
                setValue={setValue}
                value="manifestNumber"
                error={errors.manifestNumber}
                initialValue={selectedTally?.manifestNumber || ""}
                trigger={trigger}
                watch={watch}
                validation={{
                  required: "Manifest Number is required",
                  minLength: {
                    value: 2,
                    message: "Minimum 2 characters required",
                  },
                }}
              />

              <LabeledDropdown
                options={mawbOptions}
                register={register}
                setValue={setValue}
                value="mawbNumber"
                title="HAWB Number"
                onChange={(value) => {
                  setValue("mawbNumber", value);
                  fetchPortalData(value);
                  fetchShipmentData(value);
                }}
              />

              <InputBox
                placeholder="Service"
                register={register}
                setValue={setValue}
                value="service"
                error={errors.service}
                initialValue={selectedTally?.service || ""}
                trigger={trigger}
                watch={watch}
                validation={{
                  required: "Service Number is required",
                  minLength: {
                    value: 3,
                    message: "Minimum 3 characters required",
                  },
                }}
              />

              <div className="flex justify-between gap-4 bg-white border rounded-lg">
                <button
                  className="px-2 py-1 disabled:opacity-50"
                  onClick={() =>
                    setSelectedBoxIndex((prev) => Math.max(prev - 1, 0))
                  }
                  disabled={selectedBoxIndex === 0}
                >
                  <Image
                    className="rotate-180"
                    src={`/arrow-right-gray.svg`}
                    height={24}
                    width={24}
                    alt="arrow"
                  />
                </button>
                <div className="flex font-semibold text-red px-2 items-center ">
                  Box: {selectedBoxIndex + 1}/{boxOptions.length}
                </div>
                <button
                  className="px-2 py-1 disabled:opacity-50"
                  onClick={() =>
                    setSelectedBoxIndex((prev) =>
                      Math.min(prev + 1, boxOptions.length - 1)
                    )
                  }
                  disabled={selectedBoxIndex === boxOptions.length - 1}
                >
                  <Image
                    src={`/arrow-right-gray.svg`}
                    height={24}
                    width={24}
                    alt="arrow"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Tally and Portal section */}
          <div className="flex gap-3">
            <div className="w-full flex flex-col gap-4">
              <RedLabelHeading label="Tally" />
              <InputBox
                placeholder="Actual Weight"
                register={register}
                setValue={setValue}
                value="actualWeight"
                error={errors.actualWeight}
                initialValue={selectedTally?.actualWeight || ""}
                trigger={trigger}
                watch={watch}
                validation={{
                  required: "Actual Weight is required",
                  min: {
                    value: 1,
                    message: "Weight must be at least 1",
                  },
                }}
              />

              <InputBox
                placeholder="Length"
                register={register}
                setValue={setValue}
                value="length"
                error={errors.length}
                initialValue={selectedTally?.length || ""}
                trigger={trigger}
                watch={watch}
                validation={{
                  required: "Length is required",
                  min: {
                    value: 1,
                    message: "Length must be at least 1",
                  },
                }}
              />

              <InputBox
                placeholder="Breadth"
                register={register}
                setValue={setValue}
                value="breadth"
                error={errors.breadth}
                initialValue={selectedTally?.breadth || ""}
                trigger={trigger}
                watch={watch}
                validation={{
                  required: "Breadth is required",
                  min: {
                    value: 1,
                    message: "Breadth must be at least 1",
                  },
                }}
              />

              <InputBox
                placeholder="Height"
                register={register}
                setValue={setValue}
                value="height"
                error={errors.height}
                initialValue={selectedTally?.height || ""}
                trigger={trigger}
                watch={watch}
                validation={{
                  required: "Height is required",
                  min: {
                    value: 1,
                    message: "Height must be at least 1",
                  },
                }}
              />

              <DummyInputBoxWithLabelDarkGray
                label="Vol. Weight"
                register={register}
                setValue={setValue}
                initialValue={calculatedVolWeight || ""}
                value="volWeight"
              />
            </div>

            <div className="w-full flex flex-col gap-4">
              <RedLabelHeading label="Portal" />
              <DummyInputBoxWithLabelDarkGray
                label="Actual Weight"
                register={register}
                setValue={setValue}
                initialValue={selectedTally?.portalActualWeight || ""}
                value="portalActualWeight"
              />
              <DummyInputBoxWithLabelDarkGray
                label="Length"
                register={register}
                setValue={setValue}
                initialValue={selectedTally?.portalLength || ""}
                value="portalLength"
              />
              <DummyInputBoxWithLabelDarkGray
                label="Breadth"
                register={register}
                setValue={setValue}
                initialValue={selectedTally?.portalBreadth || ""}
                value="portalBreadth"
              />
              <DummyInputBoxWithLabelDarkGray
                label="Height"
                register={register}
                initialValue={selectedTally?.portalHeight || ""}
                setValue={setValue}
                value="portalHeight"
              />
              <DummyInputBoxWithLabelDarkGray
                label="Vol. Weight"
                register={register}
                setValue={setValue}
                initialValue={selectedTally?.portalVolWeight || ""}
                value="portalVolWeight"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-5">
              <RedCheckbox
                isChecked={hold}
                setChecked={setHold}
                id="hold"
                register={register}
                setValue={setValue}
                label="Hold"
              />

              <LabeledDropdown
                options={[
                  "Actual Weight Mismatch",
                  // "Length Mismatch",
                  // "Breadth Mismatch",
                  // "Height Mismatch",
                  "Vol. Weight Mismatch",
                  "Shipment & Packaging Issues",
                  "Overweight Item - OW",
                  "Damaged Packaging - DPKG",
                  "Leaking Content - LEAK",
                  "Prohibited Item - PROH",
                  "Broken Content - BROK",
                  "Packaging Not Secure - PNS",
                  "Item Missing - MISI",
                  "Address Issues",
                  "Incomplete Address - INA",
                  "Incorrect Address - ICA",
                  "Address Change Requested - ADD",
                  "Address Not Found - ANF",
                  "Wrong Pincode - WPIN",
                  "Transit & Hub Issues",
                  "Routing Error - RERR",
                  "Custom Hold - CSTM",
                  "Verification & Compliance",
                  "KYC Not Verified - KYC",
                  "Invoice Missing - INV",
                  "Content Declaration Needed - CDN",
                  "Customs Docs Missing - CDM",
                  "Prohibited Country - PRCN",
                  "Policy & Restrictions",
                  "Lithium Battery Hold - LITH",
                  "Liquids Not Allowed - LIQ",
                  "Jewellery Not Allowed - JEWL",
                  "Jewellery Bill Required - JEWB",
                  "Perishables Not Allowed - PERI",
                  "Restricted Electronics - RELE",
                  "Leather Item Restriction - LTHR",
                  "Internal & Operational",
                  "Account Deactivated - AC",
                  "Payment Pending - PAY",
                  "Duplicate Shipment - DUP",
                  "Manual Inspection Required - MANI",
                  "System Flagged Hold - SYSF",
                  "Delivery Attempt & Customer Related",
                  "No One Available - NOA",
                  "Delivery Rescheduled - DRS",
                  "Customer Requested Hold - CRH",
                  "Wrong Contact Number - WCN",
                ]}
                register={register}
                setValue={setValue}
                value="selectedReason"
                title="Hold Reason"
                defaultValue={selectedReason}
                resetFactor={false}
              />

              <div
                className="flex h-[40px] bg-gray-200 border border-gray-300 rounded items-center p-4 text-gray-600 cursor-pointer"
                onClick={() => {
                  setSelectedReason(watch("selectedReason"));
                  console.log("hello", selectedReason);
                  if (selectedReason && !holdReasons.includes(selectedReason)) {
                    const updated = [...holdReasons, selectedReason];
                    setHoldReasons(updated);
                    setHold(true);
                    setValue("holdReason", updated.join(", "));
                    setValue("selectedReason", "");
                  }
                }}
              >
                +
              </div>
            </div>
            <div className="w-full h-[40px] overflow-auto flex flex-wrap gap-2 border border-gray-300 px-2 py-2 rounded bg-gray-100 hidden-scrollbar ">
              {holdReasons.map((reason, idx) => (
                <span
                  key={idx}
                  className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-2 mb-2 border border-gray-300 bg-gray-300"
                >
                  {reason}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = holdReasons.filter((_, i) => i !== idx);
                      setHoldReasons(updated);
                      setHold(updated.length > 0);
                      setValue("holdReason", updated.join(", "));
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
              {holdReasons.length === 0 && (
                <span className="text-gray-500 text-sm">Hold Reason</span>
              )}
            </div>

            <div className="w-full flex gap-2">
              <SimpleButton
                name="Add to table"
                onClick={handleAddToTable}
                disabled={!mawbNumber || !length || !breadth || !height}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-1/2">
          <RedLabelHeading label="Customer Details" />
          <div className="flex gap-2 mt-1">
            <div className="w-[124px]">
              <DummyInputBoxWithLabelDarkGray
                label="Code"
                register={register}
                setValue={setValue}
                value="code"
              />
            </div>
            <DummyInputBoxWithLabelDarkGray
              label="Client"
              register={register}
              setValue={setValue}
              value="client"
            />
          </div>
          <div className="flex gap-2 mt-1">
            <DummyInputBoxWithLabelDarkGray
              label="E-mail"
              register={register}
              setValue={setValue}
              value="email"
            />
            <DummyInputBoxWithLabelDarkGray
              label="Phone Number"
              register={register}
              setValue={setValue}
              value="phoneNumber"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex flex-col gap-2 flex-grow">
              <RedLabelHeading label="Consignee Details" />
              <InputBox
                register={register}
                placeholder={""}
                setValue={setValue}
                value={"ConsigneeDetails"}
                initialValue={consigneeDetails || ""}
                isTextArea
                className="w-full min-h-[130px] max-h-[130px] text-xs"
                disabled
              />
            </div>
            <div className="flex flex-col gap-2 flex-grow">
              <RedLabelHeading label=" Consignor Details" />
              <InputBox
                register={register}
                placeholder={""}
                setValue={setValue}
                initialValue={consignorDetails || ""}
                value={"ConsignorDetails"}
                isTextArea
                className="w-full min-h-[130px] max-h-[130px] text-xs"
                disabled
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-[590px]">
            <RedLabelHeading label={"Table"} />
            <div className="max-h-[300px] overflow-auto border rounded-lg">
              <TableWithSorting
                register={register}
                setValue={setValue}
                name="bagging"
                columns={columns}
                rowData={rowData}
              />
            </div>
          </div>

          <div className="flex justify-between w-full">
            <RedCheckbox
              isChecked={portal}
              setChecked={setPortal}
              id="portal"
              register={register}
              setValue={setValue}
              label="Portal"
            />

            <RedCheckbox
              isChecked={eMail}
              setChecked={setEMail}
              id="eMail"
              register={register}
              setValue={setValue}
              label="EMail"
            />
            <RedCheckbox
              isChecked={whatsApp}
              setChecked={setWhatsApp}
              id="whatsApp"
              register={register}
              setValue={setValue}
              label="WhatsApp"
            />
            <div className=" ">
              <SimpleButton
                name={isSendingEmail ? "Sending..." : "Send Alert"}
                onClick={handleSendEmail}
                disabled={isSendingEmail || !eMail || rowData.length === 0}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-full">
          <div className="flex gap-3">
            <InputBox
              placeholder="Remarks"
              register={register}
              setValue={setValue}
              value="remarks"
            />
            <div>
              <SimpleButton name="Save" onClick={handleSave} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-row-reverse">
        <div className="flex flex-row gap-4">
          {/* <SimpleButton name="Close" /> */}
        </div>
      </div>
    </div>
  );
};

export default PortalEntry;
