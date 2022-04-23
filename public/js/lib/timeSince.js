export default function timeSince(dateObj) {
  const seconds = Math.floor((new Date() - dateObj) / 1000);
  let interval = seconds / 31536000;

  if (interval > 1) {
    const year = Math.floor(interval);
    if (year == 1) return '1 year';
    return year + ' years';
  }

  interval = seconds / 2592000;
  if (interval > 1) {
    const month = Math.floor(interval)
    if (month == 1) return '1 month';
    return month + ' months';
  }

  interval = seconds / 86400;
  if (interval > 1) {
    const day = Math.floor(interval);
    if (day == 1) return '1 day';
    return day + ' days';
  }

  interval = seconds / 3600;
  if (interval > 1) {
    const hour = Math.floor(interval);
    if (hour == 1) return '1 hour';
    return hour + ' hours';
  }

  interval = seconds / 60;
  if (interval > 1) {
    const minute = Math.floor(interval);
    if (minute == 1) return '1 minute';
    return minute + ' minutes';
  }

  const second = Math.floor(seconds);
  if (isNaN(second) || second == 1) '1 second';
  return second + ' seconds';
}