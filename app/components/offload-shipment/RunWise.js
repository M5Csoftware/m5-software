"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import InputBox from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import { RedLabelHeading } from "@/app/components/Heading";
import NotificationFlag from "@/app/components/Notificationflag";
import React, { useContext, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import { toast } from "react-hot-toast";

function RunWise() {
  const { register, setValue, getValues } = useForm();
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [runNo, setRunNo] = useState("");
  const [withPortal, setPortal] = useState(false);
  const [withEmail, setEmail] = useState(false);
  const [withEvents, setEvents] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  // ✅ FIX: resetFactor toggles to force InputBox to clear
  const [resetFactor, setResetFactor] = useState(false);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB No" },
      { key: "offloadReason", label: "Offload Reason" },
      { key: "accountCode", label: "Customer Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "email", label: "Email" },
    ],
    []
  );

  const clearInputs = () => {
    setValue("runNo", "");
    setValue("offloadReason", "");
    setResetFactor((prev) => !prev); // ✅ triggers InputBox internal reset
  };

  const handleAdd = async () => {
    const formValues = getValues();
    const runNoValue = formValues.runNo;
    const offloadReason = formValues.offloadReason;

    if (!runNoValue || !offloadReason) {
      showNotification("error", "Please enter Run Number and Offload Reason");
      return;
    }

    if (!runNoValue.trim() || !offloadReason.trim()) {
      showNotification("error", "Run Number and Offload Reason cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const url = `${server}/offload-shipment/run-wise?runNo=${encodeURIComponent(runNoValue)}`;
      const response = await axios.get(url);

      if (response.data.success) {
        setRunNo(runNoValue);

        const newRows = response.data.data.map((shipment) => ({
          ...shipment,
          offloadReason: offloadReason.trim(),
        }));

        const existingAwbs = rowData.map((row) => row.awbNo);
        const uniqueNewRows = newRows.filter(
          (row) => !existingAwbs.includes(row.awbNo)
        );

        if (uniqueNewRows.length === 0) {
          showNotification("error", "All AWBs from this run are already in the table");
          return;
        }

        if (uniqueNewRows.length < newRows.length) {
          showNotification("error", `${newRows.length - uniqueNewRows.length} duplicate AWB(s) skipped`);
        }

        setRowData((prev) => [...prev, ...uniqueNewRows]);

        // ✅ FIX: clear both inputs via resetFactor + setValue
        clearInputs();

        showNotification("success", `${uniqueNewRows.length} AWB(s) added successfully from Run ${runNoValue}`);
      }
    } catch (error) {
      console.error("Error fetching Run details:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch Run details";
      showNotification("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAlert = async () => {
    if (rowData.length === 0) {
      showNotification("error", "Please add at least one run before sending alert");
      return;
    }

    if (!withPortal && !withEmail && !withEvents) {
      showNotification("error", "Please select at least one alert option");
      return;
    }

    if (withEmail) {
      const invalidEmails = rowData.filter(
        (row) => !row.email || row.email.trim() === ""
      );
      if (invalidEmails.length > 0) {
        showNotification("error", "Some shipments have invalid email addresses");
        return;
      }
    }

    setSendingAlert(true);

    try {
      let allSuccess = true;
      let messages = [];

      if (withEvents) {
        try {
          const eventResponse = await axios.post(
            `${server}/offload-shipment/run-wise/update-event`,
            {
              shipments: rowData,
              alertOnEmail: withEmail,
              alertOnPortal: withPortal,
              updateInEvents: withEvents,
              runNo,
            }
          );

          if (eventResponse.data.success) {
            const { successful, failed, total } = eventResponse.data.results;
            if (failed > 0) {
              messages.push(`Events updated: ${successful} successful, ${failed} failed out of ${total}`);
              allSuccess = false;
            } else {
              messages.push(`Events updated successfully for ${total} shipment(s)`);
            }
          } else {
            messages.push("Failed to update events");
            allSuccess = false;
          }
        } catch (error) {
          console.error("Error updating events:", error);
          messages.push("Error updating events: " + (error.response?.data?.message || error.message));
          allSuccess = false;
        }
      }

      if (withEmail) {
        try {
          const emailResponse = await axios.post(
            `${server}/offload-shipment/run-wise/send-alert`,
            {
              shipments: rowData,
              alertOnEmail: withEmail,
              alertOnPortal: withPortal,
              updateInEvents: false,
            }
          );

          if (emailResponse.data.success && emailResponse.data.emailResults) {
            const { successful, failed, total } = emailResponse.data.emailResults;
            if (failed > 0) {
              messages.push(`Emails sent: ${successful} successful, ${failed} failed out of ${total} customers`);
              allSuccess = false;
            } else {
              messages.push(`Emails sent successfully to ${total} customer(s) with ${rowData.length} shipment(s)`);
            }
          } else {
            messages.push("Email alerts sent");
          }
        } catch (error) {
          console.error("Error sending emails:", error);
          messages.push("Error sending emails: " + (error.response?.data?.message || error.message));
          allSuccess = false;
        }
      }

      if (withPortal) {
        messages.push("Portal alerts processed");
      }

      const finalMessage = messages.join(". ");

      if (allSuccess) {
        showNotification("success", finalMessage);
        toast.success(finalMessage);
        setRowData([]);
        setRunNo("");
        setPortal(false);
        setEmail(false);
        setEvents(false);
      } else {
        showNotification("error", finalMessage);
        toast.error(finalMessage);
      }
    } catch (error) {
      console.error("Error in handleSendAlert:", error);
      const errorMessage = error.response?.data?.message || "Failed to process alerts";
      showNotification("error", errorMessage);
      toast.error(errorMessage);
    } finally {
      setSendingAlert(false);
    }
  };

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) => setNotification((prev) => ({ ...prev, visible }))}
      />

      <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-3">
          <RedLabelHeading label="Run To Be Offload" />
          <div className="flex gap-3">
            {/* ✅ FIX: resetFactor passed to both inputs so they clear after Add */}
            <InputBox
              placeholder="Enter Run No."
              register={register}
              setValue={setValue}
              value="runNo"
              resetFactor={resetFactor}
            />
            <InputBox
              placeholder="Offload Reason"
              register={register}
              setValue={setValue}
              value="offloadReason"
              resetFactor={resetFactor}
            />
            <div>
              <OutlinedButtonRed
                type="button"
                label={loading ? "Loading..." : "Add"}
                onClick={handleAdd}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between w-full">
          <div className="flex justify-between w-full">
            <div className="flex gap-6">
              <RedCheckbox
                register={register}
                setValue={setValue}
                label="Alert On Portal"
                id="alertPortal"
                isChecked={withPortal}
                setChecked={setPortal}
              />
              <RedCheckbox
                register={register}
                setValue={setValue}
                label="Alert On Email"
                id="alertEmail"
                isChecked={withEmail}
                setChecked={setEmail}
              />
              <RedCheckbox
                register={register}
                setValue={setValue}
                label="Update in Events"
                id="updateEvents"
                isChecked={withEvents}
                setChecked={setEvents}
              />
            </div>
            <div>
              <SimpleButton
                type="button"
                name={sendingAlert ? "Sending..." : "Send Alert"}
                onClick={handleSendAlert}
                disabled={sendingAlert}
              />
            </div>
          </div>
        </div>

        <div>
          <TableWithSorting
            register={register}
            setValue={setValue}
            columns={columns}
            rowData={rowData}
          />
        </div>
      </form>
    </>
  );
}

export default RunWise;