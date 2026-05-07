"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";

export function OutlinedButtonWithRightImage({
  label,
  icon,
  onClick = () => {},
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-red text-red font-semibold text-sm rounded-md px-6 py-3.5 flex items-center gap-4 "
    >
      <span>{label}</span>
      <Image src={icon} alt={label} width={16} height={16} />
    </button>
  );
}
export function OutlinedButtonWithLeftImage({
  label,
  icon,
  onClick = () => {},
  type = "button",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="border border-red text-red font-semibold text-xs rounded-md px-6 py-1.5 flex items-center gap-4 "
    >
      <Image
        src={icon}
        alt={label}
        width={12}
        height={12}
        className="font-semibold"
      />
      <span>{label}</span>
    </button>
  );
}

// export function OutlinedButtonRed({
//   label,
//   onClick = () => {},
//   disabled = false,
//   type = "button",
//   className,
//   buttonIcon = false,
//   saveIcon = false,
//   reportIcon = false,
//   unlockIcon = false,
// }) {
//   return (
//     <button
//       type={type}
//       onClick={onClick}
//       disabled={disabled}
//       className={`border w-full  transition-all border-red text-red font-semibold text-sm rounded-md px-12 py-2.5 ${className} flex items-center justify-center gap-1 ${
//         disabled ? "cursor-not-allowed opacity-70" : "hover:bg-[#00000033]"
//       }`}
//     >
//       {buttonIcon && <img src="/Button-Icon.png" />}
//       {saveIcon && <img src="/Save-Icon.png" className="h-5 w-5" />}
//       {reportIcon && <img src="/Report-Icon.png" className="h-5 w-5" />}
//       {unlockIcon && (
//         <img src="/unlock-solid.svg" className="h-3.5 w-3.5 mb-[1px]" />
//       )}

//       <span>{label}</span>
//     </button>
//   );
// }

// export function SimpleButton({
//   name,
//   onClick = () => {},
//   disabled = false,
//   type = "button",
//   className,
//   reportIcon = false,
//   lockIcon = false,
// }) {
//   return (
//     <button
//       disabled={disabled}
//       className={`text-nowrap transition-all text-white font-semibold rounded-md flex gap-1 items-center justify-center  text-sm  py-2.5 ${
//         className ? className : "bg-red hover:bg-dark-red"
//       } w-full ${name == "Next" ? "px-12" : "px-12"} ${
//         disabled ? "cursor-not-allowed opacity-90" : ""
//       } `}
//       type={type}
//       onClick={onClick}
//     >
//       {reportIcon && <img src="/Report-Icon.png" className="h-4 w-4" />}
//       {lockIcon && (
//         <img src="/lock-solid.svg" className="h-3.5 w-3.5 mb-[1px]" />
//       )}
//       {name}
//     </button>
//   );
// }

export function OutlinedButtonRed({
  label,
  onClick = () => {},
  disabled = false,
  type = "button",
  className = "",
  buttonIcon = false,
  saveIcon = false,
  reportIcon = false,
  unlockIcon = false,
  perm,
  tooltip = "",
}) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const sessionData = sessionStorage.getItem("user");
      const localData = localStorage.getItem("user");
      const u = sessionData
        ? JSON.parse(sessionData)
        : localData
          ? JSON.parse(localData)
          : null;
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  const hasPermission = perm ? user?.permissions?.[perm] === true : true;
  const isDisabled = disabled || !hasPermission;

  const tooltipMessage = !hasPermission
    ? "You are not authorized for this action"
    : tooltip;

  return (
    <button
      type={type}
      onClick={hasPermission ? onClick : undefined}
      disabled={isDisabled}
      title={tooltipMessage}
      className={`
        border w-full transition-all border-red text-red font-semibold 
        text-sm rounded-md px-8 py-[5px] flex items-center justify-center gap-1
        ${className}
        ${isDisabled ? "cursor-not-allowed opacity-70" : "hover:bg-[#00000033]"}
      `}
    >
      {buttonIcon && <img src="/Button-Icon.png" />}
      {saveIcon && <img src="/Save-Icon.png" className="h-5 w-5" />}
      {reportIcon && <img src="/Report-Icon.png" className="h-5 w-5" />}
      {unlockIcon && (
        <img src="/unlock-solid.svg" className="h-3.5 w-3.5 mb-[1px]" />
      )}

      <span>{label}</span>
    </button>
  );
}

export function SimpleButton({
  name,
  onClick = () => {},
  disabled = false,
  type = "button",
  className,
  reportIcon = false,
  lockIcon = false,
  perm,
  tooltip = "",
}) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const sessionData = sessionStorage.getItem("user");
      const localData = localStorage.getItem("user");
      const u = sessionData
        ? JSON.parse(sessionData)
        : localData
          ? JSON.parse(localData)
          : null;
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  const hasPermission = perm ? user?.permissions?.[perm] === true : true;
  const isDisabled = disabled || !hasPermission;

  const tooltipMessage = !hasPermission
    ? "You are not authorized for this action"
    : tooltip;

  return (
    <button
      disabled={isDisabled}
      title={tooltipMessage}
      className={`
        text-nowrap transition-all text-white font-semibold rounded-md 
        flex gap-1 items-center justify-center text-sm py-[5px]
        ${className ? className : "bg-red hover:bg-dark-red"}
        w-full px-8
        ${isDisabled ? "cursor-not-allowed opacity-60" : ""}
      `}
      type={type}
      onClick={hasPermission ? onClick : undefined}
    >
      {reportIcon && <img src="/Report-Icon.png" className="h-4 w-4" />}
      {lockIcon && (
        <img src="/lock-solid.svg" className="h-3.5 w-3.5 mb-[1px]" />
      )}
      {name}
    </button>
  );
}

export function RadioRedButton({
  tabs,
  activeTab,
  onTabChange,
  register,
  setValue,
  accountType,
  setAccountType,
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="border-gray-300 w-full flex gap-10">
        {tabs.map((tab, index) => (
          <label
            htmlFor={tab.id}
            key={index}
            className={`w-full items-center px-13 py-2 text-center cursor-pointer shadow-sm tracking-wide  rounded-md ${
              activeTab === index
                ? "text-[#EA1B40] bg-[#FFE5E9]"
                : "text-[#979797] bg-[#F8F8F8]"
            }`}
            onClick={() => onTabChange(index, tab.value)}
          >
            <div className="flex justify-center items-center gap-2">
              <tab.RadioComponent
                id={tab.id}
                name="accountType"
                register={register}
                setValue={setValue}
                value={tab.value}
                selectedValue={accountType}
                setSelectedValue={(value) => {
                  setAccountType(value);
                  onTabChange(index, value); // Sync tab change
                }}
              />
              <label htmlFor={tab.id} className="text-sm font-semibold">
                {tab.label}
              </label>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
