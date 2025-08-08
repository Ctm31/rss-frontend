// Filter utility functions for RSS feed filtering

/**
 * Get unique sources from feeds
 * @param {Array} feeds - Array of feed objects
 * @returns {Array} Array of unique source objects with id, name, and url properties
 */
export const getUniqueSources = (feeds) => {
  const sources = feeds.reduce((acc, feed) => {
    if (!acc.find(source => source.name === feed.source)) {
      acc.push({ id: feed.source, name: feed.source, url: feed.source });
    }
    return acc;
  }, []);
  return sources;
};

/**
 * Check if a date is within the specified time range
 * @param {string} dateString - Date string to check
 * @param {string} timeFilter - Time filter type ('all', 'today', 'week', 'month', 'custom')
 * @param {string} startDate - Start date for custom range (optional)
 * @param {string} endDate - End date for custom range (optional)
 * @returns {boolean} True if date is in range, false otherwise
 */
export const isDateInRange = (dateString, timeFilter, startDate, endDate) => {
  try {
    const articleDate = new Date(dateString);
    if (isNaN(articleDate.getTime())) return true; // Include if date is invalid
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timeFilter) {
      case 'today':
        const articleDay = new Date(articleDate.getFullYear(), articleDate.getMonth(), articleDate.getDate());
        return articleDay.getTime() === today.getTime();
      
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return articleDate >= weekAgo;
      
      case 'month':
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        return articleDate >= monthAgo;
      
      case 'custom':
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Include the entire end date
          return articleDate >= start && articleDate <= end;
        }
        return true;
      
      default:
        return true; // 'all' - include everything
    }
  } catch (error) {
    console.error('Error checking date range:', error);
    return true; // Include if there's an error
  }
};

/**
 * Apply filters to feeds
 * @param {Array} feeds - Array of feed objects to filter
 * @param {Object} filters - Filter object with sources, timeFilter, startDate, endDate properties
 * @returns {Array} Filtered array of feeds
 */
export const applyFilters = (feeds, filters) => {
  return feeds.filter(feed => {
    // Filter by source
    if (filters.sources && filters.sources.length > 0) {
      if (!filters.sources.includes(feed.source)) {
        return false;
      }
    }
    
    // Filter by time
    if (filters.timeFilter && filters.timeFilter !== 'all') {
      if (!isDateInRange(feed.published, filters.timeFilter, filters.startDate, filters.endDate)) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Get a summary string of applied filters
 * @param {Object} appliedFilters - Object containing applied filter settings
 * @returns {string|null} Summary string or null if no filters applied
 */
export const getFilterSummary = (appliedFilters) => {
  if (Object.keys(appliedFilters).length === 0) return null;
  
  const parts = [];
  if (appliedFilters.sources && appliedFilters.sources.length > 0) {
    parts.push(`${appliedFilters.sources.length} source(s)`);
  }
  if (appliedFilters.timeFilter && appliedFilters.timeFilter !== 'all') {
    parts.push(appliedFilters.timeFilter);
  }
  return parts.join(', ');
};
