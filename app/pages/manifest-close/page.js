"use client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";

const LOADING_STATES = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

function ManifestClose() {
  const { register, setValue } = useForm();
  const { server } = useContext(GlobalContext);

  const [rowData, setRowData] = useState([]);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.IDLE);
  const [error, setError] = useState(null);

  const currentColumns = [
    { key: "manifestNo", label: "Manifest Number" },
    { key: "accountCode", label: "Account Code" },
    { key: "awbNo", label: "AWB No." },
    { key: "manifestDate", label: "Manifest Date" },
    { key: "branch", label: "Branch" },
    { key: "status", label: "Status" },
    { key: "totalPcs", label: "Total Pcs" },
    { key: "totalWeight", label: "Total Weight" },
  ];

  // 🔹 Fetch manifests with status Close / Closed
  const fetchClosedManifests = useCallback(async () => {
    setLoadingState(LOADING_STATES.LOADING);
    setError(null);

    try {
      const response = await axios.get(`${server}/portal/get-manifest`);
      const { data } = response;
      console.log("manifestData", data);

      if (data.success && data.manifests) {
        const closedManifests = data.manifests.filter(
          (manifest) => manifest.status?.toLowerCase() === "closed"
        );

        console.log("closedManifests", closedManifests);

        // 🔹 Fetch shipment totals
        const manifestsWithTotals = await Promise.all(
          closedManifests.map(async (manifest) => {
            let totalWeight = 0;
            let totalPcs = 0;

            try {
              const shipmentResponse = await axios.get(
                `${server}/portal/get-shipments?accountCode=${manifest.accountCode}`
              );
              const shipments = shipmentResponse.data?.shipments || [];

              shipments.forEach((shipment) => {
                totalWeight += Number(shipment.totalActualWt || 0);
                totalPcs += Number(shipment.pcs || 0);
              });
            } catch (shipmentError) {
              console.error(
                "Error fetching shipments for manifest:",
                manifest.manifestNumber,
                shipmentError
              );
            }

            return {
              manifestNo: manifest.manifestNumber || "N/A",
              accountCode: manifest.accountCode || "N/A",
              awbNo: manifest.awbNumbers?.join(", ") || "N/A",
              manifestDate: new Date(manifest.createdAt).toLocaleDateString(),
              branch: manifest.pickupAddress?.city || "N/A",
              status: manifest.status || "N/A",
              totalPcs: totalPcs.toString(),
              totalWeight: totalWeight.toFixed(2),
            };
          })
        );

        setRowData(manifestsWithTotals);
        setLoadingState(LOADING_STATES.SUCCESS);
      } else {
        setRowData([]);
        setLoadingState(LOADING_STATES.SUCCESS);
      }
    } catch (error) {
      console.error("Error fetching closed manifests:", error);
      setError("Failed to fetch closed manifest data");
      setLoadingState(LOADING_STATES.ERROR);
    }
  }, [server]);

  // 🔹 Convert JSON to CSV and trigger download
  const handleDownloadCSV = useCallback(() => {
    if (rowData.length === 0) {
      alert("No data available to download.");
      return;
    }

    const csvHeader = currentColumns.map((col) => col.label).join(",") + "\n";

    const csvRows = rowData
      .map((row) =>
        currentColumns
          .map((col) => {
            const value = row[col.key] ?? "";
            // Escape commas and quotes properly
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",")
      )
      .join("\n");

    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `Closed_Manifests_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [rowData, currentColumns]);

  useEffect(() => {
    fetchClosedManifests();
  }, [fetchClosedManifests]);

  return (
    <form className="flex flex-col gap-3">
      <Heading
        title="Manifest Close"
        bulkUploadBtn="hidden"
        codeListBtn={true}
      />
      <div>
        <div className="flex justify-between mb-2 mt-3 items-center">
          <RedLabelHeading label={"List of Closed Manifests"} />
          <div>
            <SimpleButton
              type="button"
              name={"Download"}
              onClick={handleDownloadCSV}
            />
          </div>
        </div>

        {/* Loading / Error State */}
        {loadingState === LOADING_STATES.LOADING && (
          <div className="text-center text-black py-4">
            Loading manifests...
          </div>
        )}
        {error && (
          <div className="bg-red border border-red text-white px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Table */}
        {loadingState === LOADING_STATES.SUCCESS && (
          <TableWithSorting
            register={register}
            setValue={setValue}
            name="manifestClose"
            columns={currentColumns}
            rowData={rowData}
            className="h-[55vh] mt-2"
          />
        )}
      </div>

      <div className="flex justify-between">
        {/* <div>
          <OutlinedButtonRed
            type="button"
            label={"Close"}
            onClick={() => console.log("Closing selected manifests...")}
          />
        </div> */}
      </div>
    </form>
  );
}

export default ManifestClose;
