"use client";

import { SimpleButton } from "@/app/components/Buttons";
import { DateInputBox } from "@/app/components/InputBox";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  ClientsCard,
  OutstandingCard,
  SalesProgressCard,

} from "./HODCollectionComponent";
import NotificationFlag from "@/app/components/Notificationflag";

function HODCollectionDashboard() {
  const [notification, setNotification] = useState({
    visible: false,
    type: "success",
    message: "",
  });

  return (
    <div>
      <div className="flex flex-col justify-end items-end px-11 pb-2">
        <div className="w-[200px]">
          <SimpleButton name={`CTA`} />{" "}
          {/*Conditonal render for management */}
        </div>
      </div>
      <div className="p-6 py-0 space-y-4">
        {/* Top Stats */}
        <div className="grid grid-cols-4 gap-6">
          <ClientsCard />
          <div className="col-span-3 rounded-lg bg-white">
            <SalesProgressCard />
          </div>
        </div>

        <div >
          <div className="col-span-2 flex flex-col gap-6">
            {/* Fixed Height Outstanding */}
            <div className="h-[800px]">
              <OutstandingCard />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default HODCollectionDashboard;
