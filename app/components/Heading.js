"use client";
import Image from "next/image";
import { SearchInputBox } from "./InputBox";

function Heading({
  title,
  disabled = false,
  bulkUploadBtn = "",
  refreshBtn = "",
  codeListBtn = "",
  downloadBtn = false,
  searchBar = false,
  onClickDownloadBtn = () => { },
  onRefresh = () => {
    // console.log("No Action!");
  },
  handleBulkFileChange,
  fileInputRef,
  onClickBulkUploadBtn,
  browseBtn = false,
  onClickBrowseBtn = () => { },
  handleBrowseFileChange,
  fullscreenBtn = false,
  onClickFullscreenBtn = () => { },
  tableReportBtn = false,
  onClickTableReportBtn = () => { },
  onClickCodeList = () => { },
}) {

  return (
    <div className="flex justify-between items-center w-full">
      <h1 className="text-eerie-black  font-bold text-2xl">{title}</h1>
      <div className="flex gap-5 items-center">
        <button
          type="button"
          className={`${bulkUploadBtn}`}
          onClick={onClickBulkUploadBtn}
        >
          <input
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleBulkFileChange}
          />
          <Image src={`/bulk-upload.svg`} alt="" width={24} height={24} />
        </button>

        {downloadBtn && (
          <button onClick={onClickDownloadBtn} type="button">
            <Image src={`/download.svg`} alt="" width={24} height={24} />
          </button>
        )}

        {tableReportBtn && (
          <button onClick={onClickTableReportBtn} type="button">
            <Image src={`/table-report.svg`} alt="" width={20} height={20} />
          </button>
        )}

        {fullscreenBtn && (
          <button onClick={onClickFullscreenBtn} type="button">
            <Image src={`/fullscreenBtn.svg`} alt="" width={22} height={22} />
          </button>
        )}

        {searchBar && <SearchInputBox placeholder="Search Receipt No." />}

        <button onClick={onRefresh} type="button" className={`${refreshBtn}`}>
          <Image src={`/refresh.svg`} alt="" width={24} height={24} />
        </button>

        <button
          disabled={disabled}
          className={`${disabled ? "cursor-not-allowed" : ""} ${codeListBtn}`}
          type="button"
          // onClick={() => setToggleCodeList(true)}
          onClick={onClickCodeList}
        >
          <Image src={`/list.svg`} alt="" width={24} height={24} />
        </button>

        {browseBtn && (
          <button
            type="button"
            onClick={onClickBrowseBtn}
          >
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleBrowseFileChange}
            />
            <Image src={`/Group.svg`} alt="" width={20} height={20} />
          </button>
        )}
      </div>
    </div>
  );
}

export default Heading;

export function RedLabelHeading({ label }) {
  return <span className="text-sm text-red font-semibold">{label}</span>;
}

export function AwbWindowHeading({ label, awbNo }) {
  return (
    <div className="flex justify-between">
      <span className="text-2xl text-eerie-black font-bold">{label}</span>
      <span className=" text-red px-4 py-2.5 rounded-md bg-misty-rose">
        {awbNo}
      </span>
    </div>
  );
}