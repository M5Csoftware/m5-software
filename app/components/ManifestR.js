import React, { useState, useContext, useMemo, useEffect, forwardRef, useImperativeHandle } from "react";
import { DummyInputBoxWithLabelDarkGray } from "./DummyInputBox";
import { useForm } from "react-hook-form";
import InputBox from "./InputBox";
import { OutlinedButtonRed, SimpleButton } from "./Buttons";
import DownloadDropdown from "./DownloadDropdown";
import { TableWithSorting } from "./Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import NotificationFlag from "./Notificationflag";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

const ManifestR = forwardRef((props, ref) => {
  const { register, setValue, watch, reset } = useForm();
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  const runNumber = watch("runNumber");

  // Destructure props
  const { tabChange } = props;

  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  // Function to format date from ISO string (2025-11-06T00:00:00.000Z) to DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    try {
      // Handle ISO date string
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      
      return dayjs(date).format("DD/MM/YYYY");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  // Define table columns with separate name and address columns
  const columns = useMemo(
    () => [
      { key: "srNo", label: "Sr.No." },
      { key: "awbNo", label: "AWB NO." },
      { key: "consignorName", label: "CONSIGNOR'S NAME" },
      { key: "consignorAddress", label: "CONSIGNOR'S ADDRESS" },
      { key: "consigneeName", label: "CONSIGNEE NAME" },
      { key: "consigneeAddress", label: "CONSIGNEE ADDRESS" },
      { key: "pcs", label: "PCS" },
      { key: "totalActualWeight", label: "Total Actual Weight" },
      { key: "content", label: "Content" },
      { key: "grandTotal", label: "Value (INR)" },
      { key: "gst", label: "GST" },
      { key: "gstIn", label: "GST In" },
      { key: "sector", label: "Port of Ship" },
      { key: "whethe", label: "Whether" },
      { key: "wheth", label: "Wheth" },
      { key: "totalIg", label: "Total IG" },
    ],
    [],
  );

  const fetchManifestData = async () => {
    if (!runNumber || runNumber.trim() === "") {
      showNotification("error", "Please enter a run number");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(`${server}/branch-manifest/manifestO`, {
        params: { runNo: runNumber.trim() },
      });

      if (response.data.success) {
        const { runData, tableData } = response.data;

        // Populate form fields from Run model - format the date
        setValue("date", formatDate(runData.date) || "");
        setValue("sector", runData.sector || "");
        setValue("a/lMawb", runData.alMawb || "");
        setValue("obc", runData.obc || "");
        setValue("counterPart", runData.counterPart || "");
        setValue("flight", runData.flight || "");

        // Set table data
        setRowData(tableData);

        showNotification(
          "success",
          `Found ${tableData.length} shipments for run ${runNumber} (${runData.accountType})`,
        );
      }
    } catch (error) {
      console.error("Error fetching manifest data:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to fetch manifest data";
      showNotification("error", errorMessage);
      setRowData([]);

      // Clear form fields on error
      setValue("date", "");
      setValue("sector", "");
      setValue("a/lMawb", "");
      setValue("obc", "");
      setValue("counterPart", "");
      setValue("flight", "");
    } finally {
      setLoading(false);
    }
  };

  const handleShow = () => {
    fetchManifestData();
  };

  const handleRefresh = () => {
    setRowData([]);
    setLoading(false);
    setFormKey((prev) => prev + 1);

    reset({
      runNumber: "",
      date: "",
      sector: "",
      "a/lMawb": "",
      obc: "",
      counterPart: "",
      flight: "",
    });

    showNotification("success", "Page refreshed successfully");
  };

  const handleDownloadCSV = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const headers = columns.map((col) => col.label);

      const csvContent = [
        headers.join(","),
        ...rowData.map((row) =>
          columns
            .map((col) => {
              const value = row[col.key] || "";
              return typeof value === "string" && value.includes(",")
                ? `"${value.replace(/"/g, '""')}"`
                : value;
            })
            .join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `manifest_${runNumber}_${new Date().getTime()}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification("success", "CSV file downloaded successfully");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      showNotification("error", "Failed to download CSV file");
    }
  };

  const handleDownloadExcel = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const wsData = [
        columns.map((col) => col.label),
        ...rowData.map((row) => columns.map((col) => row[col.key] || "")),
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      const colWidths = columns.map(() => ({ wch: 20 }));
      ws["!cols"] = colWidths;

      const headerRange = XLSX.utils.decode_range(ws["!ref"]);
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "EEEEEE" } },
          };
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Manifest");
      XLSX.writeFile(wb, `manifest_${runNumber}_${new Date().getTime()}.xlsx`);

      showNotification("success", "Excel file downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      showNotification("error", "Failed to download Excel file");
    }
  };

  const handleDownloadPDF = async () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      // Dynamically import jsPDF
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      
      // Initialize jsPDF in landscape mode with A3 size for more width
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a3" // A3 gives more space than A4
      });
      
      // Calculate current date for footer
      const currentDate = new Date();
      const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
      
      // Add main title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("BRANCH MANIFEST (O) REPORT", doc.internal.pageSize.width / 2, 15, { align: "center" });
      
      // Add subtitle with run details in a box
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      // Draw a box for run details
      doc.setDrawColor(66, 66, 66);
      doc.setLineWidth(0.3);
      doc.rect(10, 20, doc.internal.pageSize.width - 20, 18);
      
      // Left column - Run details
      doc.text(`Run Number: ${runNumber || "N/A"}`, 15, 25);
      doc.text(`Date: ${watch("date") || "N/A"}`, 15, 30);
      doc.text(`Sector: ${watch("sector") || "N/A"}`, 15, 35);
      
      // Middle column
      doc.text(`A/L MAWB: ${watch("a/lMawb") || "N/A"}`, 120, 25);
      doc.text(`Flight: ${watch("flight") || "N/A"}`, 120, 30);
      doc.text(`OBC: ${watch("obc") || "N/A"}`, 120, 35);
      
      // Right column
      doc.text(`Counter Part: ${watch("counterPart") || "N/A"}`, 220, 25);
      doc.text(`Total Records: ${rowData.length}`, 220, 30);
      doc.text(`Generated: ${formattedDate}`, 220, 35);
      
      // Prepare data for table
      const tableData = rowData.map((row, index) => {
        return [
          (index + 1).toString(), // Sr.No.
          row.awbNo || "",
          row.consignorName || "",
          row.consignorAddress || "",
          row.consigneeName || "",
          row.consigneeAddress || "",
          row.pcs || "",
          row.totalActualWeight || "",
          row.content || "",
          row.grandTotal || "",
          row.gst || "",
          row.gstIn || "",
          row.sector || "",
          row.whethe || "",
          row.wheth || "",
          row.totalIg || ""
        ];
      });
      
      // Prepare headers
      const headers = columns.map(col => col.label);
      
      // Optimized column styles for A3 landscape (420mm width)
      const columnStyles = {
        0: { cellWidth: 12, halign: 'center' },   // Sr.No.
        1: { cellWidth: 28, halign: 'left' },     // AWB NO.
        2: { cellWidth: 32, halign: 'left' },     // CONSIGNOR'S NAME
        3: { cellWidth: 40, halign: 'left' },     // CONSIGNOR'S ADDRESS
        4: { cellWidth: 32, halign: 'left' },     // CONSIGNEE NAME
        5: { cellWidth: 40, halign: 'left' },     // CONSIGNEE ADDRESS
        6: { cellWidth: 15, halign: 'center' },   // PCS
        7: { cellWidth: 22, halign: 'right' },    // Total Actual Weight
        8: { cellWidth: 30, halign: 'left' },     // Content
        9: { cellWidth: 22, halign: 'right' },    // Value (INR)
        10: { cellWidth: 18, halign: 'right' },   // GST
        11: { cellWidth: 20, halign: 'left' },    // GST In
        12: { cellWidth: 25, halign: 'left' },    // Port of Ship
        13: { cellWidth: 18, halign: 'center' },  // Whether
        14: { cellWidth: 18, halign: 'center' },  // Wheth
        15: { cellWidth: 20, halign: 'right' }    // Total IG
      };
      
      // Generate table using autoTable
      autoTable(doc, {
        startY: 42,
        head: [headers],
        body: tableData,
        columnStyles: columnStyles,
        theme: 'grid',
        headStyles: {
          fillColor: [66, 66, 66], // Dark gray header
          textColor: [255, 255, 255], // White text
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 2,
          halign: 'center',
          valign: 'middle',
          lineWidth: 0.1,
          lineColor: [200, 200, 200]
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
          valign: 'middle',
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        margin: { left: 10, right: 10, top: 42, bottom: 20 },
        tableWidth: 'auto',
        styles: {
          cellPadding: 2,
          fontSize: 7,
          valign: 'middle',
          minCellHeight: 8,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        didDrawPage: function(data) {
          // Footer
          const pageCount = doc.internal.getNumberOfPages();
          const pageHeight = doc.internal.pageSize.height;
          const pageWidth = doc.internal.pageSize.width;
          
          // Footer line
          doc.setDrawColor(66, 66, 66);
          doc.setLineWidth(0.3);
          doc.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);
          
          // Footer text
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 100, 100);
          
          // Left footer - Company/Report name
          doc.text("Branch Manifest (O) Report", 10, pageHeight - 10);
          
          // Center footer - Page number
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`, 
            pageWidth / 2, 
            pageHeight - 10, 
            { align: "center" }
          );
          
          // Right footer - Date & Time
          const now = new Date();
          const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          doc.text(
            `${formattedDate} ${timeString}`, 
            pageWidth - 10, 
            pageHeight - 10, 
            { align: "right" }
          );
        },
        didParseCell: function(data) {
          // Add subtle borders
          if (data.section === 'head') {
            data.cell.styles.lineWidth = 0.2;
            data.cell.styles.lineColor = [150, 150, 150];
          }
        }
      });
      
      // Save PDF
      doc.save(`manifest_${runNumber}_${new Date().getTime()}.pdf`);
      
      showNotification("success", "PDF file downloaded successfully");
      
    } catch (error) {
      console.error("Error downloading PDF:", error);
      showNotification("error", "Failed to download PDF file");
    }
  };

  const handleEmail = () => {
    showNotification("info", "Email functionality coming soon");
  };

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    handleRefresh: () => {
      handleRefresh();
    }
  }));

  return (
    <form key={formKey}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <div className="flex flex-col gap-5 mt-6">
        <div className="flex flex-col gap-3">
          <div className="">
            <h2 className="text-[16px] text-red font-semibold">Run Details</h2>
          </div>

          <div className="w-full flex gap-6">
            <div className="flex flex-col w-full items-center gap-3">
              <InputBox
                placeholder="Run Number"
                register={register}
                setValue={setValue}
                value="runNumber"
              />
              <div className="w-full flex flex-col gap-3">
                <DummyInputBoxWithLabelDarkGray
                  label={`Sector`}
                  register={register}
                  setValue={setValue}
                  value={`sector`}
                />
                <DummyInputBoxWithLabelDarkGray
                  label={`A/L MAWB`}
                  register={register}
                  setValue={setValue}
                  value={`a/lMawb`}
                />
                <DummyInputBoxWithLabelDarkGray
                  label={`OBC`}
                  register={register}
                  setValue={setValue}
                  value={`obc`}
                />
              </div>
            </div>

            <div className="w-full flex flex-col gap-3">
              <DummyInputBoxWithLabelDarkGray
                label={`Date`}
                register={register}
                setValue={setValue}
                value={`date`}
              />
              <DummyInputBoxWithLabelDarkGray
                label={`Counter Part`}
                register={register}
                setValue={setValue}
                value={`counterPart`}
              />
              <DummyInputBoxWithLabelDarkGray
                label={`Flight`}
                register={register}
                setValue={setValue}
                value={`flight`}
              />
              <div className="flex justify-end">
                <div className="flex gap-3">
                  <OutlinedButtonRed
                    label={loading ? "Loading..." : "Show"}
                    onClick={handleShow}
                    disabled={loading}
                  />
                  <DownloadDropdown
                    name={"Download"}
                    handleDownloadExcel={handleDownloadExcel}
                    handleDownloadCSV={handleDownloadCSV}
                    handleDownloadPDF={handleDownloadPDF}
                  />
                  <SimpleButton name={"Email"} onClick={handleEmail} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="flex flex-col gap-3 mt-6">
          <TableWithSorting
            register={register}
            setValue={setValue}
            name="manifest"
            columns={columns}
            rowData={rowData}
            className="h-96"
          />
        </div>
      </div>
    </form>
  );
});

export default ManifestR;