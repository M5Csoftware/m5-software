

const server = process.env.NEXT_PUBLIC_SERVER ?? "";

export async function sendNotification(data) {
  try {
    const res = await fetch(`${server}/notifications/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await res.json();
  } catch (err) {
    console.error("Send notification error:", err);
  }
}


//To send notifs use below

// import { sendNotification } from "@/lib/sendNotification";

// await sendNotification({
//   accountCode: shipment.accountCode,
//   name: shipment.customerName,
//   awbNo: shipment.awbNo,
//   event: "Shipment Status",
//   description: "Shipment delivered",
//   message: "Shipment AWB123 delivered successfully.",
//   priority: "high",
// });

