export const calculateAge = (date) => {
    const diffMs = Date.now() - date.getTime();
    const ageDate = new Date(diffMs);

    return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
};