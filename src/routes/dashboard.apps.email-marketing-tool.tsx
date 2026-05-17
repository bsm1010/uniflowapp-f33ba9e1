import { useState } from "react";

const campaigns = [
  { id: 1, name: "Summer Sale 2024", status: "sent", opens: 342, clicks: 128, sent: 1200, date: "May 10, 2024" },
  { id: 2, name: "New Arrivals", status: "draft", opens: 0, clicks: 0, sent: 0, date: "May 14, 2024" },
  { id: 3, name: "Welcome Series", status: "active", opens: 890, clicks: 320, sent: 2100, date: "May 1, 2024" },
  { id: 4, name: "Abandoned Cart Recovery", status: "sent", opens: 210, clicks: 98, sent: 800, date: "Apr 28, 2024" },
];

const templates = [
  { id: 1, name: "Welcome Email", category: "Onboarding", preview: "👋" },
  { id: 2, name: "Flash Sale", category: "Promotions", preview: "🔥" },
  { id: 3, name: "Order Confirmation", category: "Transactional", preview: "✅" },
  { id: 4, name: "Newsletter", category: "Engagement", preview: "📰" },
  { id: 5, name: "Re-engagement", category: "Retention", preview: "💌" },
  { id: 6, name: "Product Launch", category: "Promotions", preview: "🚀" },
];

const statusColors = {
  sent: { bg: "rgba(0,200,100,0.15)", color: "#00c864", border: "#00c864", label: "Sent" },
  draft: { bg: "rgba(255,200,0,0.15)", color: "#ffc800", border: "#ffc800", label: "Draft" },
  active: { bg: "rgba(100,149,237,0.15)", color: "#6495ed", border: "#6495ed", label: "Active" },
};

const styles = {
  app: {
    minHeight: "100vh",
    background: "#0d0d1a",
    color: "white",
    fontFamily: "'Segoe UI', sans-serif",
    display: "flex",
  },
  sidebar: {
    width: 220,
    background: "#12122a",
    borderRight: "1px solid #2a1a4a",
    padding: "24px 0",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 20px 24px",
    borderBottom: "1px solid #2a1a4a",
    marginBottom: 16,
  },
  logoIcon: {
    width: 36,
    height: 36,
    background: "linear-gradient(135deg, #6a0dad, #9b30ff)",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },
  logoText: { fontSize: 15, fontWeight: "bold", color: "white" },
  logoSub: { fontSize: 10, color: "#888" },
  navItem: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 20px",
    cursor: "pointer",
    background: active ? "rgba(106,13,173,0.3)" : "transparent",
    borderRight: active ? "3px solid #9b30ff" : "3px solid transparent",
    color: active ? "#b388ff" : "#888",
    fontSize: 13,
    fontWeight: active ? "bold" : "normal",
    transition: "all 0.2s",
  }),
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topbar: {
    background: "#12122a",
    borderBottom: "1px solid #2a1a4a",
    padding: "16px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topbarTitle: { fontSize: 20, fontWeight: "bold" },
  topbarSub: { fontSize: 12, color: "#888", marginTop: 2 },
  btnPrimary: {
    background: "linear-gradient(135deg, #6a0dad, #9b30ff)",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  content: { flex: 1, padding: 28, overflowY: "auto" },
  statsRow: { display: "flex", gap: 16, marginBottom: 28 },
  statCard: {
    flex: 1,
    background: "#1a1a2e",
    border: "1px solid #2a1a4a",
    borderRadius: 14,
    padding: "18px 20px",
  },
  statTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  statLabel: { fontSize: 12, color: "#888" },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },
  statNum: { fontSize: 26, fontWeight: "bold", color: "white" },
  statChange: (up) => ({ fontSize: 11, color: up ? "#00c864" : "#ff5050", marginTop: 4 }),
  sectionTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 16, color: "white" },
  card: {
    background: "#1a1a2e",
    border: "1px solid #2a1a4a",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
    padding: "12px 20px",
    background: "#12122a",
    borderBottom: "1px solid #2a1a4a",
    fontSize: 11,
    color: "#888",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
    padding: "14px 20px",
    borderBottom: "1px solid #1a1a2e",
    alignItems: "center",
    fontSize: 13,
    cursor: "pointer",
    transition: "background 0.15s",
  },
  badge: (status) => ({
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: "bold",
    background: statusColors[status].bg,
    color: statusColors[status].color,
    border: `1px solid ${statusColors[status].border}`,
  }),
  templatesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 14,
  },
  templateCard: {
    background: "#1a1a2e",
    border: "1px solid #2a1a4a",
    borderRadius: 14,
    padding: "20px",
    cursor: "pointer",
    transition: "border-color 0.2s",
    textAlign: "center",
  },
  templateEmoji: { fontSize: 36, marginBottom: 10 },
  templateName: { fontSize: 13, fontWeight: "bold", marginBottom: 4 },
  templateCat: { fontSize: 11, color: "#888" },
  modal: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modalBox: {
    background: "#1a1a2e",
    border: "1px solid #3a1a6a",
    borderRadius: 18,
    padding: 28,
    width: 480,
    maxWidth: "90vw",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 6 },
  modalSub: { fontSize: 12, color: "#888", marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, color: "#b388ff", marginBottom: 6, display: "block" },
  input: {
    width: "100%",
    background: "#0d0d1a",
    border: "1px solid #3a1a6a",
    borderRadius: 10,
    padding: "10px 14px",
    color: "white",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    background: "#0d0d1a",
    border: "1px solid #3a1a6a",
    borderRadius: 10,
    padding: "10px 14px",
    color: "white",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    background: "#0d0d1a",
    border: "1px solid #3a1a6a",
    borderRadius: 10,
    padding: "10px 14px",
    color: "white",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    minHeight: 100,
    resize: "vertical",
  },
  modalBtns: { display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" },
  btnSecondary: {
    background: "transparent",
    border: "1px solid #3a1a6a",
    borderRadius: 10,
    padding: "10px 20px",
    color: "#888",
    fontSize: 13,
    cursor: "pointer",
  },
};

const navItems = [
  { icon: "📊", label: "Overview", key: "overview" },
  { icon: "📧", label: "Campaigns", key: "campaigns" },
  { icon: "🎨", label: "Templates", key: "templates" },
  { icon: "👥", label: "Subscribers", key: "subscribers" },
  { icon: "⚙️", label: "Settings", key: "settings" },
];

export default function EmailMarketing() {
  const [activeNav, setActiveNav] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [form, setForm] = useState({ name: "", subject: "", audience: "all", body: "" });

  const handleCreate = () => {
    setShowModal(false);
    setForm({ name: "", subject: "", audience: "all", body: "" });
  };

  return (
    <div style={styles.app}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🦊</div>
          <div>
            <div style={styles.logoText}>Fennecly</div>
            <div style={styles.logoSub}>Email Marketing</div>
          </div>
        </div>
        {navItems.map((item) => (
          <div
            key={item.key}
            style={styles.navItem(activeNav === item.key)}
            onClick={() => setActiveNav(item.key)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* MAIN */}
      <div style={styles.main}>
        {/* TOPBAR */}
        <div style={styles.topbar}>
          <div>
            <div style={styles.topbarTitle}>
              {activeNav === "overview" && "Email Marketing Overview"}
              {activeNav === "campaigns" && "Campaigns"}
              {activeNav === "templates" && "Email Templates"}
              {activeNav === "subscribers" && "Subscribers"}
              {activeNav === "settings" && "Settings"}
            </div>
            <div style={styles.topbarSub}>Manage your email campaigns for your store</div>
          </div>
          <button style={styles.btnPrimary} onClick={() => setShowModal(true)}>
            <span>+</span> New Campaign
          </button>
        </div>

        {/* CONTENT */}
        <div style={styles.content}>

          {/* OVERVIEW */}
          {activeNav === "overview" && (
            <>
              <div style={styles.statsRow}>
                {[
                  { label: "Total Subscribers", value: "4,821", icon: "👥", iconBg: "rgba(106,13,173,0.3)", change: "+12% this month", up: true },
                  { label: "Emails Sent", value: "18,340", icon: "📤", iconBg: "rgba(0,150,255,0.2)", change: "+8% this month", up: true },
                  { label: "Avg Open Rate", value: "34.2%", icon: "📬", iconBg: "rgba(0,200,100,0.2)", change: "+2.1% vs last month", up: true },
                  { label: "Avg Click Rate", value: "12.8%", icon: "🖱️", iconBg: "rgba(255,200,0,0.2)", change: "-0.4% vs last month", up: false },
                ].map((s, i) => (
                  <div key={i} style={styles.statCard}>
                    <div style={styles.statTop}>
                      <span style={styles.statLabel}>{s.label}</span>
                      <div style={{ ...styles.statIcon, background: s.iconBg }}>{s.icon}</div>
                    </div>
                    <div style={styles.statNum}>{s.value}</div>
                    <div style={styles.statChange(s.up)}>{s.up ? "▲" : "▼"} {s.change}</div>
                  </div>
                ))}
              </div>

              <div style={styles.sectionTitle}>Recent Campaigns</div>
              <div style={styles.card}>
                <div style={styles.tableHeader}>
                  <span>Campaign</span>
                  <span>Status</span>
                  <span>Sent</span>
                  <span>Opens</span>
                  <span>Clicks</span>
                  <span>Date</span>
                </div>
                {campaigns.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      ...styles.tableRow,
                      background: hoveredRow === c.id ? "#1f1f3a" : "transparent",
                    }}
                    onMouseEnter={() => setHoveredRow(c.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <span style={{ fontWeight: "bold" }}>{c.name}</span>
                    <span><span style={styles.badge(c.status)}>{statusColors[c.status].label}</span></span>
                    <span style={{ color: "#b388ff" }}>{c.sent.toLocaleString()}</span>
                    <span>{c.opens.toLocaleString()}</span>
                    <span>{c.clicks.toLocaleString()}</span>
                    <span style={{ color: "#888", fontSize: 12 }}>{c.date}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* CAMPAIGNS */}
          {activeNav === "campaigns" && (
            <>
              <div style={styles.sectionTitle}>All Campaigns</div>
              <div style={styles.card}>
                <div style={styles.tableHeader}>
                  <span>Campaign</span>
                  <span>Status</span>
                  <span>Sent</span>
                  <span>Opens</span>
                  <span>Clicks</span>
                  <span>Date</span>
                </div>
                {campaigns.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      ...styles.tableRow,
                      background: hoveredRow === c.id ? "#1f1f3a" : "transparent",
                    }}
                    onMouseEnter={() => setHoveredRow(c.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <span style={{ fontWeight: "bold" }}>{c.name}</span>
                    <span><span style={styles.badge(c.status)}>{statusColors[c.status].label}</span></span>
                    <span style={{ color: "#b388ff" }}>{c.sent.toLocaleString()}</span>
                    <span>{c.opens.toLocaleString()}</span>
                    <span>{c.clicks.toLocaleString()}</span>
                    <span style={{ color: "#888", fontSize: 12 }}>{c.date}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TEMPLATES */}
          {activeNav === "templates" && (
            <>
              <div style={styles.sectionTitle}>Email Templates</div>
              <div style={styles.templatesGrid}>
                {templates.map((t) => (
                  <div
                    key={t.id}
                    style={styles.templateCard}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "#9b30ff"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "#2a1a4a"}
                  >
                    <div style={styles.templateEmoji}>{t.preview}</div>
                    <div style={styles.templateName}>{t.name}</div>
                    <div style={styles.templateCat}>{t.category}</div>
                    <button style={{ ...styles.btnPrimary, margin: "12px auto 0", fontSize: 11, padding: "7px 16px" }}>
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* SUBSCRIBERS */}
          {activeNav === "subscribers" && (
            <>
              <div style={styles.statsRow}>
                {[
                  { label: "Total Subscribers", value: "4,821", icon: "👥", iconBg: "rgba(106,13,173,0.3)" },
                  { label: "Active", value: "4,210", icon: "✅", iconBg: "rgba(0,200,100,0.2)" },
                  { label: "Unsubscribed", value: "611", icon: "🚫", iconBg: "rgba(255,80,80,0.2)" },
                ].map((s, i) => (
                  <div key={i} style={styles.statCard}>
                    <div style={styles.statTop}>
                      <span style={styles.statLabel}>{s.label}</span>
                      <div style={{ ...styles.statIcon, background: s.iconBg }}>{s.icon}</div>
                    </div>
                    <div style={styles.statNum}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...styles.card, padding: 28, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>Subscriber Management</div>
                <div style={{ fontSize: 13, color: "#888" }}>Connect your Supabase database to manage subscribers here.</div>
              </div>
            </>
          )}

          {/* SETTINGS */}
          {activeNav === "settings" && (
            <div style={{ ...styles.card, padding: 28 }}>
              <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 20 }}>Email Settings</div>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Sender Name</label>
                <input style={styles.input} defaultValue="Fennecly Market" />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Sender Email</label>
                <input style={styles.input} defaultValue="hello@fennecly.online" />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Reply-To Email</label>
                <input style={styles.input} defaultValue="support@fennecly.online" />
              </div>
              <button style={{ ...styles.btnPrimary, marginTop: 8 }}>Save Settings</button>
            </div>
          )}

        </div>
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>✉️ Create New Campaign</div>
            <div style={styles.modalSub}>Fill in the details to create your email campaign</div>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Campaign Name</label>
              <input
                style={styles.input}
                placeholder="e.g. Summer Sale 2024"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Email Subject</label>
              <input
                style={styles.input}
                placeholder="e.g. 🔥 Don't miss our biggest sale!"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Audience</label>
              <select
                style={styles.select}
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
              >
                <option value="all">All Subscribers</option>
                <option value="active">Active Customers</option>
                <option value="inactive">Inactive Customers</option>
                <option value="new">New Subscribers</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Email Body</label>
              <textarea
                style={styles.textarea}
                placeholder="Write your email content here..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div style={styles.modalBtns}>
              <button style={styles.btnSecondary} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={styles.btnPrimary} onClick={handleCreate}>Create Campaign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
