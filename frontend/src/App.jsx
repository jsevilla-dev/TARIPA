import { useEffect, useState } from "react";
import "./App.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: "DB" },
  { id: "tenants", label: "Tenants", icon: "TN" },
  { id: "rooms", label: "Rooms", icon: "RM" },
  { id: "meters", label: "Meter Readings", icon: "MR" },
  { id: "rates", label: "Utility Rates", icon: "UR" },
  { id: "billing", label: "Billing", icon: "BL" },
  { id: "reports", label: "Reports", icon: "RP" },
];

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setBackendStatus("Connected");
        } else {
          setBackendStatus("Database connection failed");
        }
      })
      .catch(() => {
        setBackendStatus("Backend unavailable");
      });
  }, []);

  const activeItem = navigationItems.find(
    (item) => item.id === activePage
  );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed((current) => !current)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? "-" : "+"}
        </button>

        <div className="brand">
          <div className="brand-mark">T</div>

          <div>
            <strong>TARIPA</strong>
            <span>Utility Management</span>
          </div>
        </div>

        <nav className="navigation">
          <p className="nav-label">MAIN MENU</p>

          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${activePage === item.id ? "active" : ""
                }`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-icon">
                {item.label.charAt(0)}
              </span>

              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div
            className={`connection-indicator ${backendStatus === "Connected" ? "online" : ""
              }`}
          ></div>

          <div>
            <strong>System Status</strong>
            <span>{backendStatus}</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
          </div>


        </header>

        {activePage === "dashboard" ? (
          <Dashboard />
        ) : activePage === "tenants" ? (
          <TenantsPage />
        ) : activePage === "rooms" ? (
          <RoomsPage />
        ) : activePage === "meters" ? (
          <MeterReadingsPage />
        ) : activePage === "rates" ? (
          <UtilityRatesPage />
        ) : activePage === "billing" ? (
          <BillingPage />
        ) : activePage === "reports" ? (
          <ReportsPage />
        ) : (
          <section className="page-placeholder">
            <div className="placeholder-icon">
              {activeItem?.label.charAt(0)}
            </div>

            <p className="eyebrow">MODULE</p>

            <h2>{activeItem?.label}</h2>

            <p>
              This module is ready for the next development
              stage.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setDashboardData(data.data);
        }
      })
      .catch((error) => {
        console.error("Failed to load dashboard data:", error);
      });
  }, []);

  return (
    <div className="dashboard">
      <section className="welcome-card dashboard-hero">
        <div>
          <p className="eyebrow">DASHBOARD OVERVIEW</p>

          <h2>Welcome to TARIPA</h2>

          <p>
            Automated residential utility tracking and billing
            management.
          </p>
        </div>

        <div className="dashboard-hero-mark">T</div>
      </section>

      <section className="stat-grid">
        <div className="stat-card dashboard-stat">
          <div className="stat-icon tenants-icon">TN</div>

          <div>
            <span className="stat-label">TENANTS</span>

            <strong>
              {dashboardData?.total_tenants ?? 0}
            </strong>

            <small>Active tenants</small>
          </div>
        </div>

        <div className="stat-card dashboard-stat">
          <div className="stat-icon rooms-icon">RM</div>

          <div>
            <span className="stat-label">ROOMS</span>

            <strong>
              {dashboardData?.total_rooms ?? 0}
            </strong>

            <small>
              {dashboardData?.available_rooms ?? 0} room available
            </small>
          </div>
        </div>

        <div className="stat-card dashboard-stat">
          <div className="stat-icon billing-icon">BL</div>

          <div>
            <span className="stat-label">PENDING BILLS</span>

            <strong>
              {dashboardData?.pending_bills ?? 0}
            </strong>

            <small>Awaiting payment</small>
          </div>
        </div>

        <div className="stat-card dashboard-stat">
          <div className="stat-icon outstanding-icon">PHP</div>

          <div>
            <span className="stat-label">OUTSTANDING</span>

            <strong>
              {formatCurrency(
                dashboardData?.outstanding_amount ?? 0
              )}
            </strong>

            <small>Pending and overdue bills</small>
          </div>
        </div>
      </section>

      <section className="dashboard-section-header">
        <div>
          <p className="eyebrow">CORE MODULES</p>

          <h3>Manage your utility operations</h3>
        </div>

        <p>Everything you need for residential billing.</p>
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <div className="feature-top">
            <span className="feature-number">01</span>

            <span className="feature-icon">TN</span>
          </div>

          <h3>Tenant Management</h3>

          <p>
            Manage tenant profiles, room assignments, and status.
          </p>
        </article>

        <article className="feature-card">
          <div className="feature-top">
            <span className="feature-number">02</span>

            <span className="feature-icon">MR</span>
          </div>

          <h3>Utility Tracking</h3>

          <p>
            Record electricity and water readings for each billing
            period.
          </p>
        </article>

        <article className="feature-card">
          <div className="feature-top">
            <span className="feature-number">03</span>

            <span className="feature-icon">BL</span>
          </div>

          <h3>Automated Billing</h3>

          <p>
            Calculate utility charges using the applicable rates.
          </p>
        </article>

        <article className="feature-card">
          <div className="feature-top">
            <span className="feature-number">04</span>

            <span className="feature-icon">RP</span>
          </div>

          <h3>Reports</h3>

          <p>
            Search and review utility usage and billing records.
          </p>
        </article>
      </section>
    </div>
  );
}

function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    contact_number: "",
    room_id: "",
    move_in_date: "",
    status: "Active",
  });

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTenants = () => {
    fetch("/api/tenants")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setTenants(data.data);
        }
      })
      .catch((error) => {
        console.error("Failed to load tenants:", error);
      });
  };

  const loadRooms = () => {
    fetch("/api/rooms")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setRooms(data.data);
        }
      })
      .catch((error) => {
        console.error("Failed to load rooms:", error);
      });
  };

  useEffect(() => {
    loadTenants();
    loadRooms();
  }, []);

  const resetForm = () => {
    setFormData({
      full_name: "",
      contact_number: "",
      room_id: "",
      move_in_date: "",
      status: "Active",
    });

    setFormError("");
    setFormSuccess("");
  };

  const openAddForm = () => {
    setEditingTenant(null);
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (tenant) => {
    setEditingTenant(tenant);

    setFormData({
      full_name: tenant.full_name || "",
      contact_number: tenant.contact_number || "",
      room_id: tenant.room_id ? String(tenant.room_id) : "",
      move_in_date: tenant.move_in_date
        ? tenant.move_in_date.substring(0, 10)
        : "",
      status: tenant.status || "Active",
    });

    setFormError("");
    setFormSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTenant(null);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
    setFormSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setFormSuccess("");

    if (!formData.full_name.trim()) {
      setFormError("Full name is required.");
      return;
    }

    if (!formData.move_in_date) {
      setFormError("Move-in date is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const isEditing = Boolean(editingTenant);

      const url = isEditing
        ? `/api/tenants/${editingTenant.id}`
        : "/api/tenants";

      const method = isEditing ? "PUT" : "POST";

      const body = {
        full_name: formData.full_name.trim(),
        contact_number: formData.contact_number.trim(),
        room_id: formData.room_id || null,
        move_in_date: formData.move_in_date,
        status: formData.status,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setFormError(
          data.message ||
            `Failed to ${isEditing ? "update" : "create"} tenant.`
        );
        return;
      }

      setFormSuccess(
        isEditing
          ? "Tenant updated successfully."
          : "Tenant added successfully."
      );

      loadTenants();
      loadRooms();

      setTimeout(() => {
        closeForm();
      }, 800);
    } catch (error) {
      console.error("Failed to save tenant:", error);

      setFormError("Unable to connect to the backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="tenants-page">
      <div className="module-header">
        <div>
          <p className="eyebrow">TENANT MANAGEMENT</p>

          <h2>Tenants</h2>

          <p>
            Manage tenant profiles, room assignments, and account status.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAddForm}
        >
          + Add Tenant
        </button>
      </div>

      {showForm && (
        <div className="tenant-form-card">
          <div className="form-header">
            <div>
              <h3>
                {editingTenant ? "Edit Tenant" : "Add Tenant"}
              </h3>
            </div>

            <button
              type="button"
              className="close-button"
              onClick={closeForm}
            >
              X
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                <span>FULL NAME</span>

                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
              </label>

              <label>
                <span>CONTACT NUMBER</span>

                <input
                  type="text"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  placeholder="Enter contact number"
                />
              </label>

              <label>
                <span>ROOM</span>

                <select
                  name="room_id"
                  value={formData.room_id}
                  onChange={handleChange}
                >
                  <option value="">No room assigned</option>

                  {rooms.map((room) => {
                    const isCurrentRoom =
                      editingTenant &&
                      Number(formData.room_id) === Number(room.id);

                    const isFull =
                      Number(room.occupied_count) >=
                        Number(room.capacity) &&
                      !isCurrentRoom;

                    return (
                      <option
                        key={room.id}
                        value={room.id}
                        disabled={isFull}
                      >
                        Room {room.room_number} - {room.occupied_count}/
                        {room.capacity}
                        {isFull ? " (Full)" : ""}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label>
                <span>MOVE-IN DATE</span>

                <input
                  type="date"
                  name="move_in_date"
                  value={formData.move_in_date}
                  onChange={handleChange}
                />
              </label>

              {editingTenant && (
                <label>
                  <span>STATUS</span>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
              )}
            </div>

            {formError && (
              <div className="form-message error">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="form-message success">
                {formSuccess}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : editingTenant
                    ? "Update Tenant"
                    : "Save Tenant"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="tenant-list">
        {tenants.length === 0 ? (
          <div className="empty-state">
            <h3>No tenant records found</h3>

            <p>
              Tenant records will appear here once they are added.
            </p>
          </div>
        ) : (
          tenants.map((tenant) => (
            <article className="tenant-card" key={tenant.id}>
              <div className="tenant-main">
                <div className="tenant-avatar">
                  {tenant.full_name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <strong>{tenant.full_name}</strong>

                  <p>
                    {tenant.contact_number || "No contact number"}
                  </p>
                </div>
              </div>

              <div className="tenant-details">
                <div>
                  <span>ROOM</span>

                  <strong>
                    {tenant.room_number || "Unassigned"}
                  </strong>
                </div>

                <div>
                  <span>MOVE-IN DATE</span>

                  <strong>
                    {tenant.move_in_date.substring(0, 10)}
                  </strong>
                </div>

                <div>
                  <span>STATUS</span>

                  <strong
                    className={`tenant-status ${
                      tenant.status === "Active"
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {tenant.status}
                  </strong>
                </div>

                <button
                  type="button"
                  className="edit-button"
                  onClick={() => openEditForm(tenant)}
                >
                  Edit
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    room_number: "",
    capacity: "",
  });

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRooms = () => {
    fetch("/api/rooms")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setRooms(data.data);
        }
      })
      .catch((error) => {
        console.error("Failed to load rooms:", error);
      });
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
    setFormSuccess("");
  };

  const closeForm = () => {
    setShowForm(false);

    setFormData({
      room_number: "",
      capacity: "",
    });

    setFormError("");
    setFormSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setFormSuccess("");

    const roomNumber = formData.room_number.trim();
    const capacity = Number(formData.capacity);

    if (!roomNumber) {
      setFormError("Room number is required.");
      return;
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
      setFormError(
        "Capacity must be a positive whole number."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_number: roomNumber,
          capacity,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setFormError(
          data.message || "Failed to create room."
        );
        return;
      }

      setFormSuccess("Room added successfully.");

      setFormData({
        room_number: "",
        capacity: "",
      });

      loadRooms();

      setTimeout(() => {
        closeForm();
      }, 800);
    } catch (error) {
      console.error("Failed to create room:", error);

      setFormError("Unable to connect to the backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="tenants-page">
      <div className="module-header">
        <div>
          <p className="eyebrow">ROOM MANAGEMENT</p>

          <h2>Rooms</h2>

          <p>
            Manage residential rooms and monitor current occupancy.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setShowForm(true);
            setFormError("");
            setFormSuccess("");
          }}
        >
          + Add Room
        </button>
      </div>

      {showForm && (
        <div className="tenant-form-card">
          <div className="form-header">
            <div>
              <p className="eyebrow">NEW ROOM</p>

              <h3>Add Room</h3>
            </div>

            <button
              type="button"
              className="close-button"
              onClick={closeForm}
            >
              X
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                <span>ROOM NUMBER</span>

                <input
                  type="text"
                  name="room_number"
                  value={formData.room_number}
                  onChange={handleChange}
                  placeholder="e.g. 102"
                />
              </label>

              <label>
                <span>CAPACITY</span>

                <input
                  type="number"
                  name="capacity"
                  min="1"
                  step="1"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="e.g. 2"
                />
              </label>
            </div>

            {formError && (
              <div className="form-message error">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="form-message success">
                {formSuccess}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Room"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="tenant-list">
        {rooms.length === 0 ? (
          <div className="empty-state">
            <h3>No room records found</h3>

            <p>
              Room records will appear here once they are added.
            </p>
          </div>
        ) : (
          rooms.map((room) => {
            const occupied = Number(room.occupied_count);
            const capacity = Number(room.capacity);
            const available = Math.max(
              capacity - occupied,
              0
            );
            const isFull = occupied >= capacity;

            return (
              <article className="tenant-card" key={room.id}>
                <div className="tenant-main">
                  <div className="tenant-avatar">R</div>

                  <div>
                    <strong>Room {room.room_number}</strong>

                    <p>Residential room</p>
                  </div>
                </div>

                <div className="tenant-details">
                  <div>
                    <span>CAPACITY</span>

                    <strong>
                      {capacity} tenant
                      {capacity !== 1 ? "s" : ""}
                    </strong>
                  </div>

                  <div>
                    <span>OCCUPIED</span>

                    <strong>
                      {occupied} / {capacity}
                    </strong>
                  </div>

                  <div>
                    <span>AVAILABLE</span>

                    <strong
                      className={`tenant-status ${isFull ? "inactive" : "active"
                        }`}
                    >
                      {available}
                    </strong>
                  </div>

                  <div>
                    <span>STATUS</span>

                    <strong
                      className={`tenant-status ${isFull ? "inactive" : "active"
                        }`}
                    >
                      {isFull ? "Full" : "Available"}
                    </strong>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function MeterReadingsPage() {
  const [readings, setReadings] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingReading, setEditingReading] = useState(null);

  const [formData, setFormData] = useState({
    tenant_id: "",
    billing_month: "",
    electricity_previous: "",
    electricity_current: "",
    water_previous: "",
    water_current: "",
  });

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReadings = () => {
    fetch("/api/meter-readings")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setReadings(data.data);
        }
      })
      .catch((error) => {
        console.error(
          "Failed to load meter readings:",
          error
        );
      });
  };

  const loadTenants = () => {
    fetch("/api/tenants")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setTenants(
            data.data.filter(
              (tenant) => tenant.status === "Active"
            )
          );
        }
      })
      .catch((error) => {
        console.error(
          "Failed to load tenants:",
          error
        );
      });
  };

  useEffect(() => {
    loadReadings();
    loadTenants();
  }, []);

  const resetForm = () => {
    setFormData({
      tenant_id: "",
      billing_month: "",
      electricity_previous: "",
      electricity_current: "",
      water_previous: "",
      water_current: "",
    });

    setFormError("");
    setFormSuccess("");
  };

  const openAddForm = () => {
    setEditingReading(null);
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (reading) => {
    setEditingReading(reading);

    setFormData({
      tenant_id: String(reading.tenant_id),
      billing_month: reading.billing_month
        ? reading.billing_month.substring(0, 10)
        : "",
      electricity_previous:
        reading.electricity_previous ?? "",
      electricity_current:
        reading.electricity_current ?? "",
      water_previous:
        reading.water_previous ?? "",
      water_current:
        reading.water_current ?? "",
    });

    setFormError("");
    setFormSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingReading(null);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
    setFormSuccess("");
  };

  const electricityConsumption =
    formData.electricity_previous !== "" &&
      formData.electricity_current !== ""
      ? Number(formData.electricity_current) -
      Number(formData.electricity_previous)
      : null;

  const waterConsumption =
    formData.water_previous !== "" &&
      formData.water_current !== ""
      ? Number(formData.water_current) -
      Number(formData.water_previous)
      : null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setFormSuccess("");

    if (!formData.tenant_id) {
      setFormError("Tenant is required.");
      return;
    }

    if (!formData.billing_month) {
      setFormError("Billing month is required.");
      return;
    }

    const electricityPrevious = Number(
      formData.electricity_previous
    );

    const electricityCurrent = Number(
      formData.electricity_current
    );

    const waterPrevious = Number(
      formData.water_previous
    );

    const waterCurrent = Number(
      formData.water_current
    );

    const values = [
      electricityPrevious,
      electricityCurrent,
      waterPrevious,
      waterCurrent,
    ];

    if (
      values.some(
        (value) => Number.isNaN(value) || value < 0
      )
    ) {
      setFormError(
        "All meter readings must be non-negative numbers."
      );
      return;
    }

    if (electricityCurrent < electricityPrevious) {
      setFormError(
        "Current electricity reading cannot be lower than the previous reading."
      );
      return;
    }

    if (waterCurrent < waterPrevious) {
      setFormError(
        "Current water reading cannot be lower than the previous reading."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const isEditing = Boolean(editingReading);

      const url = isEditing
        ? `/api/meter-readings/${editingReading.id}`
        : "/api/meter-readings";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: Number(formData.tenant_id),
          billing_month: formData.billing_month,
          electricity_previous: electricityPrevious,
          electricity_current: electricityCurrent,
          water_previous: waterPrevious,
          water_current: waterCurrent,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setFormError(
          data.message ||
          `Failed to ${isEditing ? "update" : "record"
          } meter reading.`
        );
        return;
      }

      setFormSuccess(
        isEditing
          ? "Meter reading updated successfully."
          : "Meter reading recorded successfully."
      );

      loadReadings();

      setTimeout(() => {
        closeForm();
      }, 800);
    } catch (error) {
      console.error(
        "Failed to save meter reading:",
        error
      );

      setFormError(
        "Unable to connect to the backend."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reading) => {
    const confirmed = window.confirm(
      `Delete the meter reading for ${reading.full_name} for ${reading.billing_month.substring(
        0,
        7
      )}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/meter-readings/${reading.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        window.alert(
          data.message || "Failed to delete meter reading."
        );
        return;
      }

      loadReadings();
    } catch (error) {
      console.error(
        "Failed to delete meter reading:",
        error
      );

      window.alert(
        "Unable to connect to the backend."
      );
    }
  };

  return (
    <section className="tenants-page">
      <div className="module-header">
        <div>
          <p className="eyebrow">UTILITY TRACKING</p>

          <h2>Meter Readings</h2>

          <p>
            Record electricity and water readings for each billing
            period.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAddForm}
        >
          + Add Reading
        </button>
      </div>

      {showForm && (
        <div className="tenant-form-card">
          <div className="form-header">
            <div>
              <p className="eyebrow">
                {editingReading
                  ? "EDIT METER READING"
                  : "NEW METER READING"}
              </p>

              <h3>
                {editingReading
                  ? "Edit Meter Reading"
                  : "Add Meter Reading"}
              </h3>
            </div>

            <button
              type="button"
              className="close-button"
              onClick={closeForm}
            >
              +
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                <span>TENANT</span>

                <select
                  name="tenant_id"
                  value={formData.tenant_id}
                  onChange={handleChange}
                >
                  <option value="">
                    Select active tenant
                  </option>

                  {tenants.map((tenant) => (
                    <option
                      key={tenant.id}
                      value={tenant.id}
                    >
                      {tenant.full_name}
                      {tenant.room_number
                        ? ` - Room ${tenant.room_number}`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>BILLING MONTH</span>

                <input
                  type="month"
                  name="billing_month"
                  value={
                    formData.billing_month
                      ? formData.billing_month.substring(0, 7)
                      : ""
                  }
                  onChange={(event) => {
                    const value = event.target.value;

                    setFormData((current) => ({
                      ...current,
                      billing_month: value
                        ? `${value}-01`
                        : "",
                    }));

                    setFormError("");
                    setFormSuccess("");
                  }}
                />
              </label>

              <label>
                <span>ELECTRICITY PREVIOUS</span>

                <input
                  type="number"
                  name="electricity_previous"
                  min="0"
                  step="0.001"
                  value={formData.electricity_previous}
                  onChange={handleChange}
                  placeholder="e.g. 1250"
                />
              </label>

              <label>
                <span>ELECTRICITY CURRENT</span>

                <input
                  type="number"
                  name="electricity_current"
                  min="0"
                  step="0.001"
                  value={formData.electricity_current}
                  onChange={handleChange}
                  placeholder="e.g. 1375"
                />
              </label>

              <label>
                <span>WATER PREVIOUS</span>

                <input
                  type="number"
                  name="water_previous"
                  min="0"
                  step="0.001"
                  value={formData.water_previous}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                />
              </label>

              <label>
                <span>WATER CURRENT</span>

                <input
                  type="number"
                  name="water_current"
                  min="0"
                  step="0.001"
                  value={formData.water_current}
                  onChange={handleChange}
                  placeholder="e.g. 520"
                />
              </label>
            </div>

            <div className="form-grid">
              <div className="stat-card">
                <span className="stat-label">
                  ELECTRICITY CONSUMPTION
                </span>

                <strong>
                  {electricityConsumption !== null &&
                    !Number.isNaN(electricityConsumption)
                    ? `${electricityConsumption.toFixed(3)} kWh`
                    : "-"}
                </strong>

                <small>
                  Current minus previous reading
                </small>
              </div>

              <div className="stat-card">
                <span className="stat-label">
                  WATER CONSUMPTION
                </span>

                <strong>
                  {waterConsumption !== null &&
                    !Number.isNaN(waterConsumption)
                    ? `${waterConsumption.toFixed(3)} m3`
                    : "-"}
                </strong>

                <small>
                  Current minus previous reading
                </small>
              </div>
            </div>

            {formError && (
              <div className="form-message error">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="form-message success">
                {formSuccess}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : editingReading
                    ? "Update Reading"
                    : "Save Reading"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="tenant-list">
        {readings.length === 0 ? (
          <div className="empty-state">
            <h3>No meter readings found</h3>

            <p>
              Meter readings will appear here once they are
              recorded.
            </p>
          </div>
        ) : (
          readings.map((reading) => (
            <article
              className="tenant-card"
              key={reading.id}
            >
              <div className="tenant-main">
                <div className="tenant-avatar">
                  {reading.full_name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <strong>{reading.full_name}</strong>

                  <p>
                    {reading.room_number
                      ? `Room ${reading.room_number}`
                      : "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="tenant-details">
                <div>
                  <span>BILLING MONTH</span>

                  <strong>
                    {reading.billing_month.substring(0, 7)}
                  </strong>
                </div>

                <div>
                  <span>ELECTRICITY</span>

                  <strong>
                    {Number(
                      reading.electricity_consumption
                    ).toFixed(3)}{" "}
                    kWh
                  </strong>
                </div>

                <div>
                  <span>WATER</span>

                  <strong>
                    {Number(
                      reading.water_consumption
                    ).toFixed(3)}{" "}
                    m3
                  </strong>
                </div>

                <div className="tenant-actions">
                  <button
                    type="button"
                    className="edit-button"
                    onClick={() =>
                      openEditForm(reading)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() =>
                      handleDelete(reading)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}



function BillingPage() {
  const [billingRecords, setBillingRecords] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    tenant_id: "",
    billing_month: "",
  });

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBillingRecords = () => {
    fetch("/api/billing")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setBillingRecords(data.data);
        }
      })
      .catch((error) => {
        console.error(
          "Failed to load billing records:",
          error
        );
      });
  };

  const loadTenants = () => {
    fetch("/api/tenants")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setTenants(
            data.data.filter(
              (tenant) => tenant.status === "Active"
            )
          );
        }
      })
      .catch((error) => {
        console.error(
          "Failed to load tenants:",
          error
        );
      });
  };

  useEffect(() => {
    loadBillingRecords();
    loadTenants();
  }, []);

  const resetForm = () => {
    setFormData({
      tenant_id: "",
      billing_month: "",
    });

    setFormError("");
    setFormSuccess("");
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
    setFormSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setFormSuccess("");

    if (!formData.tenant_id) {
      setFormError("Tenant is required.");
      return;
    }

    if (!formData.billing_month) {
      setFormError("Billing month is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/billing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: Number(formData.tenant_id),
          billing_month: `${formData.billing_month}-01`,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setFormError(
          data.message || "Failed to generate bill."
        );
        return;
      }

      setFormSuccess(
        "Billing record generated successfully."
      );

      loadBillingRecords();

      setTimeout(() => {
        closeForm();
      }, 800);
    } catch (error) {
      console.error(
        "Failed to generate billing record:",
        error
      );

      setFormError(
        "Unable to connect to the backend."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (billing, status) => {
    try {
      const response = await fetch(
        `/api/billing/${billing.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        window.alert(
          data.message ||
          "Failed to update billing status."
        );
        return;
      }

      loadBillingRecords();
    } catch (error) {
      console.error(
        "Failed to update billing status:",
        error
      );

      window.alert(
        "Unable to connect to the backend."
      );
    }
  };

  const handleDelete = async (billing) => {
    const confirmed = window.confirm(
      `Delete the billing record for ${billing.full_name} for ${billing.billing_month.substring(
        0,
        7
      )}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/billing/${billing.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        window.alert(
          data.message ||
          "Failed to delete billing record."
        );
        return;
      }

      loadBillingRecords();
    } catch (error) {
      console.error(
        "Failed to delete billing record:",
        error
      );

      window.alert(
        "Unable to connect to the backend."
      );
    }
  };

  return (
    <section className="tenants-page">
      <div className="module-header">
        <div>
          <p className="eyebrow">BILLING MANAGEMENT</p>

          <h2>Billing</h2>

          <p>
            Generate bills from meter readings and manage
            payment status.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAddForm}
        >
          + Generate Bill
        </button>
      </div>

      {showForm && (
        <div className="tenant-form-card">
          <div className="form-header">
            <div>
              <p className="eyebrow">NEW BILLING RECORD</p>

              <h3>Generate Bill</h3>
            </div>

            <button
              type="button"
              className="close-button"
              onClick={closeForm}
            >
		X
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                <span>TENANT</span>

                <select
                  name="tenant_id"
                  value={formData.tenant_id}
                  onChange={handleChange}
                >
                  <option value="">
                    Select active tenant
                  </option>

                  {tenants.map((tenant) => (
                    <option
                      key={tenant.id}
                      value={tenant.id}
                    >
                      {tenant.full_name}
                      {tenant.room_number
                        ? ` - Room ${tenant.room_number}`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>BILLING MONTH</span>

                <input
                  type="month"
                  name="billing_month"
                  value={formData.billing_month}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div className="form-message">
              The system will calculate electricity and
              water charges using the meter reading and
              applicable utility rates.
            </div>

            {formError && (
              <div className="form-message error">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="form-message success">
                {formSuccess}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Generating..."
                  : "Generate Bill"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="tenant-list">
        {billingRecords.length === 0 ? (
          <div className="empty-state">
            <h3>No billing records found</h3>

            <p>
              Billing records will appear here once bills
              are generated.
            </p>
          </div>
        ) : (
          billingRecords.map((billing) => (
            <article
              className="tenant-card"
              key={billing.id}
            >
              <div className="tenant-main">
                <div className="tenant-avatar">
                  {billing.full_name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <strong>{billing.full_name}</strong>

                  <p>
                    {billing.room_number
                      ? `Room ${billing.room_number}`
                      : "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="tenant-details">
                <div>
                  <span>BILLING MONTH</span>

                  <strong>
                    {billing.billing_month.substring(0, 7)}
                  </strong>
                </div>

                <div>
                  <span>ELECTRICITY</span>

                  <strong>
                      {formatCurrency(billing.electricity_charge)}
                  </strong>
                </div>

                <div>
                  <span>WATER</span>

                  <strong>
                     {formatCurrency(billing.water_charge)}
                  </strong>
                </div>

                <div>
                  <span>TOTAL</span>

                  <strong>
                    {formatCurrency(billing.total_amount)}
                  </strong>
                </div>

                <div>
                  <span>STATUS</span>

                  <select
                    value={billing.status}
                    onChange={(event) =>
                      handleStatusChange(
                        billing,
                        event.target.value
                      )
                    }
                  >
                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Paid">
                      Paid
                    </option>

                    <option value="Overdue">
                      Overdue
                    </option>
                  </select>
                </div>

                <div className="tenant-actions">
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() =>
                      handleDelete(billing)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}



function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({
    billing_month: "",
    tenant_id: "",
    room_id: "",
    status: "",
  });

  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getBillingMonth = (value) => {
    if (!value) return "";

    const text = String(value);

    // MySQL DATE normally starts with YYYY-MM-DD.
    // Using the original date text avoids timezone/month shifting.
    const match = text.match(/^(\d{4}-\d{2})/);

    if (match) {
      return match[1];
    }

    return "";
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/billing");

      if (!response.ok) {
        throw new Error(
          `Billing API returned ${response.status}`
        );
      }

      const data = await response.json();

      console.log("TARIPA REPORTS:", data);

      if (!data.success) {
        throw new Error(
          data.message || "Failed to load billing reports."
        );
      }

      const billingData = Array.isArray(data.data)
        ? data.data
        : [];

      setReports(billingData);
    } catch (requestError) {
      console.error(
        "Failed to load reports:",
        requestError
      );

      setReports([]);
      setError(
        requestError.message ||
        "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const response = await fetch("/api/tenants");
      const data = await response.json();

      if (response.ok && data.success) {
        setTenants(
          Array.isArray(data.data)
            ? data.data
            : []
        );
      }
    } catch (requestError) {
      console.error(
        "Failed to load tenants:",
        requestError
      );
    }
  };

  const loadRooms = async () => {
    try {
      const response = await fetch("/api/rooms");
      const data = await response.json();

      if (response.ok && data.success) {
        setRooms(
          Array.isArray(data.data)
            ? data.data
            : []
        );
      }
    } catch (requestError) {
      console.error(
        "Failed to load rooms:",
        requestError
      );
    }
  };

  useEffect(() => {
    loadReports();
    loadTenants();
    loadRooms();
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      billing_month: "",
      tenant_id: "",
      room_id: "",
      status: "",
    });
  };

  const filteredReports = reports.filter((report) => {
    const reportMonth = getBillingMonth(
      report.billing_month
    );

    const matchesMonth =
      !filters.billing_month ||
      reportMonth === filters.billing_month;

    const matchesTenant =
      !filters.tenant_id ||
      String(report.tenant_id) ===
      String(filters.tenant_id);

    const matchesRoom =
      !filters.room_id ||
      String(report.room_id) ===
      String(filters.room_id);

    const matchesStatus =
      !filters.status ||
      String(report.status) ===
      String(filters.status);

    return (
      matchesMonth &&
      matchesTenant &&
      matchesRoom &&
      matchesStatus
    );
  });

  const totalBills = filteredReports.length;

  const totalAmount = filteredReports.reduce(
    (sum, report) =>
      sum + Number(report.total_amount || 0),
    0
  );

  const totalElectricity = filteredReports.reduce(
    (sum, report) =>
      sum +
      Number(
        report.electricity_consumption || 0
      ),
    0
  );

  const totalWater = filteredReports.reduce(
    (sum, report) =>
      sum +
      Number(
        report.water_consumption || 0
      ),
    0
  );

  const pendingAmount = filteredReports
    .filter(
      (report) =>
        String(report.status) === "Pending"
    )
    .reduce(
      (sum, report) =>
        sum + Number(report.total_amount || 0),
      0
    );

  const paidAmount = filteredReports
    .filter(
      (report) =>
        String(report.status) === "Paid"
    )
    .reduce(
      (sum, report) =>
        sum + Number(report.total_amount || 0),
      0
    );

  const overdueAmount = filteredReports
    .filter(
      (report) =>
        String(report.status) === "Overdue"
    )
    .reduce(
      (sum, report) =>
        sum + Number(report.total_amount || 0),
      0
    );

  return (
    <section className="tenants-page">
      <div className="module-header">
        <div>
          <p className="eyebrow">
            REPORTS & DATA RETRIEVAL
          </p>

          <h2>Reports</h2>

          <p>
            Search and filter billing records to review
            utility usage and payment information.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={loadReports}
        >
          Refresh
        </button>
      </div>

      <div className="tenant-form-card">
        <div className="form-header">
          <div>
            <p className="eyebrow">
              REPORT FILTERS
            </p>

            <h3>Search Billing Records</h3>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>

        <div className="form-grid">
          <label>
            <span>BILLING MONTH</span>

            <input
              type="month"
              name="billing_month"
              value={filters.billing_month}
              onChange={handleFilterChange}
            />
          </label>

          <label>
            <span>TENANT</span>

            <select
              name="tenant_id"
              value={filters.tenant_id}
              onChange={handleFilterChange}
            >
              <option value="">
                All tenants
              </option>

              {tenants.map((tenant) => (
                <option
                  key={tenant.id}
                  value={tenant.id}
                >
                  {tenant.full_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>ROOM</span>

            <select
              name="room_id"
              value={filters.room_id}
              onChange={handleFilterChange}
            >
              <option value="">
                All rooms
              </option>

              {rooms.map((room) => (
                <option
                  key={room.id}
                  value={room.id}
                >
                  Room {room.room_number}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>STATUS</span>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">
                All statuses
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Paid">
                Paid
              </option>

              <option value="Overdue">
                Overdue
              </option>
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="form-message error">
          {error}
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">
            TOTAL BILLS
          </span>

          <strong>{totalBills}</strong>

          <small>
            Matching records
          </small>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            TOTAL BILLING
          </span>

          <strong>
            {formatCurrency(totalAmount)}
          </strong>

          <small>
            Filtered bill amount
          </small>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            ELECTRICITY
          </span>

          <strong>
            {totalElectricity.toFixed(3)}
          </strong>

          <small>
            Total consumption
          </small>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            WATER
          </span>

          <strong>
            {totalWater.toFixed(3)}
          </strong>

          <small>
            Total consumption
          </small>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">
            PENDING
          </span>

          <strong>
           {formatCurrency(pendingAmount)}
          </strong>

          <small>
            Unpaid pending bills
          </small>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            PAID
          </span>

          <strong>
           {formatCurrency(paidAmount)}
          </strong>

          <small>
            Completed payments
          </small>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            OVERDUE
          </span>

          <strong>
           {formatCurrency(overdueAmount)}
          </strong>

          <small>
            Outstanding overdue bills
          </small>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            RESULTS
          </span>

          <strong>
            {filteredReports.length}
          </strong>

          <small>
            Records after filtering
          </small>
        </div>
      </div>

      <div className="tenant-list">
        {loading ? (
          <div className="empty-state">
            <h3>Loading reports...</h3>

            <p>
              Retrieving billing records from the database.
            </p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-state">
            <h3>No matching records</h3>

            <p>
              There are no billing records matching
              the current filters.
            </p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <article
              className="tenant-card"
              key={report.id}
            >
              <div className="tenant-main">
                <div className="tenant-avatar">
                  {String(
                    report.full_name || "?"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <strong>
                    {report.full_name ||
                      "Unknown tenant"}
                  </strong>

                  <p>
                    {report.room_number
                      ? `Room ${report.room_number}`
                      : "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="tenant-details">
                <div>
                  <span>BILLING MONTH</span>

                  <strong>
                    {getBillingMonth(
                      report.billing_month
                    )}
                  </strong>
                </div>

                                <div>
                  <span>ELECTRICITY</span>

                  <strong>
                    {formatCurrency(report.electricity_charge)}
                  </strong>
                </div>
                <div>
                  <span>WATER</span>

                  <strong>
                    {formatCurrency(report.water_charge)}
                  </strong>
                </div>
                <div>
                  <span>TOTAL</span>

                  <strong>
                    {formatCurrency(report.total_amount)}
                  </strong>
                </div>
<div>
                  <span>STATUS</span>

                  <strong
                    className={`tenant-status ${report.status === "Paid"
                        ? "active"
                        : report.status === "Overdue"
                          ? "inactive"
                          : ""
                      }`}
                  >
                    {report.status}
                  </strong>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function UtilityRatesPage() {
  const [rates, setRates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRate, setEditingRate] = useState(null);

  const [formData, setFormData] = useState({
    utility_type: "",
    rate_per_unit: "",
    effective_from: "",
  });

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRates = async () => {
    try {
      const response = await fetch("/api/utility-rates");
      const data = await response.json();

      if (!response.ok || !data.success) {
        setFormError(
          data.message || "Failed to load utility rates."
        );
        return;
      }

      setRates(data.data);
    } catch (error) {
      console.error(
        "Failed to load utility rates:",
        error
      );

      setFormError("Unable to connect to the backend.");
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  const resetForm = () => {
    setFormData({
      utility_type: "",
      rate_per_unit: "",
      effective_from: "",
    });

    setFormError("");
    setFormSuccess("");
    setEditingRate(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (rate) => {
    setFormData({
      utility_type: rate.utility_type,
      rate_per_unit: rate.rate_per_unit,
      effective_from: rate.effective_from.substring(0, 10),
    });

    setFormError("");
    setFormSuccess("");
    setEditingRate(rate);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
    setFormSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setFormSuccess("");

    if (!formData.utility_type) {
      setFormError("Utility type is required.");
      return;
    }

    if (formData.rate_per_unit === "") {
      setFormError("Rate per unit is required.");
      return;
    }

    const rate = Number(formData.rate_per_unit);

    if (!Number.isFinite(rate) || rate < 0) {
      setFormError(
        "Rate per unit must be a valid non-negative number."
      );
      return;
    }

    if (!formData.effective_from) {
      setFormError("Effective date is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingRate
        ? `/api/utility-rates/${editingRate.id}`
        : "/api/utility-rates";

      const method = editingRate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          utility_type: formData.utility_type,
          rate_per_unit: rate,
          effective_from: formData.effective_from,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setFormError(
          data.message || "Failed to save utility rate."
        );
        return;
      }

      setFormSuccess(
        editingRate
          ? "Utility rate updated successfully."
          : "Utility rate added successfully."
      );

      await loadRates();

      setTimeout(() => {
        closeForm();
      }, 800);
    } catch (error) {
      console.error(
        "Failed to save utility rate:",
        error
      );

      setFormError("Unable to connect to the backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (rate) => {
    const confirmed = window.confirm(
      `Delete the ${rate.utility_type} rate effective ${rate.effective_from.substring(
        0,
        10
      )}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/utility-rates/${rate.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        window.alert(
          data.message || "Failed to delete utility rate."
        );
        return;
      }

      loadRates();
    } catch (error) {
      console.error(
        "Failed to delete utility rate:",
        error
      );

      window.alert("Unable to connect to the backend.");
    }
  };

  return (
    <section className="tenants-page">
      <div className="module-header">
        <div>
          <p className="eyebrow">UTILITY RATE MANAGEMENT</p>

          <h2>Utility Rates</h2>

          <p>
            Manage electricity and water rates used for
            automated billing calculations.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAddForm}
        >
          + Add Rate
        </button>
      </div>

      {showForm && (
        <div className="tenant-form-card">
          <div className="form-header">
            <div>
              <p className="eyebrow">
                {editingRate
                  ? "EDIT UTILITY RATE"
                  : "NEW UTILITY RATE"}
              </p>

              <h3>
                {editingRate
                  ? "Edit Utility Rate"
                  : "Add Utility Rate"}
              </h3>
            </div>

            <button
              type="button"
              className="close-button"
              onClick={closeForm}
            >
        	X
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                <span>UTILITY TYPE</span>

                <select
                  name="utility_type"
                  value={formData.utility_type}
                  onChange={handleChange}
                >
                  <option value="">
                    Select utility
                  </option>

                  <option value="Electricity">
                    Electricity
                  </option>

                  <option value="Water">
                    Water
                  </option>
                </select>
              </label>

              <label>
                <span>RATE PER UNIT</span>

                <input
                  type="number"
                  name="rate_per_unit"
                  value={formData.rate_per_unit}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Enter rate"
                />
              </label>

              <label>
                <span>EFFECTIVE FROM</span>

                <input
                  type="date"
                  name="effective_from"
                  value={formData.effective_from}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div className="form-message">
              This rate will be used when generating bills for
              billing months covered by the effective date.
            </div>

            {formError && (
              <div className="form-message error">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="form-message success">
                {formSuccess}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : editingRate
                    ? "Save Changes"
                    : "Add Rate"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="tenant-list">
        {rates.length === 0 ? (
          <div className="empty-state">
            <h3>No utility rates found</h3>

            <p>
              Add an electricity or water rate to enable
              automated billing calculations.
            </p>
          </div>
        ) : (
          rates.map((rate) => (
            <article
              className="tenant-card"
              key={rate.id}
            >
              <div className="tenant-main">
                <div className="tenant-avatar">
                  {rate.utility_type === "Electricity"
                    ? "E"
                    : "W"}
                </div>

                <div>
                  <strong>{rate.utility_type}</strong>

                  <p>
                    Effective from{" "}
                    {rate.effective_from.substring(0, 10)}
                  </p>
                </div>
              </div>

              <div className="tenant-details">
                <div>
                  <span>UTILITY</span>

                  <strong>
                    {rate.utility_type}
                  </strong>
                </div>

                <div>
                  <span>RATE PER UNIT</span>

                  <strong>
              		{formatCurrency(rate.rate_per_unit)}
                  </strong>
                </div>

                <div>
                  <span>EFFECTIVE FROM</span>

                  <strong>
                    {rate.effective_from.substring(0, 10)}
                  </strong>
                </div>

                <div className="tenant-actions">
                  <button
                    type="button"
                    className="edit-button"
                    onClick={() => openEditForm(rate)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => handleDelete(rate)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default App;

















