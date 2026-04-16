"use client";
import { useState, useEffect } from "react";
import RedCheckbox, {
  RedCheckboxBase,
  RedCheckboxRedLabel,
} from "./RedCheckBox";

const Permissions = ({
  register,
  setValue,
  checkboxStates,
  toggleCheckboxState,
  permissionGroups,
}) => {
  // const [disable, setDisable] = useState(false);
  return (
    <div className="relative w-full border border-battleship-gray rounded-md p-5">
      <label className="absolute left-4 top-0 transform -translate-y-1/2 bg-white px-1 text-battleship-gray text-xs">
        Permissions
      </label>

      <div className="w-full flex justify-evenly gap-4">
        {/* Column 1 */}
        <div className="flex flex-col ">
          <PermissionSection
            title="title-Master (Administrative Control)"
            permissions={
              permissionGroups["title-Master (Administrative Control)"]
            }
            checkboxStates={checkboxStates}
            toggleCheckboxState={toggleCheckboxState}
            register={register}
            setValue={setValue}
          />

          <PermissionSection
            title="title-Operations"
            permissions={permissionGroups["title-Operations"]}
            checkboxStates={checkboxStates}
            toggleCheckboxState={toggleCheckboxState}
            register={register}
            setValue={setValue}
          />
        </div>
        <div>
          <PermissionSection
            title="title-Billing"
            permissions={permissionGroups["title-Billing"]}
            checkboxStates={checkboxStates}
            toggleCheckboxState={toggleCheckboxState}
            register={register}
            setValue={setValue}
          />

          <PermissionSection
            title="title-Reports"
            permissions={permissionGroups["title-Reports"]}
            checkboxStates={checkboxStates}
            toggleCheckboxState={toggleCheckboxState}
            register={register}
            setValue={setValue}
          />
          <PermissionSection
            title="title-Labels"
            permissions={permissionGroups["title-Labels"]}
            checkboxStates={checkboxStates}
            toggleCheckboxState={toggleCheckboxState}
            register={register}
            setValue={setValue}
          />
        </div>

        {/* Column 2 */}
        <div className="flex flex-col ">
          <PermissionSection
            title="title-Booking"
            permissions={permissionGroups["title-Booking"]}
            checkboxStates={checkboxStates}
            toggleCheckboxState={toggleCheckboxState}
            register={register}
            setValue={setValue}
          />

          <PermissionSection
            title="title-Customer Care"
            permissions={permissionGroups["title-Customer Care"]}
            checkboxStates={checkboxStates}
            toggleCheckboxState={toggleCheckboxState}
            register={register}
            setValue={setValue}
          />
        </div>

        {/* Column 3 */}
        <div>
          <PermissionSection
            title="title-Accounts"
            permissions={permissionGroups["title-Accounts"]}
            checkboxStates={checkboxStates}
            toggleCheckboxState={toggleCheckboxState}
            register={register}
            setValue={setValue}
          />
          <PermissionSection
            title="title-Import"
            permissions={permissionGroups["title-Import"]}
            checkboxStates={checkboxStates}
            toggleCheckboxState={toggleCheckboxState}
            register={register}
            setValue={setValue}
          />
        </div>
        {/* 
        <div className="flex items-start mt-4 pr-6 text-center justify-center w-[200px]">
          <RedCheckboxRedLabel
            isChecked={disable}
            setChecked={setDisable}
            id="disable"
            register={register}
            setValue={setValue}
            label={"Disable Account"}
          />
        </div> */}
      </div>
    </div>
  );
};

const PermissionSection = ({
  title,
  permissions,
  checkboxStates,
  toggleCheckboxState,
  register,
  setValue,
}) => (
  <div className="flex flex-col gap-1 rounded-md p-3 w-full">
    <div className="text-lg font-semibold">
      <RedCheckboxBase
        label={title.replace("title-", "")}
        isChecked={checkboxStates[title]}
        setChecked={() => toggleCheckboxState(title)}
        id={title}
        register={register}
        setValue={setValue}
      />
    </div>
    <div className="flex flex-col gap-1 ml-5">
      {permissions.map((permission) => (
        <RedCheckboxBase
          key={permission}
          label={permission.replace("permission-", "")}
          isChecked={checkboxStates[permission]}
          setChecked={() => toggleCheckboxState(permission)}
          id={permission}
          register={register}
          setValue={setValue}
        />
      ))}
    </div>
  </div>
);

export default Permissions;
