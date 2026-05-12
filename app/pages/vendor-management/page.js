"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import { RedLabelHeading } from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import {
  X,
  Search,
  Building2,
  Package,
  IndianRupee,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Hash,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import React, { useContext, useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

// ─── Modal Component ──────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[600px] max-h-[90vh] overflow-y-auto z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

// ─── Stats Card Component ─────────────────────────────────────────────────────
const StatsCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon size={22} className={color.replace("bg-", "text-")} />
      </div>
    </div>
  </div>
);

// ─── Vendor Form Component ────────────────────────────────────────────────────
const VendorForm = ({ onClose, onSave, server, editingVendor, isOpen }) => {
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      vendorName: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      phoneNumber: "",
      email: "",
      goodsDescription: "",
      quantity: 0,
      charges: 0,
      sgst: 0,
      cgst: 0,
      paymentTerms: "net30",
      gstNumber: "",
      panNumber: "",
      notes: "",
    },
  });

  const [saving, setSaving] = useState(false);

  // Reset form when editingVendor changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingVendor) {
        // Populate form with editing vendor data
        reset({
          vendorName: editingVendor.vendorName || "",
          address: editingVendor.address || "",
          city: editingVendor.city || "",
          state: editingVendor.state || "",
          pincode: editingVendor.pincode || "",
          country: editingVendor.country || "India",
          phoneNumber: editingVendor.phoneNumber || "",
          email: editingVendor.email || "",
          goodsDescription: editingVendor.goodsDescription || "",
          quantity: editingVendor.quantity || 0,
          charges: editingVendor.charges || 0,
          sgst: editingVendor.sgst || 0,
          cgst: editingVendor.cgst || 0,
          paymentTerms: editingVendor.paymentTerms || "net30",
          gstNumber: editingVendor.gstNumber || "",
          panNumber: editingVendor.panNumber || "",
          notes: editingVendor.notes || "",
        });
      } else {
        // Reset form for new vendor
        reset({
          vendorName: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
          phoneNumber: "",
          email: "",
          goodsDescription: "",
          quantity: 0,
          charges: 0,
          sgst: 0,
          cgst: 0,
          paymentTerms: "net30",
          gstNumber: "",
          panNumber: "",
          notes: "",
        });
      }
    }
  }, [editingVendor, isOpen, reset]);

  // Convert to numbers safely
  const charges = Number(watch("charges")) || 0;
  const sgst = Number(watch("sgst")) || 0;
  const cgst = Number(watch("cgst")) || 0;
  const quantity = Number(watch("quantity")) || 1;

  const gstAmount = (charges * (sgst + cgst)) / 100;
  const totalAmount = charges + gstAmount;
  const unitPrice = quantity > 0 ? charges / quantity : 0;

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const url = editingVendor
        ? `${server}/vendor?id=${editingVendor._id}`
        : `${server}/vendor`;
      const method = editingVendor ? "put" : "post";

      const payload = {
        ...data,
        quantity: Number(data.quantity),
        charges: Number(data.charges),
        sgst: Number(data.sgst),
        cgst: Number(data.cgst),
      };

      const response = await axios[method](url, payload);

      if (response.data.success) {
        toast.success(
          editingVendor
            ? "Vendor updated successfully!"
            : "Vendor created successfully!",
        );
        onSave?.();
        onClose();
        reset();
      } else {
        throw new Error(response.data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving vendor:", error);
      toast.error(error.response?.data?.message || "Failed to save vendor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Basic Information */}
      <div>
        <RedLabelHeading label="Basic Information" />
        <div className="flex flex-col gap-3 mt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Vendor Name *
              </label>
              <input
                {...register("vendorName", {
                  required: "Vendor name is required",
                })}
                type="text"
                placeholder="Enter vendor name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Goods Description *
              </label>
              <input
                {...register("goodsDescription", {
                  required: "Goods description is required",
                })}
                type="text"
                placeholder="Describe goods/services"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Address *
            </label>
            <input
              {...register("address", { required: "Address is required" })}
              type="text"
              placeholder="Street address"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                City
              </label>
              <input
                {...register("city")}
                type="text"
                placeholder="City"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                State
              </label>
              <input
                {...register("state")}
                type="text"
                placeholder="State"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Pincode
              </label>
              <input
                {...register("pincode")}
                type="text"
                placeholder="Pincode"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Country
              </label>
              <input
                {...register("country")}
                type="text"
                placeholder="Country"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <RedLabelHeading label="Contact Information" />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Phone Number
            </label>
            <input
              {...register("phoneNumber")}
              type="tel"
              placeholder="Phone number"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="Email address"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200"
            />
          </div>
        </div>
      </div>

      {/* Financial Details */}
      <div>
        <RedLabelHeading label="Financial Details" />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Quantity *
            </label>
            <input
              {...register("quantity", {
                required: "Quantity is required",
                min: 1,
              })}
              type="number"
              placeholder="Quantity"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Charges (₹) *
            </label>
            <input
              {...register("charges", {
                required: "Charges are required",
                min: 0,
              })}
              type="number"
              placeholder="Total charges"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              SGST (%) *
            </label>
            <input
              {...register("sgst", { required: "SGST is required", min: 0 })}
              type="number"
              step="0.01"
              placeholder="SGST percentage"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              CGST (%) *
            </label>
            <input
              {...register("cgst", { required: "CGST is required", min: 0 })}
              type="number"
              step="0.01"
              placeholder="CGST percentage"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200"
            />
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Unit Price:</span>
            <span className="font-medium">₹{unitPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">GST Amount ({sgst + cgst}%):</span>
            <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-200 mt-1">
            <span>Total Amount:</span>
            <span className="text-red-600">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div>
        <RedLabelHeading label="Additional Information" />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              GST Number
            </label>
            <input
              {...register("gstNumber")}
              type="text"
              placeholder="GSTIN"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              PAN Number
            </label>
            <input
              {...register("panNumber")}
              type="text"
              placeholder="PAN"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs font-medium text-gray-500 block mb-1">
            Payment Status
          </label>
          <select
            {...register("paymentTerms")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
          >
            <option value="immediate">Paid</option>
            <option value="net15">Unpaid</option>
           
          </select>
        </div>
        <div className="mt-3">
          <label className="text-xs font-medium text-gray-500 block mb-1">
            Notes
          </label>
          <textarea
            {...register("notes")}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
            placeholder="Additional notes"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
        <OutlinedButtonRed label="Cancel" onClick={onClose} />
        <SimpleButton
          name={
            saving
              ? "Saving..."
              : editingVendor
                ? "Update Vendor"
                : "Create Vendor"
          }
          type="submit"
          disabled={saving}
        />
      </div>
    </form>
  );
};

// ─── Vendor Details Modal ─────────────────────────────────────────────────────
const VendorDetailsModal = ({ open, onClose, vendor }) => {
  if (!open || !vendor) return null;

  // Convert string values to numbers safely
  const charges = Number(vendor.charges) || 0;
  const sgst = Number(vendor.sgst) || 0;
  const cgst = Number(vendor.cgst) || 0;
  const quantity = Number(vendor.quantity) || 1;
  const totalAmount =
    Number(vendor.totalAmount) || charges + (charges * (sgst + cgst)) / 100;

  const gstAmount = (charges * (sgst + cgst)) / 100;
  const sgstAmount = (charges * sgst) / 100;
  const cgstAmount = (charges * cgst) / 100;
  const unitPrice = quantity > 0 ? charges / quantity : 0;

  return (
    <Modal open={open} onClose={onClose} title="Vendor Details">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400">Vendor Name</label>
            <p className="text-sm font-medium text-gray-800">
              {vendor.vendorName}
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-400">Status</label>
            <p className="text-sm">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  vendor.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {vendor.status === "active" ? (
                  <CheckCircle size={10} />
                ) : (
                  <AlertCircle size={10} />
                )}
                {vendor.status}
              </span>
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400">Address</label>
          <p className="text-sm text-gray-700">{vendor.address}</p>
          {vendor.city && (
            <p className="text-sm text-gray-500">
              {vendor.city}, {vendor.state} {vendor.pincode}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400">Phone</label>
            <p className="text-sm text-gray-700">{vendor.phoneNumber || "—"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-400">Email</label>
            <p className="text-sm text-gray-700">{vendor.email || "—"}</p>
          </div>
        </div>

        <div className="border-t pt-3">
          <label className="text-xs text-gray-400">Goods Description</label>
          <p className="text-sm text-gray-700">{vendor.goodsDescription}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400">Quantity</label>
            <p className="text-sm font-medium">{quantity} units</p>
          </div>
          <div>
            <label className="text-xs text-gray-400">Unit Price</label>
            <p className="text-sm font-medium">₹{unitPrice.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Charges:</span>
            <span>₹{charges.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">SGST ({sgst}%):</span>
            <span>₹{sgstAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">CGST ({cgst}%):</span>
            <span>₹{cgstAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-1 border-t">
            <span>Total Amount:</span>
            <span className="text-red-600">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {vendor.gstNumber && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400">GST Number</label>
              <p className="text-sm">{vendor.gstNumber}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400">PAN Number</label>
              <p className="text-sm">{vendor.panNumber || "—"}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <SimpleButton name="Close" onClick={onClose} />
        </div>
      </div>
    </Modal>
  );
};

// ─── Main VendorManagement Component ──────────────────────────────────────────
const VendorManagement = () => {
  const { server } = useContext(GlobalContext);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalVendors: 0,
    activeVendors: 0,
    totalBilling: 0,
  });
  const [modal, setModal] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const searchTimeout = useRef(null);

  const fetchVendors = async (search = "") => {
    setLoading(true);
    try {
      const url = search
        ? `${server}/vendor?search=${encodeURIComponent(search)}`
        : `${server}/vendor`;
      const response = await axios.get(url);
      if (response.data.success) {
        setVendors(response.data.data);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVendors(searchTerm);
    setRefreshing(false);
    toast.success("Refreshed");
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchVendors(value);
    }, 500);
  };

  const handleDelete = async (vendor) => {
    if (
      confirm(
        `Are you sure you want to ${vendor.status === "active" ? "deactivate" : "delete"} ${vendor.vendorName}?`,
      )
    ) {
      try {
        await axios.delete(`${server}/vendor?id=${vendor._id}`);
        toast.success(
          `Vendor ${vendor.status === "active" ? "deactivated" : "deleted"} successfully`,
        );
        fetchVendors(searchTerm);
      } catch (error) {
        toast.error("Failed to delete vendor");
      }
    }
  };

  const handleEdit = (vendor) => {
    setSelectedVendor(vendor);
    setModal("edit");
  };

  const handleView = (vendor) => {
    setSelectedVendor(vendor);
    setModal("view");
  };

  const handleCreate = () => {
    setSelectedVendor(null);
    setModal("create");
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  return (
    <div className="bg-gray-50/40 p-6">
      <div className=" mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-md">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <Heading
                title="Vendor Management"
                bulkUploadBtn="hidden"
                codeListBtn="hidden"
                refreshBtn="hidden"
              />
              <p className="text-xs text-gray-400 mt-0.5">
                Manage your vendors, track purchases and billing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
            <SimpleButton
              name="New Vendor"
              onClick={handleCreate}
              icon={<Plus size={14} />}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Total Vendors"
            value={stats.totalVendors}
            icon={Building2}
            color="bg-blue-500"
          />
          <StatsCard
            title="Active Vendors"
            value={stats.activeVendors}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatsCard
            title="Total Billing"
            value={`₹${stats.totalBilling.toLocaleString()}`}
            icon={IndianRupee}
            color="bg-purple-500"
            subtitle="Lifetime value"
          />
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by vendor name or goods description..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
            />
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="p-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Vendor Name
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Goods Description
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Charges (₹)
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    GST
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Total (₹)
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-4 text-center font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-400">
                      Loading vendors...
                    </td>
                  </tr>
                ) : vendors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-gray-400">
                      No vendors found
                    </td>
                  </tr>
                ) : (
                  vendors.map((vendor) => {
                    // Safely convert values to numbers
                    const charges = Number(vendor.charges) || 0;
                    const sgst = Number(vendor.sgst) || 0;
                    const cgst = Number(vendor.cgst) || 0;
                    const quantity = Number(vendor.quantity) || 0;
                    const total = charges + (charges * (sgst + cgst)) / 100;

                    return (
                      <tr
                        key={vendor._id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-gray-400" />
                            <button
                              onClick={() => handleView(vendor)}
                              className="font-medium text-gray-800 hover:text-purple-600 hover:underline transition-colors"
                            >
                              {vendor.vendorName}
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600 max-w-[200px] truncate">
                          {vendor.goodsDescription}
                        </td>
                        <td className="p-4 text-gray-600">{quantity}</td>
                        <td className="p-4 text-gray-600">
                          ₹{charges.toLocaleString()}
                        </td>
                        <td className="p-4 text-gray-600">{sgst + cgst}%</td>
                        <td className="p-4 font-medium text-gray-800">
                          ₹
                          {total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              vendor.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {vendor.status === "active" ? (
                              <CheckCircle size={10} />
                            ) : (
                              <AlertCircle size={10} />
                            )}
                            {vendor.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleView(vendor)}
                              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                              title="View"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleEdit(vendor)}
                              className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(vendor)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title={
                                vendor.status === "active"
                                  ? "Deactivate"
                                  : "Delete"
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500">
            <span>
              Showing{" "}
              <span className="font-medium text-gray-700">
                {vendors.length}
              </span>{" "}
              vendors
            </span>
            <span>Total Records: {stats.totalVendors}</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        open={modal === "create"}
        onClose={() => setModal(null)}
        title="Create New Vendor"
      >
        <VendorForm
          onClose={() => setModal(null)}
          onSave={() => {
            fetchVendors(searchTerm);
            setModal(null);
          }}
          server={server}
          editingVendor={null}
          isOpen={modal === "create"}
        />
      </Modal>

      <Modal
        open={modal === "edit"}
        onClose={() => setModal(null)}
        title="Edit Vendor"
      >
        <VendorForm
          onClose={() => setModal(null)}
          onSave={() => {
            fetchVendors(searchTerm);
            setModal(null);
          }}
          server={server}
          editingVendor={selectedVendor}
          isOpen={modal === "edit"}
        />
      </Modal>

      <VendorDetailsModal
        open={modal === "view"}
        onClose={() => setModal(null)}
        vendor={selectedVendor}
      />
    </div>
  );
};

export default VendorManagement;
