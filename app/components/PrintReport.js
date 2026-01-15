//Check manifest-report/page.js for actual logic

// 'use client';

// import React, { useEffect, useRef } from 'react';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import JsBarcode from 'jsbarcode';

// const data = [
//     {
//         srNo: 1,
//         awbNo: '280KT205682',
//         consignor: 'JATINDER KAUR',
//         consignee: 'NIMRATA RASSNA',
//         pcs: 1,
//         wt: 36.5,
//         description: 'BELT BEDSHEET PANT BLANKET  Lorem ipsum, dolor sit amet consectetur adipisicing elit. Molestiae, et harum! Amet nisi porro, quasi corporis omnis illum voluptatem tempore libero, provident assumenda necessitatibus aliquam architecto magnam deserunt hic. Ipsum.',
//         value: 95.33,
//         dest: 'CANADA'
//     },
//     {
//         srNo: 2,
//         awbNo: '280KT206622',
//         consignor: 'PATEL NIDHIBEN',
//         consignee: 'GITABEN PATEL',
//         pcs: 2,
//         wt: 39.25,
//         description: 'BELT FOOTWEAR JACKET CAP SHIRT',
//         value: 104.27,
//         dest: 'CANADA'
//     }
// ];

// export default function PrintReport() {
//     const contentRef = useRef();

//     useEffect(() => {
//         data.forEach((item, idx) => {
//             const barcodeEl = document.getElementById(`barcode-${idx}`);
//             if (barcodeEl) {
//                 JsBarcode(barcodeEl, item.awbNo, {
//                     format: 'CODE128',
//                     width: 1,
//                     height: 30,
//                     fontSize: 10,
//                     displayValue: true,
//                     margin: 0
//                 });
//             }
//         });
//     }, []);

//     const handleDownloadPDF = async () => {
//         const input = contentRef.current;
//         const canvas = await html2canvas(input, { scale: 2, useCORS: true });
//         const imgData = canvas.toDataURL('image/png');

//         const pdf = new jsPDF('p', 'mm', 'letter');
//         const pdfWidth = pdf.internal.pageSize.getWidth();
//         const imgProps = pdf.getImageProperties(imgData);
//         const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

//         pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
//         pdf.save(`Manifest_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
//     };

//     return (
//         <div className="p-4 bg-white text-black">
//             <div ref={contentRef} className="p-4 text-[10px] ">
//                 <div className="flex justify-between mb-2">
//                     <div>
//                         <strong>FROM:</strong> M5C LOGISTICS
//                     </div>
//                     <div className="text-right">
//                         <strong>TO:</strong> DCW SOLUTIONS INC<br />
//                         13937 60 AVE SURREY, BC V3X0K7
//                     </div>
//                 </div>

//                 <h2 className="text-center font-bold mb-4 text-xs">MANIFEST REPORT</h2>

//                 <table className="w-full">
//                     <thead className='border-y-2 border-t-[#000080] border-y-[#ff0000]'>
//                         <tr >
//                             {['SrNo', 'AWB No.', 'Consignor', 'Consignee', 'PCS', 'WT', 'DEST', 'Description', 'Value'].map((header, i) => (
//                                 <th className='pt-2 pb-4 px-2 text-left' key={i} >{header}</th>
//                             ))}
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {data.map((item, idx) => (
//                             <tr className='align-top ' key={idx}>
//                                 <td className=' px-2 pt-3 ' >{item.srNo}</td>
//                                 <td className='py-3  max-w-20 text-center px-2'>
//                                     <svg id={`barcode-${idx}`} className="h-[40px]"></svg>
//                                 </td>
//                                 <td className=' px-2 max-w-12 pt-3 '>{item.consignor}</td>
//                                 <td className=' px-2 max-w-12 pt-3 '>{item.consignee}</td>
//                                 <td className='px-2 max-w-12 pt-3 '>{item.pcs}</td>
//                                 <td className='px-2 max-w-12 pt-3 ' >{item.wt}</td>
//                                 <td className='px-2 max-w-12 pt-3 '>{item.dest}</td>
//                                 <td className='max-w-16 px-2 pt-3 '>{item.description}</td>
//                                 <td className='px-2 max-w-12 pt-3 '>{item.value.toFixed(2)}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>

//             <div className="mt-4 flex justify-center">
//                 <button
//                     onClick={handleDownloadPDF}
//                     className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800"
//                 >
//                     Download PDF
//                 </button>
//             </div>


//         </div>
//     );
// }
