/**
 * Pauses execution for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to sleep.
 * @returns {Promise<void>} A promise that resolves after the specified time.
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates a simple unique ID string.
 * Uses a combination of Math.random and Date.now for basic uniqueness.
 * For more robust scenarios, consider libraries like `uuid`.
 * @param {string} [prefix='id_'] - Optional prefix for the ID.
 * @returns {string} A unique ID string.
 */
export function generateId(prefix = 'id_') {
  return prefix + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

/**
 * Debounces a function, delaying its execution until after a specified wait time
 * has elapsed since the last time it was invoked.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @param {boolean} [immediate=false] - Trigger the function on the leading edge instead of the trailing.
 * @returns {Function} The debounced function.
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const context = this;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

/**
 * Throttles a function, ensuring it's called at most once in a specified time period.
 * @param {Function} func - The function to throttle.
 * @param {number} limit - The throttle limit in milliseconds.
 * @returns {Function} The throttled function.
 */
export function throttle(func, limit) {
  let inThrottle;
  let lastFunc;
  let lastRan;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Copies text to the clipboard.
 * Uses the Clipboard API if available, otherwise falls back to a textarea method.
 * @param {string} text - The text to copy.
 * @returns {Promise<void>} A promise that resolves when copy is successful, or rejects on failure.
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return Promise.resolve();
    } catch (err) {
      console.error('Failed to copy text using Clipboard API:', err);
      // Fallback to textarea method below
    }
  }

  // Fallback for browsers that don't support Clipboard API or if it fails
  const textArea = document.createElement('textarea');
  textArea.value = text;
  // Make the textarea out of viewport
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (successful) {
      return Promise.resolve();
    } else {
      return Promise.reject(new Error('Fallback: Failed to copy text.'));
    }
  } catch (err) {
    document.body.removeChild(textArea);
    return Promise.reject(new Error('Fallback: Error copying text.'));
  }
}


/**
 * Safely get a nested property from an object.
 * @param {Object} obj - The object to query.
 * @param {string | string[]} path - The path to the property (e.g., 'a.b.c' or ['a', 'b', 'c']).
 * @param {*} [defaultValue=undefined] - The value to return if the path is not found.
 * @returns {*} The value at the path or the default value.
 */
export function getNestedValue(obj, path, defaultValue = undefined) {
  if (!obj || typeof path === 'undefined') {
    return defaultValue;
  }
  const pathArray = Array.isArray(path) ? path : path.split('.').filter(key => key.length);
  const result = pathArray.reduce((currentObject, key) => {
    return currentObject && typeof currentObject === 'object' ? currentObject[key] : undefined;
  }, obj);
  return result === undefined ? defaultValue : result;
}


// Example Usage:
// import { sleep, generateId, debounce, throttle, copyToClipboard, getNestedValue } from '@/utils/helpers';

// async function exampleAsync() {
//   console.log("Start");
//   await sleep(1000);
//   console.log("End after 1 second");
// }
// exampleAsync();

// console.log(generateId()); // e.g., id_a1b2c3d4e_f5g6h7i8j
// console.log(generateId('custom_')); // e.g., custom_a1b2c3d4e_f5g6h7i8j

// const myDebouncedFunction = debounce(() => console.log("Debounced function called"), 300);
// window.addEventListener('resize', myDebouncedFunction); // Call on resize, but debounced

// const myThrottledFunction = throttle(() => console.log("Throttled function called"), 500);
// window.addEventListener('scroll', myThrottledFunction); // Call on scroll, but throttled

// copyToClipboard("Text to copy!")
//  .then(() => console.log("Copied!"))
//  .catch(err => console.error("Could not copy:", err));

// const obj = { a: { b: { c: 10 } }, d: null };
// console.log(getNestedValue(obj, 'a.b.c')); // 10
// console.log(getNestedValue(obj, ['a', 'b', 'c'])); // 10
// console.log(getNestedValue(obj, 'a.x.y', 'default')); // 'default'
// console.log(getNestedValue(obj, 'd.e')); // undefined (d is null)
// console.log(getNestedValue(obj, 'd.e', 'fallback')); // 'fallback'
