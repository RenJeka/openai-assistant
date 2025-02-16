/**
 * format date to string like "31 Jan 2024, 15:30"
 * @param {number} timeStampInSec - timestamp in seconds (python format, OpenAI API format)
 * @returns {string} formatted date
 * @example formatDate(1739641153) // "31 Jan 2024, 15:30"
 * */
export function formatDate(timeStampInSec) {
  const correctedDate = new Date(timeStampInSec * 1000);
  return `${correctedDate.getDate()} ${correctedDate.toLocaleString("default", {
    month: "short",
  })} ${correctedDate.getFullYear()}, ${correctedDate.getHours()}:${correctedDate.getMinutes()}`;
}
