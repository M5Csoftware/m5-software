"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Dropdown } from "@/app/components/Dropdown";
import { useForm } from "react-hook-form";
import { useAuth } from "@/app/Context/AuthContext";
import RevenueDashboard from "./RevenueDashboard";

const SalesDashboard = dynamic(() => import("./SalesDashboard"), {
  ssr: false,
});
const OperationDashboard = dynamic(() => import("./OperationDashboard"), {
  ssr: false,
});
const SalesHodDashboard = dynamic(() => import("./SalesHodDashboard"), {
  ssr: false,
});
const CSDashboard = dynamic(() => import("./CSDashboard"), { ssr: false });
const HODCollectionDashboard = dynamic(
  () => import("./HODCollectionDashboard"),
  { ssr: false }
);
const BillingEmployee = dynamic(() => import("./BillingEmployee"), {
  ssr: false,
});
const SSDashboard = dynamic(() => import("./SSDashboard"), { ssr: false });
const CounterPartDashboard = dynamic(() => import("./CounterPartDashboard"), {
  ssr: false,
});
const BookingDashboard = dynamic(() => import("./BookingDashboard"), {
  ssr: false,
});

// Import the components that will be shown from Billing Dashboard
const ShipperTariff = dynamic(() => import("../shipper-tariff/page"), {
  ssr: false,
});
const CustomerManagement = dynamic(() => import("../customer-account/page"), {
  ssr: false,
});

const ALL_DASHBOARDS = [
  "Revenue",
  "Sales",
  "Booking",
  "Operations",
  "Sales HOD",
  "CS",
  "Collection HOD",
  "Billing Employee",
  "SS",
  "Counter Part",
];

function Dashboard() {
  const { register, setValue, watch } = useForm();
  const { user, loading } = useAuth();

  const selectedDashboard = watch("dashboard");

  // State management for navigation
  const [showShipperTariff, setShowShipperTariff] = useState(false);
  const [showCustomerManagement, setShowCustomerManagement] = useState(false);

  // Filter allowed dashboards — safely
  const allowedDashboards = React.useMemo(() => {
    return Array.isArray(user?.dashboardAccess)
      ? user.dashboardAccess.filter((d) => ALL_DASHBOARDS.includes(d))
      : [];
  }, [user]);

  useEffect(() => {
    if (allowedDashboards.length > 0 && !selectedDashboard) {
      setValue("dashboard", allowedDashboards[0]);
    }
  }, [allowedDashboards, selectedDashboard, setValue]);

  // Reset navigation states when switching dashboards
  useEffect(() => {
    setShowShipperTariff(false);
    setShowCustomerManagement(false);
  }, [selectedDashboard]);

  const renderDashboard = () => {
    // If we're showing ShipperTariff, render it with back button
    if (showShipperTariff) {
      return (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setShowShipperTariff(false)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors w-fit"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-semibold">Back to Billing Dashboard</span>
          </button>
          <ShipperTariff />
        </div>
      );
    }

    // If we're showing CustomerManagement, render it with back button
    if (showCustomerManagement) {
      return (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setShowCustomerManagement(false)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors w-fit"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-semibold">Back to Billing Dashboard</span>
          </button>
          <CustomerManagement />
        </div>
      );
    }

    // Otherwise show the regular dashboard
    switch (selectedDashboard) {
      case "Revenue":
        return <RevenueDashboard />;
      case "Sales":
        return <SalesDashboard />;
      case "Operations":
        return <OperationDashboard />;
      case "Sales HOD":
        return <SalesHodDashboard />;
      case "CS":
        return <CSDashboard />;
      case "Collection HOD":
        return <HODCollectionDashboard />;
      case "Billing Employee":
        return (
          <BillingEmployee
            setShowShipperTariff={setShowShipperTariff}
            setShowCustomerManagement={setShowCustomerManagement}
          />
        );
      case "SS":
        return <SSDashboard />;
      case "Counter Part":
        return <CounterPartDashboard />;
      case "Booking":
        return <BookingDashboard />;
      default:
        return <p>No dashboard access.</p>;
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>You are not logged in.</p>;

  if (allowedDashboards.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Hi, {user.userName}</h1>
        <p>You do not have access to any dashboards.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-11">
      {/* Hide header when showing child components */}
      {!showShipperTariff && !showCustomerManagement && (
        <form className="flex justify-between">
          <h1 className="text-[32px] font-bold text-eerie-black">
            Hello, {user.userName}
          </h1>

          <div className="w-44">
            {allowedDashboards.length > 1 && (
              <Dropdown
                register={register}
                setValue={setValue}
                value="dashboard"
                options={allowedDashboards}
                title="Dashboard"
                defaultValue={allowedDashboards[0] || ""}
                placeholder="Select a dashboard"
              />
            )}
          </div>
        </form>
      )}

      {renderDashboard()}
    </div>
  );
}

export default Dashboard;
