import { useEffect, useState } from "react";

function App() {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/feeds")  // FastAPI backend
      .then((res) => res.json())
      .then((data) => {
        setFeeds(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching feeds:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading feeds...</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Aggregated RSS Feeds</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {feeds.map((item, index) => (
          <li key={index} style={{ marginBottom: "15px" }}>
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              <strong>{item.title}</strong>
            </a>
            <div style={{ fontSize: "0.9em", color: "#666" }}>
              {item.source} — {item.published}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
