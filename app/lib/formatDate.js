// Utility function to format date to dd/mm/yyyy
const formatDate = (date) => {
    if (!date) return "-";
    
    // If it's already in DD/MM/YYYY format, return it as is
    if (typeof date === "string" && /^\d{2}\/\d{2}\/\d{4}/.test(date)) {
        return date;
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) {
        return date; // Return original value if it can't be parsed
    }

    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

export default formatDate;
