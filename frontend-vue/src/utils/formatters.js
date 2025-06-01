/**
 * Formats a date string or Date object into a more readable format.
 * @param {string | Date | number} dateInput - The date to format.
 * @param {Intl.DateTimeFormatOptions} [options] - Options for Intl.DateTimeFormat.
 * @returns {string} The formatted date string, or 'Invalid Date' if input is not valid.
 */
export function formatDate(dateInput, options) {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      // timeZoneName: 'short', // Optional: show timezone
    };

    return new Intl.DateTimeFormat(undefined, { ...defaultOptions, ...options }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Formats a file size in bytes into a human-readable string (KB, MB, GB).
 * @param {number} bytes - The file size in bytes.
 * @param {number} [decimals=2] - The number of decimal places to display.
 * @returns {string} The formatted file size string.
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === null || bytes === undefined || isNaN(bytes)) {
    return 'N/A';
  }
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


/**
 * Truncates a string to a specified length and appends an ellipsis if truncated.
 * @param {string} text - The string to truncate.
 * @param {number} maxLength - The maximum length of the string.
 * @param {string} [ellipsis="..."] - The ellipsis string to append.
 * @returns {string} The truncated string.
 */
export function truncateText(text, maxLength, ellipsis = "...") {
  if (typeof text !== 'string' || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Converts a string to Title Case.
 * e.g., "hello world" -> "Hello World"
 * @param {string} str - The input string.
 * @returns {string} The string in title case.
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

// Add more formatters as needed, e.g., for currency, numbers, etc.

// Example Usage:
// import { formatDate, formatFileSize, truncateText } from '@/utils/formatters';
// const myDate = new Date();
// console.log(formatDate(myDate)); // e.g., "December 20, 2023, 10:30 AM"
// console.log(formatDate(myDate, { month: 'short', day: '2-digit' })); // e.g., "Dec 20"

// console.log(formatFileSize(10240)); // "10 KB"
// console.log(truncateText("This is a very long string that needs truncation.", 20)); // "This is a very lon..."
// console.log(toTitleCase("another example string")); // "Another Example String"
