"use client";
import { useState, useEffect, useContext } from "react";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";

export default function ClientReport() {
  const { register, setValue, watch } = useForm();
  const [clients, setClients] = useState([]);
  const { server } = useContext(GlobalContext); // ✅ use same backend
  const query = (watch("customerSearch") || "").toString();
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });
  const showNotification = (type, message) =>
    setNotification({ type, message, visible: true });

  const columns = [
    { key: "accountCode", label: "Code" },
    { key: "name", label: "Customer Name" },
    { key: "addressLine1", label: "Address 1" },
    { key: "addressLine2", label: "Address 2" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "pinCode", label: "Pincode" },
    { key: "email", label: "Email" },
    { key: "telNo", label: "Telephone" },
    { key: "branch", label: "Branch" },
  ];

  // load initially
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch(`${server}/customer-account`); // ✅ same as working
        const data = await res.json();
        console.log("Fetched clients:", data);
        showNotification("success", `Fetched ${data.length} Clients`);
        setClients(data);
        setValue("customerSearch", "");
      } catch (err) {
        console.error("Error fetching clients:", err);
        showNotification("error", "Error fetching clients");
      }
    };
    fetchClients();
  }, [server, setValue]);

  // normalize + fuzzy helpers
  const norm = (s) =>
    (s ?? "").toString().toLowerCase().replace(/\s+/g, "").trim();
  const escapeReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fuzzy = (text, q) => {
    const nText = norm(text);
    const nQ = norm(q);
    if (!nQ) return true;
    if (nText.includes(nQ)) return true;
    const pattern = nQ.split("").map(escapeReg).join(".*");
    return new RegExp(pattern).test(nText);
  };

  // filter by code OR name
  const filteredClients = clients.filter(
    (c) => fuzzy(c.accountCode, query) || fuzzy(c.name, query)
  );

  // 🔥 notify when they type something and get no results
  useEffect(() => {
    if (query && filteredClients.length === 0) {
      showNotification("error", "No matching clients found");
    }
  }, [query, filteredClients.length]);

  const handleDownloadCSV = () => {
    if (filteredClients.length === 0) {
      showNotification("error", "No data to download"); // 🔥 added
      return;
    }

    const headers = columns.map((col) => col.label).join(",");
    const rows = filteredClients.map((client) =>
      columns.map((col) => client[col.key] ?? "").join(",")
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "client_report.csv";

    a.click();
    window.URL.revokeObjectURL(url);

    showNotification("success", "Report Downloaded"); // 🔥 works same as your other screens
  };

  return (
    <div className="flex flex-col gap-4">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <Heading
        title="Client Report"
        onRefresh={async () => {
          try {
            const res = await fetch(`${server}/customer-account`);
            const data = await res.json();
            setClients(data);
            setValue("customerSearch", "");

            showNotification("success", "Client list refreshed"); // 🔥 added
          } catch (err) {
            console.error("Error refreshing clients:", err);
            showNotification("error", "Error refreshing clients"); // 🔥 added
          }
        }}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
      />

      <div className="flex gap-2">
        <div className="flex-1">
          <InputBox
            placeholder="Search by Code or Name"
            register={register}
            setValue={setValue}
            value="customerSearch"
            onChange={(e) => setValue("customerSearch", e.target.value)}
          />
        </div>

        <div className="w=[10%]">
          <SimpleButton name="Download CSV" onClick={handleDownloadCSV} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-md">
        <TableWithSorting
          register={register}
          setValue={setValue}
          name="Client Report"
          columns={columns}
          rowData={filteredClients}
          className="min-h-[60vh]"
        />
      </div>

      <div className="flex justify-between">
        <div>{/* <OutlinedButtonRed label="Close" /> */}</div>
      </div>
    </div>
  );
}
