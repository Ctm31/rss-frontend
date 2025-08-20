import { useEffect, useState } from "react";
import {applyFilters, getFilterSummary } from "./filterUtils";
import "./App.css";

function App() {
  const [feeds, setFeeds] = useState([]);
  const [allFeeds, setAllFeeds] = useState([]); // Store all feeds for filtering
  const [loading, setLoading] = useState(true);
  const [updatingFeeds, setUpdatingFeeds] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [rssSources, setRssSources] = useState([]); 
  const [newRssUrl, setNewRssUrl] = useState("");
  const [newRssName, setNewRssName] = useState("");
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Filter states
  const [selectedSources, setSelectedSources] = useState([]);
  const [timeFilter, setTimeFilter] = useState("all"); // all, today, week, month, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});

  // Function to convert timestamp to local timezone and format it
  const formatLocalTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return timestamp; // Return original if parsing fails
      }
      
      // Format: "MMM DD, YYYY at HH:MM AM/PM"
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) + ' at ' + date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return timestamp; // Return original if formatting fails
    }
  };



  // Fetch current RSS sources from backend
  const fetchRssSources = async () => {
    try {
      console.log("Fetching RSS sources from: https://rss-backend-3jhv.onrender.com/list_feeds");
      const response = await fetch("https://rss-backend-3jhv.onrender.com/list_feeds");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const sources = await response.json();
      console.log("Fetched RSS sources:", sources);
      console.log("Sources count:", sources.length);
      
      if (!Array.isArray(sources)) {
        console.error("Sources data is not an array:", typeof sources);
        setRssSources([]);
        return;
      }
      
      setRssSources(sources);
    } catch (error) {
      console.error("Error fetching RSS sources:", error);
      console.error("Error details:", error.message);
      setRssSources([]);
    }
  };

  // Add new RSS source
  const addRssSource = async (url, name) => {
    try {
      // Use provided name or extract from URL if not provided
      const feedName = name || new URL(url).hostname;
      
      const response = await fetch(`https://rss-backend-3jhv.onrender.com/add_feed?name=${encodeURIComponent(feedName)}&url=${encodeURIComponent(url)}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        console.log("Successfully added RSS source:", url);
        setNewRssUrl("");
        setNewRssName("");
        fetchRssSources(); // Refresh the sources list
        fetchFeeds(); // Refresh feeds
      } else {
        console.error("Failed to add RSS source:", response.status);
      }
    } catch (error) {
      console.error("Error adding RSS source:", error);
    }
  };

  // Delete RSS source
  const deleteRssSource = async (name) => {
    try {
      const response = await fetch(`https://rss-backend-3jhv.onrender.com/remove_feed?name=${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log("Successfully deleted RSS source:", name);
        fetchRssSources(); // Refresh the sources list
        fetchFeeds(); // Refresh feeds
      } else {
        console.error("Failed to delete RSS source:", response.status);
      }
    } catch (error) {
      console.error("Error deleting RSS source:", error);
    }
  };

  const fetchFeeds = async () => {
    try {
      console.log("Fetching articles from: https://rss-backend-3jhv.onrender.com/feeds");
      const response = await fetch("https://rss-backend-3jhv.onrender.com/feeds");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Received articles data:", data);
      console.log("Articles count:", data.length);
      
      if (!Array.isArray(data)) {
        console.error("Articles data is not an array:", typeof data);
        setAllFeeds([]);
        setFeeds([]);
        setLoading(false);
        return;
      }
      
      setAllFeeds(data); // Store all feeds
      setFeeds(data); // Initially show all feeds
      setLoading(false);
    } catch (err) {
      console.error("Error fetching feeds:", err);
      console.error("Error details:", err.message);
      setAllFeeds([]);
      setFeeds([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
    fetchRssSources(); // Fetch RSS sources from backend
  }, []);

  const handleAddRssSource = (e) => {
    e.preventDefault();
    if (newRssUrl.trim()) {
      addRssSource(newRssUrl.trim(), newRssName.trim());
    }
  };

  const handleApplyFilters = () => {
    const filters = {
      sources: selectedSources,
      timeFilter: timeFilter,
      startDate: timeFilter === 'custom' ? customStartDate : null,
      endDate: timeFilter === 'custom' ? customEndDate : null
    };
    
    setAppliedFilters(filters);
    
    // Apply filters to all feeds
    const filteredFeeds = applyFilters(allFeeds, filters);
    setFeeds(filteredFeeds);
  };

  const handleClearFilters = () => {
    setSelectedSources([]);
    setTimeFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setAppliedFilters({});
    setFeeds(allFeeds); // Reset to show all feeds
  };

  const handleSourceToggle = (sourceName) => {
    const newSelectedSources = selectedSources.includes(sourceName) 
      ? selectedSources.filter(name => name !== sourceName)
      : [...selectedSources, sourceName];
    
    setSelectedSources(newSelectedSources);
    
    // Auto-apply filters
    const filters = {
      sources: newSelectedSources,
      timeFilter: timeFilter,
      startDate: timeFilter === 'custom' ? customStartDate : null,
      endDate: timeFilter === 'custom' ? customEndDate : null
    };
    
    setAppliedFilters(filters);
    const filteredFeeds = applyFilters(allFeeds, filters);
    setFeeds(filteredFeeds);
  };

  const handleTimeFilterChange = (newTimeFilter) => {
    setTimeFilter(newTimeFilter);
    
    // Auto-apply filters
    const filters = {
      sources: selectedSources,
      timeFilter: newTimeFilter,
      startDate: newTimeFilter === 'custom' ? customStartDate : null,
      endDate: newTimeFilter === 'custom' ? customEndDate : null
    };
    
    setAppliedFilters(filters);
    const filteredFeeds = applyFilters(allFeeds, filters);
    setFeeds(filteredFeeds);
  };

  const handleCustomDateChange = (field, value) => {
    if (field === 'startDate') {
      setCustomStartDate(value);
    } else {
      setCustomEndDate(value);
    }
    
    // Auto-apply filters
    const filters = {
      sources: selectedSources,
      timeFilter: timeFilter,
      startDate: field === 'startDate' ? value : customStartDate,
      endDate: field === 'endDate' ? value : customEndDate
    };
    
    setAppliedFilters(filters);
    const filteredFeeds = applyFilters(allFeeds, filters);
    setFeeds(filteredFeeds);
  };

  // Manually trigger backend to update feeds
  const updateFeeds = async () => {
    try {
      setUpdatingFeeds(true);
      console.log("Triggering feed update at: https://rss-backend-3jhv.onrender.com/update_feeds");
      const response = await fetch("https://rss-backend-3jhv.onrender.com/update_feeds", {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // After successful update, refresh feeds list
      await fetchFeeds();
    } catch (error) {
      console.error("Error updating feeds:", error);
    } finally {
      setUpdatingFeeds(false);
    }
  };

  // Search articles by title keyword
  const searchArticles = async (query) => {
    if (!query.trim()) {
      // If search is empty, show all feeds
      setFeeds(allFeeds);
      return;
    }

    try {
      setIsSearching(true);
      console.log("Searching articles with query:", query);
      const response = await fetch(`https://rss-backend-3jhv.onrender.com/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Search results:", data);
      
      if (!Array.isArray(data)) {
        console.error("Search data is not an array:", typeof data);
        setFeeds([]);
        return;
      }
      
      setFeeds(data);
    } catch (error) {
      console.error("Error searching articles:", error);
      setFeeds([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchArticles(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setFeeds(allFeeds);
  };


  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading feeds...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="header-section">
        <h1 className="app-title">Aggregated RSS Feeds</h1>
        <div className="header-buttons">
          <button 
            className="manage-sources-btn"
            onClick={updateFeeds}
            disabled={updatingFeeds}
            title="Fetch latest articles from all sources"
          >
            {updatingFeeds ? 'Updating…' : 'Update Feeds'}
          </button>
          <button 
            className="manage-sources-btn"
            onClick={() => setShowManageModal(true)}
          >
            Manage RSS Sources
          </button>
        </div>
      </div>

      <div className="main-content">
        {/* Left Sidebar */}
        <div className="sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Search & Filter</h3>
            
            {/* Search Section */}
            <div className="search-section">
              <form onSubmit={handleSearch} className="search-form">
                <input
                  type="text"
                  placeholder="Search articles by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button 
                  type="submit" 
                  className="search-btn"
                  disabled={isSearching}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
                {searchQuery && (
                  <button 
                    type="button" 
                    className="clear-search-btn"
                    onClick={handleClearSearch}
                  >
                    Clear
                  </button>
                )}
              </form>
            </div>

            {/* Filter Section */}
            <div className="filter-section">
              <h4>Filter by Source</h4>
              <div className="sources-filter">
                {rssSources.length === 0 ? (
                  <p className="no-sources">No RSS sources available.</p>
                ) : (
                  <div className="checkbox-group">
                    {rssSources.map((source) => (
                      <label key={source.user_name} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(source.user_name)}
                          onChange={() => handleSourceToggle(source.user_name)}
                        />
                        <span className="checkmark"></span>
                        {source.user_name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <h4>Filter by Time</h4>
              <div className="time-filter">
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="timeFilter"
                      value="all"
                      checked={timeFilter === "all"}
                      onChange={() => handleTimeFilterChange("all")}
                    />
                    <span className="radio-mark"></span>
                    All time
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="timeFilter"
                      value="today"
                      checked={timeFilter === "today"}
                      onChange={() => handleTimeFilterChange("today")}
                    />
                    <span className="radio-mark"></span>
                    Today
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="timeFilter"
                      value="week"
                      checked={timeFilter === "week"}
                      onChange={() => handleTimeFilterChange("week")}
                    />
                    <span className="radio-mark"></span>
                    This week
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="timeFilter"
                      value="month"
                      checked={timeFilter === "month"}
                      onChange={() => handleTimeFilterChange("month")}
                    />
                    <span className="radio-mark"></span>
                    This month
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="timeFilter"
                      value="custom"
                      checked={timeFilter === "custom"}
                      onChange={() => handleTimeFilterChange("custom")}
                    />
                    <span className="radio-mark"></span>
                    Custom range
                  </label>
                </div>

                {timeFilter === "custom" && (
                  <div className="custom-date-range">
                    <div className="date-input-group">
                      <label>Start Date:</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                      />
                    </div>
                    <div className="date-input-group">
                      <label>End Date:</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="filter-actions">
                <button 
                  className="clear-filters-btn"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              </div>

              {getFilterSummary(appliedFilters) && (
                <div className="filter-summary">
                  <strong>Active Filters:</strong> {getFilterSummary(appliedFilters)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="content-area">
          <div className="articles-grid">
            {feeds.length === 0 ? (
              <div className="no-results">
                <p>No articles match your current filters.</p>
                <button 
                  className="clear-filters-btn"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              feeds.map((item, index) => (
                <article key={index} className="article-card">
                  <div className="card-content">
                    <h2 className="article-title">
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        {item.title}
                      </a>
                    </h2>
                    <div className="article-meta">
                      <span className="publisher">{item.user_name}</span>
                      <span className="publish-time" title={item.timestamp}>
                        {formatLocalTime(item.timestamp)}
                      </span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RSS Sources Management Modal */}
      {showManageModal && (
        <div className="modal-overlay" onClick={() => setShowManageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage RSS Sources</h2>
              <button 
                className="close-btn"
                onClick={() => setShowManageModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleAddRssSource} className="add-source-form">
                <input
                  type="text"
                  placeholder="Enter feed name (optional)"
                  value={newRssName}
                  onChange={(e) => setNewRssName(e.target.value)}
                  className="rss-name-input"
                />
                <input
                  type="url"
                  placeholder="Enter RSS feed URL"
                  value={newRssUrl}
                  onChange={(e) => setNewRssUrl(e.target.value)}
                  className="rss-url-input"
                  required
                />
                <button type="submit" className="add-btn">
                  Add Source
                </button>
              </form>

              <div className="sources-list">
                <h3>Current Sources</h3>
                {rssSources.length === 0 ? (
                  <p className="no-sources">No RSS sources configured yet.</p>
                ) : (
                  <ul>
                    {rssSources.map((source) => (
                      <li key={source.user_name} className="source-item">
                        <span className="source-url">{source.user_name}</span>
                        <button     
                          className="delete-btn"
                          onClick={() => deleteRssSource(source.user_name)}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
