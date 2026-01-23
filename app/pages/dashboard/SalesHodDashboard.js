"use client";

import { SimpleButton } from "@/app/components/Buttons";
import { DateInputBox } from "@/app/components/InputBox";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ClientsCard,
  HSSBReport,
  OutstandingCard,
  SalesPersonCard,
  SalesProgressCard,
  SummaryCard,
} from "./SalesHodComponents";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";

function SalesDashboardLayout() {
  const [notification, setNotification] = useState({
    visible: false,
    type: "success",
    message: "",
  });

  const [targetRows, setTargetRows] = useState([]);
  const { server, setActiveTabs, setCurrentTab, activeTabs } =
    useContext(GlobalContext);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `${server}/dashboard/sales-hod-dashboard/target`,
          {
            cache: "no-store",
          }
        );
        const data = await res.json();
        setTargetRows(data);
      } catch (err) {
        console.log("Failed to load targets:", err);
      }
    };

    load();
  }, [server]);

  return (
    <div>
      <div className="flex flex-col justify-end items-end px-6 pb-2">
        <div className="w-[125px]">
          <SimpleButton
            name="Assign"
            onClick={() => {
              const tab = {
                folder: "Admin",
                subfolder: "Assign Customer & Target",
              };

              setActiveTabs((prev) =>
                prev.some(
                  (item) =>
                    item.folder === tab.folder &&
                    item.subfolder === tab.subfolder
                )
                  ? prev
                  : [...prev, tab]
              );

              setCurrentTab("Assign Customer & Target");
            }}
          />
          {/*Conditonal render for management */}
        </div>
      </div>
      <div className="p-6 py-0 space-y-4">
        {/* Top Stats */}
        <div className="flex w-full gap-3">
          <div className="w-1/3">
            <ClientsCard />
          </div>
          <div className="w-2/3 rounded-lg bg-white">
            <SalesProgressCard />
          </div>
        </div>

        {/* Middle Section */}
        <div className="flex gap-3">
          {/* Sales Person */}
          <div className="w-1/3">
            <SalesPersonCard rows={targetRows} />
          </div>

          {/* Right Side */}
          <div className="flex flex-col gap-3 w-2/3">
            <div className="w-full">
              <HSSBReport setNotification={setNotification} />
            </div>
            <NotificationFlag
              type={notification.type}
              message={notification.message}
              visible={notification.visible}
              setVisible={(v) =>
                setNotification({ ...notification, visible: v })
              }
            />

            {/* Fixed Height Outstanding */}
            <div className="">
              <OutstandingCard />
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <SummaryCard />
      </div>
    </div>
  );
}

export default SalesDashboardLayout;
