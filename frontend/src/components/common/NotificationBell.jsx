import { FiBell } from "react-icons/fi";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function NotificationBell() {
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  // Placeholder for notifications - integrate with your notification system
  const notifications = [];
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) return null;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 34,
          height: 34,
          borderRadius: 8,
          border: "none",
          background: "transparent",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
          position: "relative",
          transition: "color 0.2s"
        }}
        onMouseEnter={(e) => e.target.style.color = "var(--color-text-primary)"}
        onMouseLeave={(e) => e.target.style.color = "var(--color-text-secondary)"}
        aria-label="Notifications"
      >
        <FiBell size={18} strokeWidth={2} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "var(--color-danger, #ef4444)",
              color: "white",
              fontSize: 10,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: 44,
            right: 0,
            width: 320,
            maxHeight: 400,
            background: "var(--color-dropdown-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 1000,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: 12,
              borderBottom: "1px solid var(--color-border)",
              fontWeight: 600,
              fontSize: 14
            }}
          >
            Notifications
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "var(--color-text-secondary)",
                  fontSize: 14
                }}
              >
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    padding: 12,
                    borderBottom: "1px solid var(--color-border)",
                    cursor: "pointer",
                    background: notification.read
                      ? "transparent"
                      : "var(--color-bg-hover)"
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {notification.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                      marginTop: 4
                    }}
                  >
                    {notification.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {showDropdown && (
        <div
          onClick={() => setShowDropdown(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
      )}
    </div>
  );
}
