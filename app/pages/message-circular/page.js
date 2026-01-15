"use client";
import React, { useCallback, useContext, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { X, Calendar, Clock } from "lucide-react";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import ShipperTable from "./ShipperTable";
import TargetedOptions from "@/app/components/message-circular/TargetedOptions";
import NotificationFlag from "@/app/components/Notificationflag";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";

const MessageCircular = () => {
  const { server } = useContext(GlobalContext);
  const { register, setValue, getValues, reset } = useForm();
  const [attachments, setAttachments] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [shippers, setShippers] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState({
    current: 0,
    total: 0,
  });
  const [currentSendingFile, setCurrentSendingFile] = useState("");
  const [showSendingModal, setShowSendingModal] = useState(false);
  const [messageText, setMessageText] = useState("");
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Schedule Modal States
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Notification State
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  // New state for targeting options
  const [targetingOptions, setTargetingOptions] = useState({
    selectedCategory: null,
    selectedStates: [],
    selectedHubs: [],
  });
  const [showScheduleSuccessModal, setShowScheduleSuccessModal] =
    useState(false);

  // Notification helper function
  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  // Fixed text formatting functions
  const insertFormatting = (startTag, endTag) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = messageText.substring(start, end);

    let newText;
    let newCursorPos;

    if (selectedText) {
      // Wrap selected text
      newText =
        messageText.substring(0, start) +
        startTag +
        selectedText +
        endTag +
        messageText.substring(end);
      newCursorPos = end + startTag.length + endTag.length;
    } else {
      // Insert tags at cursor position
      newText =
        messageText.substring(0, start) +
        startTag +
        endTag +
        messageText.substring(start);
      newCursorPos = start + startTag.length;
    }

    setMessageText(newText);
    setValue("message", newText);

    // Set focus and cursor position after state update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleBold = () => insertFormatting("**", "**");
  const handleItalic = () => insertFormatting("*", "*");
  const handleUnderline = () => insertFormatting("<u>", "</u>");

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessageText(value);
    setValue("message", value);
  };

  const handleKeyDown = (e) => {
    const textarea = textareaRef.current;
    // If Enter (without Ctrl/Cmd) -> insert newline at cursor
    if (e.key === "Enter" && !(e.ctrlKey || e.metaKey)) {
      // prevent default to avoid any form submit or other handlers
      e.preventDefault();
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Insert newline between start and end
      const newText =
        messageText.substring(0, start) + "\n" + messageText.substring(end);

      // Update state + react-hook-form
      setMessageText(newText);
      setValue("message", newText);

      // Restore focus & put caret after the inserted newline
      // small timeout so React has applied state
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 1, start + 1);
      }, 0);

      return;
    }

    // Formatting shortcuts: Ctrl/Cmd+B/I/U
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          handleBold();
          return;
        case "i":
          e.preventDefault();
          handleItalic();
          return;
        case "u":
          e.preventDefault();
          handleUnderline();
          return;
        default:
          break;
      }
    }

    // for all other keys, don't preventDefault here
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Updated handleFileChange for Cloudinary
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const allowed = [
      ".csv",
      ".xls",
      ".xlsx",
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".bmp",
      ".webp",
    ];
    const validFiles = files.filter((file) =>
      allowed.some((ext) => file.name.toLowerCase().endsWith(ext))
    );

    if (validFiles.length !== files.length) {
      showNotification(
        "error",
        "Only CSV, Excel (.xls/.xlsx), PDF, and Image files (.jpg, .jpeg, .png, .gif, .bmp, .webp) are allowed."
      );
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      validFiles.forEach((file) => {
        console.log("Adding file to FormData:", file.name, file.size);
        formData.append("files", file);
      });

      console.log("Uploading to Cloudinary via /helper/uploadFiles...");

      const response = await axios.post(
        `${server}/helper/uploadFiles`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Cloudinary upload response:", response.data);

      if (response.data.success) {
        const newUploadedFiles = [...uploadedFiles, ...response.data.files];
        setUploadedFiles(newUploadedFiles);

        // Use original names for display, but store Cloudinary public_ids for sending
        const displayNames = response.data.files.map((f) => f.originalName);
        const updated = [...attachments, ...displayNames];
        setAttachments(updated);
        setValue("attachments", updated);

        showNotification(
          "success",
          `Successfully uploaded ${response.data.files.length} files to Cloudinary`
        );
        console.log("Cloudinary files stored:", response.data.files);
      } else {
        console.error("Cloudinary upload failed:", response.data);
        showNotification("error", `Upload failed: ${response.data.error}`);
      }
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      showNotification(
        "error",
        `Failed to upload files to Cloudinary: ${
          error.response?.data?.error || error.message
        }`
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (originalFileName) => {
    const updated = attachments.filter((f) => f !== originalFileName);
    setAttachments(updated);
    setValue("attachments", updated);

    const updatedUploaded = uploadedFiles.filter(
      (f) => f.originalName !== originalFileName
    );
    setUploadedFiles(updatedUploaded);
  };

  // Function to convert markdown-style formatting to HTML
  const convertToHtml = (text) => {
    if (!text) return "";

    let htmlText = text
      // Convert line breaks to <br> tags
      .replace(/\r?\n/g, "<br>")
      // Convert **bold** to <strong>
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Convert *italic* to <em>
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Keep <u>underline</u> as is (already HTML)
      .replace(/<u>(.*?)<\/u>/g, "<u>$1</u>");

    return `<div style="color: black; font-family: Arial, sans-serif; font-size: 14px;">${htmlText}</div>`;
  };

  // Function to convert to plain text (remove formatting)
  const convertToPlainText = (text) => {
    if (!text) return "";

    return (
      text
        // Remove HTML tags
        .replace(/<[^>]*>/g, "")
        // Remove markdown formatting
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        // Keep line breaks as is for plain text
        .replace(/\r?\n/g, "\n")
    );
  };

  // New function to fetch targeted recipients based on selection
  const fetchTargetedRecipients = async () => {
    const { selectedCategory, selectedStates, selectedHubs } = targetingOptions;

    // If nothing is selected in targeting options, return empty array
    if (
      !selectedCategory &&
      selectedStates.length === 0 &&
      selectedHubs.length === 0
    ) {
      return [];
    }

    try {
      console.log(
        "Fetching targeted recipients with options:",
        targetingOptions
      );

      const response = await axios.get(`${server}/customer-account`);
      if (!Array.isArray(response.data)) {
        throw new Error("Invalid response format");
      }

      let filteredRecipients = [];
      const allAccounts = response.data;

      // Filter by category
      if (selectedCategory && selectedCategory !== "All") {
        const categoryFiltered = allAccounts.filter(
          (account) =>
            account.accountType &&
            account.accountType.toLowerCase() === selectedCategory.toLowerCase()
        );
        filteredRecipients = [...filteredRecipients, ...categoryFiltered];
      } else if (selectedCategory === "All") {
        filteredRecipients = [...allAccounts];
      }

      // Filter by states
      if (selectedStates.length > 0) {
        const stateFiltered = allAccounts.filter(
          (account) => account.state && selectedStates.includes(account.state)
        );

        // If category is also selected, find intersection
        if (filteredRecipients.length > 0) {
          filteredRecipients = filteredRecipients.filter(
            (account) => account.state && selectedStates.includes(account.state)
          );
        } else {
          filteredRecipients = [...filteredRecipients, ...stateFiltered];
        }
      }

      // Filter by hubs
      if (selectedHubs.length > 0) {
        const hubFiltered = allAccounts.filter(
          (account) => account.hub && selectedHubs.includes(account.hub)
        );

        // If category or state is also selected, find intersection
        if (filteredRecipients.length > 0) {
          filteredRecipients = filteredRecipients.filter(
            (account) => account.hub && selectedHubs.includes(account.hub)
          );
        } else {
          filteredRecipients = [...filteredRecipients, ...hubFiltered];
        }
      }

      // Remove duplicates based on accountCode
      const uniqueRecipients = filteredRecipients.filter(
        (account, index, self) =>
          index ===
          self.findIndex((acc) => acc.accountCode === account.accountCode)
      );

      // Map to required format
      const mappedRecipients = uniqueRecipients
        .filter((account) => account.billingEmailId) // Only include accounts with email
        .map((account) => ({
          accNo: account.accountCode,
          billingEmailId: account.billingEmailId,
          isValid: true,
          status: "Valid",
        }));

      console.log(
        `Found ${mappedRecipients.length} targeted recipients:`,
        mappedRecipients
      );
      return mappedRecipients;
    } catch (error) {
      console.error("Error fetching targeted recipients:", error);
      throw error;
    }
  };
  // Updated handleSend for Cloudinary and Scheduling
  const handleSend = async (isScheduled = false, scheduledDateTime = null) => {
    const values = getValues();

    if (!values.fromEmail || !values.smtp) {
      showNotification("error", "Please fill in From Email and SMTP details");
      return;
    }

    if (!values.password) {
      showNotification("error", "Please enter the password for the from email");
      return;
    }

    let emailRecipients = [];

    // Check if we should use ShipperTable recipients or Targeting Options recipients
    if (shippers.length > 0) {
      emailRecipients = shippers.filter((shipper) => shipper.isValid);
      console.log("Using ShipperTable recipients:", emailRecipients.length);
    } else {
      const { selectedCategory, selectedStates, selectedHubs } =
        targetingOptions;

      if (
        selectedCategory ||
        selectedStates.length > 0 ||
        selectedHubs.length > 0
      ) {
        try {
          emailRecipients = await fetchTargetedRecipients();
          console.log(
            "Using Targeting Options recipients:",
            emailRecipients.length
          );
        } catch (error) {
          showNotification(
            "error",
            `Failed to fetch targeted recipients: ${error.message}`
          );
          return;
        }
      } else {
        showNotification(
          "error",
          "Please either add shippers manually or select targeting options (category, states, or hubs)"
        );
        return;
      }
    }

    if (emailRecipients.length === 0) {
      showNotification(
        "error",
        "No valid recipients found. Please check your selection or add valid shippers."
      );
      return;
    }

    // Use Cloudinary public_ids instead of local filenames
    const cloudinaryPublicIds = uploadedFiles.map(
      (f) => f.cloudinaryPublicId || f.savedName
    );

    // Convert the message text to both HTML and plain text formats
    const htmlBody = convertToHtml(values.message || "");
    const plainTextBody = convertToPlainText(values.message || "");

    // Map recipients and use billingEmailId
    const emailData = emailRecipients.map((recipient) => ({
      accNo: recipient.accNo,
      email: recipient.billingEmailId,
      subject: values.subject || "No Subject",
      cc: values.cc || "",
      bcc: values.bcc || "",
      attachments: cloudinaryPublicIds,
      htmlBody: htmlBody,
      textBody: plainTextBody,
      body: htmlBody,
      isHtml: true,
      fromEmail: values.fromEmail,
      smtp: values.smtp,
      port: values.port || "587",
      password: values.password,
    }));

    // If scheduling, prepare and send to API with schedule parameters
    if (isScheduled && scheduledDateTime) {
      console.log(`Scheduling email for: ${scheduledDateTime}`);
      console.log(`Recipients: ${emailRecipients.length}`);

      try {
        console.log(
          "Using Cloudinary public IDs for scheduled attachments:",
          cloudinaryPublicIds
        );

        // Parse the scheduled date and time
        const [date, time] = scheduledDateTime.split(" at ");

        // Try multiple payload formats to see which one works
        const schedulePayload = {
          isScheduled: true,
          scheduleDate: date,
          scheduleTime: time,
          emailData: emailData,
        };

        console.log(
          "Sending schedule request:",
          JSON.stringify(schedulePayload, null, 2)
        );

        const response = await axios.post(
          `${server}/helper/sendEmail`,
          schedulePayload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Schedule API response:", response.data);
        console.log("Response status:", response.status);
        console.log("Response success flag:", response.data.success);

        // FIXED: Check response structure properly
        if (response.data.success === true) {
          showNotification(
            "success",
            `Email successfully scheduled for ${scheduledDateTime} with ${emailRecipients.length} recipients!`
          );
          setShowScheduleSuccessModal(true);
          // Clear form after successful scheduling
          handleRefresh();
        } else {
          console.error(
            "Schedule failed. Full response:",
            JSON.stringify(response.data, null, 2)
          );
          showNotification(
            "error",
            `Failed to schedule email: ${
              response.data.error ||
              response.data.message ||
              JSON.stringify(response.data)
            }`
          );
        }
      } catch (error) {
        console.error("Schedule email error:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
        console.error(
          "Error message from backend:",
          error.response?.data?.error || error.response?.data?.message
        );

        showNotification(
          "error",
          `Failed to schedule email: ${
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message
          }`
        );
      }
      return;
    }

    // Regular immediate email sending (unchanged)
    setIsSending(true);
    setShowSendingModal(true);
    setSendingProgress({ current: 0, total: emailRecipients.length });
    setCurrentSendingFile("Preparing to send...");

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue =
        "Email sending is in progress. Closing this tab may cause emails to fail. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    try {
      console.log(
        "Using Cloudinary public IDs for attachments:",
        cloudinaryPublicIds
      );

      console.log("Sending emails with Cloudinary attachments:", emailData);

      for (let i = 0; i < emailData.length; i++) {
        setCurrentSendingFile(`Sending to ${emailData[i].email}...`);
        setSendingProgress({ current: i, total: emailData.length });

        if (i > 0) await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const response = await axios.post(
        `${server}/helper/sendEmail`,
        emailData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Email API response:", response.data);

      window.removeEventListener("beforeunload", handleBeforeUnload);

      if (response.data.success) {
        const successCount =
          response.data.results?.filter((r) => r.status === "success").length ||
          0;
        const failedCount =
          response.data.results?.filter((r) => r.status === "failed").length ||
          0;

        setCurrentSendingFile("Finalizing and cleaning up Cloudinary files...");
        setSendingProgress({
          current: emailRecipients.length,
          total: emailRecipients.length,
        });

        setTimeout(() => {
          setShowSendingModal(false);

          let message = `Email sending completed! Successful: ${successCount}`;
          if (failedCount > 0) {
            message += ` | Failed: ${failedCount}`;
          }

          if (response.data.cleanup) {
            message += ` | Cloudinary cleanup: ${response.data.cleanup.filesDeleted} files deleted`;
            if (response.data.cleanup.deleteErrors > 0) {
              message += ` (${response.data.cleanup.deleteErrors} errors)`;
            }
          }

          showNotification("success", message);
          handleRefresh();
        }, 1000);

        console.log("Email Results:", response.data.results);
        if (response.data.cleanup) {
          console.log("Cloudinary Cleanup:", response.data.cleanup);
        }

        const failedEmails =
          response.data.results?.filter((r) => r.status === "failed") || [];
        if (failedEmails.length > 0) {
          console.error("Failed emails:", failedEmails);
        }
      } else {
        setShowSendingModal(false);
        console.error("Email API Error:", response.data);
        showNotification(
          "error",
          `Email sending failed: ${response.data.error || "Unknown error"}`
        );
      }
    } catch (error) {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      setShowSendingModal(false);
      console.error("Send email error:", error);
      showNotification(
        "error",
        `Failed to send emails: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setIsSending(false);
    }
  };

  // Schedule Modal Functions
  const handleScheduleClick = () => {
    setIsScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setIsScheduleModalOpen(false);
    setScheduleDate("");
    setScheduleTime("");
  };

  const handleScheduleSend = () => {
    if (scheduleDate && scheduleTime) {
      const scheduledDateTime = `${scheduleDate} at ${scheduleTime}`;
      handleSend(true, scheduledDateTime);
      handleCloseScheduleModal();
    } else {
      showNotification("error", "Please select both date and time");
    }
  };

  const handleScheduleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseScheduleModal();
    }
  };

  const handleRefresh = () => {
    reset();
    setAttachments([]);
    setUploadedFiles([]);
    setShippers([]);
    setMessageText("");
    setTargetingOptions({
      selectedCategory: null,
      selectedStates: [],
      selectedHubs: [],
    });
    setRefreshKey((prev) => prev + 1);
  };

  // Handler for targeting options updates
  const handleTargetingOptionsUpdate = useCallback((options) => {
    setTargetingOptions(options);
    console.log("Targeting options updated:", options);
  }, []);

  return (
    <div className="relative">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes slideTransfer {
            0% { transform: translateX(-100%); opacity: 0; }
            50% { opacity: 0.3; }
            100% { transform: translateX(100%); opacity: 0; }
          }
          @keyframes pulse-green {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.5; }
          }
          @keyframes flowRight {
            0% { transform: translateX(-100%); opacity: 0.8; }
            100% { transform: translateX(300%); opacity: 0; }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes progressLine {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          .animate-progressLine {
            animation: progressLine 2s linear forwards;
          }
        `,
        }}
      />

      <form className="flex flex-col gap-6">
        <Heading
          title="Message/Rate Circular"
          bulkUploadBtn="hidden"
          codeListBtn="hidden"
          onRefresh={handleRefresh}
        />

        <div className="flex flex-1 w-full gap-4 items-stretch">
          <div className="flex gap-8 h-full">
            <ShipperTable
              key={`shipper-${refreshKey}`}
              onShippersUpdate={setShippers}
            />
          </div>

          <div className="flex-1 flex flex-col gap-5">
            {/* Targeting Options Component */}
            <TargetedOptions
              key={`targeting-${refreshKey}`}
              onTargetingOptionsUpdate={handleTargetingOptionsUpdate}
            />

            <div>
              <h2 className="text-red font-semibold mb-2 mt-1">
                Mail Information
              </h2>
              <div className="flex gap-2 mb-2">
                <InputBox
                  key={`subject-${refreshKey}`}
                  placeholder="Subject"
                  value="subject"
                  register={register}
                  setValue={setValue}
                />
              </div>
              <div className="flex gap-2 mb-2">
                <InputBox
                  key={`cc-${refreshKey}`}
                  placeholder="CC"
                  value="cc"
                  register={register}
                  setValue={setValue}
                />
                <InputBox
                  key={`bcc-${refreshKey}`}
                  placeholder="BCC"
                  value="bcc"
                  register={register}
                  setValue={setValue}
                />
              </div>

              <div className="flex items-center gap-2 mb-2 w-full">
                <div className="flex-1 border border-[#979797] rounded-md h-10 px-2 flex items-center gap-2 overflow-x-auto bg-gray-100">
                  {attachments.length === 0 ? (
                    <span className="text-gray-400 text-sm">Attachment</span>
                  ) : (
                    attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center bg-white border rounded px-2 py-0.5 text-sm"
                      >
                        <span>{file}</span>
                        <button
                          type="button"
                          className="ml-2 text-red-500 font-bold hover:text-red-700"
                          onClick={() => handleRemove(file)}
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <SimpleButton
                    name={isUploading ? "Uploading..." : "Browse"}
                    // className="text-sm px-6 py-1"
                    onClick={handleBrowseClick}
                    disabled={isUploading}
                  />
                  <OutlinedButtonRed
                    label="+"
                    className="text-sm px-4 py-1"
                    onClick={handleBrowseClick}
                    type="button"
                    disabled={isUploading}
                  />
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xls,.xlsx,.pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  multiple
                  disabled={isUploading}
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-red font-semibold">Message (Body)</h2>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handleBold}
                    className="px-3 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black"
                    title="Bold (Ctrl+B)"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    onClick={handleItalic}
                    className="px-3 py-1 text-sm italic border border-gray-300 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black"
                    title="Italic (Ctrl+I)"
                  >
                    <em>I</em>
                  </button>
                  <button
                    type="button"
                    onClick={handleUnderline}
                    className="px-3 py-1 text-sm underline border border-gray-300 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black"
                    title="Underline (Ctrl+U)"
                  >
                    U
                  </button>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                className="w-full flex-1 border border-gray-300 rounded-md p-3 min-h-[120px] resize-none leading-relaxed focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                style={{
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                }}
                placeholder="Write your message here... Press Enter for new line."
                value={messageText}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
              />

              <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                <span>{messageText.length} characters</span>
              </div>
            </div>

            <div>
              <h2 className="text-red font-semibold mb-2">
                Outgoing Server Details
              </h2>
              <div className="flex gap-2 mb-2">
                <InputBox
                  key={`fromEmail-${refreshKey}`}
                  placeholder="From Email ID"
                  value="fromEmail"
                  register={register}
                  setValue={setValue}
                />
                <InputBox
                  key={`password-${refreshKey}`}
                  placeholder="Password"
                  type="password"
                  value="password"
                  register={register}
                  setValue={setValue}
                />
              </div>
              <div className="flex gap-2">
                <InputBox
                  key={`smtp-${refreshKey}`}
                  placeholder="SMTP"
                  value="smtp"
                  register={register}
                  setValue={setValue}
                  defaultValue="smtp.gmail.com"
                />
                <InputBox
                  key={`port-${refreshKey}`}
                  placeholder="Port"
                  value="port"
                  register={register}
                  setValue={setValue}
                  defaultValue="587"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {/* <OutlinedButtonRed label="Close" className="text-sm px-10 py-1" /> */}
          </div>
          <div className="flex gap-2">
            <OutlinedButtonRed
              onClick={handleScheduleClick}
              type="button"
              label={
                <span className="flex items-center gap-2">
                  Schedule
                  <img
                    src="/schedule.svg"
                    alt="calendar icon"
                    className="w-4 h-4"
                  />
                </span>
              }
            />
            <SimpleButton
              name={
                isSending ? (
                  "Sending..."
                ) : (
                  <span className="flex items-center gap-2">
                    Send
                    <img
                      src="/send-icon.svg"
                      alt="send icon"
                      className="w-4 h-4"
                    />
                  </span>
                )
              }
              // className="text-sm px-10 py-1"
              onClick={() => handleSend(false)}
              type="button"
              disabled={isSending}
            />
          </div>
        </div>
      </form>

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleScheduleOverlayClick}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
            {/* Close Button */}
            <button
              onClick={handleCloseScheduleModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Schedule Email
            </h2>

            {/* Date and Time Inputs */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      placeholder="Select date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      required={true}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    Time
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="time"
                      placeholder="Time (Use 24 hr Format)"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      required={true}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
              <SimpleButton
                onClick={handleScheduleSend}
                className="px-8 py-2 bg-blue-500 hover:bg-blue-600"
                name={`Schedule`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Schedule Success Modal */}
      {showScheduleSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 text-center shadow-lg">
            <h2 className="text-lg font-semibold text-red mb-6">
              ✅ Your email is scheduled!
            </h2>

            <div className="relative w-full h-1 bg-gray-200 overflow-hidden rounded">
              <div
                className="absolute top-0 left-0 h-1 bg-green-500 animate-progressLine"
                onAnimationEnd={() => setShowScheduleSuccessModal(false)}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Sending Progress Modal */}
      {showSendingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              </div>

              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                📧 Sending Emails...
              </h2>

              <p className="text-gray-600 mb-4">{currentSendingFile}</p>

              <div className="w-full bg-gray-200 rounded-full h-4 mb-4 relative overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-700 relative overflow-hidden"
                  style={{
                    width: `${
                      sendingProgress.total > 0
                        ? (sendingProgress.current / sendingProgress.total) *
                          100
                        : 0
                    }%`,
                  }}
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.5s infinite",
                    }}
                  />

                  {sendingProgress.current > 0 && (
                    <React.Fragment>
                      <div
                        className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg"
                        style={{
                          animation: "flowRight 2s infinite",
                          animationDelay: "0s",
                        }}
                      />
                      <div
                        className="absolute top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-green-100 rounded-full"
                        style={{
                          animation: "flowRight 2s infinite",
                          animationDelay: "0.5s",
                        }}
                      />
                      <div
                        className="absolute top-1/2 transform -translate-y-1/2 w-1 h-1 bg-white rounded-full"
                        style={{
                          animation: "flowRight 2s infinite",
                          animationDelay: "1s",
                        }}
                      />
                    </React.Fragment>
                  )}
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-700 drop-shadow-sm">
                    {sendingProgress.current}/{sendingProgress.total} emails
                    sent
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                Progress: {sendingProgress.current}/{sendingProgress.total}
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 relative overflow-hidden">
                <div className="absolute inset-0">
                  <div className="h-full bg-gradient-to-r from-transparent via-green-200 to-transparent opacity-30 animate-pulse" />
                  <div className="absolute top-0 left-0 w-full h-full">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-transparent opacity-20"
                      style={{
                        animation: "slideTransfer 2s ease-in-out infinite",
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center relative z-10">
                  <div className="flex-shrink-0">
                    <span className="text-yellow-400 text-xl animate-bounce">
                      ⚠️
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      <strong className="text-green-700">
                        📤 Files being transferred...
                      </strong>
                      <br />
                      <span className="text-yellow-900">
                        Please do not close this tab! Closing the browser may
                        cause emails to fail.
                      </span>
                    </p>
                  </div>

                  <div className="ml-auto flex space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    <div
                      className="w-2 h-2 bg-green-400 rounded-full animate-ping"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-2 h-2 bg-green-300 rounded-full animate-ping"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageCircular;
