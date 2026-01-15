import { RedCheckbox } from "@/app/components/Checkbox";
import React, { useState, useEffect } from "react";

const CustomerServiceSection = ({ onChange }) => {
  const sections = {
    "Ticket Info": [
      "Ticket ID",
      "AWB Number",
      "Sector",
      "Category",
      "Sub Category",
      "Ticket Source",
    ],
    "Customer Interaction": [
      "Raised By",
      "Raised Date",
      "Handled By",
      "CS Remarks",
      "Communication Log",
    ],
    Resolution: ["Status", "Resolution Date", "TAT"],
  };

  // Build dynamic state
  const initial = {};
  Object.entries(sections).forEach(([title, fields]) => {
    initial[`title-${title}`] = false; // parent
    fields.forEach((f) => (initial[f] = false)); // children
  });

  const [state, setState] = useState(initial);

  const toggle = (key) => {
    setState((prev) => {
      const updated = { ...prev };
      const newVal = !prev[key];
      updated[key] = newVal;

      // If parent clicked → toggle all children
      if (key.startsWith("title-")) {
        const title = key.replace("title-", "");
        sections[title].forEach((c) => (updated[c] = newVal));
      } else {
        // If child clicked → update parent
        const parent = Object.keys(sections).find((t) =>
          sections[t].includes(key)
        );

        const allSelected = sections[parent].every((c) => updated[c]);
        updated[`title-${parent}`] = allSelected;
      }

      return updated;
    });
  };

  const getCount = (children) => {
    const selected = children.filter((c) => state[c]).length;
    return `${selected}/${children.length}`;
  };

  // Send list of selected child fields back to parent page
  useEffect(() => {
    const selected = Object.keys(state).filter(
      (k) => !k.startsWith("title-") && state[k]
    );
    onChange?.(selected);
  }, [state]);

  return (
    <div className="flex flex-col gap-3">
      {Object.entries(sections).map(([title, fields]) => (
        <div key={title} className="bg-[#F2F2F2] rounded-lg p-4 shadow-sm">
          {/* Heading with Select-All */}
          <div className="flex justify-between items-center">
            <RedCheckbox
              id={`title-${title}`}
              label={title}
              isChecked={state[`title-${title}`]}
              setChecked={() => toggle(`title-${title}`)}
              register={() => {}}
              setValue={() => {}}
            />

            <div className="bg-red px-3 py-[2px] rounded text-sm text-white">
              {getCount(fields)}
            </div>
          </div>

          {/* Children */}
          <ul className="mt-2 ml-6">
            {fields.map((field) => (
              <li key={field}>
                <RedCheckbox
                  id={field}
                  label={field}
                  isChecked={state[field]}
                  setChecked={() => toggle(field)}
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

export default CustomerServiceSection;
