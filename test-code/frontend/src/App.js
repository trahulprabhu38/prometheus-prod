import React, { useState, useEffect } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState("idle");

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API}/api/logs`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  };

  const triggerEndpoint = async (path) => {
    setStatus(`Calling ${path}...`);
    try {
      const res = await fetch(`${API}${path}`);
      const data = await res.json();
      setStatus(`${path} -> ${res.status}: ${JSON.stringify(data).slice(0, 100)}`);
      fetchLogs();
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const runLoadTest = async () => {
    setStatus("Running load test (50 requests)...");
    const endpoints = [
      "/api/health",
      "/api/logs",
      "/api/simulate/error",
      "/api/simulate/warning",
      "/api/simulate/auth-fail",
      "/api/simulate/slow",
    ];
    for (let i = 0; i < 50; i++) {
      const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
      fetch(`${API}${ep}`).catch(() => {});
      await new Promise((r) => setTimeout(r, 100));
    }
    setStatus("Load test complete - check Kibana for results!");
    fetchLogs();
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const buttonStyle = {
    padding: "10px 20px",
    margin: "5px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#fff",
  };

  return (
    <div style={{ fontFamily: "monospace", padding: "20px", maxWidth: 900, margin: "auto", background: "#1a1a2e", color: "#eee", minHeight: "100vh" }}>
      <h1 style={{ color: "#00d4ff" }}>ELK Log Tester Dashboard</h1>
      <p style={{ color: "#888" }}>Generate different log types and view them in Kibana at <a href="http://localhost:5601" style={{ color: "#00d4ff" }}>localhost:5601</a></p>

      <div style={{ marginBottom: 20 }}>
        <h3 style={{ color: "#ffd700" }}>Trigger Log Events</h3>
        <button style={{ ...buttonStyle, background: "#28a745" }} onClick={() => triggerEndpoint("/api/health")}>Health Check (INFO)</button>
        <button style={{ ...buttonStyle, background: "#17a2b8" }} onClick={() => triggerEndpoint("/api/logs")}>Fetch Logs (INFO)</button>
        <button style={{ ...buttonStyle, background: "#dc3545" }} onClick={() => triggerEndpoint("/api/simulate/error")}>Simulate Error (ERROR)</button>
        <button style={{ ...buttonStyle, background: "#ffc107", color: "#000" }} onClick={() => triggerEndpoint("/api/simulate/warning")}>Simulate Warning (WARN)</button>
        <button style={{ ...buttonStyle, background: "#6f42c1" }} onClick={() => triggerEndpoint("/api/simulate/auth-fail")}>Auth Failure (SECURITY)</button>
        <button style={{ ...buttonStyle, background: "#fd7e14" }} onClick={() => triggerEndpoint("/api/simulate/slow")}>Slow Request (PERF)</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button style={{ ...buttonStyle, background: "#e83e8c", fontSize: 16, padding: "12px 30px" }} onClick={runLoadTest}>Run Load Test (50 requests)</button>
      </div>

      {status !== "idle" && (
        <div style={{ padding: 10, background: "#16213e", borderRadius: 6, marginBottom: 20, borderLeft: "4px solid #00d4ff" }}>
          <strong>Status:</strong> {status}
        </div>
      )}

      <h3 style={{ color: "#ffd700" }}>Recent Log Entries from MongoDB ({logs.length})</h3>
      <div style={{ maxHeight: 400, overflow: "auto" }}>
        {logs.map((log, i) => (
          <div key={i} style={{ padding: 8, margin: 4, background: "#16213e", borderRadius: 4, borderLeft: `4px solid ${log.level === "error" ? "#dc3545" : log.level === "warn" ? "#ffc107" : "#28a745"}` }}>
            <span style={{ color: log.level === "error" ? "#dc3545" : log.level === "warn" ? "#ffc107" : "#28a745" }}>[{log.level}]</span>{" "}
            <span style={{ color: "#888" }}>{new Date(log.timestamp).toLocaleTimeString()}</span>{" "}
            <span>{log.message}</span>{" "}
            <span style={{ color: "#666" }}>({log.source})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
