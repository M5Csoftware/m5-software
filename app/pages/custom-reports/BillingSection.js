import { RedCheckbox } from "@/app/components/Checkbox";
import React, { useState, useEffect } from "react";

const BillingSection = ({ onChange }) => {
  const sections = {
    Charges: [
      "Base Freight",
      "Fuel Surcharge",
      "Other Charges",
      "Discount",
      "Total Amount",
    ],
    Taxation: ["GST Rate", "GST Amount", "HSN Code"],
    "Invoice Info": [
      "Invoice Number",
      "Invoice Date",
      "Payment Status",
      "Payment Mode",
      "Billing Cycle",
    ],
    "Account Link": ["Account Code", "Billed By"],
    Documents: ["Invoice File", "Receipt File"],
  };

  // Build dynamic state
  const initialState = {};
  Object.entries(sections).forEach(([title, children]) => {
    initialState[`title-${title}`] = false;
    children.forEach((c) => (initialState[c] = false));
  });

  const [state, setState] = useState(initialState);

  const toggle = (key) => {
    setState((prev) => {
      const updated = { ...prev };
      const newVal = !prev[key];
      updated[key] = newVal;

      // If heading clicked → toggle all under it
      if (key.startsWith("title-")) {
        const title = key.replace("title-", "");
        sections[title].forEach((child) => (updated[child] = newVal));
      } else {
        // Child clicked → update heading based on all children
        const title = Object.keys(sections).find((t) =>
          sections[t].includes(key)
        );

        const allSelected = sections[title].every(
          (child) => updated[child]
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

  // SEND only child-selected fields to parent
  useEffect(() => {
    const selected = Object.keys(state).filter(
      (k) => !k.startsWith("title-") && state[k] === true
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

            <div className="bg-red text-white px-3 py-[2px] rounded text-sm">
              {getCount(children)}
            </div>
          </div>

          {/* Child Fields */}
          <ul className="ml-6 mt-2">
            {children.map((child) => (
              <li key={child}>
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

export default BillingSection;
