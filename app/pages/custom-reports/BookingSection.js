import { RedCheckbox } from "@/app/components/Checkbox";
import React, { useState, useEffect } from "react";

const BookingSection = ({ onChange, preSelectedFields = [] }) => {
  const sections = {
    "Shipment Info": [
      "AWB Number",
      "Reference Number",
      "Booking Date",
      "Shipment Type",
      "Mode",
      "Sector",
    ],

    "Consignor (Sender)": [
      "Consignor Name",
      "Consignor Address",
      "Consignor City",
      "Consignor State",
      "Consignor Contact",
      "Consignor Email",
      "KYC Type",
      "KYC Number",
    ],

    "Consignee (Receiver)": [
      "Consignee Name",
      "Consignee Address",
      "Consignee City",
      "Consignee Country",
      "Consignee Contact",
      "Consignee Email",
    ],

    "Weight & Dimensions": [
      "Actual Weight",
      "Chargeable Weight",
      "Length",
      "Width",
      "Height",
    ],

    "Account Info": ["Account Code", "Account Type"],

    "Booking Staff": ["Booked By", "Branch"],
  };

  // Build dynamic state based on preSelectedFields
  const [state, setState] = useState(() => {
    const initialState = {};
    Object.entries(sections).forEach(([title, children]) => {
      const allSelected = children.every((c) => preSelectedFields.includes(c));
      initialState[`title-${title}`] = allSelected;
      children.forEach((c) => (initialState[c] = preSelectedFields.includes(c)));
    });
    return initialState;
  });

  // Handle external reset
  useEffect(() => {
    if (preSelectedFields.length === 0) {
      const hasSelected = Object.values(state).some((v) => v === true);
      if (hasSelected) {
        const resetState = {};
        Object.keys(state).forEach((k) => (resetState[k] = false));
        setState(resetState);
      }
    }
  }, [preSelectedFields]);

  const toggle = (key) => {
    setState((prev) => {
      const updated = { ...prev };
      const newVal = !prev[key];
      updated[key] = newVal;

      // Heading toggle
      if (key.startsWith("title-")) {
        const title = key.replace("title-", "");
        sections[title].forEach((child) => (updated[child] = newVal));
      } else {
        // Child toggle updates heading
        const title = Object.keys(sections).find((t) =>
          sections[t].includes(key),
        );

        const allSelected = sections[title].every(
          (child) => updated[child] === true,
        );

        updated[`title-${title}`] = allSelected;
      }

      return updated;
    });
  };

  const getCount = (children) => {
    const selected = children.filter((c) => state[c]).length;
    return `${selected}/${children.length}`;
  };

  // Send only selected child fields
  useEffect(() => {
    const selected = Object.keys(state).filter(
      (k) => !k.startsWith("title-") && state[k],
    );

    onChange?.(selected);
  }, [state]);

  return (
    <div className="flex flex-col gap-3">
      {Object.entries(sections).map(([title, children]) => (
        <div key={title} className="bg-[#F2F2F2] rounded-lg p-4 shadow-sm">
          {/* Heading */}
          <div className="flex items-center justify-between">
            <RedCheckbox
              id={`title-${title}`}
              label={title}
              isChecked={state[`title-${title}`]}
              setChecked={() => toggle(`title-${title}`)}
              register={() => {}}
              setValue={() => {}}
            />

            <div className="bg-red text-white px-3 py-[2px] rounded text-sm tracking-widest">
              {getCount(children)}
            </div>
          </div>

          {/* Child Fields */}
          <ul className="ml-6 mt-2">
            {children.map((child) => (
              <li key={child} className="leading-loose mt-1">
                <RedCheckbox
                  id={child}
                  label={child}
                  isChecked={state[child]}
                  setChecked={() => toggle(child)}
                  register={() => {}}
                  setValue={() => {}}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default BookingSection;
