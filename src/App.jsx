import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BellRing,
  Cpu,
  Droplets,
  Gauge,
  RadioTower,
  ShieldCheck,
  Thermometer,
  Wifi,
  RefreshCw,
  LockKeyhole,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/$/,
  "",
);
const fmt = (d) => new Date(d).toLocaleString();
const num = (v, suffix) =>
  v == null ? "—" : `${Number(v).toFixed(1)}${suffix}`;
function Metric({ icon: Icon, title, value, sub, alert = false }) {
  return (
    <div className={"metric " + (alert ? "alert" : "")}>
      <div className="metric-top">
        <span>{title}</span>
        <Icon size={20} />
      </div>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}
export default function App() {
  const [key, setKey] = useState("");
  const [activeKey, setActiveKey] = useState("");
  const [data, setData] = useState({
    events: [],
    readings: [],
    latest: null,
    eventCount: 0,
    criticalCount: 0,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(null);
  async function load(k = activeKey) {
    if (!k) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/dashboard`, {
        headers: { "x-dashboard-key": k },
      });
      if (!r.ok)
        throw new Error(
          r.status === 401
            ? "Incorrect dashboard key"
            : `API error ${r.status}`,
        );
      const j = await r.json();
      setData(j);
      setError("");
      setUpdated(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!activeKey) return;
    load(activeKey);
    const id = setInterval(() => load(activeKey), 5000);
    return () => clearInterval(id);
  }, [activeKey]);
  const latest = data.latest;
  const events = data.events || [];
  const readings = [...(data.readings || [])].reverse();
  const danger =
    latest &&
    [
      "SOS EMERGENCY",
      "MOTION ALERT",
      "INTRUSION ALERT",
      "HIGH TEMP ALERT",
    ].includes(latest.status);
  const chart = readings.map((r) => ({
    time: new Date(r.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    temperature: r.temperature,
    humidity: r.humidity,
    distance: r.distance,
  }));
  if (!activeKey)
    return (
      <div className="login-wrap">
        <div className="login">
          <div className="brand">
            <ShieldCheck size={34} />
            <div>
              <b>AEGIS-X</b>
              <span>SECURE COMMAND CENTER</span>
            </div>
          </div>
          <LockKeyhole size={36} className="login-icon" />
          <h1>Operator Access</h1>
          <p>
            Enter the dashboard key from your backend <code>.env</code> file.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (key.trim()) setActiveKey(key.trim());
            }}
          >
            <input
              type="password"
              autoComplete="off"
              placeholder="Dashboard access key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
            <button type="submit">Open Command Center</button>
          </form>
          <small>Demo dashboard • Access key stays in this browser tab</small>
        </div>
      </div>
    );
  return (
    <div className="app">
      <aside>
        <div className="brand">
          <ShieldCheck size={34} />
          <div>
            <b>AEGIS-X</b>
            <span>COMMAND SYSTEM</span>
          </div>
        </div>
        <div className="side-label">OPERATIONS</div>
        <div className="nav active">
          <Activity size={18} /> Overview
        </div>
        <div className="nav">
          <RadioTower size={18} /> Station Alpha
        </div>
        <div className="nav">
          <BellRing size={18} /> Event Intelligence
        </div>
        <div className="side-bottom">
          <div className="online-dot" /> Dashboard connected{" "}
          <button
            onClick={() => {
              setActiveKey("");
              setKey("");
            }}
          >
            Lock
          </button>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <div className="eyebrow">LIVE MONITORING / STATION ALPHA</div>
            <h1>Command Overview</h1>
            <p>Real-time environmental and security telemetry</p>
          </div>
          <div className="header-right">
            <span className="live">
              <span className="online-dot" /> AUTO REFRESH · 5 SEC
            </span>
            <button className="refresh" onClick={() => load()}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </header>
        {error && (
          <div className="error">
            {error} — Check backend URL, MongoDB and dashboard key.
          </div>
        )}
        <div className={"status " + (danger ? "danger" : "safe")}>
          <div className="status-icon">
            {danger ? <AlertTriangle size={25} /> : <ShieldCheck size={25} />}
          </div>
          <div>
            <b>
              {latest ? latest.status || "MONITORING" : "AWAITING TELEMETRY"}
            </b>
            <span>
              {latest
                ? `Last sensor update: ${fmt(latest.createdAt)}`
                : "Events may arrive before sensor readings are enabled"}
            </span>
          </div>
          <div className="status-badge">
            {danger ? "ATTENTION" : "SYSTEM STATUS"}
          </div>
        </div>
        <section className="metrics">
          <Metric
            icon={Thermometer}
            title="TEMPERATURE"
            value={num(latest?.temperature, "°C")}
            sub="DHT22 sensor"
            alert={latest?.temperature >= 40}
          />
          <Metric
            icon={Droplets}
            title="HUMIDITY"
            value={num(latest?.humidity, "%")}
            sub="DHT22 sensor"
          />
          <Metric
            icon={Gauge}
            title="PROXIMITY"
            value={num(latest?.distance, " cm")}
            sub="HC-SR04 ultrasonic"
            alert={latest?.distance > 0 && latest.distance < 20}
          />
          <Metric
            icon={RadioTower}
            title="MOTION"
            value={latest ? (latest.motion ? "DETECTED" : "CLEAR") : "—"}
            sub="PIR motion sensor"
            alert={latest?.motion}
          />
        </section>
        <section className="two">
          <div className="panel">
            <div className="panel-title">
              <div>
                <h2>Environmental Telemetry</h2>
                <p>Temperature and humidity over time</p>
              </div>
              <Activity size={19} />
            </div>
            {chart.length ? (
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart}>
                    <CartesianGrid stroke="#24374b" strokeDasharray="4 4" />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: "#7892a9", fontSize: 11 }}
                      minTickGap={35}
                    />
                    <YAxis tick={{ fill: "#7892a9", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#12263a",
                        border: "1px solid #34516a",
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      name="Temp °C"
                      stroke="#32c9d7"
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="humidity"
                      name="Humidity %"
                      stroke="#e5b25d"
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty">
                No sensor readings yet. Enable /api/readings on ESP32.
              </div>
            )}
          </div>
          <div className="panel">
            <div className="panel-title">
              <div>
                <h2>Station Diagnostics</h2>
                <p>Current operating information</p>
              </div>
              <Cpu size={19} />
            </div>
            <div className="diag">
              <div>
                <span>Station</span>
                <b>{latest?.station || "STATION ALPHA"}</b>
              </div>
              <div>
                <span>Event records</span>
                <b>{data.eventCount}</b>
              </div>
              <div>
                <span>Critical alerts</span>
                <b>{data.criticalCount ?? 0}</b>
              </div>
              <div>
                <span>Last motion</span>
                <b>
                  {latest ? (latest.motion ? "Detected" : "Clear") : "Unknown"}
                </b>
              </div>
              <div>
                <span>Latest telemetry</span>
                <b>{latest ? fmt(latest.createdAt) : "Not received"}</b>
              </div>
              <div>
                <span>Dashboard API</span>
                <b className={error ? "bad" : "good"}>
                  {error ? "Error" : "Connected"}
                </b>
              </div>
              <div>
                <span>Last refresh</span>
                <b>{updated ? updated.toLocaleTimeString() : "—"}</b>
              </div>
            </div>
          </div>
        </section>
        <section className="panel events">
          <div className="panel-title">
            <div>
              <h2>Security Event Log</h2>
              <p>Latest device-generated alerts, newest first</p>
            </div>
            <BellRing size={19} />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>TIME</th>
                  <th>EVENT</th>
                  <th>MESSAGE</th>
                  <th>SEVERITY</th>
                </tr>
              </thead>
              <tbody>
                {events.length ? (
                  events.map((e) => (
                    <tr key={e._id}>
                      <td>{fmt(e.createdAt)}</td>
                      <td>
                        <b>{e.type}</b>
                      </td>
                      <td>{e.message}</td>
                      <td>
                        <span className={"pill " + e.severity}>
                          {e.severity}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty">
                      No events received yet. Press SOS or trigger a sensor in
                      Wokwi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <footer>
          AEGIS-X · IoT monitoring simulation ·{" "}
          {loading ? "Syncing…" : "Monitoring active"}
        </footer>
      </main>
    </div>
  );
}
