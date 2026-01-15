import React, { useContext, useEffect, useState } from "react";
import Checkbox from "../Checkbox";
import InputBox, { ImageInputBox } from "../InputBox";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";
import axios from "axios";

const UploadSignature = ({
  register,
  setValue,
  setStep,
  getValues,
  watch,
  customerData,
}) => {
  const { server } = useContext(GlobalContext);
  const [signatureImageUrl, setSignatureImageUrl] = useState(null);
  const [stampImageUrl, setStampImageUrl] = useState(null);
  const [reset, setReset] = useState(false);
  const [uploading, setUploading] = useState({
    signature: false,
    stamp: false,
  });

  // Notification state
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  // Get account code from form
  const accountCode = watch("accountCode");

  // Helper function to show notifications
  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  // Load existing images if available
  useEffect(() => {
    if (customerData?.signatureImage) {
      setSignatureImageUrl(customerData.signatureImage);
    }
    if (customerData?.stampImage) {
      setStampImageUrl(customerData.stampImage);
    }
  }, [customerData]);

  const handleImageUpload = async (file, imageType) => {
    if (!accountCode) {
      showNotification(
        "error",
        "Please save customer details first to get an account code"
      );
      return;
    }

    if (!file) {
      showNotification("error", "Please select a file");
      return;
    }

    // Update uploading state
    setUploading((prev) => ({ ...prev, [imageType]: true }));

    try {
      console.log(`=== Uploading ${imageType} ===`);
      console.log("Account Code:", accountCode);
      console.log("File:", file.name);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("accountCode", accountCode);
      formData.append("imageType", imageType);

      const response = await axios.post(
        `${server}/customer-account/upload-signature`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        const imageUrl = response.data.url;

        // Update the appropriate state
        if (imageType === "signature") {
          setSignatureImageUrl(imageUrl);
          setValue("signatureImage", imageUrl);
        } else {
          setStampImageUrl(imageUrl);
          setValue("stampImage", imageUrl);
        }

        showNotification(
          "success",
          `${
            imageType === "signature" ? "Signature" : "Stamp"
          } uploaded successfully`
        );
        console.log(`${imageType} uploaded:`, imageUrl);
      } else {
        showNotification(
          "error",
          response.data.error || `Failed to upload ${imageType}`
        );
      }
    } catch (error) {
      console.error(`Error uploading ${imageType}:`, error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        `Failed to upload ${imageType}`;
      showNotification("error", errorMessage);
    } finally {
      setUploading((prev) => ({ ...prev, [imageType]: false }));
    }
  };

  const handleRemoveAll = () => {
    setSignatureImageUrl(null);
    setStampImageUrl(null);
    setValue("signatureImage", null);
    setValue("stampImage", null);
    setReset(!reset);
    showNotification("success", "All details removed");
  };

  return (
    <div>
      <div className="flex flex-col gap-4 h-[55vh]">
        <div className=" flex flex-col gap-4">
          <div className="flex flex-col gap-3 w-full">
            <div className="flex gap-[88px] ">
              <div className="flex flex-col gap-2 w-full">
                <div>
                  <h2 className="text-red font-semibold text-[16px]">
                    Upload Signature Details
                  </h2>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <div className="w-full">
                    <ImageInputBox
                      placeholder="Signature Image"
                      register={register}
                      setValue={setValue}
                      value="signatureImage"
                      getValues={getValues}
                      watch={watch}
                      setUrl={setSignatureImageUrl}
                      resetFactor={reset}
                      onFileSelect={(file) =>
                        handleImageUpload(file, "signature")
                      }
                      disabled={uploading.signature}
                    />
                    {uploading.signature && (
                      <p className="text-sm text-gray-500 mt-1">
                        Uploading signature...
                      </p>
                    )}
                  </div>
                  <div className="w-full">
                    <ImageInputBox
                      placeholder="Stamp Image"
                      register={register}
                      setValue={setValue}
                      value="stampImage"
                      getValues={getValues}
                      watch={watch}
                      setUrl={setStampImageUrl}
                      resetFactor={reset}
                      onFileSelect={(file) => handleImageUpload(file, "stamp")}
                      disabled={uploading.stamp}
                    />
                    {uploading.stamp && (
                      <p className="text-sm text-gray-500 mt-1">
                        Uploading stamp...
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <div>
                  <h2 className="text-red font-semibold text-[16px]">
                    Signature
                  </h2>
                </div>
                <div className="border border-[#EA2147] w-full h-[98px] rounded-md overflow-hidden flex items-center justify-center">
                  {signatureImageUrl ? (
                    <img
                      src={signatureImageUrl}
                      alt="Signature"
                      className="h-full w-auto object-contain"
                    />
                  ) : (
                    <p className="text-gray-400 text-sm">
                      No signature uploaded
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <div className="flex gap-[88px] ">
              <div className="flex flex-col gap-3 w-full">
                <div>
                  <h2 className="text-red font-semibold text-[16px]">
                    Bank Details
                  </h2>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <div className="flex gap-3 items-center w-full ">
                    <div className="w-full flex flex-col gap-3">
                      <InputBox
                        placeholder="Bank Name"
                        register={register}
                        setValue={setValue}
                        value="bankName"
                        resetFactor={reset}
                        initialValue={customerData?.bankName || ""}
                      />
                      <InputBox
                        placeholder="Account No."
                        register={register}
                        setValue={setValue}
                        value="accountNumber"
                        resetFactor={reset}
                        initialValue={customerData?.accountNumber || ""}
                      />
                      <InputBox
                        placeholder="IFSC"
                        register={register}
                        setValue={setValue}
                        value="ifsc"
                        resetFactor={reset}
                        initialValue={customerData?.ifsc || ""}
                      />
                      <InputBox
                        placeholder="Bank Address"
                        register={register}
                        setValue={setValue}
                        value="bankAddress"
                        resetFactor={reset}
                        initialValue={customerData?.bankAddress || ""}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <div>
                    <OutlinedButtonRed
                      onClick={handleRemoveAll}
                      label={"Remove All Details"}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <div>
                  <h2 className="text-red font-semibold text-[16px]">Stamp</h2>
                </div>
                <div className="border border-[#EA2147] w-full h-[219px] rounded-md overflow-hidden flex items-center justify-center">
                  {stampImageUrl ? (
                    <img
                      src={stampImageUrl}
                      alt="Stamp"
                      className="h-full w-auto object-contain"
                    />
                  ) : (
                    <p className="text-gray-400 text-sm">No stamp uploaded</p>
                  )}
                </div>
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

      {/* Notification Flag */}
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
    </div>
  );
};

export default UploadSignature;
