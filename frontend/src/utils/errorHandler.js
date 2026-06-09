/**
 * Error Handling Utility
 * Provides consistent error handling patterns across the application
 */

import toast from 'react-hot-toast';

/**
 * Wraps an API call with try-catch and consistent error handling
 * @param {Function} apiCall - The async API function to call
 * @param {string} errorContext - Context for error logging (e.g., "Login", "Upload Profile")
 * @param {Object} options - Additional options
 * @returns {Promise} - Result of the API call or null on error
 */
export const withErrorHandler = async (apiCall, errorContext = 'API Call', options = {}) => {
  const { 
    showNotification = true, 
    logError = true,
    fallbackMessage = 'An error occurred. Please try again.'
  } = options;

  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    const errorMessage = error?.message || fallbackMessage;
    const errorCode = error?.code || 'UNKNOWN_ERROR';
    const statusCode = error?.status || null;

    // Log error for debugging
    if (logError) {
      console.error(`[${errorContext}] Error (${errorCode}):`, {
        message: errorMessage,
        status: statusCode,
        fullError: error
      });
    }

    // Show user notification
    if (showNotification) {
      toast.error(errorMessage);
    }

    // Return null to indicate failure (allows graceful degradation)
    return null;
  }
};

/**
 * Wraps multiple async operations with error handling
 * @param {Array<Promise>} promises - Array of promises to execute
 * @param {string} errorContext - Context for error logging
 * @returns {Promise<Array>} - Results array (failed ones are null)
 */
export const withBatchErrorHandler = async (promises, errorContext = 'Batch Operation') => {
  try {
    const results = await Promise.allSettled(promises);
    
    // Process results and log failures
    return results.map((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[${errorContext}] Operation ${index} failed:`, result.reason);
        return null;
      }
      return result.value;
    });
  } catch (error) {
    console.error(`[${errorContext}] Batch operation failed:`, error);
    toast.error('Failed to complete batch operation');
    return null;
  }
};

/**
 * Creates a retry mechanism for failed API calls
 * @param {Function} apiCall - The async API function to call
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delayMs - Delay between retries in milliseconds
 * @param {string} errorContext - Context for error logging
 * @returns {Promise} - Result of the API call or null on all failures
 */
export const withRetry = async (
  apiCall, 
  maxRetries = 3, 
  delayMs = 1000,
  errorContext = 'API Call with Retry'
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry for certain status codes (auth, validation, etc.)
      const dontRetryStatusCodes = [400, 401, 403, 404];
      if (dontRetryStatusCodes.includes(error?.status)) {
        throw error;
      }

      if (attempt < maxRetries) {
        console.warn(
          `[${errorContext}] Attempt ${attempt} failed. Retrying in ${delayMs}ms...`
        );
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  console.error(`[${errorContext}] All ${maxRetries} attempts failed:`, lastError);
  toast.error('Operation failed after multiple attempts. Please try again later.');
  return null;
};

/**
 * Validates required fields before making API call
 * @param {Object} data - Data object to validate
 * @param {Array<string>} requiredFields - List of required field names
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
export const validateApiInput = (data, requiredFields = []) => {
  const errors = {};

  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors[field] = `${field} is required`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Extracts user-friendly error message from API error
 * @param {Error} error - The error object from axios
 * @param {string} defaultMessage - Default message if extraction fails
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  // Axios error with response data
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Custom error message
  if (error?.message) {
    return error.message;
  }

  // Network/timeout errors
  if (error?.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }

  if (error?.code === 'ENOTFOUND' || !error?.response) {
    return 'Network error. Please check your connection.';
  }

  return defaultMessage;
};
