// hooks/useAlertCheck.js
import { useContext, useCallback } from "react";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";

export const useAlertCheck = () => {
  const { server } = useContext(GlobalContext);

  const checkAlert = useCallback(
    async (awbNo) => {
      // Validate input
      if (!awbNo || typeof awbNo !== "string" || awbNo.trim().length === 0) {
        return {
          hasAlert: false,
          message: "",
          notifType: "Close",
        };
      }

      try {
        const response = await axios.get(
          `${server}/alert-notif?awbNo=${awbNo.trim()}`
        );

        // Check if alert exists and is Open
        if (response.data.exists && response.data.notifType === "Open") {
          return {
            hasAlert: true,
            message: response.data.notifMsg || "This AWB has an active alert",
            notifType: response.data.notifType,
            awbNo: response.data.awbNo,
          };
        }

        return {
          hasAlert: false,
          message: "",
          notifType: response.data.notifType || "Close",
        };
      } catch (error) {
        // Don't treat 404 as error - just means no shipment found
        if (error.response?.status === 404) {
          return {
            hasAlert: false,
            message: "",
            notifType: "Close",
          };
        }

        console.error("Error checking alert:", error);
        return {
          hasAlert: false,
          message: "",
          notifType: "Close",
          error: error.message,
        };
      }
    },
    [server]
  );

  return { checkAlert };
};
