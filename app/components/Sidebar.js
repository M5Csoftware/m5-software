"use client";
import React, { useState, useContext, useEffect } from "react";
import Image from "next/image";
import { GlobalContext } from "../lib/GlobalContext";
import { useAuth } from "../Context/AuthContext";
import UpdateNotification from "./UpdateNotification";

// Sidebar component
function Sidebar() {
  const [activeFolder, setActiveFolder] = useState(["Admin"]);
  const [reportOpen, toggleReportOpen] = useState(false);
  const [operationreportOpen, setOperationreportOpen] = useState(false);
  const [branchreportOpen, setBranchreportOpen] = useState(false);
  const [billingReportOpen, setBillingReportOpen] = useState(false);

  const [accountReportOpen, setAccountReportOpen] = useState(false);
  const [accountSummaryOpen, setAccountSummaryOpen] = useState(false);
  const { activeTabs, setActiveTabs, setCurrentTab } =
    useContext(GlobalContext);
  const { user } = useAuth();

  // useEffect(() => {
  //   // console.log("User Permissions:", user?.permissions);
  // }, [user]);

  const toggleFolder = (folder) => {
    setActiveFolder((prev) =>
      prev.includes(folder)
        ? prev.filter((item) => item !== folder)
        : [...prev, folder],
    );
  };

  const handleSubfolderClick = (folder, subfolder) => {
    const tab = { folder, subfolder };
    if (folder === "Customer Care" && subfolder === "Report") {
      toggleReportOpen(!reportOpen);
      // console.log(reportOpen);
      return;
    } else if (folder === "Operations" && subfolder === "Report") {
      setOperationreportOpen(!operationreportOpen);
      // console.log(operationreportOpen);
      return;
    } else if (folder === "Booking" && subfolder === "Report") {
      setBranchreportOpen(!branchreportOpen);
      // console.log(branchreportOpen);
      return;
    }
    setActiveTabs((prev) =>
      prev.some(
        (item) => item.folder === folder && item.subfolder === subfolder,
      )
        ? prev
        : [...prev, tab],
    );
    setCurrentTab(subfolder);
  };

  const folders = [
    {
      name: "Admin",
      subfolders: [
        "Entity Manager",
        "Branch Master",
        "Vendor Master",
        "Customer",
        "Employee Master",
        "Tax Settings",
        "Fuel Settings",
        "Shipper Tariff",
        "Shipper Tariff Bulk",
        // "Modify Shipper Tariff",
        "Assign Customer & Target",
        "Assign Sector",
        "Custom Reports",
        "KYC Verification",
        "API Management",
        "Service Master",
        "Customer Discount",
        "Delete Shipment",
      ],
    },
    {
      name: "Booking",
      subfolders: [
        "AWB Entry",
        "Digital Tally",
        "Manifest",
        "Hub InScan (Client)",
        "Quick Inscan",
        "Manifest Close",
        "Bulk Upload",
        "RTO Shipment",
        "International Pickup Order",
        "Alert Messages",
        // "Branch Manifest Report",
      ],
    },
    {
      name: "Operations",
      subfolders: [
        "Run Entry",
        "Clubbing",
        "Bagging",
        "Create Child Number",
        "Run Transfer",
        "Branch Bagging",
        "Offload Shipment",
        "Awb Print",
        "Overseas Manifest",
        "Bagging With Barcode",
        "Run Process",
      ],
    },
    {
      name: "Labels",
      subfolders: [
        "AMS DPD",
        "YYZ UPS",
        "YVR UPS",
        "UK DPD",
        "Courier Please",
        "LHR FEDEX",
      ],
    },
    {
      name: "Account",
      subfolders: [
        "Payment Entry",
        "Credit Limit Temp",
        "Account Ledger",
        "Zone",
        "Rate Sheet",
        "Expense Entry",
        // "Payment Receipt Summary",
        // "Total Outstanding",
        // "Run Wise Sale Report",
        "Amount Log",
        "Credit Note",
        // "Credit Summary Report",
        "Debit Note",
        // "Debit Summary Report",
        // "Claim For Lost Shipment",
        // "Claim For Lost Shipment Summary",
        // "Discount Credit Note",
        // "Discount Credit Note Summary",
        //"Payment Collection Report",
        "Account Ledger Mail",
        // "Sale With Collection Report",
        // "Sale With Total Receiving",
        // "Booking Report With Amount",
        // "Credit Limit Report",
        // "Credit Limit Report With Days",

        // "Month Sale",
        // "New Sale Report",
        "Rate Calculator",
      ],
    },
    {
      name: "Billing",

      subfolders: [
        "AWB Billing",
        "Invoice",
        "Bulk Invoice",
        "Bulk Invoice Delete",
        "Invoice PTP",
        "Upload IRN Number",
        "Extra Charges",
        "Email Invoice",
        "Month Files",
        "Rate Hike",
        "Data Lock",
        "Auto Calculation",
      ],
    },
    {
      name: "Customer Care",
      subfolders: [
        "Shipment Query",
        "Register Complaint",
        "Event Activity",
        "Update Forwarding Number",
        "POD Entry",
        "POA Entry",
        "POD Email",
        "Message Circular",
        "Portal Balance",
        "Ticket Dashboard",
        "Upload Shipping Bill",
        "Run Process", //From Operation Duplicate

        // "Portal Ticket Details",

        "Offload Shipment",
      ],
    },
    {
      name: "Reports",
      subfolders: [
        "Booking Report",
        "Airwaybill Log",
        "Booking With Sale",
        "New Booking Report",
        "Custom Reports",
      ],
    },
  ];

  // const permissionKeyMap = {
  //   "Account Ledger": "Acc-Account Ledger",
  //   "Sale With Collection Report": "ACC-Sale With Collection Report",
  //   "Credit Limit Report": "ACC-Credit Limit Report",
  //   "Credit Limit Report With Days": "ACC-Credit Limit Report With Days",
  //   "Month Sale": "ACC-Month Sale",

  //   "Sales Report": "Bill-Sales Report",
  //   "Sale Summary Sector Wise": "Bill-Sale Summary Sector Wise",
  //   "Day Wise Sale": "Bill-Day Wise Sale",

  //   "Run Summary": "CC-Run Summary",
  //   "Offload Shipment": "CC-Offload Shipment",

  //   "Booking Report": "Rep-Booking Report",
  // };

  const permissionKeyMap = {
    "Account Ledger": ["Acc-Account Ledger", "Bill-Account Ledger"],
    "Credit Limit Report": [
      "ACC-Credit Limit Report",
      "Bill-Credit Limit Report",
    ],
    "Credit Limit Report With Days": [
      "ACC-Credit Limit Report With Days",
      "Bill-Credit Limit Report With Days",
    ],
    "Month Sale": ["ACC-Month Sale", "Bill-Month Sale"],

    "Sales Report": ["Bill-Sales Report"],
    "Sale Summary Sector Wise": ["Bill-Sale Summary Sector Wise"],
    "Day Wise Sale": ["Bill-Day Wise Sale"],

    "Run Summary": ["CC-Run Summary", "Bill-Run Summary"],
    "Offload Shipment": ["CC-Offload Shipment"],

    "Booking Report": ["Rep-Booking Report"],
  };

  // Permission checker for sidebar
  const hasPerm = (name) => {
    const mapping = permissionKeyMap[name];

    if (Array.isArray(mapping)) {
      return mapping.some((key) => user?.permissions?.[key] === true);
    }

    return user?.permissions?.[mapping || name] === true;
  };

  const [appVersion, setAppVersion] = useState("v0.1.0");
  const [latestVersion, setLatestVersion] = useState(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        if (window.__TAURI__) {
          const invokeFn =
            window.__TAURI__?.tauri?.invoke ?? window.__TAURI__?.invoke;
          if (invokeFn) {
            const version = await invokeFn("get_app_version");
            setAppVersion(`v${version}`);
          }
        }

        // Fetch remote version for "Latest" display
        const VERSION_URL =
          "https://raw.githubusercontent.com/M5Csoftware/m5-software/main/version.json";
        const res = await fetch(VERSION_URL + "?t=" + Date.now());
        if (res.ok) {
          const data = await res.json();
          setLatestVersion(`v${data.version}`);
        }
      } catch (e) {
        console.warn("Failed to fetch app version:", e);
      }
    };
    fetchVersion();
  }, []);

  return (
    <nav className="flex flex-col min-w-56 w-[15vw] gap-3 text-gunmetal bg-seasalt h-screen overflow-auto hidden-scrollbar">
      <div className="sticky top-0 flex flex-col gap-3 bg-seasalt">
        <div className="px-2 pt-3 ">
          <Image src="/logo-and-name.svg" alt="" width={130} height={24} />
        </div>
        <hr />

        <div className="rounded-md w-fit mx-auto flex justify-between text-sm font-semibold overflow-hidden">
          {user?.permissions?.Export && (
            <span className="w-28 text-center py-1 cursor-pointer bg-platinum">
              Export
            </span>
          )}

          {user?.permissions?.Import && (
            <span className="w-28 text-center py-1 cursor-pointer bg-foggy-white">
              Import
            </span>
          )}
        </div>
        <div className="flex justify-start pl-6 items-center w-full mt-3">
          <span className="text-xs font-semibold tracking-wide text-green-1">
            Login ID: {user.userId}
          </span>
        </div>
      </div>

      <ul className="mx-4 text-sm">
        <li
          onClick={() => {
            const tab = { folder: "Dashboard", subfolder: "Dashboard" }; // Treat it as a single tab
            setActiveTabs((prev) =>
              prev.some(
                (item) =>
                  item.folder === tab.folder &&
                  item.subfolder === tab.subfolder,
              )
                ? prev
                : [...prev, tab],
            );
            setCurrentTab("Dashboard");
          }}
          className="flex gap-1 font-semibold items-center cursor-pointer hover:bg-foggy-white transition-all p-1 rounded-md"
        >
          <Image src="/dashboard.svg" alt="" width={16} height={24} />
          <span>Dashboard</span>
        </li>

        {folders.map((folder, index) => {
          // title permission key
          const titleKey = `title-${folder.name}`;

          // If title permission exists and is false → block whole folder
          if (titleKey in (user?.permissions || {})) {
            if (!user.permissions[titleKey]) return null;
          }

          // Filter subfolders
          const allowedSubfolders = folder.subfolders.filter((sub) => {
            const mapping = permissionKeyMap[sub];

            if (Array.isArray(mapping)) {
              return mapping.some((perm) => user?.permissions?.[perm] === true);
            }

            const key = mapping || sub;
            return user?.permissions?.[key] === true;
          });

          if (allowedSubfolders.length === 0) return null;

          return (
            <Folder
              key={index}
              name={folder.name}
              subfolders={allowedSubfolders}
              activeFolder={activeFolder}
              toggleFolder={toggleFolder}
              activeTabs={activeTabs}
              handleSubfolderClick={handleSubfolderClick}
              reportOpen={reportOpen}
              operationreportOpen={operationreportOpen}
              branchreportOpen={branchreportOpen}
              accountReportOpen={accountReportOpen}
              setAccountReportOpen={setAccountReportOpen}
              accountSummaryOpen={accountSummaryOpen}
              setAccountSummaryOpen={setAccountSummaryOpen}
              billingReportOpen={billingReportOpen}
              setBillingReportOpen={setBillingReportOpen}
              hasPerm={hasPerm}
            />
          );
        })}
      </ul>
      <UpdateNotification />
      <div className="px-8 pb-4 text-[10px] flex flex-col gap-0.5 font-bold text-green-1">
        {/* <div className="opacity-60">Current: {appVersion}</div> */}
        {latestVersion && (
          <div
            className={`${latestVersion !== appVersion ? "text-amber-600" : "opacity-60"}`}
          >
            Latest: {latestVersion}
          </div>
        )}
      </div>
      {/* </div>
      <div className="pr-4 pl-1 sticky bottom-2">
        <SimpleButton name={"Logout"} onClick={logout} />
      </div> */}
    </nav>
  );
}

export default Sidebar;

// Folder component
const Folder = ({
  name,
  subfolders,
  activeFolder,
  toggleFolder,
  activeTabs,
  handleSubfolderClick,
  reportOpen = false,
  operationreportOpen = false,
  branchreportOpen = false,
  accountReportOpen = false,
  setAccountReportOpen,
  accountSummaryOpen = false,
  setAccountSummaryOpen,
  billingReportOpen,
  setBillingReportOpen = false,
  hasPerm,
}) => {
  // Check if any tab in activeTabs corresponds to this folder
  const isFolderActive = activeTabs.some((tab) => tab.folder === name);

  return (
    <li className="my-1 flex flex-col gap-1">
      <div
        onClick={() => toggleFolder(name)}
        className={`flex gap-1 font-semibold cursor-pointer p-1 hover:bg-foggy-white rounded-md transition-all ${
          activeFolder.includes(name) || isFolderActive ? "bg-foggy-white" : ""
        }`}
      >
        <Image
          src={
            activeFolder.includes(name)
              ? "/arrow-sidebar-active.svg"
              : "/arrow-sidebar.svg"
          }
          alt=""
          width={16}
          height={16}
        />
        <span>{name}</span>
      </div>
      <ul
        className={`ml-10 overflow-hidden transition-all flex flex-col  duration-300 ${
          activeFolder.includes(name) ? "max-h-screen " : "max-h-0 "
        }`}
      >
        {subfolders.map((subfolder, index) => (
          <li
            key={index}
            onClick={() => handleSubfolderClick(name, subfolder)}
            className={`p-1 my-0.5 cursor-pointer hover:bg-foggy-white rounded-md ${
              subfolder === "Report" ? "font-semibold" : ""
            } ${
              activeTabs.some(
                (tab) => tab.folder === name && tab.subfolder === subfolder,
              )
                ? "bg-foggy-white"
                : ""
            }`}
          >
            {subfolder}
          </li>
        ))}
        {name === "Operations" &&
          [
            "Child AWB No Report",
            "Manifest Report",
            "Manifest Report D",
            "Club Report",
            "Bag Report",
            "EDI Report",
            "Message Sheet",
            "Custom Invoice",
            "RTO Shipment Report",
            "CSB V Report",
            "Run Number Report",
          ].some((item) => hasPerm(item)) && (
            <li
              onClick={() => handleSubfolderClick(name, "Report")}
              className={`p-1 cursor-pointer hover:bg-foggy-white rounded-md font-semibold flex gap-2 ${
                operationreportOpen ? "bg-foggy-white" : ""
              }`}
            >
              <span>Report</span>
              <Image
                src={
                  operationreportOpen
                    ? "/arrow-sidebar-active.svg"
                    : "/arrow-sidebar.svg"
                }
                alt=""
                width={16}
                height={16}
              />
            </li>
          )}

        {name == "Operations" &&
          [
            "Child AWB No Report",
            "Manifest Report",
            "Manifest Report D",
            "Club Report",
            "Bag Report",
            "EDI Report",
            "Message Sheet",
            "Custom Invoice",
            "RTO Shipment Report",
            "CSB V Report",
            "Run Number Report",
          ]
            .filter((item) => hasPerm(item))
            .map((item, index) => (
              <li
                key={index}
                onClick={() => handleSubfolderClick(name, item)}
                className={` ml-3 cursor-pointer hover:bg-foggy-white rounded-md overflow-hidden transition-all ${
                  operationreportOpen ? "max-h-20 p-1 mt-0.5" : "max-h-0"
                }  ${
                  activeTabs.some(
                    (tab) => tab.folder === name && tab.subfolder === item,
                  )
                    ? "bg-foggy-white"
                    : ""
                }`}
              >
                {item}
              </li>
            ))}

        {name === "Customer Care" &&
          [
            "Tracking Report",
            "Complaint Report",
            "Client Report",
            "Multiple Run Wise",
            "Shipment Status Report",
            "Child Shipment Status Report",
            "Forwarding Number Report",
            "Run Summary",
          ].some((item) => hasPerm(item)) && (
            <li
              onClick={() => handleSubfolderClick(name, "Report")}
              className={`p-1 cursor-pointer hover:bg-foggy-white rounded-md font-semibold flex gap-2 ${
                reportOpen ? "bg-foggy-white" : ""
              }`}
            >
              <span>Report</span>
              <Image
                src={
                  reportOpen
                    ? "/arrow-sidebar-active.svg"
                    : "/arrow-sidebar.svg"
                }
                alt=""
                width={16}
                height={16}
              />
            </li>
          )}

        {name == "Customer Care" &&
          [
            "Tracking Report",
            "Complaint Report",
            "Client Report",
            "Multiple Run Wise",
            "Shipment Status Report",
            "Child Shipment Status Report",
            "Forwarding Number Report",
            "Run Summary",
          ]
            .filter((item) => hasPerm(item))
            .map((item, index) => (
              <li
                key={index}
                onClick={() => handleSubfolderClick(name, item)}
                className={` ml-3 cursor-pointer hover:bg-foggy-white rounded-md overflow-hidden transition-all ${
                  reportOpen ? "max-h-20 p-1 mt-0.5" : "max-h-0"
                }  ${
                  activeTabs.some(
                    (tab) => tab.folder === name && tab.subfolder === item,
                  )
                    ? "bg-foggy-white"
                    : ""
                }`}
              >
                {item}
              </li>
            ))}

        {name === "Booking" &&
          ["Branch Manifest Report"].some((item) => hasPerm(item)) && (
            <li
              onClick={() => handleSubfolderClick(name, "Report")}
              className={`p-1 cursor-pointer hover:bg-foggy-white rounded-md font-semibold flex gap-2 ${
                branchreportOpen ? "bg-foggy-white" : ""
              }`}
            >
              <span>Report</span>
              <Image
                src={
                  branchreportOpen
                    ? "/arrow-sidebar-active.svg"
                    : "/arrow-sidebar.svg"
                }
                alt=""
                width={16}
                height={16}
              />
            </li>
          )}

        {name == "Booking" &&
          ["Branch Manifest Report"]
            .filter((item) => hasPerm(item))
            .map((item, index) => (
              <li
                key={index}
                onClick={() => handleSubfolderClick(name, item)}
                className={` ml-3 cursor-pointer hover:bg-foggy-white rounded-md overflow-hidden transition-all ${
                  branchreportOpen ? "max-h-20 p-1 mt-0.5" : "max-h-0"
                }  ${
                  activeTabs.some(
                    (tab) => tab.folder === name && tab.subfolder === item,
                  )
                    ? "bg-foggy-white"
                    : ""
                }`}
              >
                {item}
              </li>
            ))}

        {name === "Account" &&
          [
            "Total Outstanding",
            "Run Wise Sale Report",
            "Amount Log",
            "Payment Collection Report",
            "Sale With Collection Report",
            "Sale With Total Receiving",
            "Booking Report With Amount",
            "Credit Limit Report",
            "Credit Limit Report With Days",
            "Month Sale",
            "New Sale Report",
          ].some((item) => hasPerm(item)) && (
            <li
              onClick={() => setAccountReportOpen(!accountReportOpen)}
              className={`p-1 cursor-pointer hover:bg-foggy-white rounded-md font-semibold flex gap-2 ${
                accountReportOpen ? "bg-foggy-white" : ""
              }`}
            >
              <span>Report</span>
              <Image
                src={
                  accountReportOpen
                    ? "/arrow-sidebar-active.svg"
                    : "/arrow-sidebar.svg"
                }
                alt=""
                width={16}
                height={16}
              />
            </li>
          )}

        {name == "Account" &&
          [
            "Total Outstanding",
            "Run Wise Sale Report",
            "Amount Log",
            "Payment Collection Report",
            "Sale With Collection Report",
            "Sale With Total Receiving",
            "Booking Report With Amount",
            "Credit Limit Report",
            "Credit Limit Report With Days",
            "Month Sale",
            "New Sale Report",
          ]
            .filter((item) => hasPerm(item))
            .map((item, index) => (
              <li
                key={index}
                onClick={() => handleSubfolderClick(name, item)}
                className={` ml-3 cursor-pointer hover:bg-foggy-white rounded-md overflow-hidden transition-all ${
                  accountReportOpen ? "max-h-20 p-1 mt-0.5" : "max-h-0"
                }  ${
                  activeTabs.some(
                    (tab) => tab.folder === name && tab.subfolder === item,
                  )
                    ? "bg-foggy-white"
                    : ""
                }`}
              >
                {item}
              </li>
            ))}

        {name === "Account" &&
          [
            "Payment Receipt Summary",
            "Credit Summary Report",
            "Debit Summary Report",
          ].some((item) => hasPerm(item)) && (
            <li
              onClick={() => setAccountSummaryOpen(!accountSummaryOpen)}
              className={`p-1 cursor-pointer hover:bg-foggy-white rounded-md font-semibold flex gap-2 ${
                accountSummaryOpen ? "bg-foggy-white" : ""
              }`}
            >
              <span>Summary</span>
              <Image
                src={
                  accountSummaryOpen
                    ? "/arrow-sidebar-active.svg"
                    : "/arrow-sidebar.svg"
                }
                alt=""
                width={16}
                height={16}
              />
            </li>
          )}

        {name == "Account" &&
          [
            "Payment Receipt Summary",
            "Credit Summary Report",
            "Debit Summary Report",
            // "Claim For Lost Shipment Summary",
            // "Discount Credit Note Summary",
          ]
            .filter((item) => hasPerm(item))
            .map((item, index) => (
              <li
                key={index}
                onClick={() => handleSubfolderClick(name, item)}
                className={` ml-3 cursor-pointer hover:bg-foggy-white rounded-md overflow-hidden transition-all ${
                  accountSummaryOpen ? "max-h-20 p-1 mt-0.5" : "max-h-0"
                }  ${
                  activeTabs.some(
                    (tab) => tab.folder === name && tab.subfolder === item,
                  )
                    ? "bg-foggy-white"
                    : ""
                }`}
              >
                {item}
              </li>
            ))}

        {name === "Billing" && (
          <li
            onClick={() => setBillingReportOpen(!billingReportOpen)}
            className={`p-1 cursor-pointer hover:bg-foggy-white rounded-md font-semibold flex gap-2 ${
              billingReportOpen ? "bg-foggy-white" : ""
            }`}
          >
            <span>Report</span>
            <Image
              src={
                billingReportOpen
                  ? "/arrow-sidebar-active.svg"
                  : "/arrow-sidebar.svg"
              }
              alt=""
              width={16}
              height={16}
            />
          </li>
        )}

        {name === "Billing" &&
          [
            "Sale Report With Hold",
            "Sale With Collection Report",
            "Credit Limit Report",
            "Account Ledger",
            "Credit Limit Report With Days",
            "Sale Summary Sector Wise",
            "Run Summary",
            "Sale Report With Child Number",
            "Month Sale",
            "Credit Note Summary AWB No. Wise",
            "Day Wise Sale",
            "Sales Report",
            "Invoice Summary",
            "Invoice PTP Summary",
          ]
            .filter((item) => hasPerm(item))
            .map((item, index) => (
              <li
                key={index}
                onClick={() => handleSubfolderClick(name, item)}
                className={`ml-3 cursor-pointer hover:bg-foggy-white rounded-md overflow-hidden transition-all ${
                  billingReportOpen ? "max-h-20 p-1 mt-0.5" : "max-h-0"
                }  ${
                  activeTabs.some(
                    (tab) => tab.folder === name && tab.subfolder === item,
                  )
                    ? "bg-foggy-white"
                    : ""
                }`}
              >
                {item}
              </li>
            ))}
      </ul>
    </li>
  );
};
