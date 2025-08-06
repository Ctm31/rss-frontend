import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [feeds, setFeeds] = useState([]);
  const [allFeeds, setAllFeeds] = useState([]); // Store all feeds for filtering
  const [loading, setLoading] = useState(true);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [rssSources, setRssSources] = useState([]); // TODO: Fetch from backend
  const [newRssUrl, setNewRssUrl] = useState("");
  
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

  // Function to get unique sources from feeds
  const getUniqueSources = (feeds) => {
    const sources = feeds.reduce((acc, feed) => {
      if (!acc.find(source => source.name === feed.source)) {
        acc.push({ id: feed.source, name: feed.source, url: feed.source });
      }
      return acc;
    }, []);
    return sources;
  };

  // Function to check if a date is within the specified time range
  const isDateInRange = (dateString, timeFilter, startDate, endDate) => {
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

  // Function to apply filters to feeds
  const applyFilters = (feeds, filters) => {
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

  // TODO: Implement API call to fetch current RSS sources
  const fetchRssSources = async () => {
    // TODO: GET /api/rss-sources
    // const response = await fetch("http://127.0.0.1:8000/api/rss-sources");
    // const sources = await response.json();
    // setRssSources(sources);
    console.log("TODO: Fetch RSS sources from backend");
  };

  // TODO: Implement API call to add new RSS source
  const addRssSource = async (url) => {
    // TODO: POST /api/rss-sources
    // const response = await fetch("http://127.0.0.1:8000/api/rss-sources", {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ url: url })
    // });
    // if (response.ok) {
    //   setNewRssUrl("");
    //   fetchRssSources();
    //   fetchFeeds(); // Refresh feeds
    // }
    console.log("TODO: Add RSS source:", url);
  };

  // TODO: Implement API call to delete RSS source
  const deleteRssSource = async (id) => {
    // TODO: DELETE /api/rss-sources/{id}
    // const response = await fetch(`http://127.0.0.1:8000/api/rss-sources/${id}`, {
    //   method: 'DELETE'
    // });
    // if (response.ok) {
    //   fetchRssSources();
    //   fetchFeeds(); // Refresh feeds
    // }
    console.log("TODO: Delete RSS source:", id);
  };

  const fetchFeeds = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/feeds");
      const data = await response.json();
      setAllFeeds(data); // Store all feeds
      setFeeds(data); // Initially show all feeds
      setLoading(false);
      
      // Extract unique sources from feeds for filtering
      const sources = getUniqueSources(data);
      setRssSources(sources);
    } catch (err) {
      console.error("Error fetching feeds:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
    fetchRssSources(); // TODO: Uncomment when API is ready
  }, []);

  const handleAddRssSource = (e) => {
    e.preventDefault();
    if (newRssUrl.trim()) {
      addRssSource(newRssUrl.trim());
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
    
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setSelectedSources([]);
    setTimeFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setAppliedFilters({});
    setFeeds(allFeeds); // Reset to show all feeds
  };

  const handleSourceToggle = (sourceId) => {
    setSelectedSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const getFilterSummary = () => {
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
            className="filter-btn"
            onClick={() => setShowFilterModal(true)}
          >
            <span className="filter-icon">🔍</span>
            Filter
            {getFilterSummary() && (
              <span className="filter-badge">{getFilterSummary()}</span>
            )}
          </button>
          <button 
            className="manage-sources-btn"
            onClick={() => setShowManageModal(true)}
          >
            Manage RSS Sources
          </button>
        </div>
      </div>

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
                  <span className="publisher">{item.source}</span>
                  <span className="publish-time" title={item.published}>
                    {formatLocalTime(item.published)}
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Filter Articles</h2>
              <button 
                className="close-btn"
                onClick={() => setShowFilterModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="filter-section">
                <h3>Filter by Source</h3>
                <div className="sources-filter">
                  {rssSources.length === 0 ? (
                    <p className="no-sources">No RSS sources available.</p>
                  ) : (
                    <div className="checkbox-group">
                      {rssSources.map((source) => (
                        <label key={source.id} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedSources.includes(source.name)}
                            onChange={() => handleSourceToggle(source.name)}
                          />
                          <span className="checkmark"></span>
                          {source.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="filter-section">
                <h3>Filter by Time</h3>
                <div className="time-filter">
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="timeFilter"
                        value="all"
                        checked={timeFilter === "all"}
                        onChange={(e) => setTimeFilter(e.target.value)}
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
                        onChange={(e) => setTimeFilter(e.target.value)}
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
                        onChange={(e) => setTimeFilter(e.target.value)}
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
                        onChange={(e) => setTimeFilter(e.target.value)}
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
                        onChange={(e) => setTimeFilter(e.target.value)}
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
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </div>
                      <div className="date-input-group">
                        <label>End Date:</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="filter-actions">
                <button 
                  className="clear-filters-btn"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
                <button 
                  className="apply-filters-btn"
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                      <li key={source.id} className="source-item">
                        <span className="source-url">{source.name}</span>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteRssSource(source.id)}
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
