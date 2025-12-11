export const getIndoMonth = (monthIndex) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return months[monthIndex % 12];
};

export const formatFullDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${date.getDate()} ${getIndoMonth(date.getMonth())} ${date.getFullYear()}`;
};

export const processSmartLabels = (dataPoints, range) => {
    if (!dataPoints || dataPoints.length === 0) return dataPoints;
    const historyPoints = dataPoints.filter(p => p.type === 'history');
    const forecastPoints = dataPoints.filter(p => p.type === 'forecast');
    return [...historyPoints, ...forecastPoints];
};