/**
 * Collection of utility helper functions
 */

// Generate random string
exports.generateRandomString = (length = 10) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };
  
  // Format date to Indonesian format
  exports.formatDate = (date) => {
    if (!date) return null;
    
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    };
    
    return new Date(date).toLocaleDateString('id-ID', options);
  };
  
  // Paginate array of data
  exports.paginate = (array, page_size, page_number) => {
    return array.slice((page_number - 1) * page_size, page_number * page_size);
  };
  
  // Format response
  exports.formatResponse = (success, message, data = null, meta = null) => {
    return {
      success,
      message,
      data,
      meta
    };
  };
  
  // Filter allowed fields
  exports.filterFields = (obj, allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(key => {
      if (allowedFields.includes(key)) {
        newObj[key] = obj[key];
      }
    });
    return newObj;
  };
  
  // Convert string to slug
  exports.slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };
  
  // Get current timestamp in seconds
  exports.getCurrentTimestamp = () => {
    return Math.floor(Date.now() / 1000);
  };