import React, { useState, useRef, useEffect, useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import { SimpleButton } from "@/app/components/Buttons";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import { useForm } from "react-hook-form";
import { useAuth } from "../../Context/AuthContext";

dayjs.extend(localeData);

function BookingDashboard() {
  const { setActiveTabs, setCurrentTab, activeTabs } =
    useContext(GlobalContext);
  const { register, setValue } = useForm();
  const { user } = useAuth();

  //  Selected date for each table
  const [selectedDateForRunHandover, setSelectedDateForRunHandover] = useState(
    dayjs()
  );
  const [selectedDateForOldShipment, setSelectedDateForOldShipment] = useState(
    dayjs()
  );

  //  Calendar popover visibility
  const [showCalendarForRunHandover, setShowCalendarForRunHandover] =
    useState(false);
  const [showCalendarForOldShipment, setShowCalendarForOldShipment] =
    useState(false);

  const calendarRefRunHandover = useRef(null);
  const calendarRefOldShipment = useRef(null);

  const [demoRadio, setDemoRadio] = useState("Client");

  // console.log;

  const handleRadioChange = async (value) => {
    setDemoRadio(value);
    setValue("entryType", value);

    if (value === "Client") {
      fetchClientManifests(); // ← normal manifests
    } else {
      fetchBranchBaggingData(); // ← branch bagging
    }
  };

  const fetchClientManifests = async () => {
    setLoading(true);

    try {
      // Admin sees all, others see only their branch
      const endpoint =
        user.role === "Admin"
          ? `${server}/portal/get-manifest/get-all`
          : `${server}/portal/get-manifest/get-all?branch=${user.branch}`;

      const res = await axios.get(endpoint);
      const manifestData = res.data.manifests || [];

      const transformed = await Promise.all(
        manifestData.map(async (m) => {
          const awbs = m.awbNumbers || [];
          const { totalPcs, totalWeight } = await fetchAwbDetails(awbs);

          return {
            manifestNumber: m.manifestNumber,
            client: m.clientName || "N/A",
            awbCount: awbs.length,
            pcs: totalPcs,
            totalWeight: totalWeight.toFixed(2),
            address: m.pickupAddress || "N/A",
            date: m.createdAt,
            status: m.pickupType === "pending" ? "Pending" : "Drop",
            branch: m.branch || user.branch,
          };
        })
      );

      setManifests(transformed);
    } catch (err) {
      console.log("Error loading manifests:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchBaggingData = async () => {
    setLoading(true);

    try {
      // console.log(user);

      const res = await axios.get(
        `${server}/branch-bagging/getAll-runs?branch=${user.branch}`
      );
      const data = [res.data] || [];

      // console.log(data);

      // Transform for your table format
      const transformed = data.map((run) => ({
        manifestNumber: run.runNo,
        awbCount: run.noOfAwb,
        pcs: run.noOfBags,
        totalWeight: `${run.runWeight} Kg`,
        date: run.createdAt,
        noOfBags: run.noOfBags,
        hub: run.hub,
      }));

      setManifests(transformed);
    } catch (err) {
      console.error("Error fetching branch bagging:", err);
    } finally {
      setLoading(false);
    }
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        calendarRefRunHandover.current &&
        !calendarRefRunHandover.current.contains(event.target)
      ) {
        setShowCalendarForRunHandover(false);
      }
      if (
        calendarRefOldShipment.current &&
        !calendarRefOldShipment.current.contains(event.target)
      ) {
        setShowCalendarForOldShipment(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const summaries = [
    {
      title: "RUN",
      Component: <LoadInWarehouse departed={64} advanceBagging={102} />,
    },
    {
      title: "SHIPMENTS",
      Component: <LoadInWarehouse departed={64} advanceBagging={102} />,
    },
    {
      title: "SHIPMENTS",
      Component: <LoadInWarehouse departed={64} advanceBagging={102} />,
    },
  ];

  const tableHeadersForRunHandover =
    demoRadio === "Branch"
      ? [
          "Manifest Number",
          "Origin Hub",
          "Bag",
          "No. of AWB",
          "Pcs",
          "Total Weight",
        ]
      : ["Manifest Number", "No. of AWB", "Pcs", "Total Weight"];

  const tableHeardersForOldShipment = [
    "Manifest Number",
    "Client",
    "No. of AWB",
    "Pcs",
    "Total Weight",
    "Address",
    "Action",
  ];

  const [manifests, setManifests] = useState([]);
  const [loading, setLoading] = useState(false);
  const { server } = useContext(GlobalContext);

  // CSV download util
  const downloadCSV = (data, headers, filename) => {
    let csvContent = "";
    csvContent += headers.join(",") + "\n";
    data.forEach((row) => {
      csvContent += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    link.click();
  };

  // Get detail for AWBs
  const fetchAwbDetails = async (awbNumbers) => {
    try {
      const awbResponses = await Promise.all(
        awbNumbers.map((awb) =>
          axios.get(`${server}/portal/get-shipments?awbNo=${awb}`)
        )
      );

      let totalPcs = 0;
      let totalWeight = 0;

      awbResponses.forEach((res) => {
        const shipment = res.data.shipment;
        if (shipment) {
          totalPcs += shipment?.boxes?.length || 0;
          totalWeight += shipment.totalActualWt || 0;
        }
      });

      return { totalPcs, totalWeight };
    } catch (err) {
      return { totalPcs: 0, totalWeight: 0 };
    }
  };

  // Load manifests
  useEffect(() => {
    if (!user || !user.branch) return; // Wait for user data

    const fetchManifests = async () => {
      setLoading(true);

      try {
        // Add branch filter
        const res = await axios.get(
          `${server}/portal/get-manifest/get-all?branch=${user.branch}`
        );
        const manifestData = res.data.manifests || [];

        const transformed = await Promise.all(
          manifestData.map(async (m) => {
            const awbs = m.awbNumbers || [];
            const { totalPcs, totalWeight } = await fetchAwbDetails(awbs);

            return {
              manifestNumber: m.manifestNumber,
              client: m.clientName || "N/A",
              awbCount: awbs.length,
              pcs: totalPcs,
              totalWeight: totalWeight.toFixed(2),
              address: m.pickupAddress || "N/A",
              date: m.createdAt,
              status: m.pickupType === "pending" ? "Pending" : "Drop",
              branch: m.branch || "N/A",
            };
          })
        );

        // Filter by user's branch
        const filteredByBranch = transformed.filter(
          (m) => !m.branch || m.branch === "N/A" || m.branch === user.branch
        );

        setManifests(filteredByBranch);
      } catch (err) {
        console.log("Error loading manifests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchManifests();
  }, [server, user]); // Add user as dependency

  // Split by status
  const dropManifests = manifests.filter((m) => m.status === "Drop");
  const pickupManifests = manifests.filter((m) => m.status === "Pending");

  // Full (unfiltered) table data
  // const runHandOver = dropManifests.map((m) => [
  //   m.manifestNumber,
  //   m.awbCount,
  //   m.pcs,
  //   m.totalWeight + " Kg",
  // ]);

  // const oldShipment = pickupManifests.map((m) => [
  //   m.manifestNumber,
  //   m.client,
  //   m.awbCount,
  //   m.pcs,
  //   m.totalWeight + " Kg",
  //   m.address && typeof m.address === "object"
  //     ? `${m.address.city || ""}, ${m.address.state || ""} - ${m.address.pincode || ""}`
  //     : "N/A",
  //   m.status,
  // ]);

  let runHandOver = [];
  let oldShipment = [];

  if (demoRadio === "Client") {
    // EXISTING CLIENT MAPPING
    // const dropManifests = manifests.filter((m) => m.status === "Drop");
    // const pickupManifests = manifests.filter((m) => m.status === "Pending");

    runHandOver = dropManifests.map((m) => [
      m.manifestNumber,
      m.awbCount,
      m.pcs,
      m.totalWeight + " Kg",
    ]);

    oldShipment = pickupManifests.map((m) => [
      m.manifestNumber,
      m.client,
      m.awbCount,
      m.pcs,
      m.totalWeight + " Kg",
      typeof m.address === "object"
        ? `${m.address.city}, ${m.address.state} - ${m.address.pincode}`
        : "N/A",
      m.status,
    ]);
  } else {
    // BRANCH MODE (RUN DATA)
    runHandOver = manifests.map((m) => [
      m.manifestNumber,
      m.hub,
      m.noOfBags,
      m.awbCount,
      m.pcs,
      m.totalWeight,
    ]);

    // No pickup table in branch mode (optional)
    oldShipment = [];
  }

  //  Filtered data (by date)
  const [filteredRunHandover, setFilteredRunHandover] = useState([]);
  const [filteredOldShipment, setFilteredOldShipment] = useState([]);

  // Filter helper
  const filterDataByDate = (selectedDate, type) => {
    if (!selectedDate) return;

    const formatted = selectedDate.format("YYYY-MM-DD");

    if (type === "run") {
      const filtered = dropManifests.filter(
        (m) => dayjs(m.date).format("YYYY-MM-DD") === formatted
      );

      setFilteredRunHandover(
        filtered.map((m) => [
          m.manifestNumber,
          m.awbCount,
          m.pcs,
          m.totalWeight + " Kg",
        ])
      );
    }

    if (type === "pickup") {
      const filtered = pickupManifests.filter(
        (m) => dayjs(m.date).format("YYYY-MM-DD") === formatted
      );

      setFilteredOldShipment(
        filtered.map((m) => [
          m.manifestNumber,
          m.client,
          m.awbCount,
          m.pcs,
          m.totalWeight + " Kg",
          m.address && typeof m.address === "object"
            ? `${m.address.city || ""}, ${m.address.state || ""} - ${
                m.address.pincode || ""
              }`
            : "N/A",
          m.status,
        ])
      );
    }
  };

  // When manifests load/change, filter by today's date initially
  useEffect(() => {
    if (manifests.length) {
      filterDataByDate(selectedDateForRunHandover, "run");
      filterDataByDate(selectedDateForOldShipment, "pickup");
    }
  }, [manifests]);

  // Handle date click from calendar
  const handleDateSelect = (newDate, type) => {
    if (type === "run") {
      setSelectedDateForRunHandover(newDate);
      filterDataByDate(newDate, "run");
    } else {
      setSelectedDateForOldShipment(newDate);
      filterDataByDate(newDate, "pickup");
    }
  };

  // CSV handlers (use filtered if available)
  const handleDownloadRunHandover = () => {
    const data =
      filteredRunHandover.length > 0 ? filteredRunHandover : runHandOver;
    downloadCSV(data, tableHeadersForRunHandover, "load_dispatch.csv");
  };

  const handleDownloadOldShipment = () => {
    const data =
      filteredOldShipment.length > 0 ? filteredOldShipment : oldShipment;
    downloadCSV(data, tableHeardersForOldShipment, "pickup_request.csv");
  };

  // Helper for building date grid
  const renderCalendar = (selectedDate, setShowCalendar, onSelectDate) => {
    const startOfMonth = selectedDate.startOf("month");
    const daysInMonth = selectedDate.daysInMonth();
    const today = dayjs();

    // To align by weekday, add blanks from Sunday index
    const firstDayWeekIndex = startOfMonth.day(); // 0-6

    const datesArray = [
      ...Array(firstDayWeekIndex).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) =>
        startOfMonth.date(i + 1)
      ),
    ];

    return (
      <div className="absolute z-10 mt-2 p-4 bg-white shadow-lg border rounded-md w-[280px]">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() =>
              onSelectDate(selectedDate.subtract(1, "month"), "change-month")
            }
          >
            &lt;
          </button>

          <span className="font-semibold">
            {selectedDate.format("MMMM YYYY")}
          </span>

          <button
            onClick={() =>
              !selectedDate.isAfter(today, "month") &&
              onSelectDate(selectedDate.add(1, "month"), "change-month")
            }
            disabled={selectedDate.isAfter(today, "month")}
          >
            &gt;
          </button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 text-xs text-gray-400 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center">
              {d}
            </div>
          ))}
        </div>

        {/* Dates grid */}
        <div className="grid grid-cols-7 gap-1">
          {datesArray.map((date, idx) => {
            if (!date) {
              return <div key={idx} />; // empty cell
            }

            const isFuture = date.isAfter(today, "day");
            const isSelected = selectedDate.isSame(date, "day");

            return (
              <button
                key={idx}
                disabled={isFuture}
                onClick={() => {
                  onSelectDate(date, "select-day");
                  setShowCalendar(false);
                }}
                className={`p-2 text-sm rounded ${
                  isFuture
                    ? "text-gray-300 cursor-not-allowed"
                    : isSelected
                    ? "bg-red text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {date.date()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ---- TOTALS FOR RUN TABLE ----
  const calculateRunTotals = (rows, mode = "Client") => {
    let totalAWB = 0;
    let totalPcs = 0;
    let totalWeight = 0;

    rows.forEach((row) => {
      if (mode === "Branch") {
        // Branch mode (6 columns)
        totalAWB += Number(row[3]) || 0;
        totalPcs += Number(row[4]) || 0;

        const weightValue =
          typeof row[5] === "string" ? parseFloat(row[5]) : Number(row[5]);

        totalWeight += weightValue || 0;
      } else {
        // Client mode (4 columns)
        totalAWB += Number(row[1]) || 0;
        totalPcs += Number(row[2]) || 0;

        const weightValue =
          typeof row[3] === "string" ? parseFloat(row[3]) : Number(row[3]);

        totalWeight += weightValue || 0;
      }
    });

    return { totalAWB, totalPcs, totalWeight };
  };

  // ---- TOTALS FOR PICKUP TABLE ----
  const calculatePickupTotals = (rows) => {
    let totalAWB = 0;
    let totalPcs = 0;
    let totalWeight = 0;

    rows.forEach((row) => {
      totalAWB += Number(row[2]) || 0; // AWB
      totalPcs += Number(row[3]) || 0; // PCS

      let weightCell = row[4]; // "50 Kg" or number
      let weightValue = 0;

      if (typeof weightCell === "string") {
        weightValue = parseFloat(weightCell);
      } else {
        weightValue = Number(weightCell);
      }

      totalWeight += weightValue || 0;
    });

    return { totalAWB, totalPcs, totalWeight };
  };

  // ---- APPLY TOTAL CALCULATION ----
  const totalsRun = calculateRunTotals(
    filteredRunHandover.length ? filteredRunHandover : runHandOver,
    demoRadio
  );

  const totalsPickup = calculatePickupTotals(
    filteredOldShipment.length ? filteredOldShipment : oldShipment
  );

  const openDigitalTallyTab = () => {
    const folder = "Booking"; // same folder as sidebar
    const subfolder = "Digital Tally";

    // Prevent duplicate tab
    setActiveTabs((prev) => {
      const exists = prev.some(
        (t) => t.folder === folder && t.subfolder === subfolder
      );
      if (exists) return prev;
      return [...prev, { folder, subfolder }];
    });

    // Make it the active tab
    setCurrentTab(subfolder);
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedManifest, setSelectedManifest] = useState(null);

  const confirmPickupUpdate = async () => {
    try {
      const body = {
        manifestNumber: selectedManifest,
        pickupType: "pickup",
      };

      const res = await axios.put(`${server}/portal/manifest`, body);

      if (res.data.success) {
        alert("Pickup updated successfully!");

        // Refresh UI locally
        setManifests((prev) =>
          prev.map((m) =>
            m.manifestNumber === selectedManifest
              ? { ...m, pickupType: "pickup", status: "Pickup" }
              : m
          )
        );
      }
    } catch (err) {
      console.error(err);
      alert("Error updating pickup request.");
    }

    setShowConfirmModal(false);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="w-full flex justify-between items-end">
        <div>
          <div className="text-sm text-gray-600">
            Viewing data for:{" "}
            <span className="font-semibold">{user.branch}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <SimpleButton
            type="button"
            name="Digital Tally"
            onClick={() => openDigitalTallyTab()}
          />
        </div>
      </div>

      {/* Summaries Row */}
      <div className="flex flex-row gap-3">
        {summaries.map(({ title, Component }, index) => (
          <CSSummary
            key={index}
            title={title}
            link="#"
            DataComponent={Component}
          />
        ))}
      </div>

      {/* Tables Section */}
      <div className="w-full flex flex-col gap-6">
        {/* Load Dispatch */}
        <div className="flex-1 p-5 border-battleship-gray border bg-seasalt rounded-md flex flex-col gap-5">
          <div className="flex justify-between items-start">
            <span className="font-bold text-lg">Load Dispatch</span>
            <div className="flex flex-row gap-4">
              <div ref={calendarRefRunHandover} className="relative">
                {/* Calendar Trigger */}
                <div
                  className="flex text-dim-gray border rounded-md items-center py-2 px-6 border-battleship-gray bg-white  cursor-pointer"
                  onClick={() =>
                    setShowCalendarForRunHandover(!showCalendarForRunHandover)
                  }
                >
                  <div className="flex items-center gap-4">
                    <span>
                      {selectedDateForRunHandover.format("DD")}/
                      {selectedDateForRunHandover.format("MM")}/
                      {selectedDateForRunHandover.format("YYYY")}
                    </span>
                    <img
                      src="calender.svg"
                      height={18}
                      width={18}
                      alt="calendar"
                    />
                  </div>
                </div>

                {/* Calendar Popover */}
                {showCalendarForRunHandover &&
                  renderCalendar(
                    selectedDateForRunHandover,
                    setShowCalendarForRunHandover,
                    (newDate, mode) => {
                      if (mode === "change-month") {
                        // change only month for view, keep day if possible
                        setSelectedDateForRunHandover(newDate);
                      } else {
                        handleDateSelect(newDate, "run");
                      }
                    }
                  )}
              </div>
              <div
                className="border p-2 rounded-lg border-[#979797] cursor-pointer"
                onClick={handleDownloadRunHandover}
              >
                <img
                  src="Download-gray.svg"
                  height={25}
                  width={25}
                  alt="Download"
                />
              </div>
            </div>
          </div>

          <div className=" w-full flex gap-3">
            {["Client", "Branch"].map((type) => (
              <RadioButtonLarge
                key={type}
                id={type}
                label={type}
                name="entryType"
                register={register}
                setValue={setValue}
                selectedValue={demoRadio}
                setSelectedValue={handleRadioChange}
              />
            ))}
          </div>

          <div className="border border-alice-blue border-collapse rounded-md overflow-hidden flex flex-col h-[600px]">
            <table className="w-full text-dim-gray border-collapse table-fixed bg-seasalt">
              <thead className="bg-seasalt text-xs font-medium sticky top-0 z-10">
                <tr className="border-b border-alice-blue">
                  {tableHeadersForRunHandover.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-center whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                  {/* Options menu */}
                  <td className="px-4 py-2 text-center text-gray-400 text-xl cursor-pointer"></td>
                </tr>
              </thead>
            </table>

            {/* Scrollable section */}
            <div className="flex-1 overflow-y-auto hidden-scrollbar">
              <table className="w-full text-sm border-collapse table-fixed">
                <tbody>
                  {(filteredRunHandover.length
                    ? filteredRunHandover
                    : runHandOver
                  ).map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="bg-white border-b border-alice-blue hover:bg-gray-50"
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-4 py-3 text-center text-dim-gray"
                        >
                          {cell}
                        </td>
                      ))}
                      {/* Options menu */}
                      <td className="px-4 py-2 text-center text-gray-400 text-xl cursor-pointer">
                        ⋮
                      </td>
                    </tr>
                  ))}
                  {!loading &&
                    filteredRunHandover.length === 0 &&
                    runHandOver.length === 0 && (
                      <tr>
                        <td
                          colSpan={tableHeadersForRunHandover.length}
                          className="text-center py-4 text-sm text-gray-400"
                        >
                          No data for this date.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
            <table>
              <tbody>
                {demoRadio === "Branch" ? (
                  <tr className="bg-alice-blue font-semibold">
                    <td className="px-4 py-3 text-left">Total</td>
                    <td className="px-4 py-3 text-center"></td>
                    <td className="px-4 py-3 text-center"></td>
                    <td className="px-4 py-3 text-center"></td>
                    <td className="px-4 py-3 text-center">
                      {totalsRun.totalAWB}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {totalsRun.totalPcs}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {totalsRun.totalWeight.toFixed(2)} Kg
                    </td>
                    <td className="px-4 py-3 text-center"></td>
                  </tr>
                ) : (
                  <tr className="bg-alice-blue font-semibold">
                    <td className="px-4 py-3 text-left">Total</td>
                    <td className="px-4 py-3 text-center">
                      {totalsRun.totalAWB}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {totalsRun.totalPcs}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {totalsRun.totalWeight.toFixed(2)} Kg
                    </td>
                    <td className="px-4 py-3 text-center"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pickup Request */}
        <div className="flex-1 p-5 border-battleship-gray border bg-seasalt rounded-md flex flex-col gap-5">
          <div className="flex justify-between items-start">
            <span className="font-bold text-lg">Pickup Request</span>

            <div className="flex flex-row gap-4">
              <div ref={calendarRefOldShipment} className="relative">
                {/* Calendar Trigger */}
                <div
                  className="flex text-dim-gray border rounded-md items-center py-2 px-6 border-battleship-gray bg-white  cursor-pointer"
                  onClick={() =>
                    setShowCalendarForOldShipment(!showCalendarForOldShipment)
                  }
                >
                  <div className="flex items-center gap-4">
                    <span>
                      {selectedDateForOldShipment.format("DD")}/
                      {selectedDateForOldShipment.format("MM")}/
                      {selectedDateForOldShipment.format("YYYY")}
                    </span>
                    <img
                      src="calender.svg"
                      height={18}
                      width={18}
                      alt="calendar"
                    />
                  </div>
                </div>

                {/* Calendar Popover */}
                {showCalendarForOldShipment &&
                  renderCalendar(
                    selectedDateForOldShipment,
                    setShowCalendarForOldShipment,
                    (newDate, mode) => {
                      if (mode === "change-month") {
                        setSelectedDateForOldShipment(newDate);
                      } else {
                        handleDateSelect(newDate, "pickup");
                      }
                    }
                  )}
              </div>

              <div
                className="border p-2 rounded-lg border-[#979797] cursor-pointer"
                onClick={handleDownloadOldShipment}
              >
                <img
                  src="Download-gray.svg"
                  height={25}
                  width={25}
                  alt="Download"
                />
              </div>
            </div>
          </div>

          <div className="border border-alice-blue border-collapse rounded-md overflow-hidden flex flex-col h-[600px]">
            <table className="w-full text-dim-gray border-collapse table-fixed bg-seasalt">
              <thead className="bg-seasalt text-xs font-medium sticky top-0 z-10">
                <tr className="border-b border-alice-blue">
                  {tableHeardersForOldShipment.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-center whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                  {/* Options menu */}
                  <td className="px-4 py-2 text-center text-gray-400 text-xl cursor-pointer"></td>
                </tr>
              </thead>
            </table>

            {/* Scrollable section */}
            <div className="flex-1 overflow-y-auto hidden-scrollbar">
              <table className="w-full text-sm border-collapse table-fixed">
                <tbody>
                  {(filteredOldShipment.length
                    ? filteredOldShipment
                    : oldShipment
                  ).map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="bg-white border-b border-alice-blue hover:bg-gray-50"
                    >
                      {row.map((cell, cellIndex) => {
                        const isStatusColumn =
                          tableHeardersForOldShipment[cellIndex] === "Status";
                        let statusClass = "";

                        if (isStatusColumn) {
                          if (cell === "Completed") {
                            statusClass =
                              "bg-green-3/10 text-green-3 border-green-3";
                          } else if (cell === "Pending") {
                            statusClass =
                              "bg-old-gold/10 text-old-gold border-old-gold";
                          } else if (cell === "Processing") {
                            statusClass =
                              "bg-blue-200/10 text-blue-600 border-blue-200";
                          }
                        }

                        return (
                          <td
                            key={cellIndex}
                            className="px-4 py-3 text-center text-dim-gray"
                          >
                            {isStatusColumn ? (
                              <span
                                className={`text-xs py-1.5 px-3 rounded-full border ${statusClass}`}
                              >
                                {cell}
                              </span>
                            ) : (
                              cell
                            )}
                          </td>
                        );
                      })}
                      {/* Options menu */}
                      <td
                        className="px-4 py-2 text-center text-gray-400 text-xl cursor-pointer"
                        onClick={() => {
                          setSelectedManifest(row[0]); // manifestNumber
                          setShowConfirmModal(true);
                        }}
                      >
                        ⋮
                      </td>
                    </tr>
                  ))}
                  {!loading &&
                    filteredOldShipment.length === 0 &&
                    oldShipment.length === 0 && (
                      <tr>
                        <td
                          colSpan={tableHeardersForOldShipment.length}
                          className="text-center py-4 text-sm text-gray-400"
                        >
                          No data for this date.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
            <table>
              <tbody>
                <tr className="bg-alice-blue font-semibold">
                  <td className="px-4 py-3 text-left">Total</td>
                  <td className="px-4 py-3 text-center"></td>
                  <td className="px-4 py-3 text-center"></td>
                  <td className="px-4 py-3 text-center">
                    {totalsPickup.totalAWB}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {totalsPickup.totalPcs}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {totalsPickup.totalWeight.toFixed(2)} Kg
                  </td>
                  <td className="px-4 py-3 text-center"></td>
                  <td className="px-4 py-3 text-center"></td>
                  <td className="px-4 py-3 text-center"></td>
                  <td className="px-4 py-3 text-center"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ConfirmModal
        visible={showConfirmModal}
        manifestNumber={selectedManifest}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmPickupUpdate}
      />
    </div>
  );
}

export default BookingDashboard;

// Generic summary box
function CSSummary({ title, link, DataComponent }) {
  const currentDate = dayjs();
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const dateInputRef = useRef(null);

  const handlePrevDay = () => {
    setSelectedDate((prev) => prev.subtract(1, "day"));
  };

  const handleNextDay = () => {
    const nextDate = selectedDate.add(1, "day");
    if (nextDate.isAfter(currentDate)) return;
    setSelectedDate(nextDate);
  };

  const handleDateChange = (e) => {
    setSelectedDate(dayjs(e.target.value));
  };

  const openCalendar = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <div className="flex flex-col gap-2.5 border p-4 rounded-md border-french-gray flex-1">
      <div className="flex justify-between text-xs">
        <span className="text-dim-gray font-semibold">{title}</span>
        <div className="text-dim-gray text-xs flex items-center gap-1">
          <button onClick={handlePrevDay}>
            <img src="arrow-right-gray.svg" alt="Left" className="rotate-180" />
          </button>

          <span onClick={openCalendar} className="cursor-pointer">
            {selectedDate.format("DD MMM, YYYY")}
          </span>

          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate.format("YYYY-MM-DD")}
            onChange={handleDateChange}
            className="hidden"
            max={currentDate.format("YYYY-MM-DD")}
          />

          <button
            onClick={handleNextDay}
            disabled={selectedDate.isSame(currentDate, "day")}
          >
            <img src="arrow-right-gray.svg" alt="Right" />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>{DataComponent}</div>
        <Link href={link}>
          <Image
            src="/external-link.svg"
            alt="external link"
            width={18}
            height={18}
          />
        </Link>
      </div>
    </div>
  );
}

function LoadInWarehouse({ departed, advanceBagging }) {
  return (
    <div className="flex gap-6">
      <LoadValue value={departed} label="Departed" color="text-red" />
      <LoadValue value={advanceBagging} label="Advance Bagging" />
    </div>
  );
}

function LoadValue({ value, label, color = "" }) {
  return (
    <div className="flex flex-col">
      <span className={`font-bold ${color}`}>{value} Tonn</span>
      <span className="text-xs text-dim-gray">{label}</span>
    </div>
  );
}

function ConfirmModal({ visible, onClose, onConfirm, manifestNumber }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
      <div className="bg-white w-[350px] rounded-md p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-center mb-4">
          Confirm Pickup
        </h2>

        <p className="text-sm text-center text-gray-600 mb-6">
          Are you sure you want to change <br />
          <b>Manifest #{manifestNumber}</b> to <b>Pickup</b>?
        </p>

        <div className="flex justify-between mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border-2 rounded-md text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#EA1B40] text-white rounded-md hover:bg-red/80"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
