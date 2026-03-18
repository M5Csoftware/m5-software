import axios from "axios";

const server = process.env.NEXT_PUBLIC_SERVER ?? "";

export async function addNotification(payload) {
    try {
        const res = await axios.post(`${server}/notifications`, payload);

        return res.data; // { message, notification }
    } catch (error) {
        console.error("Add Notification Error:", error);

        return {
            error:
                error.response?.data?.error ||
                error.message ||
                "Failed to create notification",
        };
    }
}



// import { addNotification } from "@/app/lib/notifications";

// async function handleCreate() {
//     const payload = {
//         accountCode: "A123",
//         type: "Shipment Hold",
//         title: "Hold Notice",
//         description: "Shipment stuck",
//         awb: "AWB001",
//     };

//     const result = await addNotification(payload);
//     // console.log(result);
// }
