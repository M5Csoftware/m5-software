"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { TableWithCheckbox } from "@/app/components/Table";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { LabeledDropdown } from "../Dropdown";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useContext, useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

function Normal() {
  const { server } = useContext(GlobalContext);
  const { register, setValue, watch } = useForm();
  const [branches, setBranches] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  const customerCode = watch("Customer");
  const selectedBranch = watch("branch");
  const fromDate = watch("from");
  const toDate = watch("to");

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get(`${server}/branch-master`);
        if (response.data && Array.isArray(response.data)) {
          const branchOptions = response.data.map((branch) => branch.code);
          setBranches(branchOptions);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        setNotification({
          type: "error",
          message: "Failed to fetch branches",
          visible: true,
        });
      }
    };
    fetchBranches();
  }, [server]);

  // Fetch customer details when account code changes
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!customerCode) {
        setValue("name", "");
        return;
      }

      try {
        const response = await axios.get(
          `${server}/customer-account?accountCode=${customerCode}`
        );
        if (response.data) {
          setValue("name", response.data.name || "");
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
        setValue("name", "");
      }
    };

    fetchCustomerDetails();
  }, [customerCode, server, setValue]);

  const columns = useMemo(
    () => [
      { key: "invoiceNo", label: "Invoice No" },
      { key: "invoiceDate", label: "Invoice Date" },
      { key: "customerCode", label: "Customer Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "emailId", label: "Email ID" },
      { key: "branch", label: "Branch" },
      { key: "grandTotal", label: "Grand Total" },
    ],
    []
  );

  const toISODate = (val) => {
    if (!val) return null;

    // already yyyy-mm-dd (DateInputBox usually gives this)
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

    // dd/mm/yyyy OR mm/dd/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [a, b, c] = val.split("/");

      // assume DD/MM/YYYY (India usage everywhere in your app)
      const dd = a.padStart(2, "0");
      const mm = b.padStart(2, "0");
      const yyyy = c;

      const iso = `${yyyy}-${mm}-${dd}`;
      const test = new Date(iso);

      return isNaN(test.getTime()) ? null : iso;
    }

    // fallback (Date object / timestamp)
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;

    return d.toISOString().split("T")[0];
  };

  const handleShow = async () => {
    if (!selectedBranch) {
      setNotification({
        type: "error",
        message: "Please select a branch",
        visible: true,
      });
      return;
    }

    if (!fromDate || !toDate) {
      setNotification({
        type: "error",
        message: "Please select date range",
        visible: true,
      });
      return;
    }

    setLoading(true);
    setPdfGenerated(false);

    try {
      const fromISO = toISODate(fromDate);
      const toISO = toISODate(toDate);

      if (!fromISO || !toISO) {
        setNotification({
          type: "error",
          message: "Invalid date range",
          visible: true,
        });
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        branch: selectedBranch,
        fromDate: fromISO,
        toDate: toISO,
      });

      if (customerCode) {
        params.append("customerCode", customerCode);
      }

      const response = await axios.get(
        `${server}/email-invoice?${params.toString()}`
      );

      console.log("API Response:", response.data);

      if (response.data.success && response.data.invoices) {
        const invoices = response.data.invoices;

        console.log(`Found ${invoices.length} invoice(s)`);

        // Fetch customer emails in parallel
        const formattedData = await Promise.all(
          invoices.map(async (invoice) => {
            let email = "";

            // Fetch customer email
            if (invoice.customerCode) {
              try {
                const customerResponse = await axios.get(
                  `${server}/customer-account?accountCode=${invoice.customerCode}`
                );
                if (customerResponse.data?.billingEmailId) {
                  email = customerResponse.data.billingEmailId;
                }
              } catch (error) {
                console.error(
                  `Error fetching email for ${invoice.customerCode}:`,
                  error
                );
              }
            }

            return {
              invoiceNo: invoice.invoiceNo,
              invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString(
                "en-IN"
              ),
              customerCode: invoice.customerCode,
              customerName: invoice.customerName,
              emailId: email,
              branch: invoice.branch,
              grandTotal: `₹${invoice.grandTotal.toFixed(2)}`,
            };
          })
        );

        setRowData(formattedData);

        if (formattedData.length > 0) {
          setNotification({
            type: "success",
            message: `Found ${formattedData.length} invoice(s)`,
            visible: true,
          });
        } else {
          setNotification({
            type: "info",
            message: "No invoices found matching the criteria",
            visible: true,
          });
        }
      } else {
        setRowData([]);
        setNotification({
          type: "info",
          message: response.data.message || "No invoices available",
          visible: true,
        });
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setNotification({
        type: "error",
        message: error.response?.data?.message || "Failed to fetch invoices",
        visible: true,
      });
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (selectedItems.length === 0) {
      setNotification({
        type: "error",
        message: "Please select at least one invoice",
        visible: true,
      });
      return;
    }

    // Validate that all selected invoices have emails
    const itemsWithoutEmail = selectedItems.filter(
      (item) => !item.emailId || item.emailId === "N/A" || item.emailId === ""
    );

    if (itemsWithoutEmail.length > 0) {
      setNotification({
        type: "error",
        message: `${itemsWithoutEmail.length} invoice(s) missing customer email. Cannot generate PDF.`,
        visible: true,
      });
      return;
    }

    setNotification({
      type: "info",
      message: `Preparing ${selectedItems.length} invoice(s) for PDF generation...`,
      visible: true,
    });

    // Simulate PDF generation (in reality, PDFs will be generated when sending email)
    setTimeout(() => {
      setPdfGenerated(true);
      setNotification({
        type: "success",
        message: `${selectedItems.length} invoice(s) ready to send. Click 'Send Email' to proceed.`,
        visible: true,
      });
    }, 500);
  };

  const handleSendEmail = async () => {
    if (selectedItems.length === 0) {
      setNotification({
        type: "error",
        message: "Please select at least one invoice",
        visible: true,
      });
      return;
    }

    if (!pdfGenerated) {
      setNotification({
        type: "error",
        message: "Please generate PDF first before sending email",
        visible: true,
      });
      return;
    }

    // Validate that all selected invoices have emails
    const itemsWithoutEmail = selectedItems.filter(
      (item) => !item.emailId || item.emailId === "N/A" || item.emailId === ""
    );

    if (itemsWithoutEmail.length > 0) {
      setNotification({
        type: "error",
        message: `${itemsWithoutEmail.length} invoice(s) missing customer email`,
        visible: true,
      });
      return;
    }

    setLoading(true);
    setNotification({
      type: "info",
      message:
        "Generating PDFs and sending emails... This may take a few moments",
      visible: true,
    });

    try {
      const response = await axios.post(`${server}/email-invoice`, {
        selectedInvoices: selectedItems,
      });

      if (response.data.success) {
        setPdfGenerated(false);
        setSelectedItems([]);

        setNotification({
          type: "success",
          message: response.data.message,
          visible: true,
        });

        if (response.data.results) {
          console.log("Email Results:", response.data.results);
        }
        if (response.data.errors && response.data.errors.length > 0) {
          console.error("Email Errors:", response.data.errors);
          setNotification({
            type: "warning",
            message: `Sent ${response.data.results.length} email(s). ${response.data.errors.length} failed.`,
            visible: true,
          });
        }
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      setNotification({
        type: "error",
        message: error.response?.data?.message || "Failed to send emails",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRowData([]);
    setSelectedItems([]);
    setPdfGenerated(false);
    setValue("branch", "");
    setValue("Customer", "");
    setValue("name", "");
    setValue("from", "");
    setValue("to", "");
  };

  // Reset PDF generated state when selection changes
  useEffect(() => {
    if (selectedItems.length === 0) {
      setPdfGenerated(false);
    }
  }, [selectedItems]);

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

      <form className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <LabeledDropdown
                options={branches}
                value="branch"
                title="Branch"
                register={register}
                setValue={setValue}
              />
            </div>
            <div className="flex gap-3">
              <div className="w-full">
                <InputBox
                  placeholder="Customer Code"
                  register={register}
                  setValue={setValue}
                  value="Customer"
                />
              </div>

              <DummyInputBoxWithLabelDarkGray
                placeholder="Customer Name"
                register={register}
                setValue={setValue}
                value="name"
              />
              <DateInputBox
                register={register}
                setValue={setValue}
                value="from"
                placeholder="From"
              />
              <DateInputBox
                register={register}
                setValue={setValue}
                value="to"
                placeholder="To"
              />
              <div>
                <OutlinedButtonRed
                  label={loading ? "Loading..." : "Show"}
                  onClick={handleShow}
                  disabled={loading}
                  type="button"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <TableWithCheckbox
            register={register}
            setValue={setValue}
            columns={columns}
            rowData={rowData}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            name="invoices"
          />
        </div>

        <div className="flex justify-between">
          <div>
            {/* <OutlinedButtonRed
              type="button"
              label="Close"
              onClick={handleClose}
            /> */}
          </div>
          <div className="flex gap-2">
            <div className="w-[120%]">
              <OutlinedButtonRed
                type="button"
                label={pdfGenerated ? "✓ PDF Ready" : "Generate PDF"}
                onClick={handleGeneratePDF}
                disabled={loading || selectedItems.length === 0}
                className={pdfGenerated ? "bg-green border-green-600" : ""}
              />
            </div>
            <div className="w-full">
              <SimpleButton
                type="button"
                name={loading ? "Sending..." : "Send Email"}
                onClick={handleSendEmail}
                disabled={
                  loading || selectedItems.length === 0 || !pdfGenerated
                }
              />
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

export default Normal;
