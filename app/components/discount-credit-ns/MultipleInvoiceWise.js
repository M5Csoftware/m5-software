import React from "react";
import InputBox from "../InputBox";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import { TableWithSorting } from "../Table";
import { X } from "lucide-react";

const MultipleInvoiceWise = ({
  register,
  setValue,
  isFullscreen,
  setIsFullscreen,
}) => {
  const columns = [
    { key: "awbNo", label: "AWB No." },
    { key: "shipmentDate", label: "Shipment Date" },
    { key: "customerCode", label: "Customer Code" },
    { key: "customerName", label: "Customer Name" },
    { key: "salePerson", label: "Sale Person" },
    { key: "consigneeName", label: "Consignee Name" },
    { key: "consigneeAddress", label: "Consignee Address" },
  ];

  const rowData = [
    {
      awbNo: "AWB1001",
      shipmentDate: "10/12/2024",
      customerCode: "CUST001",
      customerName: "John Doe",
      salePerson: "Alice Smith",
      consigneeName: "Bob Johnson",
      consigneeAddress: "123 Main Street, Cityville",
    },
    {
      awbNo: "AWB1002",
      shipmentDate: "11/12/2024",
      customerCode: "CUST002",
      customerName: "Jane Williams",
      salePerson: "Michael Brown",
      consigneeName: "Sara Davis",
      consigneeAddress: "456 Elm Street, Townsville",
    },
    {
      awbNo: "AWB1003",
      shipmentDate: "12/12/2024",
      customerCode: "CUST003",
      customerName: "Robert Wilson",
      salePerson: "Laura Martin",
      consigneeName: "Tom Clark",
      consigneeAddress: "789 Pine Avenue, Villagetown",
    },
  ];

  return (
    <div>
      <div className="space-y-3">
        {/* Branch input with Add button */}
        <div className="flex gap-2 mt-6">
          <InputBox
            placeholder="Branch"
            value="branch"
            register={register}
            setValue={setValue}
          />
          <div className="w-[175px]">
            <OutlinedButtonRed label="Add" />
          </div>
        </div>

        {/* Items input with Show button */}
        <div className="flex gap-2">
          <InputBox
            placeholder="Items"
            value="items"
            register={register}
            setValue={setValue}
          />
          <div className="w-[175px]">
            <OutlinedButtonRed label="Show" />
          </div>
        </div>

        {/* Normal Table */}
        {!isFullscreen && (
          <TableWithSorting
            columns={columns}
            rowData={rowData}
            register={register}
            setValue={setValue}
            className="h-[45vh]"
          />
        )}

        {/* Fullscreen Overlay */}
        {isFullscreen && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col p-12">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Table Fullscreen View</h2>
              <button
                onClick={() => setIsFullscreen(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <TableWithSorting
                columns={columns}
                rowData={rowData}
                register={register}
                setValue={setValue}
                className="h-full w-full"
              />
            </div>
          </div>
        )}

        <div className="flex justify-between mt-4">
          <div>
            <OutlinedButtonRed label="Close" />
          </div>
          <div>
            <SimpleButton name="Download" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleInvoiceWise;
