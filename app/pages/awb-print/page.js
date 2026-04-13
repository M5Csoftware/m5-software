"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, { MultipleEntryInputBox } from "@/app/components/InputBox";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import RedCheckbox from "@/app/components/RedCheckBox";
import { TableWithSorting } from "@/app/components/Table";
import React, {
  useImperativeHandle,
  forwardRef,
  useRef,
  useState,
  useEffect,
  useContext,
} from "react";
import { useForm } from "react-hook-form";
import Invoice from "./AwbInvoice";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";
import { startTransition } from "react";
import MultipleInvoice from "./MultipleInvoice";
import pushAWBLog from "@/app/lib/pushAWBLog";

const AwbPrint = () => {
  const [demoRadio, setDemoRadio] = useState("awbWise");
  const { setValue, register, reset } = useForm();
  const [refreshKey, setRefreshKey] = useState(0);

  const awbRef = useRef();
  const runRef = useRef();
  const manifestRef = useRef();

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div>
      <Heading
        title="AWB Print"
        codeListBtn="hidden"
        bulkUploadBtn="hidden"
        onRefresh={handleRefresh}
      />
      <div className="flex gap-3 mb-8 mt-6">
        <RadioButtonLarge
          setValue={setValue}
          register={register}
          name="AWB Wise"
          label="AWB Wise"
          id="awbWise"
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          setValue={setValue}
          register={register}
          name="Run Wise"
          label="Run Wise"
          id="runWise"
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          setValue={setValue}
          register={register}
          name="Manifest No."
          label="Manifest No."
          id="manifestNo"
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
      </div>

      <div>
        {demoRadio == "awbWise" && (
          <AwbWise
            key={`awb-${refreshKey}`}
            setValue={setValue}
            register={register}
          />
        )}
        {demoRadio == "runWise" && (
          <RunWise
            key={`run-${refreshKey}`}
            setValue={setValue}
            register={register}
          />
        )}
        {demoRadio == "manifestNo" && (
          <ManifestNo
            key={`manifest-${refreshKey}`}
            setValue={setValue}
            register={register}
          />
        )}
      </div>

      <div className="flex justify-start mt-3">
        <div></div>
      </div>
    </div>
  );
};

export default AwbPrint;

const AwbWise = forwardRef((props, ref) => {
  const invoiceRef = useRef();
  const multipleInvoiceRef = useRef();
  const [multipleInvoicesData, setMultipleInvoicesData] = useState([]);
  const { setValue, register, watch, reset } = useForm();
  const { server } = useContext(GlobalContext);
  const [withTransportCharges, setWithTransportCharges] = useState(false);
  const [canadaAwbPrint, setCanadaAwbPrint] = useState(false);
  const multipleAwbRef = useRef(null);
  const [size, setSize] = useState("A4");
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const awbNo = watch("awbNo");
  const [debouncedAwb, setDebouncedAwb] = useState("");

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedAwb(awbNo);
    }, 500);

    return () => clearTimeout(handler);
  }, [awbNo]);

  useImperativeHandle(ref, () => ({
    resetAll: () => {
      setValue("awbNo", "");
      setValue("size", "A4");
      setValue("company", "M 5 CONTINENT LOGISTICS SOLUTION (P) LTD");
      setInvoiceData(null);
      setMultipleInvoicesData([]);
      setWithTransportCharges(false);
      setCanadaAwbPrint(false);
      multipleAwbRef.current?.clearAll?.();
      setLoading(false);
    },
  }));

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  useEffect(() => {
    const fetchAwbInvoice = async (awb) => {
      if (!awb) return;
      setLoading(true);
      try {
        const res = await fetch(`${server}/awb-print?awbNo=${awb}`);
        if (!res.ok) throw new Error("AWB not found");
        const data = await res.json();
        setInvoiceData({
          ...data,
          date: formatDate(data.date),
          createdAt: formatDate(data.createdAt),
        });

        showNotification("success", `Invoice for AWB ${awb} loaded`);
      } catch (err) {
        console.error(err);
        setInvoiceData(null);
        showNotification("error", `AWB ${awb} not found`);
      } finally {
        setLoading(false);
      }
    };

    if (debouncedAwb) {
      fetchAwbInvoice(debouncedAwb);
    }
  }, [debouncedAwb]);

  const handleMultiPrint = async () => {
    if (!multipleAwbRef.current) return;
    const awbList = multipleAwbRef.current.getValues();
    if (!awbList.length) {
      showNotification("error", "No AWB numbers to print");
      return;
    }

    setLoading(true);

    try {
      showNotification("success", `Fetching ${awbList.length} invoices...`);

      const allInvoiceData = [];
      for (const awb of awbList) {
        try {
          const res = await fetch(`${server}/awb-print?awbNo=${awb}`);
          if (!res.ok) {
            showNotification("error", `AWB ${awb} not found, skipping...`);
            continue;
          }
          const data = await res.json();
          allInvoiceData.push({
            ...data,
            date: formatDate(data.date),
            createdAt: formatDate(data.createdAt),
            company: watch("company"),
          });
        } catch (err) {
          console.error(`Error fetching AWB ${awb}:`, err);
        }
      }

      if (allInvoiceData.length === 0) {
        showNotification("error", "No valid invoices found");
        setLoading(false);
        return;
      }

      setMultipleInvoicesData(allInvoiceData);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showNotification(
        "success",
        `Generating PDF with ${allInvoiceData.length} invoices...`
      );
      await multipleInvoiceRef.current?.downloadPdf();

      showNotification(
        "success",
        `Successfully downloaded ${allInvoiceData.length} invoices!`
      );
      
      // Log label prints
      for (const inv of allInvoiceData) {
        pushAWBLog({
          server,
          awbNo: inv.awbNo,
          action: "AWB Label Printed (Bulk)",
          actionUser: "11111111",
          meta: { size, component: "MultipleAwb Print" }
        }).catch(err => console.error(err));
      }

      setMultipleInvoicesData([]);
    } catch (err) {
      console.error(err);
      showNotification("error", "Error generating combined PDF");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setValue("company", "M 5 CONTINENT LOGISTICS SOLUTION (P) LTD");
  }, [setValue]);

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <div className="flex gap-10">
        <div className="w-1/2 flex flex-col gap-3">
          <RedLabelHeading label={`AWB Details`} />
          <div>
            <InputBox
              register={register}
              setValue={setValue}
              value={`company`}
              placeholder="Company"
              initialValue={watch("company")}
            />
          </div>
          <div>
            <InputBox
              register={register}
              setValue={setValue}
              value={`awbNo`}
              placeholder="Awb Number"
            />
          </div>
          <div className="flex gap-4 mb-4">
            <RedCheckbox
              id="withTransportCharges"
              register={register}
              setValue={setValue}
              isChecked={withTransportCharges}
              setChecked={setWithTransportCharges}
              label="With Transport Charges"
            />
            <RedCheckbox
              id="canadaAwbPrint"
              register={register}
              setValue={setValue}
              isChecked={canadaAwbPrint}
              setChecked={setCanadaAwbPrint}
              label="Canada Awb Print"
            />
          </div>

          <div className="flex gap-4">
            <div className="w-full">
              <LabeledDropdown
                value="size"
                options={["A4", "4'X6'", "2X2"]}
                setValue={(_, val) => setSize(val)}
                register={register}
                title="Size"
                defaultValue={"A4"}
              />
            </div>

            <div>
              <SimpleButton
                name={loading ? "Loading..." : "Print"}
                onClick={async () => {
                  if (!awbNo) {
                    showNotification("error", "Please enter an AWB number");
                    return;
                  }

                  if (!size) {
                    showNotification("error", "Please select a size");
                    return;
                  }

                  if (!invoiceData) {
                    showNotification("error", "AWB Number Not found");
                    return;
                  }
                  setLoading(true);
                  showNotification(
                    "success",
                    `Downloading invoice for AWB ${awbNo}...`
                  );
                  try {
                    await invoiceRef.current?.downloadPdf();
                    showNotification(
                      "success",
                      `Invoice for AWB ${awbNo} downloaded`
                    );

                    // Log label print
                    await pushAWBLog({
                      server,
                      awbNo: awbNo,
                      action: "AWB Label Printed",
                      actionUser: "11111111",
                      meta: { size, component: "AwbWise Print" }
                    }).catch(err => console.error(err));
                  } catch (err) {
                    console.error(err);
                    showNotification(
                      "error",
                      `Failed to download AWB ${awbNo}`
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className={
                  loading ? "bg-red opacity-80 cursor-not-allowed" : "bg-red"
                }
              />
            </div>
          </div>
        </div>

        <div className="w-1/2">
          <RedLabelHeading label={`Add Multiple AWB Number`} />
          <div className="rounded-lg w-full flex flex-col p-4 pl-0 pt-0 gap-4">
            <div className="flex flex-col gap-2 mt-2">
              <MultipleEntryInputBox
                value="multipleAwbNos"
                setValue={setValue}
                register={register}
                placeholder="Type or paste multiple AWB numbers"
                ref={multipleAwbRef}
              />
            </div>

            <div className="flex justify-end items-center gap-2 mt-2">
              <div>
                <OutlinedButtonRed
                  label="Clear"
                  onClick={() => {
                    multipleAwbRef.current?.clearAll();
                    showNotification("success", "AWB list cleared");
                  }}
                />
              </div>
              <div>
                <SimpleButton
                  name={loading ? "Loading..." : "Print All"}
                  onClick={handleMultiPrint}
                  className={
                    loading ? "bg-red opacity-80 cursor-not-allowed" : "bg-red"
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="pdf-capture" className="w-full absolute -left-[9999px]">
        {invoiceData ? (
          <Invoice
            ref={invoiceRef}
            data={{ ...invoiceData, company: watch("company") }}
            size={size}
          />
        ) : (
          <p className="text-gray-500">Enter a valid AWB number</p>
        )}
      </div>
      <MultipleInvoice
        ref={multipleInvoiceRef}
        invoicesData={multipleInvoicesData}
        size={size}
      />
    </>
  );
});

const RunWise = forwardRef((props, ref) => {
  const multipleInvoiceRef = useRef();
  const [multipleInvoicesData, setMultipleInvoicesData] = useState([]);
  const { setValue, register, watch, reset } = useForm();
  const { server } = useContext(GlobalContext);
  const invoiceRef = useRef();
  const [withTransportCharges, setWithTransportCharges] = useState(false);
  const [canadaAwbPrint, setCanadaAwbPrint] = useState(false);
  const [size, setSize] = useState("A4");
  const [rowData, setRowData] = useState([]);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runNo = watch("runNo");
  const bagNo = watch("bagNo");
  const company = watch("company");

  const [debouncedRun, setDebouncedRun] = useState("");
  const [debouncedBag, setDebouncedBag] = useState("");
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  useImperativeHandle(ref, () => ({
    resetAll: () => {
      reset({
        company: "M 5 CONTINENT LOGISTICS SOLUTION (P) LTD",
        runNo: "",
        bagNo: "",
        size: "A4",
      });
      setRowData([]);
      setInvoiceData(null);
      setMultipleInvoicesData([]);
      setWithTransportCharges(false);
      setCanadaAwbPrint(false);
    },
  }));

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedRun(runNo);
      setDebouncedBag(bagNo);
    }, 500);
    return () => clearTimeout(handler);
  }, [runNo, bagNo]);

  const columns = [
    { key: "awbNo", label: "AWB No." },
    { key: "bagNo", label: "Bag No." },
    { key: "runwiseDate", label: "Date" },
    { key: "consigneeName", label: "Consignee" },
    { key: "accountCode", label: "Customer Code" },
  ];

  // Update the formatDate function in RunWise component
  const formatDate = (d) => {
    if (!d) return "";

    let date;

    // Handle different date formats
    if (typeof d === "string") {
      // Try to parse string date
      date = new Date(d);

      // If it's a MySQL/ISO date string, handle it
      if (d.includes("-") && d.includes("T")) {
        // ISO format
        date = new Date(d);
      } else if (d.includes("-")) {
        // MySQL date format YYYY-MM-DD
        date = new Date(d);
      } else if (d.includes("/")) {
        // Already in DD/MM/YYYY format
        return d;
      }
    } else if (d instanceof Date) {
      date = d;
    } else {
      date = new Date(d);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date received:", d);
      return "Invalid Date";
    }

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  useEffect(() => {
    const fetchRunData = async () => {
      if (!debouncedRun) {
        setRowData([]);
        setInvoiceData(null);
        return;
      }
      setLoading(true);
      try {
        const url = new URL(`${server}/awb-print/run`);
        url.searchParams.set("runNo", debouncedRun);
        if (debouncedBag) url.searchParams.set("bagNo", debouncedBag);

        const res = await fetch(url);
        if (!res.ok) throw new Error("No shipments found");

        const dataList = await res.json();

        // Debug logging
        // console.log("🔍 Raw API Data:", dataList);
        // console.log("🔍 First item date fields:", {
//           date: dataList[0]?.date,
//           createdAt: dataList[0]?.createdAt,
//           created_at: dataList[0]?.created_at,
//           bookingDate: dataList[0]?.bookingDate,
//         });

        // Try multiple date fields in priority order
        const awbs = dataList.map((r) => {
          // Determine which date field to use
          let dateToFormat =
            r.date || r.createdAt || r.created_at || r.bookingDate || r.runDate;
          // console.log("📅 Date to format for", r.awbNo, ":", dateToFormat);

          const formattedDate = formatDate(dateToFormat);
          // console.log("📅 Formatted date for", r.awbNo, ":", formattedDate);

          return {
            awbNo: r.awbNo,
            bagNo: r.bagNo,
            runwiseDate: formattedDate,
            consigneeName: r.consigneeName || "",
            accountCode: r.accountCode || "",
          };
        });

        // console.log("🔍 Final table data:", awbs);

        setRowData(awbs);

        if (awbs.length > 0) {
          setInvoiceData(dataList[0]);
          showNotification("success", `Run ${debouncedRun} data loaded`);
        } else {
          setInvoiceData(null);
          showNotification(
            "error",
            `No shipments found for Run ${debouncedRun}`
          );
        }
      } catch (err) {
        console.error(err);
        setRowData([]);
        setInvoiceData(null);
        showNotification("error", `Failed to fetch Run ${debouncedRun}`);
      } finally {
        setLoading(false);
      }
    };
    fetchRunData();
  }, [debouncedRun, debouncedBag, server]);

  const handlePrintAll = async () => {
    if (!rowData.length) {
      showNotification("error", "No shipments found");
      return;
    }

    setLoading(true);
    try {
      showNotification("success", `Fetching ${rowData.length} invoices...`);
      const allData = [];

      for (const row of rowData) {
        try {
          const res = await fetch(`${server}/awb-print?awbNo=${row.awbNo}`);
          if (!res.ok) {
            showNotification(
              "error",
              `AWB ${row.awbNo} not found, skipping...`
            );
            continue;
          }
          const data = await res.json();

          allData.push({
            ...data,
            company: watch("company"),
          });
        } catch (err) {
          console.error(`Error fetching AWB ${row.awbNo}:`, err);
        }
      }

      if (!allData.length) {
        showNotification("error", "No valid invoices found");
        return;
      }

      setMultipleInvoicesData(allData);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await multipleInvoiceRef.current?.downloadPdf();

      showNotification(
        "success",
        `Successfully generated ${allData.length} invoices in one PDF`
      );

      // Log label prints
      for (const inv of allData) {
        pushAWBLog({
          server,
          awbNo: inv.awbNo,
          action: "AWB Label Printed (Run Wise)",
          actionUser: "11111111",
          meta: { size: watch("size"), runNo: watch("runNo") }
        }).catch(err => console.error(err));
      }

      setMultipleInvoicesData([]);
    } catch (err) {
      console.error(err);
      showNotification("error", "Error generating combined PDF");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setValue("company", "M 5 CONTINENT LOGISTICS SOLUTION (P) LTD");
  }, [setValue]);

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <div className="flex gap-10">
        <div className="w-1/2 flex flex-col gap-3">
          <RedLabelHeading label="AWB Details" />
          <InputBox
            register={register}
            setValue={setValue}
            value="company"
            placeholder="Company"
            initialValue={watch("company")}
          />
          <div className="flex gap-3">
            <InputBox
              register={register}
              setValue={setValue}
              value="runNo"
              placeholder="Run Number"
            />
            <InputBox
              register={register}
              setValue={setValue}
              value="bagNo"
              placeholder="Bag Number"
            />
          </div>

          <div className="flex gap-4 mb-4">
            <RedCheckbox
              id="withTransportCharges"
              register={register}
              setValue={setValue}
              isChecked={withTransportCharges}
              setChecked={setWithTransportCharges}
              label="With Transport Charges"
            />
            <RedCheckbox
              id="canadaAwbPrint"
              register={register}
              setValue={setValue}
              isChecked={canadaAwbPrint}
              setChecked={setCanadaAwbPrint}
              label="Canada Awb Print"
            />
          </div>

          <div className="flex gap-4">
            <div className="w-full">
              <LabeledDropdown
                value="size"
                options={["A4", "4'X6'", "2X2"]}
                setValue={(_, val) => setSize(val)}
                register={register}
                title="Size"
                defaultValue={"A4"}
              />
            </div>
            <div>
              <SimpleButton
                name={loading ? "Loading..." : "Print"}
                onClick={handlePrintAll}
                disabled={loading}
                className={
                  loading ? "bg-red opacity-80 cursor-not-allowed" : "bg-red"
                }
              />
            </div>
          </div>
        </div>

        <div className="w-1/2">
          <RedLabelHeading label="Preview" />
          <div className="rounded-lg w-full mt-2">
            <TableWithSorting
              columns={columns}
              rowData={rowData || []}
              setValue={setValue}
              register={register}
            />
          </div>
        </div>
      </div>

      <div className="w-full absolute -left-[9999px]">
        <MultipleInvoice
          ref={multipleInvoiceRef}
          invoicesData={multipleInvoicesData}
          size={size}
        />
      </div>
    </>
  );
});

const ManifestNo = forwardRef((props, ref) => {
  const { setValue, register, watch, reset } = useForm();
  const [withTransportCharges, setWithTransportCharges] = useState(false);
  const [canadaAwbPrint, setCanadaAwbPrint] = useState(false);
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const invoiceRef = useRef();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const manifestNo = watch("manifestNo");
  const size = watch("size") || "A4";
  const [debouncedManifest, setDebouncedManifest] = useState("");
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  useImperativeHandle(ref, () => ({
    resetAll: () => {
      reset({
        company: "M 5 CONTINENT LOGISTICS SOLUTION (P) LTD",
        manifestNo: "",
        size: "A4",
      });
      setRowData([]);
      setInvoiceData(null);
      setWithTransportCharges(false);
      setCanadaAwbPrint(false);
    },
  }));

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedManifest(manifestNo);
    }, 500);

    return () => clearTimeout(handler);
  }, [manifestNo]);

  const columns = [
    { key: "awbNo", label: "AWB No." },
    { key: "manifestNoDate", label: "Date" },
    { key: "customer", label: "Customer Name" },
    { key: "accountCode", label: "Customer Code" },
  ];

  // Also update the ManifestNo component similarly:
  const formatDate = (d) => {
    if (!d) return "";

    let date;

    // Handle different date formats
    if (typeof d === "string") {
      // Try to parse string date
      date = new Date(d);

      // If it's a MySQL/ISO date string, handle it
      if (d.includes("-") && d.includes("T")) {
        // ISO format
        date = new Date(d);
      } else if (d.includes("-")) {
        // MySQL date format YYYY-MM-DD
        date = new Date(d);
      } else if (d.includes("/")) {
        // Already in DD/MM/YYYY format
        return d;
      }
    } else if (d instanceof Date) {
      date = d;
    } else {
      date = new Date(d);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date received:", d);
      return "Invalid Date";
    }

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Update the ManifestNo useEffect
  useEffect(() => {
    const fetchManifestData = async () => {
      if (!debouncedManifest) {
        setRowData([]);
        setInvoiceData(null);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `${server}/awb-print/manifest?manifestNo=${debouncedManifest}`
        );
        if (!res.ok) throw new Error("No shipments found");
        const dataList = await res.json();

        // console.log("🔍 Raw API Data (Manifest):", dataList);

        const formattedData = dataList.map((d) => {
          let dateToFormat =
            d.date ||
            d.createdAt ||
            d.created_at ||
            d.bookingDate ||
            d.manifestDate;
          // console.log("📅 Date to format for", d.awbNo, ":", dateToFormat);

          const formattedDate = formatDate(dateToFormat);
          // console.log("📅 Formatted date for", d.awbNo, ":", formattedDate);

          return {
            awbNo: d.awbNo,
            manifestNoDate: formattedDate,
            customer: d.consigneeName || d.customer || "",
            accountCode: d.accountCode || "",
          };
        });

        // console.log("🔍 Final table data (Manifest):", formattedData);

        setRowData(formattedData);

        if (dataList.length > 0) {
          setInvoiceData({
            ...dataList[0],
            company: watch("company"),
          });
          showNotification(
            "success",
            `Manifest ${debouncedManifest} loaded successfully`
          );
        } else {
          showNotification(
            "error",
            `No shipments found for Manifest ${debouncedManifest}`
          );
        }
      } catch (err) {
        console.error(err);
        setRowData([]);
        setInvoiceData(null);
        showNotification("error", `Please Enter a Valid Manifest Number`);
      } finally {
        setLoading(false);
      }
    };

    fetchManifestData();
  }, [debouncedManifest, server]);

  const handleManifestPrint = async () => {
    if (!size) {
      showNotification("error", "Please select a size");
      return;
    }
    if (!manifestNo || rowData.length === 0) {
      showNotification("error", "No shipments found for Manifest");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${server}/awb-print/manifest?manifestNo=${manifestNo}`
      );
      if (!res.ok) throw new Error("No shipments found");

      const dataList = await res.json();
      for (const data of dataList) {
        setInvoiceData({
          ...data,
          company: watch("company"),
        });

        showNotification(
          "success",
          `Downloading invoice for AWB ${data.awbNo}...`
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
        await invoiceRef.current?.downloadPdf();
        showNotification("success", `Invoice for AWB ${data.awbNo} downloaded`);

        // Log label print
        await pushAWBLog({
          server,
          awbNo: data.awbNo,
          action: "AWB Label Printed (Manifest)",
          actionUser: "11111111",
          meta: { manifestNo, size }
        }).catch(err => console.error(err));
      }
      showNotification(
        "success",
        `All invoices for Manifest ${manifestNo} downloaded`
      );
    } catch (err) {
      console.error(err);
      showNotification(
        "error",
        `Error downloading invoices for Manifest ${manifestNo}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setValue("company", "M 5 CONTINENT LOGISTICS SOLUTION (P) LTD");
  }, [setValue]);

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <div className="flex gap-10">
        {/* Left */}
        <div className="w-1/2 flex flex-col gap-3">
          <RedLabelHeading label={`Manifest Details`} />
          <InputBox
            register={register}
            setValue={setValue}
            value="company"
            placeholder="Company"
            initialValue={watch("company")}
          />
          <InputBox
            register={register}
            setValue={setValue}
            value="manifestNo"
            placeholder="Manifest Number"
          />

          <div className="flex gap-4 mb-4">
            <RedCheckbox
              id="withTransportCharges"
              register={register}
              setValue={setValue}
              isChecked={withTransportCharges}
              setChecked={setWithTransportCharges}
              label="With Transport Charges"
            />
            <RedCheckbox
              id="canadaAwbPrint"
              register={register}
              setValue={setValue}
              isChecked={canadaAwbPrint}
              setChecked={setCanadaAwbPrint}
              label="Canada Awb Print"
            />
          </div>

          <div className="flex gap-4">
            <div className="w-full">
              <LabeledDropdown
                value="size"
                options={["A4", "4'X6'", "2X2"]}
                setValue={setValue}
                register={register}
                title="Size"
                defaultValue={"A4"}
              />
            </div>
            <div>
              <SimpleButton
                name={loading ? "Loading..." : "Print"}
                onClick={handleManifestPrint}
                className={
                  loading ? "bg-red opacity-80 cursor-not-allowed" : "bg-red"
                }
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="w-1/2">
          <RedLabelHeading label="Preview" />
          <div className="rounded-lg w-full mt-2">
            <TableWithSorting
              setValue={setValue}
              register={register}
              columns={columns}
              rowData={rowData}
            />
          </div>
        </div>
      </div>

      {/* Hidden Invoice for PDF */}
      <div className="w-full absolute -left-[9999px]">
        {invoiceData && (
          <Invoice
            ref={invoiceRef}
            data={{ ...invoiceData, company: watch("company") }} // ✅ add company here
            size={size}
          />
        )}
      </div>
    </>
  );
});
