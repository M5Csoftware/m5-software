"use client";

import { OutlinedButtonRed } from "@/app/components/Buttons";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import InputBox from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useState, useContext, useRef } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { LabeledDropdown } from "../Dropdown";

const UKComponent = () => {
  const { server } = useContext(GlobalContext);
  const { register, setValue, watch } = useForm();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [runInfo, setRunInfo] = useState(null);
  const [viewType, setViewType] = useState("standard");
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [bagNumbers, setBagNumbers] = useState("");
  const lastMergedBags = useRef([]);

  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const runNo = watch("runNo");

  /* COLUMN DEFINITIONS — unchanged */
  const columnsUK = [
    { key: "runNo", label: "Run No." },
    { key: "flightDate", label: "Flight Date" },
    { key: "alMawb", label: "AL MAWB" },
    { key: "obc", label: "OBC" },
    { key: "flight", label: "Flight" },
    { key: "counterPart", label: "Counter Part" },
    { key: "countBag", label: "Count Bag" },
    { key: "countAwb", label: "Count AWB" },
    { key: "bagWeight", label: "Bag Weight" },
    { key: "totalActualWt", label: "Total Actual Weight" },
    { key: "chargableWt", label: "Chargable Weight" },
  ];

  const columnsCSVLHR = [
    { key: "manifest_number", label: "manifest_number" },
    { key: "flight_number", label: "flight_number" },
    { key: "flight_date", label: "flight_date" },
    { key: "mawb_number", label: "mawb_number" },
    { key: "hawb_number", label: "hawb_number" },
    { key: "mawb_origin", label: "mawb_origin" },
    { key: "mawb_destination", label: "mawb_destination" },
    { key: "total_bags", label: "total_bags" },
    { key: "total_weight", label: "total_weight" },
    { key: "manifest_value_type", label: "manifest_value_type" },
    { key: "mawb_shipper_name", label: "mawb_shipper_name" },
    { key: "mawb_shipper_street_address_line_1", label: "mawb_shipper_street_address_line_1" },
    { key: "mawb_shipper_street_address_line_2", label: "mawb_shipper_street_address_line_2" },
    { key: "mawb_shipper_city", label: "mawb_shipper_city" },
    { key: "mawb_shipper_county_or_state", label: "mawb_shipper_county_or_state" },
    { key: "mawb_shipper_postal_code", label: "mawb_shipper_postal_code" },
    { key: "mawb_shipper_country_code", label: "mawb_shipper_country_code" },
    { key: "mawb_shipper_tel", label: "mawb_shipper_tel" },
    { key: "mawb_shipper_email", label: "mawb_shipper_email" },
    { key: "mawb_consignee_name", label: "mawb_consignee_name" },
    { key: "mawb_consignee_street_address_line_1", label: "mawb_consignee_street_address_line_1" },
    { key: "mawb_consignee_street_address_line_2", label: "mawb_consignee_street_address_line_2" },
    { key: "mawb_consignee_city", label: "mawb_consignee_city" },
    { key: "mawb_consignee_county_or_state", label: "mawb_consignee_county_or_state" },
    { key: "mawb_consignee_postal_code", label: "mawb_consignee_postal_code" },
    { key: "mawb_consignee_country_code", label: "mawb_consignee_country_code" },
    { key: "mawb_consignee_tel", label: "mawb_consignee_tel" },
    { key: "mawb_consignee_email", label: "mawb_consignee_email" },
    { key: "consignment_number", label: "consignment_number" },
    { key: "shipper_name", label: "shipper_name" },
    { key: "shipper_street_address_line_1", label: "shipper_street_address_line_1" },
    { key: "shipper_street_address_line_2", label: "shipper_street_address_line_2" },
    { key: "shipper_city", label: "shipper_city" },
    { key: "shipper_county_or_state", label: "shipper_county_or_state" },
    { key: "shipper_postal_code", label: "shipper_postal_code" },
    { key: "shipper_country_code", label: "shipper_country_code" },
    { key: "shipper_tel", label: "shipper_tel" },
    { key: "shipper_email", label: "shipper_email" },
    { key: "consignee_name", label: "consignee_name" },
    { key: "consignee_street_address_line_1", label: "consignee_street_address_line_1" },
    { key: "consignee_street_address_line_2", label: "consignee_street_address_line_2" },
    { key: "consignee_city", label: "consignee_city" },
    { key: "consignee_county_or_state", label: "consignee_county_or_state" },
    { key: "consignee_postal_code", label: "consignee_postal_code" },
    { key: "consignee_country_code", label: "consignee_country_code" },
    { key: "consignee_tel", label: "consignee_tel" },
    { key: "consignee_email", label: "consignee_email" },
    { key: "pieces", label: "pieces" },
    { key: "weight", label: "weight" },
    { key: "description", label: "description" },
    { key: "value", label: "value" },
    { key: "value_currency_code", label: "value_currency_code" },
    { key: "service_info", label: "service_info" },
    { key: "bag_numbers", label: "bag_numbers" },
  ];

  const columnsTSManifest = [
    { key: "flight", label: "Flight" },
    { key: "awb_number", label: "AWB #" },
    { key: "shipdate", label: "shipdate" },
    { key: "consignor_company", label: "Consignor company" },
    { key: "cnr_name", label: "Cnr name" },
    { key: "cnr_address1", label: "Cnr Address1" },
    { key: "cnr_address2", label: "Cnr Address2" },
    { key: "cnr_address3", label: "Cnr Address3" },
    { key: "cnr_city", label: "Cnr City" },
    { key: "cnr_state", label: "Cnr State" },
    { key: "cnr_zip", label: "Cnr ZIP" },
    { key: "cnr_country", label: "Cnr Country" },
    { key: "cnr_telephone", label: "Cnr Telphone" },
    { key: "consignee_company", label: "Consignee company" },
    { key: "cne_name", label: "Cne name" },
    { key: "cne_address1", label: "Cne Address1" },
    { key: "cne_address2", label: "Cne Address2" },
    { key: "cne_address3", label: "Cne Address3" },
    { key: "cne_city", label: "Cne City" },
    { key: "cne_state", label: "Cne State" },
    { key: "cne_zip", label: "Cne ZIP" },
    { key: "cnr_country1", label: "Cnr Country1" },
    { key: "cne_telephone", label: "Cne Telphone" },
    { key: "duty_flag", label: "Duty-Flag" },
    { key: "weight", label: "Weight" },
    { key: "pcs", label: "#Pcs" },
    { key: "bag_number", label: "Bag#" },
    { key: "payment_type", label: "Payment type" },
    { key: "packaging", label: "Packaging" },
    { key: "package_type", label: "package type" },
    { key: "description", label: "Description" },
    { key: "qty", label: "Qty" },
    { key: "value", label: "Value" },
    { key: "currency", label: "Currency" },
    { key: "fwd_service", label: "Fwd service" },
    { key: "forwarding_no", label: "Forwarding No" },
  ];

  const columnsDPDCSV = [
    { key: "recordtype", label: "RECORDTYPE" },
    { key: "product", label: "PRODUCT" },
    { key: "clientid", label: "CLIENTID" },
    { key: "bookedby", label: "BOOKEDBY" },
    { key: "senderphone", label: "SENDERPHONE" },
    { key: "sendermobile", label: "SENDERMOBILE" },
    { key: "senderemail", label: "SENDEREMAIL" },
    { key: "optionalpod", label: "OPTIONALPOD" },
    { key: "optionalpodemail", label: "OPTIONALPODEMAIL" },
    { key: "hawb", label: "HAWB" },
    { key: "bookingdate", label: "BOOKINGDATE" },
    { key: "clientrefrence1", label: "CLIENTREFRENCE1" },
    { key: "clientrefrence2", label: "CLIENTREFRENCE2" },
    { key: "clientrefrence3", label: "CLIENTREFRENCE3" },
    { key: "clientrefrence4", label: "CLIENTREFRENCE4" },
    { key: "thirdpartyref", label: "THIRDPARTYREF" },
    { key: "fourthpartyref", label: "FOURTHPARTYREF" },
    { key: "collectioncompany", label: "COLLECTIONCOMPANY" },
    { key: "collectioncompanyaddline1", label: "COLLECTIONCOMPANYADDLINE1" },
    { key: "collectioncompanyaddline2", label: "COLLECTIONCOMPANYADDLINE2" },
    { key: "collectioncompanyaddline3", label: "COLLECTIONCOMPANYADDLINE3" },
    { key: "collectioncompanyaddline4", label: "COLLECTIONCOMPANYADDLINE4" },
    { key: "collectionpostcode", label: "COLLECTIONPOSTCODE" },
    { key: "collectionplace", label: "COLLECTIONPLACE" },
    { key: "collectioncountry", label: "COLLECTIONCOUNTRY" },
    { key: "collectioncode", label: "COLLECTIONCODE" },
    { key: "collectionbranch", label: "COLLECTIONBRANCH" },
    { key: "collectioncontact", label: "COLLECTIONCONTACT" },
    { key: "collectionemail", label: "COLLECTIONEMAIL" },
    { key: "collectionphone", label: "COLLECTIONPHONE" },
    { key: "collectionmobile", label: "COLLECTIONMOBILE" },
    { key: "collectionfax", label: "COLLECTIONFAX" },
    { key: "sentby", label: "SENTBY" },
    { key: "timereadyforcollection", label: "TIMEREADYFORCOLLECTION" },
    { key: "readyattime", label: "READYATTIME" },
    { key: "closedate", label: "CLOSEDATE" },
    { key: "closetime", label: "CLOSETIME" },
    { key: "deliverycompany", label: "DELIVERYCOMPANY" },
    { key: "deliveryaddline1", label: "DELIVERYADDLINE1" },
    { key: "deliveryaddline2", label: "DELIVERYADDLINE2" },
    { key: "deliveryaddline3", label: "DELIVERYADDLINE3" },
    { key: "deliveryaddline4", label: "DELIVERYADDLINE4" },
    { key: "deliverypostcode", label: "DELIVERYPOSTCODE" },
    { key: "deliveryplace", label: "DELIVERYPLACE" },
    { key: "deliverycountry", label: "DELIVERYCOUNTRY" },
    { key: "deliverycode", label: "DELIVERYCODE" },
    { key: "deliverybranch", label: "DELIVERYBRANCH" },
    { key: "deliverycontact", label: "DELIVERYCONTACT" },
    { key: "deliveryemail", label: "DELIVERYEMAIL" },
    { key: "deliveryphone", label: "DELIVERYPHONE" },
    { key: "deliverymobile", label: "DELIVERYMOBILE" },
    { key: "deliveryfax", label: "DELIVERYFAX" },
    { key: "searchsentto", label: "SEARCHSENTTO" },
    { key: "recipientposition", label: "RecipientPosition" },
    { key: "recipientemail", label: "RecipientEmail" },
    { key: "recipientphone", label: "RecipientPhone" },
    { key: "deliveredafter", label: "Deliveredafter" },
    { key: "deliveredaftertime", label: "Deliveredaftertime" },
    { key: "deliverybyday", label: "Deliverybyday" },
    { key: "deliverybytime", label: "Deliverybytime" },
    { key: "contentstype", label: "Contentstype" },
    { key: "contents", label: "Contents" },
    { key: "consignmentvalue", label: "Consignmentvalue" },
    { key: "consignmentcurrency", label: "Consignmentcurrency" },
    { key: "insurancevalue", label: "Insurancevalue" },
    { key: "insurancecurrency", label: "Insurancecurrency" },
    { key: "distance", label: "Distance" },
    { key: "paymentbyduty", label: "Paymentbyduty" },
    { key: "packageformat", label: "Packageformat" },
    { key: "specialinstruction", label: "Specialinstruction" },
    { key: "notes", label: "Notes" },
    { key: "totalnumberofitems", label: "Totalnumberofitems" },
    { key: "totalweightkg", label: "TotalweightKG" },
    { key: "service", label: "Service" },
    { key: "route", label: "Route" },
    { key: "proformacurrency", label: "Proformacurrency" },
    { key: "reasonforexport", label: "Reasonforexport" },
    { key: "nameandaddressofmanufacturer", label: "NameandAddressofManufacturer" },
    { key: "countryoforigin", label: "Countryoforigin" },
    { key: "proformanote", label: "Proformanote" },
    { key: "bookthirdparty", label: "Bookthirdparty" },
    { key: "displaycollectioninstruction", label: "Displaycollectioninstruction" },
    { key: "deliveryinstruction", label: "DeliveryInstruction" },
    { key: "shippertintype", label: "ShipperTINtype" },
    { key: "receivertintype", label: "ReceiverTINtype" },
    { key: "shippertin", label: "ShipperTIN" },
    { key: "receivertin", label: "ReceiverTIN" },
    { key: "dutypayoraccount", label: "Dutypayoraccount" },
    { key: "dutypayorcountry", label: "Dutypayorcountry" },
    { key: "dutypayorpostcode", label: "Dutypayorpostcode" },
    { key: "supplierdoctype", label: "Supplierdoctype" },
    { key: "hazardous", label: "Hazardous" },
    { key: "termofsale", label: "Termofsale" },
    { key: "supplierreasoncode", label: "Supplierreasoncode" },
    { key: "predeliverynotification", label: "Predeliverynotification" },
    { key: "specialarrangement", label: "Specialarrangement" },
    { key: "securelocation", label: "Securelocation" },
    { key: "additionalservicedetails", label: "Additionalservicedetails" },
    { key: "signaturerequired", label: "Signaturerequired" },
    { key: "labeltype", label: "Labeltype" },
    { key: "iscollectionaddressresidence", label: "Iscollectionaddressresidence" },
    { key: "isdeliveryaddressresidence", label: "Isdeliveryaddressresidence" },
    { key: "displaycollectionnote", label: "Displaycollectionnote" },
    { key: "displayvehicletype", label: "Displayvehicletype" },
    { key: "returntype", label: "Returntype" },
    { key: "returncollectioninstruction", label: "ReturnCollectionInstruction" },
    { key: "returndeliveryinstruction", label: "ReturnDeliveryinstruction" },
    { key: "returnshippertintype", label: "ReturnShipperTINtype" },
    { key: "returnreceivertintype", label: "ReturnReceiverTINtype" },
    { key: "returnshippertin", label: "ReturnShipperTIN" },
    { key: "returnreceivertin", label: "ReturnReceiverTIN" },
    { key: "returndutypayoraccount", label: "ReturnDutypayoraccount" },
    { key: "returndutypayorcountry", label: "ReturnDutypayorcountry" },
    { key: "returndutypayorpostcode", label: "ReturnDutypayorpostcode" },
    { key: "returnsupplierdoctype", label: "ReturnSupplierdoctype" },
    { key: "returnhazardous", label: "ReturnHazardous" },
    { key: "returntermofsale", label: "ReturnTermsofsale" },
    { key: "returnsupplierreasoncode", label: "ReturnSupplierreasoncode" },
    { key: "returnpredeliverynotification", label: "ReturnPredeliverynotification" },
    { key: "returnspecialarrangement", label: "ReturnSpecialarrangement" },
    { key: "returnsecurelocation", label: "ReturnSecurelocation" },
    { key: "returnadditionalservicedetails", label: "ReturnAdditionalservicedetails" },
    { key: "returnsignaturerequired", label: "ReturnSignaturerequired" },
    { key: "returnlabeltype", label: "ReturnLabeltype" },
    { key: "collectionadditionalemail", label: "Collectionadditionalemail" },
    { key: "deliveryadditionalemail", label: "Deliveryadditionalemail" },
    { key: "notifypartycompany", label: "Notifypartycompany" },
    { key: "notifypartyaddressline1", label: "Notifypartyaddressline1" },
    { key: "notifypartyaddressline2", label: "Notifypartyaddressline2" },
    { key: "notifypartyaddressline3", label: "Notifypartyaddressline3" },
    { key: "notifypartyaddressline4", label: "Notifypartyaddressline4" },
    { key: "notifypartypostcode", label: "Notifypartypostcode" },
    { key: "notifypartyplace", label: "Notifypartyplace" },
    { key: "notifypartycountry", label: "Notifypartycountry" },
    { key: "notifypartycode", label: "Notifypartycode" },
    { key: "notifypartybranch", label: "Notifypartybranch" },
    { key: "notifypartycontact", label: "Notifypartycontact" },
    { key: "notifypartyemail", label: "Notifypartyemail" },
    { key: "notifypartyphone", label: "Notifypartyphone" },
    { key: "notifypartymobile", label: "Notifypartymobile" },
    { key: "notifypartyfax", label: "Notifypartyfax" },
    { key: "isnotifypartyaddressresidence", label: "Isnotifypartyaddressresidence" },
    { key: "notifypartyadditionalemail", label: "Notifypartyadditionalemail" },
    { key: "collectionw3waddress", label: "CollectionW3Waddress" },
    { key: "deliveryw3waddress", label: "DeliveryW3WAddress" },
    { key: "notifypartyw3waddress", label: "NotifypartyW3Waddress" },
    { key: "eventcode", label: "Eventcode" },
    { key: "eventdate", label: "Eventdate" },
    { key: "ud03", label: "UD03" },
    { key: "serviceoption", label: "Serviceoption" },
    { key: "timeslot", label: "Timeslot" },
    { key: "bookingconfirmationnumber", label: "Bookingconfirmationnumber" },
    { key: "shippersloadandcount", label: "Shippersloadandcount" },
    { key: "returnroutecode", label: "Returnroutecode" },
    { key: "recipientid", label: "Recipientid" },
    { key: "deliverydepartment", label: "Deliverydepartment" },
    { key: "deliverydesk", label: "Deliverydesk" },
    { key: "carriercompany", label: "Carriercompany" },
    { key: "alternativestaff", label: "Alternativestaff" },
    { key: "alternativestaffcontactno", label: "Alternativestaffcontactno" },
    { key: "alternativestaffemail", label: "Alternativestaffemail" },
    { key: "deliverybuilding", label: "DeliveryBuilding" },
    { key: "deliveryfloor", label: "Deliveryfloor" },
    { key: "sender", label: "Sender" },
    { key: "deliverybyday1", label: "Deliverybyday1" },
    { key: "deliverybytime1", label: "Deliverybytime1" },
    { key: "assignedto", label: "Assignedto" },
    { key: "deliverymethod", label: "Deliverymethod" },
    { key: "eventcode1", label: "Eventcode1" },
    { key: "sendereori", label: "SenderEORI" },
    { key: "receivereori", label: "ReceiverEORI" },
    { key: "billingcompany", label: "Billingcompany" },
    { key: "billingaddressline1", label: "Billingaddressline1" },
    { key: "billingaddressline2", label: "Billingaddressline2" },
    { key: "billingaddressline3", label: "Billingaddressline3" },
    { key: "billingaddressline4", label: "Billingaddressline4" },
    { key: "billingpostcode", label: "Billingpostcode" },
    { key: "billingplace", label: "Billingplace" },
    { key: "billingcountry", label: "Billingcountry" },
    { key: "billingcode", label: "Billingcode" },
    { key: "billingbranch", label: "Billingbranch" },
    { key: "billingcontact", label: "Billingcontact" },
    { key: "billingemail", label: "Billingemail" },
    { key: "billingphone", label: "Billingphone" },
    { key: "billingmobile", label: "Billingmobile" },
    { key: "billingfax", label: "Billingfax" },
    { key: "isbillingaddressresidence", label: "Isbillingaddressresidence" },
    { key: "billingadditionalemail", label: "Billingadditionalemail" },
    { key: "billingw3waddress", label: "BillingW3Waddress" },
    { key: "billingeori", label: "BillingEORI" },
  ];

  const columnsLHRManifest = [
    { key: "sno", label: "S.NO" },
    { key: "awb", label: "AWB" },
    { key: "dummies", label: "DUMMIES" },
    { key: "shipper", label: "SHIPPER" },
    { key: "cod", label: "COD" },
    { key: "eori_number", label: "EORI NUMBER" },
    { key: "vat_number", label: "VAT NUMBER" },
    { key: "consignee", label: "CONSIGNEE" },
    { key: "pcs", label: "PCS" },
    { key: "wt", label: "WT." },
    { key: "billing", label: "BILLING" },
  ];

  const getCurrentColumns = () => {
    switch (viewType) {
      case "csv-lhr":
        return columnsCSVLHR;
      case "ts-manifest":
        return columnsTSManifest;
      case "dpd-csv":
        return columnsDPDCSV;
      case "lhr-manifest":
        return columnsLHRManifest;
      default:
        return columnsUK;
    }
  };


  /* 🔥 FIXED MERGE FUNCTION — Proper weight summation and value calculation */
  const applyMergedRows = (sourceRows, bagNumbers) => {
    if (!bagNumbers?.length) return sourceRows;

    let mergedTemplate = null;
    let totalPCS = 0, totalWeight = 0, totalValue = 0;
    const nonMerged = [];

    console.log("=== MERGE DEBUG START ===");
    console.log("Bag numbers to merge:", bagNumbers);
    console.log("Source rows count:", sourceRows.length);

    sourceRows.forEach((row, index) => {
      let bagField;
      switch (viewType) {
        case "csv-lhr":
          bagField = row.bag_numbers;
          console.log(`Row ${index}: bag_numbers = "${bagField}"`);
          break;
        case "ts-manifest": bagField = row.bag_number; break;
        case "dpd-csv": bagField = row.clientrefrence1 || row.notes; break;
        default:
          bagField = row.bagNumber || row.bagNo || row.alMawb || row.bag_weight || "";
          break;
      }

      const matches = bagField && bagNumbers.some(b => bagField.includes(b));
      console.log(`Row ${index}: matches = ${matches}, bagField = "${bagField}"`);

      if (matches) {
        if (!mergedTemplate) {
          console.log(`Creating template from row ${index}`);
          mergedTemplate = { ...row };
        }

        // Sum pieces
        const rowPieces = Number(row.pieces || row.pcs || row.totalnumberofitems || 0);
        totalPCS += rowPieces;

        // Sum weight
        let rowWeight = 0;
        switch (viewType) {
          case "csv-lhr":
            rowWeight = Number(row.total_weight || row.weight || 0);
            console.log(`Row ${index}: pieces = ${rowPieces}, weight = ${rowWeight}, total_weight = ${row.total_weight}`);
            break;
          case "ts-manifest":
            rowWeight = Number(row.weight || 0);
            break;
          case "dpd-csv":
            rowWeight = Number(row.totalweightkg || row.total_weight || 0);
            break;
          case "lhr-manifest":
            rowWeight = Number(row.wt || row.weight || 0);
            break;
          default:
            rowWeight = Number(
              row.totalActualWt ||
              row.bagWeight ||
              row.totalActualWeight ||
              row.total_weight ||
              row.weight ||
              row.bag_weight ||
              row.totalweightkg ||
              0
            );
            break;
        }
        totalWeight += rowWeight;

        // Sum value
        const rowValue = Number(row.value || row.consignmentvalue || 0);
        totalValue += rowValue;

        console.log(`Merging row ${index}: Pieces = ${rowPieces}, Weight = ${rowWeight}, Value = ${rowValue}, Running Total Weight = ${totalWeight.toFixed(2)}`);

      } else {
        nonMerged.push(row);
      }
    });

    console.log("=== MERGE DEBUG END ===");
    console.log(`Total Pieces: ${totalPCS}, Total Weight: ${totalWeight.toFixed(2)}, Total Value: ${totalValue.toFixed(2)}`);

    if (!mergedTemplate) {
      console.log("No matching rows found for merging");
      return sourceRows;
    }

    // Calculate value as 62% of total weight
    const mergeValue = (totalWeight * 0.62).toFixed(2);
    console.log(`Calculated value (62% of ${totalWeight}): ${mergeValue}`);

    switch (viewType) {
      case "csv-lhr":
        mergedTemplate.pieces = totalPCS;
        mergedTemplate.total_weight = totalWeight.toFixed(2);
        mergedTemplate.weight = totalWeight.toFixed(2); // Also update weight field
        mergedTemplate.value = mergeValue;
        mergedTemplate.bag_numbers = bagNumbers.join(",");
        console.log(`Updated CSV-LHR: pieces=${mergedTemplate.pieces}, total_weight=${mergedTemplate.total_weight}, value=${mergedTemplate.value}`);
        break;

      case "ts-manifest":
        mergedTemplate.pcs = totalPCS;
        mergedTemplate.weight = totalWeight.toFixed(2);
        mergedTemplate.value = mergeValue;
        mergedTemplate.bag_number = bagNumbers.join(",");
        break;

      case "dpd-csv":
        mergedTemplate.totalnumberofitems = totalPCS;
        mergedTemplate.totalweightkg = totalWeight.toFixed(2);
        mergedTemplate.consignmentvalue = mergeValue;
        mergedTemplate.clientrefrence1 = bagNumbers.join(",");
        mergedTemplate.notes = bagNumbers.join(",");
        break;

      case "lhr-manifest":
        mergedTemplate.pcs = totalPCS;
        mergedTemplate.wt = totalWeight.toFixed(2);
        break;

      default:
        const wt = totalWeight.toFixed(2);

        // Update all weight-related fields in the merged row
        if (mergedTemplate.totalActualWt !== undefined) mergedTemplate.totalActualWt = wt;
        if (mergedTemplate.bagWeight !== undefined) mergedTemplate.bagWeight = wt;
        if (mergedTemplate.totalActualWeight !== undefined) mergedTemplate.totalActualWeight = wt;
        if (mergedTemplate.total_weight !== undefined) mergedTemplate.total_weight = wt;
        if (mergedTemplate.actualweight !== undefined) mergedTemplate.actualweight = wt;
        if (mergedTemplate.bag_weight !== undefined) mergedTemplate.bag_weight = wt;
        if (mergedTemplate.weight !== undefined) mergedTemplate.weight = wt;
        if (mergedTemplate.totalweightkg !== undefined) mergedTemplate.totalweightkg = wt;

        // Also update count fields
        if (mergedTemplate.countBag !== undefined) mergedTemplate.countBag = totalPCS;
        break;
    }

    console.log(`Final merged row:`, mergedTemplate);

    // IMPORTANT: Create a new array with the merged row first, then non-merged rows
    const result = [mergedTemplate, ...nonMerged].map((r, i) => ({
      ...r,
      id: i + 1,
    }));

    console.log("Final result rows:", result);
    return result;
  };

  /* 🔥 UPDATED FETCH with merge reapply */
  const fetchData = async (formatType = "standard") => {
    if (!runNo) return showNotification("error", "Please enter a Run Number");

    setLoading(true);
    setRows([]);

    try {
      const formatParam = formatType === "standard" ? "" : `&format=${formatType}`;
      const response = await axios.get(
        `${server}/overseas-manifest/uk?runNo=${runNo}${formatParam}`
      );

      if (response.data.success) {
        setRunInfo(response.data.runInfo);

        const formatted = response.data.data.map((row, index) => ({
          ...row,
          id: index + 1,
        }));

        let finalRows = formatted;

        if (lastMergedBags.current.length > 0) {
          finalRows = applyMergedRows(formatted, lastMergedBags.current);
        }

        setRows(finalRows);
        setViewType(formatType);

        showNotification(
          "success",
          lastMergedBags.current.length > 0
            ? `Loaded merged view for ${formatType}`
            : `Loaded ${formatType} data`
        );
      } else {
        showNotification("error", response.data.message);
      }
    } catch (err) {
      showNotification("error", err.message);
    }

    setLoading(false);
  };

  /* 🔥 UPDATED MERGE BUTTON HANDLER */
  const processMerge = () => {
    if (!bagNumbers.trim()) return showNotification("error", "Enter bag numbers");

    const bags = bagNumbers.split(",").map(b => b.trim());
    lastMergedBags.current = bags;

    // Force a complete new array
    const currentRows = [...rows];
    const merged = applyMergedRows(currentRows, bags);

    // Force React to recognize the change
    setRows([...merged]);

    setShowMergeModal(false);
    showNotification("success", "Merged successfully");
  };

  // Test function to verify calculations
  const testMergeCalculation = () => {
    const testRows = [
      { pieces: 1, total_weight: 50.00, weight: 50.00, value: 0, bag_numbers: "1" },
      { pieces: 1, total_weight: 30.00, weight: 30.00, value: 0, bag_numbers: "2" }
    ];

    const bags = ["1", "2"];
    const result = applyMergedRows(testRows, bags);
    console.log("Test Result:", result[0]);
    // Should show: pieces: 2, total_weight: 80.00, value: 49.60 (80 * 0.62)
  };

  /* CSV / EXCEL / PDF — unchanged */

  /* ---------- CSV EXPORT ---------- */
  const handleDownloadCSV = () => {
    if (!rows.length) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const columns = getCurrentColumns();
      const fileName = `UK_Manifest_${viewType}_${runNo}_${Date.now()}.csv`;

      const headers = columns.map(col => col.label).join(",");

      const csvRows = rows.map(row =>
        columns.map(col => `"${String(row[col.key] ?? "").replace(/"/g, '""')}"`).join(",")
      );

      const csvContent = [headers, ...csvRows].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);

      showNotification("success", "CSV downloaded successfully");
    } catch (error) {
      console.error("CSV Error:", error);
      showNotification("error", `CSV export failed: ${error.message}`);
    }
  };

  /* ---------- EXCEL EXPORT ---------- */
  const handleDownloadExcel = () => {
    if (!rows.length) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const columns = getCurrentColumns();
      const fileName = `UK_Manifest_${viewType}_${runNo}_${Date.now()}.xlsx`;

      const sheetData = rows.map(row => {
        const formatted = {};
        columns.forEach(col => {
          formatted[col.label] = row[col.key] ?? "";
        });
        return formatted;
      });

      const ws = XLSX.utils.json_to_sheet(sheetData);
      ws["!cols"] = columns.map(() => ({ wch: 20 }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Manifest");
      XLSX.writeFile(wb, fileName);

      showNotification("success", "Excel downloaded successfully");
    } catch (error) {
      console.error("Excel Error:", error);
      showNotification("error", `Excel export failed: ${error.message}`);
    }
  };

  /* ---------- PDF EXPORT ---------- */
  const handleDownloadPDF = () => {
    if (!rows.length) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const doc = new jsPDF("landscape");
      const columns = getCurrentColumns();

      doc.setFontSize(16);
      doc.text(`UK Manifest - ${viewType.toUpperCase()}`, 14, 15);

      if (runInfo) {
        doc.setFontSize(10);
        doc.text(`Run No: ${runInfo.runNo || ""}`, 14, 25);
        doc.text(`Flight: ${runInfo.flight || ""}`, 14, 30);
      }

      autoTable(doc, {
        head: [columns.map(col => col.label)],
        body: rows.map(row => columns.map(col => String(row[col.key] ?? ""))),
        startY: runInfo ? 35 : 25,
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [200, 0, 0] }
      });

      doc.save(`UK_Manifest_${viewType}_${runNo}_${Date.now()}.pdf`);

      showNotification("success", "PDF downloaded successfully");
    } catch (error) {
      console.error("PDF Error:", error);
      showNotification("error", `PDF export failed: ${error.message}`);
    }
  };


  return (
    <div className="flex flex-col gap-3">
      <NotificationFlag {...notification} setVisible={(v) => setNotification({ ...notification, visible: v })} />

      {showMergeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-md w-96">
            <h2>Enter Bag Numbers</h2>
            <textarea className="w-full border p-2" value={bagNumbers}
              onChange={(e) => setBagNumbers(e.target.value)}
              placeholder="BAG001,BAG002" />

            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setShowMergeModal(false)}>Cancel</button>
              <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={processMerge}>Merge</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <LabeledDropdown options={["DPD", "Every"]} value="format" title="Format" register={register} setValue={setValue} />
        <LabeledDropdown options={["AJ"]} value="counterPart" title="CounterPart" register={register} setValue={setValue} />
      </div>

      <div className="flex gap-2">
        <InputBox register={register} setValue={setValue} value="runNo" placeholder="Run Number" />
        <OutlinedButtonRed label={loading ? "Loading..." : "Show"} disabled={loading} onClick={() => fetchData("standard")} />
        <OutlinedButtonRed label="Merge" disabled={!rows.length || loading} onClick={() => setShowMergeModal(true)} />
        <DownloadDropdown handleDownloadCSV={handleDownloadCSV} handleDownloadExcel={handleDownloadExcel} handleDownloadPDF={handleDownloadPDF} />
      </div>

      <TableWithSorting columns={getCurrentColumns()} rowData={rows} register={register} setValue={setValue} className="h-[400px]" />

      <div className="flex gap-3">
        <OutlinedButtonRed label="CSV LHR" disabled={loading} onClick={() => fetchData("csv-lhr")} />
        <OutlinedButtonRed label="CSV" disabled={loading} onClick={() => fetchData("dpd-csv")} />
        <OutlinedButtonRed label="TS Manifest" disabled={loading} onClick={() => fetchData("ts-manifest")} />
        <OutlinedButtonRed label="LHR Manifest" disabled={loading} onClick={() => fetchData("lhr-manifest")} />
      </div>
    </div>
  );
};

export default UKComponent;
