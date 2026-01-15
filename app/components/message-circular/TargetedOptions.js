"use client"
import React, { useState, useEffect, useRef, useContext } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { GlobalContext } from "@/app/lib/GlobalContext";

const TargetedOptions = ({ onTargetingOptionsUpdate }) => {
  const { server } = useContext(GlobalContext);
  const [isOpen, setIsOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedHubs, setSelectedHubs] = useState([]);

  const [states, setStates] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState({ states: false, hubs: false });
  const [error, setError] = useState({ states: null, hubs: null });

  const dropdownRef = useRef(null);

  const categories = ["All", "Agents", "Customer"];

  // Update parent component whenever selections change
  useEffect(() => {
    if (onTargetingOptionsUpdate) {
      onTargetingOptionsUpdate({
        selectedCategory,
        selectedStates,
        selectedHubs,
      });
    }
  }, [
    selectedCategory,
    selectedStates,
    selectedHubs,
    onTargetingOptionsUpdate,
  ]);

  useEffect(() => {
    if (isOpen) {
      fetchStates();
      fetchHubs();
    }
  }, [isOpen]);

  const fetchStates = async () => {
    setLoading((p) => ({ ...p, states: true }));
    try {
      const res = await fetch(`${server}/helper/get-states`);
      const data = await res.json();
      if (data.success) setStates(data.states || []);
    } catch (err) {
      setError((p) => ({ ...p, states: err.message }));
    } finally {
      setLoading((p) => ({ ...p, states: false }));
    }
  };

  const fetchHubs = async () => {
    setLoading((p) => ({ ...p, hubs: true }));
    try {
      const res = await fetch(`${server}/helper/get-hubs`);
      const data = await res.json();
      if (data.success) setHubs(data.hubs || []);
    } catch (err) {
      setError((p) => ({ ...p, hubs: err.message }));
    } finally {
      setLoading((p) => ({ ...p, hubs: false }));
    }
  };

  const handleCategoryChange = (cat) => {
    if (selectedCategory === cat) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(cat);
    }
  };

  const toggleState = (state) => {
    setSelectedStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  const toggleHub = (hub) => {
    setSelectedHubs((prev) =>
      prev.includes(hub) ? prev.filter((h) => h !== hub) : [...prev, hub]
    );
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Dropdown header */}
      <div
        className="bg-gray-100 border border-gray-300 px-4 py-2 flex items-center justify-between cursor-pointer rounded-md w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <h2 className="text-red text-sm font-medium">Targeting Options</h2>
          {/* Show selected options summary */}
          {(selectedCategory ||
            selectedStates.length > 0 ||
            selectedHubs.length > 0) && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              {selectedCategory && (
                <span className="bg-green-100 px-2 py-1 rounded">
                  {selectedCategory}
                </span>
              )}
              {selectedStates.length > 0 && (
                <span className="bg-blue-100 px-2 py-1 rounded">
                  {selectedStates.length} States
                </span>
              )}
              {selectedHubs.length > 0 && (
                <span className="bg-purple-100 px-2 py-1 rounded">
                  {selectedHubs.length} Hubs
                </span>
              )}
            </div>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </div>

      {/* Floating Dropdown with independent scroll */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 border border-gray-300 bg-white rounded-md shadow-lg mt-1 max-h-80 overflow-y-auto custom-scrollbar w-full">
          <div className="grid grid-cols-3 gap-8 p-4">
            {/* Category */}
            <div>
              <h3 className="text-red font-medium mb-2 text-sm">
                Select Category*
              </h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={selectedCategory === cat}
                      onChange={() => handleCategoryChange(cat)}
                      onClick={() => handleCategoryChange(cat)}
                      className="custom-radio"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* States */}
            <div>
              <h3 className="text-red font-medium mb-2 text-sm">
                Select State* ({selectedStates.length} selected)
              </h3>
              {loading.states ? (
                <div className="flex items-center text-gray-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading
                  states...
                </div>
              ) : error.states ? (
                <p className="text-red-500 text-sm">{error.states}</p>
              ) : (
                <div className="space-y-2">
                  {states.map((s, i) => (
                    <label key={i} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedStates.includes(s)}
                        onChange={() => toggleState(s)}
                        className="custom-checkbox"
                      />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Hubs */}
            <div>
              <h3 className="text-red font-medium mb-2 text-sm">
                Select Hub* ({selectedHubs.length} selected)
              </h3>
              {loading.hubs ? (
                <div className="flex items-center text-gray-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading
                  hubs...
                </div>
              ) : error.hubs ? (
                <p className="text-red-500 text-sm">{error.hubs}</p>
              ) : (
                <div className="space-y-2">
                  {hubs.map((h, i) => (
                    <label key={i} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedHubs.includes(h)}
                        onChange={() => toggleHub(h)}
                        className="custom-checkbox"
                      />
                      <span>{h}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom styles */}
      <style jsx>{`
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #ef4444;
          border-radius: 10px;
        }

        /* Checkbox */
        .custom-checkbox {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          width: 16px;
          height: 16px;
          border: 2px solid #9ca3af;
          border-radius: 3px;
          cursor: pointer;
          position: relative;
        }
        .custom-checkbox:checked {
          background-color: #ef4444;
          border-color: #ef4444;
        }
        .custom-checkbox:checked::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 10px;
          background-image: url("/redCheck.svg");
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
        }

        /* Radio */
        .custom-radio {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          width: 18px;
          height: 18px;
          border: 2px solid #9ca3af;
          border-radius: 9999px;
          cursor: pointer;
          position: relative;
        }
        .custom-radio:checked::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 10px;
          background-color: #ef4444;
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
};

export default TargetedOptions;
