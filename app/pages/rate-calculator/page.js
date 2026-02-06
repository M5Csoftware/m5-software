import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import React, { useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GlobalContext } from "@/app/lib/GlobalContext";

const RateCalculator = () => {
  const { register, setValue, watch, handleSubmit, reset } = useForm();
  const { server, accounts } = useContext(GlobalContext);
  const router = useRouter();

  // State Management
  const [volumetricWeight, setVolumetricWeight] = useState("0.00");
  const [chargeableWeight, setChargeableWeight] = useState("0.00");
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [loadingCustomerName, setLoadingCustomerName] = useState(false);
  const [calculatedRates, setCalculatedRates] = useState([]);
  const [selectedServiceLocal, setSelectedServiceLocal] = useState();

  // Static sectors data
  const staticSectors = ["UK", "BR", "CANADA", "AUSTRALIA", "USA", "EUROPE"];
  const shipmentPurposeOptions = ["Commercial", "Gift", "Sample"];

  // Dropdown data
  const [availableServices, setAvailableServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [availableDestinations, setAvailableDestinations] = useState([]);
  const [customerName, setCustomerName] = useState("");

  // Watch form fields
  const watchAccountCode = watch("accountCode");
  const watchSector = watch("sector");
  const watchService = watch("service");
  const watchLength = watch("length");
  const watchWidth = watch("width");
  const watchHeight = watch("height");
  const watchActualWeight = watch("actualWt");

  // 👉 1. Fetch customer name when account code changes (FIXED)
  useEffect(() => {
    const fetchCustomerName = async () => {
      if (!watchAccountCode || watchAccountCode.trim() === "") {
        setCustomerName("");
        setValue("customerName", "");
        setAvailableServices([]);
        setFilteredServices([]);
        setValue("sector", "");
        setValue("service", "");
        setValue("destination", "");
        setAvailableDestinations([]);
        return;
      }

      setLoadingCustomerName(true);
      const accountCode = watchAccountCode.trim().toUpperCase();

      try {
        // First, check if account exists in GlobalContext accounts
        if (accounts && Array.isArray(accounts)) {
          console.log(
            "🔍 Checking GlobalContext accounts:",
            accounts.length,
            "accounts available",
          );
          const customerAccount = accounts.find(
            (account) => account.accountCode?.toUpperCase() === accountCode,
          );

          if (customerAccount) {
            console.log(
              "✅ Found customer in GlobalContext:",
              customerAccount.name,
            );
            setCustomerName(customerAccount.name);
            setValue("customerName", customerAccount.name);
            setLoadingCustomerName(false);
            return;
          }
        }

        console.log(
          "⚠️ Customer not found in GlobalContext, fetching from API...",
        );

        // If not found in context, try API call
        const response = await axios.get(`${server}/accounts`);

        if (response.data && Array.isArray(response.data)) {
          const customerAccount = response.data.find(
            (account) => account.accountCode?.toUpperCase() === accountCode,
          );

          if (customerAccount) {
            console.log("✅ Found customer via API:", customerAccount.name);
            setCustomerName(customerAccount.name);
            setValue("customerName", customerAccount.name);
          } else {
            console.log("❌ Customer not found in API response");
            setCustomerName("Customer not found");
            setValue("customerName", "Customer not found");
          }
        } else {
          setCustomerName("");
          setValue("customerName", "");
        }
      } catch (error) {
        console.error("❌ Error fetching customer name:", error);
        setCustomerName("");
        setValue("customerName", "");

        // Fallback: Try with customer-specific endpoint
        try {
          const fallbackResponse = await axios.get(
            `${server}/customers/${accountCode}`,
          );

          if (fallbackResponse.data && fallbackResponse.data.name) {
            setCustomerName(fallbackResponse.data.name);
            setValue("customerName", fallbackResponse.data.name);
          }
        } catch (fallbackError) {
          console.error("❌ Fallback API also failed:", fallbackError);
        }
      } finally {
        setLoadingCustomerName(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (watchAccountCode && watchAccountCode.trim() !== "") {
        fetchCustomerName();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchAccountCode, server, setValue, accounts]);

  // 👉 2. Fetch available services when account code is entered
  useEffect(() => {
    const fetchCustomerServices = async () => {
      if (!watchAccountCode || watchAccountCode.trim() === "") {
        setAvailableServices([]);
        setFilteredServices([]);
        return;
      }

      setLoadingServices(true);
      try {
        const response = await axios.get(
          `${server}/shipper-tariff/rate-calc?accountCode=${watchAccountCode.trim()}`,
        );

        if (response.data && Array.isArray(response.data)) {
          const allServices = [];
          const currentDate = new Date();

          response.data.forEach((tariff) => {
            if (
              tariff.ratesApplicable &&
              Array.isArray(tariff.ratesApplicable)
            ) {
              tariff.ratesApplicable.forEach((rate) => {
                const fromDate = new Date(rate.from);
                const toDate = new Date(rate.to);

                if (fromDate <= currentDate && toDate >= currentDate) {
                  allServices.push({
                    service: rate.service,
                    sector: rate.sector,
                    zoneMatrix: rate.zoneMatrix,
                    network: rate.network,
                    rateTariff: rate.rateTariff,
                    mode: rate.mode,
                    from: rate.from,
                    to: rate.to,
                  });
                }
              });
            }
          });

          setAvailableServices(allServices);
          console.log("✅ Available services loaded:", allServices);
        }
      } catch (error) {
        console.error("❌ Error fetching customer services:", error);
        setAvailableServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (watchAccountCode && watchAccountCode.trim() !== "") {
        fetchCustomerServices();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchAccountCode, server]);

  // 👉 3. Filter services when sector changes
  useEffect(() => {
    if (!watchSector || watchSector === "") {
      setFilteredServices([]);
      setValue("service", "");
      setValue("destination", "");
      setAvailableDestinations([]);
      return;
    }

    console.log("🔍 Filtering services for sector:", watchSector);
    const filtered = availableServices.filter(
      (s) => s.sector?.toUpperCase() === watchSector.toUpperCase(),
    );

    console.log("✅ Filtered services:", filtered);
    setFilteredServices(filtered);

    // Reset dependent fields
    setValue("service", "");
    setValue("destination", "");
    setAvailableDestinations([]);
  }, [watchSector, availableServices, setValue]);

  // 👉 4. Fetch available destinations when service changes
  useEffect(() => {
    const fetchDestinations = async () => {
      if (!watchSector || !watchService || watchService === "") {
        setAvailableDestinations([]);
        setValue("destination", "");
        return;
      }

      setLoadingDestinations(true);
      try {
        const selectedServiceDetails = filteredServices.find(
          (s) => s.service === watchService,
        );

        if (!selectedServiceDetails) {
          console.error("❌ Service details not found for:", watchService);
          setAvailableDestinations([]);
          return;
        }

        console.log("🔍 Fetching destinations for:", {
          sector: watchSector,
          service: watchService,
          zoneMatrix: selectedServiceDetails.zoneMatrix,
        });

        const response = await axios.get(`${server}/zones/destinations`, {
          params: {
            sector: watchSector.toUpperCase(),
            service: watchService.toUpperCase(),
            zoneMatrix: selectedServiceDetails.zoneMatrix,
          },
        });

        if (response.data && Array.isArray(response.data)) {
          const destinations = [
            ...new Set(response.data.map((z) => z.destination)),
          ]
            .filter((d) => d && d.trim() !== "")
            .sort();

          setAvailableDestinations(destinations);
          console.log("✅ Available destinations:", destinations);

          if (destinations.length === 1) {
            setValue("destination", destinations[0]);
          } else {
            setValue("destination", "");
          }
        } else {
          setAvailableDestinations([]);
        }
      } catch (error) {
        console.error("❌ Error fetching destinations:", error);
        setAvailableDestinations([]);
      } finally {
        setLoadingDestinations(false);
      }
    };

    if (watchService && filteredServices.length > 0) {
      fetchDestinations();
    }
  }, [watchSector, watchService, filteredServices, server, setValue]);

  // 👉 5. Calculate volumetric and chargeable weight in real-time
  useEffect(() => {
    const length = parseFloat(watchLength) || 0;
    const width = parseFloat(watchWidth) || 0;
    const height = parseFloat(watchHeight) || 0;
    const actualWeight = parseFloat(watchActualWeight) || 0;

    const volumeWeight = (length * width * height) / 5000 || 0;
    setVolumetricWeight(volumeWeight.toFixed(2));

    const chargeable = Math.max(volumeWeight, actualWeight, 0.5);
    setChargeableWeight(chargeable.toFixed(2));
  }, [watchLength, watchWidth, watchHeight, watchActualWeight]);

  // 👉 6. Calculate rates
  const onSubmit = async (data) => {
    const {
      accountCode,
      sector,
      destination,
      service,
      actualWt,
      zipcode,
      shipmentPurpose,
    } = data;

    // Validate required fields
    if (!accountCode || accountCode.trim() === "") {
      alert("❌ Please enter account code");
      return;
    }

    if (!sector || sector === "") {
      alert("❌ Please select a sector");
      return;
    }

    if (!service || service === "") {
      alert("❌ Please select a service");
      return;
    }

    if (!destination || destination === "") {
      alert("❌ Please select a destination");
      return;
    }

    if (!actualWt || parseFloat(actualWt) <= 0) {
      alert("❌ Please enter a valid actual weight");
      return;
    }

    setLoading(true);

    try {
      const chargeable = parseFloat(chargeableWeight);

      const response = await axios.post(
        `${server}/bulk-upload/calculate-rates`,
        {
          shipments: [
            {
              awbNo: `CALC-${Date.now()}`,
              sector: sector.toUpperCase().trim(),
              destination: destination.toUpperCase().trim(),
              service: service.toUpperCase().trim(),
              chargeableWt: chargeable,
              pcs: 1,
              totalInvoiceValue: 0,
              currency: "INR",
              origin: sector.toUpperCase().trim(),
              goodstype: shipmentPurpose || "Commercial",
              receiverPincode: zipcode || "",
              receiverCountry: destination.toUpperCase().trim(),
            },
          ],
          accountCode: accountCode.trim(),
        },
      );

      console.log("✅ Rate calculation response:", response.data);

      if (response.data.success && response.data.results) {
        const calculatedRatesData = response.data.results
          .filter((r) => r.success)
          .map((result) => {
            const serviceDetails = availableServices.find(
              (s) => s.service.toUpperCase() === result.service.toUpperCase(),
            );

            return {
              service: result.service,
              zone: result.zone,
              ratePerKg: result.rateUsed || 0,
              chargeableWt: result.chargeableWt,
              basicAmt: result.basicAmt || 0,
              sgst: result.sgst || 0,
              cgst: result.cgst || 0,
              igst: result.igst || 0,
              totalAmt: result.totalAmt || 0,
              network: serviceDetails?.network || "Standard",
              from: serviceDetails?.from || null,
              to: serviceDetails?.to || null,
              zoneMatrix: serviceDetails?.zoneMatrix || "",
              rateTariff: serviceDetails?.rateTariff || "",
            };
          });

        setCalculatedRates(calculatedRatesData);

        if (calculatedRatesData.length === 0) {
          alert(
            "⚠️ No rates found for this combination.\n\nPlease check your zone and rate sheet configuration.",
          );
        }
      } else {
        alert("❌ Failed to calculate rates. Please try again.");
        setCalculatedRates([]);
      }
    } catch (err) {
      console.error("❌ Error calculating rates:", err);

      let errorMessage = "Error calculating rates:\n\n";

      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += "Unknown error occurred";
      }

      alert(errorMessage);
      setCalculatedRates([]);
    } finally {
      setLoading(false);
    }
  };

  // 👉 7. Reset Button
  const handleReset = () => {
    reset();
    setVolumetricWeight("0.00");
    setChargeableWeight("0.00");
    setCalculatedRates([]);
    setSelectedServiceLocal(null);
    setFilteredServices([]);
    setAvailableDestinations([]);
    setAvailableServices([]);
    setCustomerName("");
  };

  return (
    <div>
      <Heading
        title={`Rate Calculator`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
      />

      <div className="py-3">
        <RedLabelHeading label="Shipment Details" />
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex gap-3 mt-2">
            <div className="w-1/2 flex flex-col gap-3">
              <div className="flex gap-3">
                <InputBox
                  register={register}
                  setValue={setValue}
                  placeholder={`Customer Code *`}
                  value={`accountCode`}
                />
                <InputBox
                  register={register}
                  setValue={setValue}
                  placeholder={"Customer Name"}
                  initialValue={watch("customerName")}
                  value={`customerName`}
                  disabled
                />
              </div>

              <LabeledDropdown
                register={register}
                setValue={setValue}
                placeholder={
                  !watchAccountCode
                    ? "Enter customer code first"
                    : loadingServices
                      ? "Loading services..."
                      : "Select Sector *"
                }
                value={`sector`}
                options={
                  watchAccountCode && !loadingServices ? staticSectors : []
                }
              />

              <LabeledDropdown
                register={register}
                setValue={setValue}
                placeholder={
                  !watchSector
                    ? "Select sector first"
                    : filteredServices.length === 0
                      ? "No services available for this sector"
                      : "Select Service *"
                }
                value={`service`}
                options={
                  watchSector && filteredServices.length > 0
                    ? filteredServices.map((s) => s.service)
                    : []
                }
              />

              <LabeledDropdown
                register={register}
                setValue={setValue}
                placeholder={
                  !watchService
                    ? "Select service first"
                    : loadingDestinations
                      ? "Loading destinations..."
                      : availableDestinations.length === 0
                        ? "No destinations configured"
                        : "Select Destination *"
                }
                value={`destination`}
                options={
                  watchService && availableDestinations.length > 0
                    ? availableDestinations
                    : []
                }
              />

              <div className="flex gap-3 items-center text-sm font-medium">
                <div className="w-1/2 py-1.5 flex items-center justify-center bg-yellow-100 text-yellow-900 rounded-md">
                  Volumetric:{" "}
                  <span className="ml-1 font-bold">{volumetricWeight} Kg</span>
                </div>
                <div className="w-1/2 flex py-1.5 items-center justify-center bg-green-100 text-green-900 rounded-md">
                  Chargeable:{" "}
                  <span className="ml-1 font-bold">{chargeableWeight} Kg</span>
                </div>
              </div>
            </div>

            <div className="w-1/2 flex flex-col gap-3">
              <InputBox
                register={register}
                setValue={setValue}
                placeholder={`Zipcode (Optional)`}
                value={`zipcode`}
              />

              <LabeledDropdown
                register={register}
                setValue={setValue}
                placeholder={`Shipment Purpose`}
                value={`shipmentPurpose`}
                options={shipmentPurposeOptions}
              />

              <div className="flex gap-3">
                <InputBox
                  register={register}
                  setValue={setValue}
                  placeholder={`Length (cm)`}
                  value={`length`}
                  type="number"
                  step="0.01"
                />
                <InputBox
                  register={register}
                  setValue={setValue}
                  placeholder={`Width (cm)`}
                  value={`width`}
                  type="number"
                  step="0.01"
                />
                <InputBox
                  register={register}
                  setValue={setValue}
                  placeholder={`Height (cm)`}
                  value={`height`}
                  type="number"
                  step="0.01"
                />
              </div>

              <InputBox
                register={register}
                setValue={setValue}
                placeholder={`Actual Weight (Kg) *`}
                value={`actualWt`}
                type="number"
                step="0.01"
              />

              <div className="flex gap-3">
                <div className="w-1/2">
                  <SimpleButton
                    name={loading ? "Calculating..." : "Calculate Rate"}
                    type="submit"
                  />
                </div>
                <div className="w-1/2">
                  <OutlinedButtonRed
                    label={`Reset`}
                    onClick={handleReset}
                    type="button"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Rate Display Section */}
      {calculatedRates.length > 0 && (
        <div className="py-3">
          <RedLabelHeading label="Calculated Rates" />
          <div className="mt-2 flex flex-col gap-3">
            {calculatedRates.map((service, idx) => (
              <div
                key={idx}
                className={`bg-white border p-4 rounded-[10px] ${
                  selectedServiceLocal === service?.service
                    ? "border-[#EA2147] shadow-lg"
                    : "border-[#E2E8F0]"
                }`}
              >
                {/* Header Section */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <img
                      src="/logo.svg"
                      alt="logo"
                      className="w-12 h-12 rounded-full border-battleship-gray border-[2px] border-opacity-75 p-1"
                    />
                    <div>
                      <p className="font-bold text-lg">{service?.service}</p>
                      <p className="text-sm text-gray-600">
                        {service?.network || "Standard"} Network
                      </p>
                    </div>
                  </div>

                  <div className="flex items-end gap-2">
                    <span className="font-bold text-3xl text-[#EA2147]">
                      ₹ {Number(service?.totalAmt || 0).toFixed(2)}
                    </span>
                    <span className="text-[#EA2147] mb-1 font-bold text-sm">
                      (Incl. GST)
                    </span>
                  </div>
                </div>

                {/* Rate Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4 pt-2 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Zone</p>
                      <p className="text-sm font-bold text-gray-800">
                        Zone {service?.zone || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Rate per KG
                      </p>
                      <p className="text-sm font-bold text-gray-800">
                        ₹ {Number(service?.ratePerKg || 0).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Chargeable Weight
                      </p>
                      <p className="text-sm font-bold text-gray-800">
                        {Number(service?.chargeableWt || 0).toFixed(2)} KG
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Basic Amount
                      </p>
                      <p className="text-sm font-bold text-gray-800">
                        ₹ {Number(service?.basicAmt || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* GST Breakdown */}
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500 font-medium mb-2">
                      Tax Breakdown:
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      {service?.igst > 0 ? (
                        <div className="bg-white rounded px-3 py-2">
                          <p className="text-xs text-gray-500">IGST (18%)</p>
                          <p className="font-semibold text-gray-700">
                            ₹ {Number(service?.igst || 0).toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="bg-white rounded px-3 py-2">
                            <p className="text-xs text-gray-500">SGST (9%)</p>
                            <p className="font-semibold text-gray-700">
                              ₹ {Number(service?.sgst || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-white rounded px-3 py-2">
                            <p className="text-xs text-gray-500">CGST (9%)</p>
                            <p className="font-semibold text-gray-700">
                              ₹ {Number(service?.cgst || 0).toFixed(2)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Calculation Formula */}
                  <div className="mt-3 pt-3 flex justify-between items-center border-t">
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Calculation:</span> ₹
                        {Number(service?.ratePerKg || 0).toFixed(2)} ×{" "}
                        {Number(service?.chargeableWt || 0).toFixed(2)} KG = ₹
                        {Number(service?.basicAmt || 0).toFixed(2)} + GST ₹
                        {(
                          Number(service?.sgst || 0) +
                          Number(service?.cgst || 0) +
                          Number(service?.igst || 0)
                        ).toFixed(2)}{" "}
                        =
                        <span className="font-bold text-[#EA2147]">
                          {" "}
                          ₹{Number(service?.totalAmt || 0).toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {!loading && calculatedRates.length === 0 && watchAccountCode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-blue-800 text-center font-medium">
            💡 Fill in all required fields and click{" "}
            <strong>Calculate Rate</strong> to see pricing details.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 mt-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EA2147]"></div>
            <p className="text-gray-700 font-medium">
              Calculating rates, please wait...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RateCalculator;
