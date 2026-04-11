import React, { useContext, useEffect, useState } from "react";
import InputBox from "../InputBox";
import { LabeledDropdown } from "../Dropdown";
import { useForm } from "react-hook-form";
import { TableWithSorting } from "../Table";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "../Notificationflag";

const AwbWish = ({ refreshKey }) => {
  const { server } = useContext(GlobalContext);
  const {
    register,
    setValue,
    reset,
    watch,
    getValues,
    formState: { errors },
    trigger,
  } = useForm();

  const [rowData, setRowData] = React.useState([]);
  const [resetFactor, setResetFactor] = useState(0);
  const [forwarderOptions, setForwarderOptions] = useState([
    "UPS",
    "USPS",
    "DPD",
    "DPDG",
    "DPDE",
    "DPDI",
    "ARAMEX",
    "Courier Please",
    "Self",
    "DHL",
    "Fedex",
    "Evri",
  ]);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const watchedAwb = watch("awbNo");

  const columns = [
    { key: "forwardingNo", label: "FWD No." },
    { key: "forwarder", label: "Forwarder" },
    { key: "coLoader", label: "Co-Loader" },
    { key: "coLoaderNumber", label: "Co-Loader No." },
  ];

  // Fetch AWB
  useEffect(() => {
    if (!watchedAwb) return;

    const fetchAwbData = async () => {
      try {
        const res = await axios.get(
          `${server}/portal/create-shipment/update-forwarding-number?awbNo=${watchedAwb}`
        );

        const data = res.data;

        if (!data) {
          setRowData([]);
          showNotification("error", "AWB not found");
          return;
        }

        // works for master + child
        setValue("forwarder", data.forwarder || "");
        setValue("forwardingNumber", data.forwardingNo || "");
        setValue("coLoader", data.coLoader || "");
        setValue("coLoaderNumber", data.coLoaderNumber || "");

        setRowData([
          {
            forwarder: data.forwarder || "",
            forwardingNo: data.forwardingNo || "",
            coLoader: data.coLoader || "",
            coLoaderNumber: data.coLoaderNumber || "",
            source: data.source, // optional
          },
        ]);

        showNotification("success", `Loaded (${data.source})`);
      } catch (err) {
        setRowData([]);
        showNotification("error", "Invalid AWB");
      }
    };

    fetchAwbData();
  }, [watchedAwb]);

  const handleSave = async () => {
    const valid = await trigger();
    if (!valid) return;

    if (!rowData.length) {
      showNotification("error", "Enter valid AWB");
      return;
    }

    const formValues = getValues();
    const oldData = rowData[0];

    const safe = (v) => (v ?? "").toString().trim();

    // BOTH must exist in DB
    const hasExisting =
      safe(oldData.forwarder) !== "" && safe(oldData.forwardingNo) !== "";

    if (!hasExisting) {
      // first time entry → no modal
      await handleConfirm();
      return;
    }

    // check actual change
    const isChanged =
      safe(formValues.forwarder) !== safe(oldData.forwarder) ||
      safe(formValues.forwardingNumber) !== safe(oldData.forwardingNo) ||
      safe(formValues.coLoader) !== safe(oldData.coLoader) ||
      safe(formValues.coLoaderNumber) !== safe(oldData.coLoaderNumber);

    if (!isChanged) {
      showNotification("error", "No changes detected");
      return;
    }

    // existing data + change → show modal
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    try {
      const formValues = getValues();
      const updatePayload = {};

      if (formValues.forwarder) updatePayload.forwarder = formValues.forwarder;
      if (formValues.forwardingNumber)
        updatePayload.fwdNumber = formValues.forwardingNumber;
      if (formValues.coLoader) updatePayload.coLoader = formValues.coLoader;
      if (formValues.coLoaderNumber)
        updatePayload.coLoaderNumber = formValues.coLoaderNumber;

      await axios.put(
        `${server}/portal/create-shipment/update-forwarding-number?awbNo=${watchedAwb}`,
        updatePayload
      );

      showNotification("success", "AWB updated");
      setResetFactor((p) => p + 1);
      setRowData([]);
      setValue("forwarder", "");
      setValue("forwardingNumber", "");
      setValue("coLoader", "");
      setValue("coLoaderNumber", "");
    } catch (error) {
      console.error(error);
      showNotification("error", "Update failed");
    }
  };

  useEffect(() => {
    reset({
      forwarder: "",
      forwardingNumber: "",
      coLoader: "",
      coLoaderNumber: "",
      awbNo: "",
    });
    setRowData([]);
    showNotification("success", "Form refreshed");

    const timeout = setTimeout(() => {
      setResetFactor((p) => p + 1);
    }, 50);

    return () => clearTimeout(timeout);
  }, [refreshKey]);

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <div className="flex flex-col gap-3">
        <h2 className="text-[16px] text-red font-semibold">Run Details</h2>

        <div className="flex gap-9">
          <div className="flex flex-col gap-3 w-full">
            <InputBox
              placeholder="Awb No"
              register={register}
              setValue={setValue}
              value="awbNo"
              resetFactor={resetFactor}
              validation={{ required: "AWB required" }}
              error={errors.awbNo}
              trigger={trigger}
            />

            <LabeledDropdown
              options={forwarderOptions}
              register={register}
              setValue={setValue}
              value="forwarder"
              title="Forwarder"
              resetFactor={resetFactor}
              validation={{ required: "Forwarder required" }}
              error={errors.forwarder}
              trigger={trigger}
            />

            <InputBox
              placeholder="Forwarding Number"
              register={register}
              setValue={setValue}
              value="forwardingNumber"
              resetFactor={resetFactor}
              validation={{ required: "Required" }}
              error={errors.forwardingNumber}
              trigger={trigger}
            />

            <InputBox
              placeholder="Co-Loader"
              register={register}
              setValue={setValue}
              value="coLoader"
              resetFactor={resetFactor}
            />

            <InputBox
              placeholder="Co-Loader Number"
              register={register}
              setValue={setValue}
              value="coLoaderNumber"
              resetFactor={resetFactor}
            />

            <SimpleButton name="Save" onClick={handleSave} />
          </div>

          <div className="w-full">
            <TableWithSorting
              register={register}
              setValue={setValue}
              name="Update Forwarding Number"
              columns={columns}
              rowData={rowData}
              className="h-[29.5vh]"
            />
          </div>
        </div>

        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
              <h3 className="text-lg font-semibold mb-4">Confirm Update</h3>
              <p className="mb-6">Are you sure you want to update this AWB?</p>
              <div className="flex justify-end gap-3">
                <OutlinedButtonRed
                  label="Cancel"
                  onClick={() => {
                    setShowConfirmModal(false);
                    showNotification("error", "Update canceled");
                  }}
                />
                <SimpleButton name="Confirm" onClick={handleConfirm} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AwbWish;
