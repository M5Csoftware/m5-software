import { RedCheckbox } from "@/app/components/Checkbox";
import React, { useState, useEffect } from "react";

const OperationsSection = ({ onChange, preSelectedFields = [] }) => {
  const sections = {
    Processing: [
      "Pickup Status",
      "Received At Hub",
      "Bag Number",
      "Bagged By",
      "Manifest Date",
    ],
    Routing: [
      "Origin Airport",
      "Destination Airport",
      "Flight Number",
      "Offload Reason",
    ],
    "Tracking / Status": [
      "Current Status",
      "Status Date",
      "Delivery Date",
      "POD Available",
    ],
  };

  // Build dynamic state based on preSelectedFields
  const [state, setState] = useState(() => {
    const initialState = {};
    Object.entries(sections).forEach(([title, fields]) => {
      const allSelected = fields.every((f) => preSelectedFields.includes(f));
      initialState[`title-${title}`] = allSelected;
      fields.forEach((f) => (initialState[f] = preSelectedFields.includes(f)));
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

      if (key.startsWith("title-")) {
        const title = key.replace("title-", "");
        sections[title].forEach((f) => (updated[f] = newVal));
      } else {
        const parent = Object.keys(sections).find((t) =>
          sections[t].includes(key),
        );

        const allSelected = sections[parent].every((f) => updated[f]);
        updated[`title-${parent}`] = allSelected;
      }

      return updated;
    });
  };

  const getCount = (fields) =>
    `${fields.filter((f) => state[f]).length}/${fields.length}`;

  useEffect(() => {
    const selected = Object.keys(state).filter(
      (k) => !k.startsWith("title-") && state[k],
    );
    onChange?.(selected);
  }, [state]);

  return (
    <div className="flex flex-col gap-3">
      {Object.entries(sections).map(([title, fields]) => (
        <div key={title} className="bg-[#F2F2F2] rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <RedCheckbox
              id={`title-${title}`}
              label={title}
              isChecked={state[`title-${title}`]}
              setChecked={() => toggle(`title-${title}`)}
              register={() => {}}
              setValue={() => {}}
            />

            <div className="bg-red text-white px-3 py-[2px] rounded text-sm">
              {getCount(fields)}
            </div>
          </div>

          <ul className="ml-6 mt-2">
            {fields.map((f) => (
              <li key={f} className="mt-1">
                <RedCheckbox
                  id={f}
                  label={f}
                  isChecked={state[f]}
                  setChecked={() => toggle(f)}
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

export default OperationsSection;
