import React, { useContext, useEffect, useState } from "react";
import InputBox from "@/app/components/InputBox";
import { LabeledDropdown } from "../Dropdown";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import { DummyInputBoxWithLabelTransparent } from "../DummyInputBox";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";

const CustomerDetails = ({
  register,
  setValue,
  setStep,
  watch,
  customerData,
}) => {
  const [branchName, setBranchName] = useState("");
  const [allBranches, setAllBranches] = useState([]);
  const { server } = useContext(GlobalContext);

  // Watch the branch field for changes
  const selectedBranch = watch("branch");

  // Watch the account field for changes
  const accountStatus = watch("account");

  // Fetch all branches from API on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        console.log("=== Fetching Branches ===");
        const response = await axios.get(`${server}/branch-master`);
        console.log("Branches fetched:", response.data);
        setAllBranches(response.data);
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };

    fetchBranches();
  }, [server]);

  // Update branch name when selected branch changes
  useEffect(() => {
    const codeToFind = selectedBranch || customerData?.branch;

    if (codeToFind && allBranches.length > 0) {
      console.log("=== Branch Selected ===");
      console.log("Selected branch code:", codeToFind);

      const branch = allBranches.find((b) => b.code === codeToFind);

      if (branch) {
        console.log("Branch found:", branch);
        setBranchName(branch.companyName);
        setValue("branchName", branch.companyName);
      } else {
        console.log("Branch not found for code:", codeToFind);
        setBranchName("");
        setValue("branchName", "");
      }
    }
  }, [selectedBranch, allBranches, setValue]); // allBranches in deps ensures it runs after fetch

  // Set initial values from customerData
  useEffect(() => {
    if (customerData?.branchName) {
      setBranchName(customerData.branchName);
      setValue("branchName", customerData.branchName);
    }
  }, [customerData, setValue]);

  return (
    <div>
      <div className=" flex gap-9  h-[55vh]">
        <div className="flex flex-col w-full ">
          <div className="flex flex-col gap-3">
            <h2 className="text-red font-semibold text-base">Branch Details</h2>
            <div className="flex flex-col gap-4">
              <LabeledDropdown
                options={allBranches.map((branch) => branch.code)} // ← changed from branches to allBranches
                title="Select Branch"
                register={register}
                setValue={setValue}
                value="branch"
                defaultValue={customerData?.branch || ""}
              />
              <DummyInputBoxWithLabelTransparent
                watch={watch}
                label={`Company Name`}
                register={register}
                setValue={setValue}
                value="branchName"
                inputValue={branchName}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-red font-semibold text-base">
              Sale Person Details
            </h2>
            <div className="flex gap-6">
              <InputBox
                placeholder="Sales Person Name"
                register={register}
                setValue={setValue}
                value="salesPersonName"
                initialValue={customerData?.salesPersonName || ""}
              />
              <InputBox
                placeholder="Reference By"
                register={register}
                setValue={setValue}
                value="referenceBy"
                initialValue={customerData?.referenceBy || ""}
              />
            </div>

            <div className=" flex flex-col gap-4">
              <InputBox
                placeholder="Managed By"
                register={register}
                setValue={setValue}
                value="managedBy"
                initialValue={customerData?.managedBy || ""}
              />
              <InputBox
                placeholder="Collection By"
                register={register}
                setValue={setValue}
                value="collectionBy"
                initialValue={customerData?.collectionBy || ""}
              />
              <InputBox
                placeholder="Account Manager"
                register={register}
                setValue={setValue}
                value="accountManager"
                initialValue={customerData?.accountManager || ""}
              />
              <InputBox
                placeholder="Report Person"
                register={register}
                setValue={setValue}
                value="reportPerson"
                initialValue={customerData?.reportPerson || ""}
              />
              <InputBox
                placeholder="Sales Coordinator"
                register={register}
                setValue={setValue}
                value="salesCoordinator"
                initialValue={customerData?.salesCoordinator || ""}
              />
            </div>
          </div>
        </div>

        <div className=" flex flex-col w-full gap-3">
          <h2 className="text-red font-semibold text-base">Other Details</h2>

          <div className=" flex flex-col gap-4">
            <div className="grid grid-cols-2 grid-rows gap-x-4 gap-y-4">
              <InputBox
                placeholder="Applicable Tariff"
                register={register}
                setValue={setValue}
                value="applicableTariff"
                initialValue={customerData?.applicableTariff || ""}
              />
              <LabeledDropdown
                options={["GST-Additional", "GST-Inclusive"]}
                register={register}
                setValue={setValue}
                value="gst"
                title="GST"
                defaultValue={customerData?.gst || ""}
              />
            </div>
            <div className="grid grid-cols-2 grid-rows gap-x-4 gap-y-4">
              <LabeledDropdown
                options={["Yes", "No"]}
                register={register}
                setValue={setValue}
                value="fuel"
                title="Fuel "
                defaultValue={customerData?.fuel || ""}
              />
              <InputBox
                placeholder="Fuel %"
                register={register}
                setValue={setValue}
                value="fuelPercentage"
                initialValue={customerData?.fuelPercentage || ""}
              />
            </div>
            <div className="flex flex-col gap-3">
              <InputBox
                placeholder="Billing Email Id"
                register={register}
                setValue={setValue}
                value="billingEmailId"
                initialValue={customerData?.billingEmailId || ""}
              />
            </div>

            <div className="flex gap-6">
              <LabeledDropdown
                options={["Air Cargo", "COD", "Credit", "FOC", "RTO"]}
                register={register}
                setValue={setValue}
                value="paymentTerms"
                title="Payment Terms"
                defaultValue={customerData?.paymentTerms || ""}
              />
            </div>
            <div className="flex gap-6">
              <InputBox
                placeholder="Parent Account"
                register={register}
                setValue={setValue}
                value="parentAccount"
                initialValue={
                  customerData?.accountClass === "Parent"
                    ? customerData?.accountCode
                    : customerData?.groupCode
                }
                disabled
              />
              <LabeledDropdown
                title={`Account Class`}
                register={register}
                setValue={setValue}
                value="accountClass"
                defaultValue={customerData?.accountClass || ""}
                options={["Parent", "Child"]}
              />
              <InputBox
                placeholder="Group Code"
                register={register}
                setValue={setValue}
                value="groupCode"
                initialValue={customerData?.groupCode || ""}
              />
            </div>
            <div className="flex gap-6">
              <LabeledDropdown
                options={["Yes", "No"]}
                register={register}
                setValue={setValue}
                value="billingTag"
                title="Billing Tag"
                defaultValue={customerData?.billingTag || ""}
              />
              <LabeledDropdown
                options={["INR", "USD", "GBP", "EUR", "CAD", "AUD"]}
                register={register}
                setValue={setValue}
                value="currency"
                title="Currency"
                defaultValue={customerData?.currency || ""}
              />
              <InputBox
                placeholder="CSB5"
                register={register}
                setValue={setValue}
                value="csb"
                initialValue={customerData?.csb || ""}
              />
            </div>
            <div className="flex gap-6">
              <InputBox
                placeholder="OUT/Group Code"
                register={register}
                setValue={setValue}
                value="outOrGroupCode"
                initialValue={customerData?.outOrGroupCode || ""}
              />
            </div>
            <div className="flex flex-col gap-3">
              <LabeledDropdown
                options={["normal", "temp"]}
                register={register}
                setValue={setValue}
                value="modeType"
                title="Mode Type"
                defaultValue={customerData?.modeType || ""}
              />
              <div className="grid grid-cols-2 grid-rows gap-x-4 gap-y-4">
                <LabeledDropdown
                  options={["Active", "Deactivated"]}
                  register={register}
                  setValue={setValue}
                  value="account"
                  title="Account"
                  defaultValue={customerData?.account || ""}
                />
                {accountStatus === "Deactivated" ? (
                  <InputBox
                    placeholder="Deactivate Reason"
                    register={register}
                    setValue={setValue}
                    value="deactivateReason"
                    initialValue={customerData?.deactivateReason || ""}
                  />
                ) : (
                  <DummyInputBoxWithLabelTransparent
                    watch={watch}
                    label={`Deactivate Reason`}
                    register={register}
                    setValue={setValue}
                    value="deactivateReason"
                    inputValue=""
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <div>
          <OutlinedButtonRed
            label={"Back"}
            onClick={() => setStep((prevStep) => prevStep - 1)}
          />
        </div>
        <div>
          <SimpleButton
            onClick={() => setStep((prevStep) => prevStep + 1)}
            name={"Next"}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
