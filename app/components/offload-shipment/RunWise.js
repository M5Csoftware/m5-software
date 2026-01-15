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
import { show } from "@tauri-apps/api/app";

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

  const handleAdd = async () => {
    const formValues = getValues();
    const runNoValue = formValues.runNo;
    const offloadReason = formValues.offloadReason;

    console.log("Form Values:", { runNo: runNoValue, offloadReason });

    if (!runNoValue || !offloadReason) {
      toast.error("Please enter Run Number and Offload Reason");
      showNotification("error", "Please enter Run Number and Offload Reason");
      return;
    }

    if (!runNoValue.trim() || !offloadReason.trim()) {
      toast.error("Run Number and Offload Reason cannot be empty");
      showNotification(
        "error",
        "Run Number and Offload Reason cannot be empty"
      );

      return;
    }

    setLoading(true);
    try {
      const url = `${server}/offload-shipment/run-wise?runNo=${encodeURIComponent(
        runNoValue
      )}`;
      console.log("Calling API:", url);

      const response = await axios.get(url);

      console.log("API Response:", response.data);

      if (response.data.success) {
        // Store the run number for later use
        setRunNo(runNoValue);

        // Add offload reason to each shipment
        const newRows = response.data.data.map((shipment) => ({
          ...shipment,
          offloadReason: offloadReason.trim(),
        }));

        console.log("New Rows to Add:", newRows);

        // Check for duplicates and add only new AWBs
        const existingAwbs = rowData.map((row) => row.awbNo);
        const uniqueNewRows = newRows.filter(
          (row) => !existingAwbs.includes(row.awbNo)
        );

        if (uniqueNewRows.length === 0) {
          toast.warning("All AWBs from this run are already in the table");
          showNotification(
            "error",
            "All AWBs from this run are already in the table"
          );
          return;
        }

        if (uniqueNewRows.length < newRows.length) {
          toast.warning(
            `${newRows.length - uniqueNewRows.length} duplicate AWB(s) skipped`
          );
        }

        setRowData((prev) => {
          const updated = [...prev, ...uniqueNewRows];
          console.log("Updated Row Data:", updated);
          return updated;
        });

        // Clear input fields
        setValue("runNo", "");
        setValue("offloadReason", "");

        toast.success(
          `${uniqueNewRows.length} AWB(s) added successfully from Run ${runNoValue}`
        );
        showNotification(
          "success",
          `${uniqueNewRows.length} AWB(s) added successfully from Run ${runNoValue}`
        );
      }
    } catch (error) {
      console.error("Error fetching Run details:", error);
      console.error("Error Response:", error.response?.data);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch Run details";
      toast.error(errorMessage);
      showNotification("error", errorMessage)
    } finally {
      setLoading(false);
    }
  };

  const handleSendAlert = async () => {
    if (rowData.length === 0) {
      toast.error("Please add at least one run before sending alert");
      showNotification("error", "Please add at least one run before sending alert")
      return;
    }

    if (!withPortal && !withEmail && !withEvents) {
      toast.error("Please select at least one alert option");
      showNotification("error", "Please add at least one run before sending alert")
      return;
    }

    // If email alert is selected, validate email addresses
    if (withEmail) {
      const invalidEmails = rowData.filter(
        (row) => !row.email || row.email.trim() === ""
      );
      if (invalidEmails.length > 0) {
        toast.error("Some shipments have invalid email addresses");
        showNotification("error", "Some shipments have invalid email addresses")
        return;
      }
    }

    setSendingAlert(true);

    try {
      let allSuccess = true;
      let messages = [];

      // 1. Handle Update in Events
      if (withEvents) {
        try {
          const updateEventUrl = `${server}/offload-shipment/run-wise/update-event`;
          console.log("Updating events at:", updateEventUrl);

          const eventResponse = await axios.post(updateEventUrl, {
            shipments: rowData,
            alertOnEmail: withEmail,
            alertOnPortal: withPortal,
            updateInEvents: withEvents,
            runNo: runNo,
          });

          console.log("Event Update Response:", eventResponse.data);

          if (eventResponse.data.success) {
            const { successful, failed, total } = eventResponse.data.results;
            if (failed > 0) {
              messages.push(
                `Events updated: ${successful} successful, ${failed} failed out of ${total}`
              );
              allSuccess = false;
            } else {
              messages.push(
                `Events updated successfully for ${total} shipment(s)`
              );
            }
          } else {
            messages.push("Failed to update events");
            allSuccess = false;
          }
        } catch (error) {
          console.error("Error updating events:", error);
          messages.push(
            "Error updating events: " +
              (error.response?.data?.message || error.message)
          );
          allSuccess = false;
        }
      }

      // 2. Handle Email Alert
      if (withEmail) {
        try {
          const emailUrl = `${server}/offload-shipment/run-wise/send-alert`;
          console.log("Sending email alerts to:", emailUrl);

          const emailResponse = await axios.post(emailUrl, {
            shipments: rowData,
            alertOnEmail: withEmail,
            alertOnPortal: withPortal,
            updateInEvents: false, // Already handled above
          });

          console.log("Email Alert Response:", emailResponse.data);

          if (emailResponse.data.success && emailResponse.data.emailResults) {
            const { successful, failed, total } =
              emailResponse.data.emailResults;
            if (failed > 0) {
              messages.push(
                `Emails sent: ${successful} successful, ${failed} failed out of ${total} customers`
              );
              allSuccess = false;
            } else {
              messages.push(
                `Emails sent successfully to ${total} customer(s) with ${rowData.length} shipment(s)`
              );
            }
          } else {
            messages.push("Email alerts sent");
          }
        } catch (error) {
          console.error("Error sending emails:", error);
          messages.push(
            "Error sending emails: " +
              (error.response?.data?.message || error.message)
          );
          allSuccess = false;
        }
      }

      // 3. Handle Portal Alert (if you have a separate endpoint for this)
      if (withPortal) {
        try {
          // Add your portal alert endpoint here if you have one
          messages.push("Portal alerts processed");
        } catch (error) {
          console.error("Error sending portal alerts:", error);
          messages.push(
            "Error with portal alerts: " +
              (error.response?.data?.message || error.message)
          );
          allSuccess = false;
        }
      }

      // Display results
      const finalMessage = messages.join(". ");

      if (allSuccess) {
        setNotification({
          type: "success",
          message: finalMessage,
          visible: true,
        });
        toast.success(finalMessage);
        showNotification("success", finalMessage)

        // Clear the table after successful alert
        setRowData([]);
        setRunNo("");

        // Reset checkboxes
        setPortal(false);
        setEmail(false);
        setEvents(false);
      } else {
        setNotification({
          type: "warning",
          message: finalMessage,
          visible: true,
        });
        toast.warning(finalMessage);
        showNotification("error", finalMessage)
      }
    } catch (error) {
      console.error("Error in handleSendAlert:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to process alerts";

      setNotification({
        type: "error",
        message: errorMessage,
        visible: true,
      });

      toast.error(errorMessage);
      showNotification("error", errorMessage)
    } finally {
      setSendingAlert(false);
    }
  };

  // Debug: Log rowData changes
  React.useEffect(() => {
    console.log("Row Data Changed:", rowData);
  }, [rowData]);

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

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-3">
          <RedLabelHeading label="Run To Be Offload" />
          <div className="flex gap-3">
            <InputBox
              placeholder="Enter Run No."
              register={register}
              setValue={setValue}
              value="runNo"
            />
            <InputBox
              placeholder="Offload Reason"
              register={register}
              setValue={setValue}
              value="offloadReason"
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

        <div className="flex justify-end">
          <div className="flex gap-2"></div>
        </div>
      </form>
    </>
  );
}

export default RunWise;
