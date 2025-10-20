/**
 * Converts seconds to mm:ss or hh:mm:ss format.
 * @param seconds Number of seconds
 * @returns String in format "mm:ss" or "hh:mm:ss"
 */
export function formatDuration(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");

    if (hrs > 0) {
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    } else {
        return `${pad(mins)}:${pad(secs)}`;
    }
}