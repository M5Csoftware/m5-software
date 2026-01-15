// Utility function to format date to dd/mm/yyyy
const formatDate = (date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, "0"); // Add leading zero for day
    const month = (d.getMonth() + 1).toString().padStart(2, "0"); // Add leading zero for month (months are 0-indexed)
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

export default formatDate;
