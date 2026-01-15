"use client";
import { useContext, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { GlobalContext } from "./lib/GlobalContext";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import Tabs from "./components/Tabs";

// Loading component
const PageLoader = () => (
  <div className="flex justify-center items-center h-full">
    <div className="text-gray-600 animate-pulse">Loading page...</div>
  </div>
);

// Dashboard is always loaded (it's your default/home page)
import Dashboard from "./pages/dashboard/Dashboard";
import CodeList from "./components/CodeList";

// ALL other pages lazy-loaded with dynamic imports
const dynamicPages = {
  1: dynamic(() => import("./pages/entity-manager/page"), { ssr: false }),
  2: dynamic(() => import("./pages/branch-master/page"), { ssr: false }),
  3: dynamic(() => import("./pages/vendor-master/page"), { ssr: false }),
  4: dynamic(() => import("./pages/customer-account/page"), { ssr: false }),
  5: dynamic(() => import("./pages/employee-master/Employee"), { ssr: false }),
  6: dynamic(() => import("./pages/tax-settings/page"), { ssr: false }),
  7: dynamic(() => import("./pages/fuel-setting/page"), { ssr: false }),
  8: dynamic(() => import("./pages/hubInscan/page"), { ssr: false }),
  9: dynamic(() => import("./pages/hubInscan-client/page"), { ssr: false }),
  10: dynamic(() => import("./pages/payment-entry/page"), { ssr: false }),
  11: dynamic(() => import("./pages/branch-manifest-report/page"), {
    ssr: false,
  }),
  12: dynamic(() => import("./pages/manifest-report/page"), { ssr: false }),
  13: dynamic(() => import("./pages/manifest/page"), { ssr: false }),
  14: dynamic(() => import("./pages/run-entry/page"), { ssr: false }),
  15: dynamic(() => import("./pages/clubbing/page"), { ssr: false }),
  16: dynamic(() => import("./pages/bagging/page"), { ssr: false }),
  17: dynamic(() => import("./pages/awb-entry/AwbEntry"), { ssr: false }),
  18: dynamic(() => import("./pages/account-ledger/page"), { ssr: false }),
  19: dynamic(() => import("./pages/create-child-number/page"), { ssr: false }),
  20: dynamic(() => import("./pages/sale-report/page"), { ssr: false }),
  21: dynamic(() => import("./pages/Invoice/page"), { ssr: false }),
  22: dynamic(() => import("./pages/zone/page"), { ssr: false }),
  23: dynamic(() => import("./pages/rate-sheet/page"), { ssr: false }),
  24: dynamic(() => import("./pages/newdemobutton/page"), { ssr: false }),
  25: dynamic(() => import("./pages/volume-weight/page"), { ssr: false }),
  26: dynamic(() => import("./pages/shipper-tariff/page"), { ssr: false }),
  27: dynamic(() => import("./pages/shipper-tariff-bulk/page"), { ssr: false }),
  28: dynamic(() => import("./pages/shipment-query/page"), { ssr: false }),
  29: dynamic(() => import("./pages/register-complaint/page"), { ssr: false }),
  30: dynamic(() => import("./pages/event-activity/page"), { ssr: false }),
  31: dynamic(() => import("./pages/digital-tally/page"), { ssr: false }),
  32: dynamic(() => import("./pages/Update-forwarding-number/page"), {
    ssr: false,
  }),
  33: dynamic(() => import("./pages/pod-entry/page"), { ssr: false }),
  34: dynamic(() => import("./pages/poa-entry/page"), { ssr: false }),
  35: dynamic(() => import("./pages/pod-email/page"), { ssr: false }),
  36: dynamic(() => import("./pages/portal-balance/page"), { ssr: false }),
  37: dynamic(() => import("./pages/tracking-report/page"), { ssr: false }),
  38: dynamic(() => import("./pages/complaint-report/page"), { ssr: false }),
  39: dynamic(() => import("./pages/multiple-run-wise/page"), { ssr: false }),
  40: dynamic(() => import("./pages/shipment-status-report/page"), {
    ssr: false,
  }),
  41: dynamic(() => import("./pages/dummy-shipment-status-report/page"), {
    ssr: false,
  }),
  42: dynamic(() => import("./pages/forwarding-number-report/page"), {
    ssr: false,
  }),
  43: dynamic(() => import("./pages/bulk-invoice/page"), { ssr: false }),
  44: dynamic(() => import("./pages/awb-billing/page"), { ssr: false }),
  45: dynamic(() => import("./pages/ChildAwbNoReport/page"), { ssr: false }),
  46: dynamic(() => import("./pages/manifest-report-d/page"), { ssr: false }),
  47: dynamic(() => import("./pages/message-sheet/page"), { ssr: false }),
  48: dynamic(() => import("./pages/bag-report/page"), { ssr: false }),
  49: dynamic(() => import("./pages/edi-report/page"), { ssr: false }),
  50: dynamic(() => import("./pages/assign-customer/page"), { ssr: false }),
  51: dynamic(() => import("./pages/ExpenseEntry/page"), { ssr: false }),
  52: dynamic(() => import("./pages/custom-Invoice/page"), { ssr: false }),
  53: dynamic(() => import("./pages/run-transfer/page"), { ssr: false }),
  54: dynamic(() => import("./pages/booking-report/page"), { ssr: false }),
  55: dynamic(() => import("./pages/airwaybill-log/page"), { ssr: false }),
  56: dynamic(() => import("./pages/branch-bagging/page"), { ssr: false }),
  57: dynamic(() => import("./pages/ticket-dashboard/page"), { ssr: false }),
  58: dynamic(() => import("./pages/client-report/page"), { ssr: false }),
  59: dynamic(() => import("./pages/message-circular/page"), { ssr: false }),
  60: dynamic(() => import("./pages/payment-receipt-summary/page"), {
    ssr: false,
  }),
  61: dynamic(() => import("./pages/total-outstanding/page"), { ssr: false }),
  62: dynamic(() => import("./pages/discount-credit-ns/page"), { ssr: false }),
  63: dynamic(() => import("./pages/discount-credit-note/page"), {
    ssr: false,
  }),
  64: dynamic(() => import("./pages/claim-for-lost-ss/page"), { ssr: false }),
  65: dynamic(() => import("./pages/claim-for-lost-shipment/page"), {
    ssr: false,
  }),
  66: dynamic(() => import("./pages/debit-summary-report/page"), {
    ssr: false,
  }),
  67: dynamic(() => import("./pages/debite-note/page"), { ssr: false }),
  68: dynamic(() => import("./pages/credit-summary-report/page"), {
    ssr: false,
  }),
  69: dynamic(() => import("./pages/credit-note/page"), { ssr: false }),
  70: dynamic(() => import("./pages/amount-log/page"), { ssr: false }),
  71: dynamic(() => import("./pages/runwise-sale-report/page"), { ssr: false }),
  72: dynamic(() => import("./pages/payment-collection-report/page"), {
    ssr: false,
  }),
  73: dynamic(() => import("./pages/account-ledger-mail/page"), { ssr: false }),
  74: dynamic(() => import("./pages/sale-with-collection-report/page"), {
    ssr: false,
  }),
  75: dynamic(() => import("./pages/sale-with-total-receiving/page"), {
    ssr: false,
  }),
  76: dynamic(() => import("./pages/booking-report-with-amount/page"), {
    ssr: false,
  }),
  77: dynamic(() => import("./pages/credit-limit-report/page"), { ssr: false }),
  78: dynamic(() => import("./pages/credit-limit-report-with-days/page"), {
    ssr: false,
  }),
  79: dynamic(() => import("./pages/month-sale/page"), { ssr: false }),
  80: dynamic(() => import("./pages/sale-report-with-hold/page"), {
    ssr: false,
  }),
  81: dynamic(() => import("./pages/credit-limit-temp/page"), { ssr: false }),
  82: dynamic(() => import("./pages/modified-shipper-tariff/page"), {
    ssr: false,
  }),
  83: dynamic(() => import("./pages/new-sale-report/page"), { ssr: false }),
  84: dynamic(() => import("./pages/quick-inscan/page"), { ssr: false }),
  85: dynamic(() => import("./pages/manifest-close/page"), { ssr: false }),
  86: dynamic(() => import("./pages/bulk-upload/page"), { ssr: false }),
  87: dynamic(() => import("./pages/bulk-invoice-delete/page"), { ssr: false }),
  88: dynamic(() => import("./pages/invoice-ptp/page"), { ssr: false }),
  89: dynamic(() => import("./pages/upload-irn-number/page"), { ssr: false }),
  90: dynamic(() => import("./pages/invoice-summary/page"), { ssr: false }),
  91: dynamic(() => import("./pages/extra-charges/page"), { ssr: false }),
  92: dynamic(() => import("./pages/sale-summary-sector-wise/page"), {
    ssr: false,
  }),
  93: dynamic(() => import("./pages/run-summary/page"), { ssr: false }),
  94: dynamic(() => import("./pages/sale-report-with-dummy-number/page"), {
    ssr: false,
  }),
  95: dynamic(() => import("./pages/email-invoice/page"), { ssr: false }),
  96: dynamic(() => import("./pages/credit-note-summary-awb-wise/page"), {
    ssr: false,
  }),
  97: dynamic(() => import("./pages/portal-ticket-details/page"), {
    ssr: false,
  }),
  98: dynamic(() => import("./pages/registered-ticket-details/page"), {
    ssr: false,
  }),
  99: dynamic(() => import("./pages/offload-shipment/page"), { ssr: false }),
  100: dynamic(() => import("./pages/day-wise-sale-report/page"), {
    ssr: false,
  }),
  101: dynamic(() => import("./pages/rto-shipment/page"), { ssr: false }),
  102: dynamic(() => import("./pages/assign-sector/page"), { ssr: false }),
  103: dynamic(() => import("./pages/counter-part-inscan/page"), {
    ssr: false,
  }),
  104: dynamic(() => import("./pages/booking-with-sale/page"), { ssr: false }),
  105: dynamic(() => import("./pages/club-report/page"), { ssr: false }),
  106: dynamic(() => import("./pages/awb-print/page"), { ssr: false }),
  107: dynamic(() => import("./pages/rto-shipment-report/page"), {
    ssr: false,
  }),
  108: dynamic(() => import("./pages/month-files/page"), { ssr: false }),
  109: dynamic(() => import("./pages/invoice-ptp-summary/page"), {
    ssr: false,
  }),
  110: dynamic(() => import("./pages/rate-hike/page"), { ssr: false }),
  111: dynamic(() => import("./pages/international-pickup-order/page"), {
    ssr: false,
  }),
  112: dynamic(() => import("./pages/custom-reports/page"), { ssr: false }),
  113: dynamic(() => import("./pages/alert-messages/page"), { ssr: false }),
  114: dynamic(() => import("./pages/data-lock/page"), { ssr: false }),
  115: dynamic(() => import("./pages/overseas-manifest/page"), { ssr: false }),
  116: dynamic(() => import("./pages/auto-calculation/page"), { ssr: false }),
  117: dynamic(() => import("./pages/csb-v-report/page"), { ssr: false }),
  118: dynamic(() => import("./pages/run-number-report/page"), { ssr: false }),
  119: dynamic(() => import("./pages/bagging-with-barcode/page"), {
    ssr: false,
  }),
  120: dynamic(() => import("./pages/kyc-verification/kycVerification"), {
    ssr: false,
  }),
  121: dynamic(() => import("./pages/upload-shipping-bill/page"), {
    ssr: false,
  }),
  122: dynamic(() => import("./pages/api-management/page"), { ssr: false }),
  123: dynamic(() => import("./pages/run-process/page"), { ssr: false }),
  124: dynamic(() => import("./pages/labels/courier-please/page"), { ssr: false }),
  125: dynamic(() => import("./pages/labels/yyz-ups/page"), { ssr: false }),
  126: dynamic(() => import("./pages/labels/yvr-ups/page"), { ssr: false }),
  127: dynamic(() => import("./pages/labels/uk-dpd/page"), { ssr: false }),
  128: dynamic(() => import("./pages/labels/ams-dpd/page"), { ssr: false }),
  129: dynamic(() => import("./pages/labels/lhr-fedex/page"), { ssr: false }),
  130: dynamic(() => import("./pages/entity-manager/ServiceMaster"), { ssr: false }),
};

const App = () => {
  const {
    currentTab,
    activeTabs,
    setCities,
    setStates,
    setCountries,
    server,
    setAccounts,
    setBranches,
    refetch,
    setSectors,
    setZones,
    setRates,
    setHub,
    setCounterPart,
    setEventCode,
    mountedTabs,
    setMountedTabs,
    codeListConfig,
  } = useContext(GlobalContext);

  const [view, setView] = useState(0);

  // Disable right-click with proper cleanup
  useEffect(() => {
    const handleRightClick = (e) => e.preventDefault();
    document.addEventListener("contextmenu", handleRightClick);
    return () => document.removeEventListener("contextmenu", handleRightClick);
  }, []);

  // Tab to view mapping
  const tabMapping = {
    "Entity Manager": 1,
    "Branch Master": 2,
    "Vendor Master": 3,
    Customer: 4,
    "Employee Master": 5,
    "Tax Settings": 6,
    "Fuel Settings": 7,
    "Hub InScan": 8,
    "Hub InScan (Client)": 9,
    "Payment Entry": 10,
    "Branch Manifest Report": 11,
    "Manifest Report": 12,
    Manifest: 13,
    "Run Entry": 14,
    Clubbing: 15,
    Bagging: 16,
    "AWB Entry": 17,
    "Account Ledger": 18,
    "Create Child Number": 19,
    "Sales Report": 20,
    Invoice: 21,
    Zone: 22,
    "Rate Sheet": 23,
    NewDemoButton: 24,
    VolumeWeight: 25,
    "Shipper Tariff": 26,
    "Shipper Tariff Bulk": 27,
    "Shipment Query": 28,
    "Register Complaint": 29,
    "Event Activity": 30,
    "Digital Tally": 31,
    "Update Forwarding Number": 32,
    "POD Entry": 33,
    "POA Entry": 34,
    "POD Email": 35,
    "Portal Balance": 36,
    "Tracking Report": 37,
    "Complaint Report": 38,
    "Multiple Run Wise": 39,
    "Shipment Status Report": 40,
    "Child Shipment Status Report": 41,
    "Forwarding Number Report": 42,
    "Bulk Invoice": 43,
    "AWB Billing": 44,
    "Child AWB No Report": 45,
    "Manifest Report D": 46,
    "Message Sheet": 47,
    "Bag Report": 48,
    "EDI Report": 49,
    "Assign Customer & Target": 50,
    "Expense Entry": 51,
    "Custom Invoice": 52,
    "Run Transfer": 53,
    "Booking Report": 54,
    "Airwaybill Log": 55,
    "Branch Bagging": 56,
    "Ticket Dashboard": 57,
    "Client Report": 58,
    "Message Circular": 59,
    "Payment Receipt Summary": 60,
    "Total Outstanding": 61,
    "Discount Credit Note Summary": 62,
    "Discount Credit Note": 63,
    "Claim For Lost Shipment Summary": 64,
    "Claim For Lost Shipment": 65,
    "Debit Summary Report": 66,
    "Debit Note": 67,
    "Credit Summary Report": 68,
    "Credit Note": 69,
    "Amount Log": 70,
    "Run Wise Sale Report": 71,
    "Payment Collection Report": 72,
    "Account Ledger Mail": 73,
    "Sale With Collection Report": 74,
    "Sale With Total Receiving": 75,
    "Booking Report With Amount": 76,
    "Credit Limit Report": 77,
    "Credit Limit Report With Days": 78,
    "Month Sale": 79,
    "Sale Report With Hold": 80,
    "Credit Limit Temp": 81,
    "Modify Shipper Tariff": 82,
    "New Sale Report": 83,
    "Quick Inscan": 84,
    "Manifest Close": 85,
    "Bulk Upload": 86,
    "Bulk Invoice Delete": 87,
    "Invoice PTP": 88,
    "Upload IRN Number": 89,
    "Invoice Summary": 90,
    "Extra Charges": 91,
    "Sale Summary Sector Wise": 92,
    "Run Summary": 93,
    "Sale Report With Child Number": 94,
    "Email Invoice": 95,
    "Credit Note Summary AWB No. Wise": 96,
    "Portal Ticket Details": 97,
    "Registered Ticket Details": 98,
    "Offload Shipment": 99,
    "Day Wise Sale": 100,
    "RTO Shipment": 101,
    "Assign Sector": 102,
    CounterPartInscan: 103,
    "Booking With Sale": 104,
    "Club Report": 105,
    "Awb Print": 106,
    "RTO Shipment Report": 107,
    "Month Files": 108,
    "Invoice PTP Summary": 109,
    "Rate Hike": 110,
    "International Pickup Order": 111,
    "Custom Reports": 112,
    "Alert Messages": 113,
    "Data Lock": 114,
    "Overseas Manifest": 115,
    "Auto Calculation": 116,
    "CSB V Report": 117,
    "Run Number Report": 118,
    "Bagging With Barcode": 119,
    "KYC Verification": 120,
    "Upload Shipping Bill": 121,
    "API Management": 122,
    "Run Process": 123,
    "Courier Please": 124,
    "YYZ UPS": 125,
    "YVR UPS": 126,
    "UK DPD": 127,
    "AMS DPD": 128,
    "LHR FEDEX": 129,
    "Service Master": 130,
  };

  // Update view and track mounted tabs when currentTab changes
  useEffect(() => {
    const newView = tabMapping[currentTab] || 0;
    setView(newView);

    // Add this tab to mounted tabs
    setMountedTabs((prev) => new Set([...prev, newView]));
  }, [currentTab]);

  // Remove closed tabs from mountedTabs
  useEffect(() => {
    const activeViews = new Set(
      activeTabs.map((tab) => tabMapping[tab.subfolder] || 0)
    );
    activeViews.add(0); // Always keep dashboard mounted

    setMountedTabs(activeViews);
  }, [activeTabs]);

  // Fetch entity data - REPLACE instead of append
  useEffect(() => {
    const controller = new AbortController();

    const fetchEntity = async (entityType, setter) => {
      try {
        const { data } = await axios.get(`${server}/entity-manager`, {
          params: { entityType },
          signal: controller.signal,
        });
        // ⚡ REPLACE data, don't append
        setter(data.map((item) => ({ code: item.code, name: item.name })));
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error(`Error fetching ${entityType}:`, err);
          setter([]); // Clear on error
        }
      }
    };

    fetchEntity("City", setCities);
    fetchEntity("Country", setCountries);
    fetchEntity("State", setStates);
    fetchEntity("Sector", setSectors);
    fetchEntity("Hub", setHub);
    fetchEntity("Counter Part", setCounterPart);
    fetchEntity("Event", setEventCode);

    // Cleanup: Cancel requests if component unmounts or refetch changes
    return () => controller.abort();
  }, [refetch, server]);

  // Fetch accounts, branches, zones, rates - with cleanup
  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const [accRes, branchRes, zoneRes, rateRes] = await Promise.all([
          axios.get(`${server}/customer-account/accounts`, {
            signal: controller.signal,
          }),
          axios.get(`${server}/branch-master/branches`, {
            signal: controller.signal,
          }),
          axios.get(`${server}/zones`, { signal: controller.signal }),
          axios.get(`${server}/rate-sheet`, { signal: controller.signal }),
        ]);

        setAccounts(accRes.data);
        setBranches(branchRes.data);
        setZones(zoneRes.data);
        setRates(rateRes.data);
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error("Error fetching data:", err);
        }
      }
    };

    fetchData();

    // Cleanup: Cancel all requests
    return () => controller.abort();
  }, [refetch, server]);

  return (
    <main className="flex">
      <Sidebar />
      <div className="flex flex-col w-[85vw]">
        {codeListConfig && (
          <CodeList
            data={codeListConfig.data}
            columns={codeListConfig.columns}
            name={codeListConfig.name}
            handleAction={codeListConfig.handleAction}
          />
        )}
        <Tabs />
        <div className="w-full px-12 py-10 h-[95vh] overflow-auto text-eerie-black table-scrollbar">
          {/* Render all mounted tabs but only show the active one */}
          {Array.from(mountedTabs).map((tabView) => {
            const Component = dynamicPages[tabView] || Dashboard;
            return (
              <div
                key={tabView}
                style={{ display: view === tabView ? "block" : "none" }}
              >
                <Component />
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default App;
