export default function timeSince(dateObj) {
  const seconds = Math.floor((new Date() - dateObj) / 1000);
  let interval = seconds / 31536000;

  if (interval > 1) {
    const year = Math.floor(interval);
    if (year == 1) return year + " year";
    return year + " years";
  }

  interval = seconds / 2592000;
  if (interval > 1) {
    const month = Math.floor(interval)
    if (month == 1) return month + " month";
    return month + " months";
  }

  interval = seconds / 86400;
  if (interval > 1) {
    const day = Math.floor(interval);
    if (day == 1) return day + " day";
    return day + " days";
  }

  interval = seconds / 3600;
  if (interval > 1) {
    const hour = Math.floor(interval);
    if (hour == 1) return hour + " hour";
    return hour + " hours";
  }

  interval = seconds / 60;
  if (interval > 1) {
    const minute = Math.floor(interval);
    if (minute == 1) return minute + " minute";
    return minute + " minutes";
  }

  const second = Math.floor(seconds);
  if (isNaN(second)) return "0 seconds";
  if (second == 1) return second + " second";
  return second + " seconds";
}