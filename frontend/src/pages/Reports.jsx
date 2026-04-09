import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import "./Reports.css";

const Reports = () => {
  const [report, setReport] = useState(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(false);

  const COLORS = ["#0d7d26ff", "#b91c1c"];
  const token = localStorage.getItem("token");

  const fetchReport = async (customStart = start, customEnd = end) => {
    try {
      setLoading(true);

      const params = {};
      if (customStart) params.start = customStart;
      if (customEnd) params.end = customEnd;

      const res = await axios.get("http://localhost:5001/api/reports", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });

      setReport(res.data);
    } catch (err) {
      console.error("Report fetch failed:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    const defaultStart = lastWeek.toISOString().split("T")[0];
    const defaultEnd = today.toISOString().split("T")[0];

    setStart(defaultStart);
    setEnd(defaultEnd);

    fetchReport(defaultStart, defaultEnd);
  }, []);

  const handleReset = async () => {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    const defaultStart = lastWeek.toISOString().split("T")[0];
    const defaultEnd = today.toISOString().split("T")[0];

    setStart(defaultStart);
    setEnd(defaultEnd);

    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5001/api/reports", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          start: defaultStart,
          end: defaultEnd,
        },
      });
      setReport(res.data);
      toast.success("Report reset successfully");
    } catch (err) {
      console.error("Report reset failed:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to reset reports");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) {
      toast.warning("No report data to export");
      return;
    }

    const rows = [
      ["Metric", "Value"],
      ["Total Revenue", report.totalRevenue || 0],
      ["Total Bookings", report.totalBookings || 0],
      ["Confirmed", report.confirmed || 0],
      ["Cancelled", report.cancelled || 0],
      [
        "Revenue Per Booking",
        report.totalBookings
          ? Math.round((report.totalRevenue || 0) / report.totalBookings)
          : 0,
      ],
      [],
      ["Daily Sales"],
      ["Date", "Sales"],
      ...((report.dailySales || []).map((item) => [item.date, item.sales])),
      [],
      ["Top Movies"],
      ["Title", "Bookings", "Revenue"],
      ...((report.topMovies || []).map((movie) => [
        movie.title,
        movie.bookings,
        movie.revenue,
      ])),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((row) => row.join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "cinemax-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV exported successfully");
  };

  const bookingStatusData = report
    ? [
        { name: "Confirmed", value: report.confirmed || 0 },
        { name: "Cancelled", value: report.cancelled || 0 },
      ]
    : [];

  const topMovie = useMemo(() => {
    if (!report?.topMovies?.length) return null;
    return report.topMovies[0];
  }, [report]);

  return (
    <div className="reports-page">
      <div className="reports-shell">
        <div className="reports-hero">
          <div className="reports-hero-text">
            <span className="reports-badge">Admin Analytics</span>
            <h1>Reports & Insights</h1>
            <p>
              Monitor revenue, bookings, trends, and top-performing movies in
              one cinematic dashboard.
            </p>
          </div>

          <div className="hero-mini-stats">
            <div className="hero-stat">
              <span>Total Revenue</span>
              <strong>
                Rs. {(report?.totalRevenue || 0).toLocaleString()}
              </strong>
            </div>
            <div className="hero-stat">
              <span>Bookings</span>
              <strong>{report?.totalBookings || 0}</strong>
            </div>
          </div>
        </div>

        <div className="filter-box">
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>

          <div className="filter-actions">
            <button className="apply-btn" onClick={() => fetchReport()}>
              Apply Filter
            </button>
            <button className="reset-btn" onClick={handleReset}>
              Reset
            </button>
            <button className="export-btn" onClick={handleExport}>
              <i className="fa-solid fa-download"></i> Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="report-loading">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <p>Generating report...</p>
          </div>
        ) : !report ? (
          <div className="report-empty">
            <i className="fa-solid fa-chart-line"></i>
            <h4>No Data Available</h4>
            <p>Try adjusting your filters or date range.</p>
          </div>
        ) : (
          <>
            <div className="report-cards">
              <div className="report-card revenue-card">
                <div className="card-top">
                  <span>Total Revenue</span>
                  <i className="fa-solid fa-sack-dollar" />
                </div>
                <h2>Rs. {(report.totalRevenue || 0).toLocaleString()}</h2>
                <p>Revenue generated from confirmed bookings.</p>
              </div>

              <div className="report-card bookings-card">
                <div className="card-top">
                  <span>Total Bookings</span>
                  <i className="fa-solid fa-ticket" />
                </div>
                <h2>{report.totalBookings || 0}</h2>
                <p>All bookings created in the selected period.</p>
              </div>

              <div className="report-card success-card">
                <div className="card-top">
                  <span>Confirmed</span>
                  <i className="fa-solid fa-circle-check" />
                </div>
                <h2 className="success-text">{report.confirmed || 0}</h2>
                <p>Successful paid reservations.</p>
              </div>

              <div className="report-card danger-card">
                <div className="card-top">
                  <span>Cancelled</span>
                  <i className="fa-solid fa-ban" />
                </div>
                <h2 className="danger-text">{report.cancelled || 0}</h2>
                <p>Bookings cancelled or expired.</p>
              </div>
            </div>

            <div className="highlights-grid">
              <div className="spotlight-card">
                <div className="spotlight-header">
                  <span>Top Performer</span>
                  <i className="fa-solid fa-crown" />
                </div>

                {topMovie ? (
                  <>
                    <h3>{topMovie.title}</h3>
                    <div className="spotlight-metrics">
                      <div>
                        <small>Bookings</small>
                        <strong>{topMovie.bookings}</strong>
                      </div>
                      <div>
                        <small>Revenue</small>
                        <strong>
                          Rs. {(topMovie.revenue || 0).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <p>No movie performance data available yet.</p>
                )}
              </div>

              <div className="mini-summary-card">
                <div className="mini-summary-item">
                  <span>Conversion Mix</span>
                  <strong>
                    {report.totalBookings
                      ? `${Math.round(
                          ((report.confirmed || 0) / report.totalBookings) * 100
                        )}% confirmed`
                      : "0% confirmed"}
                  </strong>
                </div>

                <div className="mini-summary-item">
                  <span>Cancellation Rate</span>
                  <strong>
                    {report.totalBookings
                      ? `${Math.round(
                          ((report.cancelled || 0) / report.totalBookings) * 100
                        )}% cancelled`
                      : "0% cancelled"}
                  </strong>
                </div>

                <div className="mini-summary-item">
                  <span>Revenue / Booking</span>
                  <strong>
                    {report.totalBookings
                      ? `Rs. ${Math.round(
                          (report.totalRevenue || 0) / report.totalBookings
                        ).toLocaleString()}`
                      : "Rs. 0"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="reports-grid">
              <div className="report-section">
                <div className="section-head">
                  <div>
                    <h3>Daily Sales Trend</h3>
                    <p>Revenue movement across the selected dates.</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={report.dailySales || []}>
                    <CartesianGrid stroke="#3b1118" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#d9b7bc" />
                    <YAxis stroke="#d9b7bc" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#dc2626"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Sales"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="report-section">
                <div className="section-head">
                  <div>
                    <h3>Booking Status</h3>
                    <p>Confirmed vs cancelled distribution.</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      innerRadius={55}
                      paddingAngle={4}
                      label
                    >
                      {bookingStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="report-section">
              <div className="section-head">
                <div>
                  <h3>Top Movies by Revenue</h3>
                  <p>Highest earning titles in the current range.</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={report.topMovies || []}>
                  <CartesianGrid stroke="#3b1118" strokeDasharray="3 3" />
                  <XAxis dataKey="title" stroke="#d9b7bc" />
                  <YAxis stroke="#d9b7bc" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    fill="#991b1b"
                    radius={[10, 10, 0, 0]}
                    name="Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="report-section">
              <div className="section-head">
                <div>
                  <h3>Leaderboard</h3>
                  <p>Movie rankings based on bookings and revenue.</p>
                </div>
              </div>

              {!report.topMovies || report.topMovies.length === 0 ? (
                <div className="report-empty">
                  <i className="fa-solid fa-film"></i>
                  <h4>No Movie Data Found</h4>
                  <p>No movie performance data found for this range.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="top-movies-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Movie</th>
                        <th>Bookings</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.topMovies.map((movie, index) => (
                        <tr key={`${movie.title}-${index}`}>
                          <td>
                            <span className="rank-pill">{index + 1}</span>
                          </td>
                          <td className="movie-title-cell">{movie.title}</td>
                          <td>{movie.bookings}</td>
                          <td>Rs. {(movie.revenue || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;