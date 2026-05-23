import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";

const categories = ["Electronics", "ID Card", "Keys", "Books", "Clothing", "Accessories", "Other"];
const adminStatusOptions = ["all", "pending", "approved", "rejected", "returned"];
const browseStatusOptions = ["all", "approved"];
const myPostStatusOptions = ["all", "pending", "approved", "rejected", "returned"];

const apiRequest = async (url, options = {}, token = "") => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : "Not set";

const getUploadUrl = (filename) =>
  filename ? `/uploads/${encodeURIComponent(filename)}` : "";

const initialReportForm = {
  item_name: "",
  category: categories[0],
  description: "",
  location: "",
  date: "",
  type: "lost"
};

function App() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem("lf_token") || "");
  const [user, setUser] = useState(null);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState("info");
  const [authView, setAuthView] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    status: "all",
    mine: "false"
  });
  const [reportForm, setReportForm] = useState(initialReportForm);
  const [reportImage, setReportImage] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [adminBusyId, setAdminBusyId] = useState("");

  const visibleItems = useMemo(() => items, [items]);
  const activeAdminItems = useMemo(
    () => items.filter((item) => item.status !== "returned"),
    [items]
  );

  const counts = useMemo(() => {
    return items.reduce(
      (result, item) => {
        result.total += 1;
        result[item.status] += 1;
        result[item.type] += 1;
        return result;
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        returned: 0,
        lost: 0,
        found: 0
      }
    );
  }, [items]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    const loadUser = async () => {
      try {
        const data = await apiRequest("/api/auth/me", {}, token);
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem("lf_token");
        setToken("");
        setUser(null);
      }
    };

    loadUser();
  }, [token]);

  useEffect(() => {
    const loadItems = async () => {
      setItemsLoading(true);

      const params = new URLSearchParams();

      if (filters.search) {
        params.set("search", filters.search);
      }

      if (filters.type !== "all") {
        params.set("type", filters.type);
      }

      if (filters.status !== "all") {
        params.set("status", filters.status);
      }

      if (filters.mine === "true" && token) {
        params.set("mine", "true");
      }

      try {
        const query = params.toString();
        const data = await apiRequest(`/api/items${query ? `?${query}` : ""}`, {}, token);
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        setNoticeTone("error");
        setNotice(error.message);
      } finally {
        setItemsLoading(false);
      }
    };

    loadItems();
  }, [filters, token]);

  const refreshItems = async () => {
    const params = new URLSearchParams();

    if (filters.search) {
      params.set("search", filters.search);
    }

    if (filters.type !== "all") {
      params.set("type", filters.type);
    }

    if (filters.status !== "all") {
      params.set("status", filters.status);
    }

    if (filters.mine === "true" && token) {
      params.set("mine", "true");
    }

    const query = params.toString();
    const data = await apiRequest(`/api/items${query ? `?${query}` : ""}`, {}, token);
    setItems(Array.isArray(data) ? data : []);
  };

  const saveSession = (payload) => {
    localStorage.setItem("lf_token", payload.token);
    setToken(payload.token);
    setUser(payload.user);
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthBusy(true);

    try {
      const endpoint = authView === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        authView === "login"
          ? {
              email: authForm.email,
              password: authForm.password
            }
          : {
              name: authForm.name,
              email: authForm.email,
              password: authForm.password
            };

      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body)
      });

      saveSession(data);
      setNoticeTone("success");
      setNotice(authView === "login" ? "Welcome back." : "Account created.");
      setAuthForm({
        name: "",
        email: "",
        password: ""
      });
      navigate(authView === "login" && data.user.role === "admin" ? "/admin" : "/browse");
    } catch (error) {
      setNoticeTone("error");
      setNotice(error.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("lf_token");
    setToken("");
    setUser(null);
    setEditingItem(null);
    setReportImage(null);
    setReportForm(initialReportForm);
    setFilters((current) => ({ ...current, mine: "false", status: "all" }));
    setNoticeTone("info");
    setNotice("You have been signed out.");
    navigate("/");
  };

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    setReportBusy(true);

    try {
      const formData = new FormData();

      Object.entries(reportForm).forEach(([key, value]) => formData.append(key, value));

      if (reportImage) {
        formData.append("image", reportImage);
      }

      await apiRequest(
        editingItem ? `/api/items/${editingItem._id}` : "/api/items",
        {
          method: editingItem ? "PUT" : "POST",
          body: formData
        },
        token
      );

      setReportForm(initialReportForm);
      setReportImage(null);
      setEditingItem(null);
      await refreshItems();
      setNoticeTone("success");
      setNotice(editingItem ? "Item updated and sent for review." : "Item submitted for review.");
      navigate("/browse");
    } catch (error) {
      setNoticeTone("error");
      setNotice(error.message);
    } finally {
      setReportBusy(false);
    }
  };

  const handleEditStart = (item) => {
    setEditingItem(item);
    setReportImage(null);
    setReportForm({
      item_name: item.item_name || "",
      category: item.category || categories[0],
      description: item.description || "",
      location: item.location || "",
      date: item.date ? new Date(item.date).toISOString().slice(0, 10) : "",
      type: item.type || "lost"
    });
    navigate("/report");
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setReportImage(null);
    setReportForm(initialReportForm);
    navigate("/browse");
  };

  const handlePrepareNewReport = () => {
    setEditingItem(null);
    setReportImage(null);
    setReportForm(initialReportForm);
  };

  const handleStatusUpdate = async (itemId, status) => {
    setAdminBusyId(`${itemId}:${status}`);

    try {
      await apiRequest(
        `/api/items/${itemId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status })
        },
        token
      );
      await refreshItems();
      setNoticeTone("success");
      setNotice(`Item marked as ${status}.`);
    } catch (error) {
      setNoticeTone("error");
      setNotice(error.message);
    } finally {
      setAdminBusyId("");
    }
  };

  const handleDelete = async (itemId) => {
    setAdminBusyId(`${itemId}:delete`);

    try {
      await apiRequest(
        `/api/items/${itemId}`,
        {
          method: "DELETE"
        },
        token
      );
      await refreshItems();
      setNoticeTone("success");
      setNotice("Item deleted.");
    } catch (error) {
      setNoticeTone("error");
      setNotice(error.message);
    } finally {
      setAdminBusyId("");
    }
  };

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">LF</span>
          <span>
            <strong>Hostel Desk</strong>
            <small>Lost and found, kept simple.</small>
          </span>
        </Link>

        <div className="topbar-actions">
          {user && (
            <div className="user-chip" aria-label="Current user">
              <strong>{user.name || "Signed in"}</strong>
              <span>{user.email}</span>
            </div>
          )}

          <nav className="nav">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/browse">Browse</NavLink>
            <NavLink to="/report" onClick={handlePrepareNewReport}>Report</NavLink>
            <NavLink to="/history">Returned History</NavLink>
            {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
            {!user ? (
              <NavLink to="/auth">Sign in</NavLink>
            ) : (
              <button className="ghost-button" type="button" onClick={handleLogout}>
                Log out
              </button>
            )}
          </nav>
        </div>
      </header>

      {notice && <div className={`notice ${noticeTone}`}>{notice}</div>}

      <Routes>
        <Route
          path="/"
          element={<HomePage counts={counts} onPrepareNewReport={handlePrepareNewReport} user={user} />}
        />
        <Route
          path="/browse"
          element={
            <BrowsePage
              filters={filters}
              items={visibleItems}
              loading={itemsLoading}
              onFilterChange={setFilters}
              onDelete={handleDelete}
              onEdit={handleEditStart}
              onStatusUpdate={handleStatusUpdate}
              busyId={adminBusyId}
              user={user}
            />
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute user={user}>
              <ReportPage
                form={reportForm}
                image={reportImage}
                busy={reportBusy}
                editingItem={editingItem}
                onCancelEdit={handleEditCancel}
                onFormChange={setReportForm}
                onImageChange={setReportImage}
                onSubmit={handleReportSubmit}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={<ReturnedHistoryPage token={token} user={user} />}
        />
        <Route
          path="/admin"
          element={
            <AdminRoute user={user}>
              <AdminPage
                counts={counts}
                items={activeAdminItems}
                busyId={adminBusyId}
                onDelete={handleDelete}
                onStatusUpdate={handleStatusUpdate}
              />
            </AdminRoute>
          }
        />
        <Route
          path="/auth"
          element={
            user ? (
              <Navigate to={user.role === "admin" ? "/admin" : "/browse"} replace />
            ) : (
              <AuthPage
                authForm={authForm}
                authView={authView}
                busy={authBusy}
                onSubmit={handleAuthSubmit}
                onToggleView={setAuthView}
                onFormChange={setAuthForm}
              />
            )
          }
        />
      </Routes>
    </div>
  );
}

function ReturnedHistoryPage({ token, user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("status", "returned");

      if (search) {
        params.set("search", search);
      }

      if (type !== "all") {
        params.set("type", type);
      }

      try {
        const data = await apiRequest(`/api/items?${params.toString()}`, {}, token);
        setItems(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [search, token, type]);

  return (
    <main className="page">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h1>Returned history</h1>
          </div>
          <p className="muted">View items that were already returned.</p>
        </div>

        <div className="filters">
          <input
            type="search"
            placeholder="Search returned items"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="all">All types</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>

          {user && (
            <div className="user-chip" aria-label="History note">
              <strong>History only</strong>
              <span>Returned items are shown here.</span>
            </div>
          )}
        </div>
      </section>

      <section className="card-grid">
        {loading ? (
          <div className="empty-panel">Loading returned items...</div>
        ) : items.length ? (
          items.map((item) => <ItemCard item={item} key={item._id} />)
        ) : (
          <div className="empty-panel">No returned items found.</div>
        )}
      </section>
    </main>
  );
}

function HomePage({ counts, onPrepareNewReport, user }) {
  return (
    <main className="page">
      <section className="hero">
        <div className="hero-copy">
          <h1>Lost and found for the hostel.</h1>
          <p className="hero-text">
            Students can post lost or found items, and admins can review them before they appear in
            the portal.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/browse">
              Browse items
            </Link>
            <Link className="secondary-button" onClick={user ? onPrepareNewReport : undefined} to={user ? "/report" : "/auth"}>
              {user ? "Report an item" : "Create account"}
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          <div className="metric-card warm">
            <span>Total posts</span>
            <strong>{counts.total}</strong>
          </div>
          <div className="metric-card">
            <span>Lost</span>
            <strong>{counts.lost}</strong>
          </div>
          <div className="metric-card">
            <span>Found</span>
            <strong>{counts.found}</strong>
          </div>
          <div className="metric-card cool">
            <span>Returned</span>
            <strong>{counts.returned}</strong>
          </div>
        </div>
      </section>

      <section className="section-grid">
        <article className="feature-card">
          <h2>Simple reporting</h2>
          <p>Add the item name, place, date, and a short description.</p>
        </article>
        <article className="feature-card">
          <h2>Admin review</h2>
          <p>Posts can be approved, rejected, marked returned, or removed.</p>
        </article>
        <article className="feature-card">
          <h2>Easy contact</h2>
          <p>Approved posts include the poster details so students can connect directly.</p>
        </article>
      </section>
    </main>
  );
}

function BrowsePage({ filters, items, loading, onFilterChange, onDelete, onEdit, onStatusUpdate, busyId, user }) {
  const statusOptions = user?.role === "admin"
    ? adminStatusOptions
    : filters.mine === "true"
      ? myPostStatusOptions
      : browseStatusOptions;

  return (
    <main className="page">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h1>Recent reports</h1>
          </div>
          <p className="muted">Search and filter the current list.</p>
        </div>

        <div className="filters">
          <input
            type="search"
            placeholder="Search item, location, or category"
            value={filters.search}
            onChange={(event) =>
              onFilterChange((current) => ({ ...current, search: event.target.value }))
            }
          />

          <select
            value={filters.type}
            onChange={(event) =>
              onFilterChange((current) => ({ ...current, type: event.target.value }))
            }
          >
            <option value="all">All types</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>

          <select
            value={filters.status}
            onChange={(event) =>
              onFilterChange((current) => ({ ...current, status: event.target.value }))
            }
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "all"
                  ? filters.mine === "true" || user?.role === "admin"
                    ? "All status"
                    : "Approved + returned"
                  : status}
              </option>
            ))}
          </select>

          {user && (
            <select
              value={filters.mine}
              onChange={(event) =>
                onFilterChange((current) => ({
                  ...current,
                  mine: event.target.value,
                  status:
                    event.target.value === "true" || user?.role === "admin"
                      ? current.status
                      : current.status === "pending" || current.status === "rejected"
                        ? "all"
                        : current.status
                }))
              }
            >
              <option value="false">All posts</option>
              <option value="true">My posts</option>
            </select>
          )}
        </div>
      </section>

      <section className="card-grid">
        {loading ? (
          <div className="empty-panel">Loading items...</div>
        ) : items.length ? (
          items.map((item) => (
            <ItemCard
              busyId={busyId}
              item={item}
              key={item._id}
              onDelete={onDelete}
              onEdit={onEdit}
              onStatusUpdate={onStatusUpdate}
              user={user}
            />
          ))
        ) : (
          <div className="empty-panel">No items match the current filters.</div>
        )}
      </section>
    </main>
  );
}

function ReportPage({ form, image, busy, editingItem, onCancelEdit, onFormChange, onImageChange, onSubmit }) {
  return (
    <main className="page narrow">
      <section className="panel form-panel">
        <div className="panel-head">
          <div>
            <h1>{editingItem ? "Edit your item" : "Add a lost or found item"}</h1>
          </div>
          <p className="muted">
            {editingItem ? "Update the details and send it back for review." : "Keep the details short and clear."}
          </p>
        </div>

        <form className="report-form" onSubmit={onSubmit}>
          <div className="field-grid">
            <label>
              <span>Item name</span>
              <input
                required
                type="text"
                value={form.item_name}
                onChange={(event) =>
                  onFormChange((current) => ({ ...current, item_name: event.target.value }))
                }
              />
            </label>

            <label>
              <span>Category</span>
              <select
                value={form.category}
                onChange={(event) =>
                  onFormChange((current) => ({ ...current, category: event.target.value }))
                }
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Type</span>
              <select
                value={form.type}
                onChange={(event) =>
                  onFormChange((current) => ({ ...current, type: event.target.value }))
                }
              >
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </label>

            <label>
              <span>Date</span>
              <input
                required
                type="date"
                value={form.date}
                onChange={(event) =>
                  onFormChange((current) => ({ ...current, date: event.target.value }))
                }
              />
            </label>
          </div>

          <label>
            <span>Location</span>
            <input
              required
              type="text"
              value={form.location}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, location: event.target.value }))
              }
            />
          </label>

          <label>
            <span>Description</span>
            <textarea
              required
              rows="5"
              value={form.description}
              onChange={(event) =>
                onFormChange((current) => ({ ...current, description: event.target.value }))
              }
            />
          </label>

          <label className="upload-field">
            <span>Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => onImageChange(event.target.files?.[0] || null)}
            />
            <small>{image ? image.name : editingItem?.image ? "Leave empty to keep current photo" : "Optional"}</small>
          </label>

          <div className="hero-actions">
            <button className="primary-button" disabled={busy} type="submit">
              {busy ? "Submitting..." : editingItem ? "Update item" : "Submit for review"}
            </button>
            {editingItem && (
              <button className="secondary-button" type="button" onClick={onCancelEdit}>
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}

function AdminPage({ counts, items, busyId, onDelete, onStatusUpdate }) {
  return (
    <main className="page">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h1>Moderation board</h1>
          </div>
          <p className="muted">Review and manage item posts.</p>
        </div>

        <div className="admin-metrics">
          <div className="metric-card">
            <span>Pending</span>
            <strong>{counts.pending}</strong>
          </div>
          <div className="metric-card">
            <span>Approved</span>
            <strong>{counts.approved}</strong>
          </div>
          <div className="metric-card">
            <span>Rejected</span>
            <strong>{counts.rejected}</strong>
          </div>
          <div className="metric-card cool">
            <span>Returned</span>
            <strong>{counts.returned}</strong>
          </div>
        </div>
      </section>

      <section className="admin-list">
        {items.length ? (
          items.map((item) => (
            <article className="admin-card" key={item._id}>
              {item.image ? (
                <a
                  className="image-link"
                  href={getUploadUrl(item.image)}
                  rel="noreferrer"
                  target="_blank"
                >
                  <img
                    alt={item.item_name}
                    className="admin-card-image"
                    src={getUploadUrl(item.image)}
                  />
                </a>
              ) : item.status !== "returned" ? (
                <div className="admin-card-image admin-card-placeholder">
                  {item.type === "lost" ? "Lost" : "Found"}
                </div>
              ) : null}

              <div className="admin-card-copy">
                <div className="tag-row">
                  <span className={`pill ${item.type}`}>{item.type}</span>
                  <span className={`pill status-${item.status}`}>{item.status}</span>
                </div>
                <h2>{item.item_name}</h2>
                <p>{item.description}</p>
                <div className="meta-line">
                  <span>{item.category}</span>
                  <span>{item.location}</span>
                  <span>{formatDate(item.date)}</span>
                </div>
                <div className="meta-line">
                  <span>{item.user_id?.name || "Unknown"}</span>
                  <span>{item.user_id?.email || "No email"}</span>
                </div>
              </div>

              <div className="admin-actions">
                <button
                  type="button"
                  disabled={item.status === "approved" || busyId === `${item._id}:approved`}
                  onClick={() => onStatusUpdate(item._id, "approved")}
                >
                  {item.status === "approved" ? "Approved" : "Approve"}
                </button>
                <button
                  type="button"
                  disabled={item.status === "rejected" || busyId === `${item._id}:rejected`}
                  onClick={() => onStatusUpdate(item._id, "rejected")}
                >
                  {item.status === "rejected" ? "Rejected" : "Reject"}
                </button>
                <button
                  type="button"
                  disabled={item.status === "returned" || busyId === `${item._id}:returned`}
                  onClick={() => onStatusUpdate(item._id, "returned")}
                >
                  {item.status === "returned" ? "Returned" : "Return"}
                </button>
                <button
                  className="danger-button"
                  type="button"
                  disabled={busyId === `${item._id}:delete`}
                  onClick={() => onDelete(item._id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-panel">No posts available yet.</div>
        )}
      </section>
    </main>
  );
}

function AuthPage({ authForm, authView, busy, onSubmit, onToggleView, onFormChange }) {
  return (
    <main className="page narrow">
      <section className="auth-shell">
        <div className="auth-copy">
          <h1>{authView === "login" ? "Sign in to continue" : "Create your account"}</h1>
          <p>{authView === "login" ? "Use your account to continue." : "Create your account to post items."}</p>
        </div>

        <div className="auth-card">
          <div className="switch-row">
            <button
              className={authView === "login" ? "tab active" : "tab"}
              type="button"
              onClick={() => onToggleView("login")}
            >
              Sign in
            </button>
            <button
              className={authView === "register" ? "tab active" : "tab"}
              type="button"
              onClick={() => onToggleView("register")}
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            {authView === "register" && (
              <label>
                <span>Name</span>
                <input
                  required
                  type="text"
                  value={authForm.name}
                  onChange={(event) =>
                    onFormChange((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
            )}

            <label>
              <span>Email</span>
              <input
                required
                type="email"
                value={authForm.email}
                onChange={(event) =>
                  onFormChange((current) => ({ ...current, email: event.target.value }))
                }
              />
            </label>

            <label>
              <span>Password</span>
              <input
                required
                type="password"
                value={authForm.password}
                onChange={(event) =>
                  onFormChange((current) => ({ ...current, password: event.target.value }))
                }
              />
            </label>

            <button className="primary-button" disabled={busy} type="submit">
              {busy ? "Please wait..." : authView === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function ItemCard({ busyId, item, onDelete, onEdit, onStatusUpdate, user }) {
  const imageUrl = getUploadUrl(item.image);
  const canContact = Boolean(item.user_id?.email);
  const isOwner = user && item.user_id?._id === user.id;
  const isAdmin = user?.role === "admin";
  const canManage = isAdmin || isOwner;

  return (
    <article className="item-card">
      {imageUrl ? (
        <a className="image-link" href={imageUrl} rel="noreferrer" target="_blank">
          <img alt={item.item_name} className="item-card-image" src={imageUrl} />
        </a>
      ) : item.status !== "returned" ? (
        <div className="item-card-placeholder">{item.type === "lost" ? "Lost" : "Found"}</div>
      ) : null}
      <div className="item-card-body">
        <div className="tag-row">
          <span className={`pill ${item.type}`}>{item.type}</span>
          <span className={`pill status-${item.status}`}>{item.status}</span>
        </div>
        <h2>{item.item_name}</h2>
        <p>{item.description}</p>
        <div className="meta-line">
          <span>{item.category}</span>
          <span>{item.location}</span>
        </div>
        <div className="meta-line">
          <span>{formatDate(item.date)}</span>
          <span>{item.user_id?.name || "Unknown"}</span>
        </div>
        {canContact && (
          <a className="contact-link" href={`mailto:${item.user_id.email}`}>
            Contact poster
          </a>
        )}
        {canManage && (
          <div className="admin-actions">
            {!isAdmin && (
              <button type="button" onClick={() => onEdit(item)}>
                Edit
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                disabled={item.status === "approved" || busyId === `${item._id}:approved`}
                onClick={() => onStatusUpdate(item._id, "approved")}
              >
                {item.status === "approved" ? "Approved" : "Approve"}
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                disabled={item.status === "rejected" || busyId === `${item._id}:rejected`}
                onClick={() => onStatusUpdate(item._id, "rejected")}
              >
                {item.status === "rejected" ? "Rejected" : "Reject"}
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                disabled={item.status === "returned" || busyId === `${item._id}:returned`}
                onClick={() => onStatusUpdate(item._id, "returned")}
              >
                {item.status === "returned" ? "Returned" : "Return"}
              </button>
            )}
            <button
              className="danger-button"
              type="button"
              disabled={busyId === `${item._id}:delete`}
              onClick={() => onDelete(item._id)}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function ProtectedRoute({ children, user }) {
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function AdminRoute({ children, user }) {
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/browse" replace />;
  }

  return children;
}

export default App;
