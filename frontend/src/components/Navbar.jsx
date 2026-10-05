import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import "./navbar-mobile.css";

/* =========================================================
   SERVICES DATA
========================================================= */

const SERVICES = [
  {
    icon: "🏠",
    title: "Find a PG",
    text: "Private-room PGs from verified owners, with real ratings and a live map.",
  },
  {
    icon: "🔑",
    title: "Digital room key",
    text: "Unlock, lock and control your room's electricity from the app.",
  },
  {
    icon: "🧹",
    title: "Room services",
    text: "Book cleaning slots and register guests from your dashboard.",
  },
  {
    icon: "🗂️",
    title: "PG organizer",
    text: "Owners manage rooms, requests and occupancy in one place.",
  },
  {
    icon: "🏷️",
    title: "Your PG, your name",
    text: "Register your PG and it gets its own branded listing on Roomly.",
  },
];

const CUSTOMISE = [
  {
    icon: "❄️",
    title: "AC or cooler",
    text: "Choose an AC, a cooler, or neither for your room.",
    tag: "Your choice",
  },
  {
    icon: "🏠",
    title: "Home & kitchen appliances",
    text: "Add the home and kitchen appliances you need in your room.",
    tag: "Your choice",
  },
  {
    icon: "🍽️",
    title: "Food services",
    text: "Food is optional. You don't have to take meals from your own PG's kitchen.",
    tag: "Optional",
  },
  {
    icon: "👨‍🍳",
    title: "Kitchen service",
    text: "Kitchen services are also listed on Roomly, so you can pick the one that suits you.",
    tag: "Listed on Roomly",
  },
  {
    icon: "🍳",
    title: "Personal kitchen in your room",
    text: "Want to cook for yourself? Rooms with a personal kitchen are available.",
    tag: "Above ₹10,000",
  },
];

/* =========================================================
   ROOMLY LOGO

   Light Mode:
   Black rounded square + White house

   Dark Mode:
   White rounded square + Black house
========================================================= */

function RoomlyLogo() {
  return (
    <span className="roomly-logo">
      <svg
        width="34"
        height="34"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="roomly-brand-svg"
        aria-hidden="true"
      >
        {/* Rounded square background */}
        <rect
          className="roomly-mark-bg"
          x="0"
          y="0"
          width="40"
          height="40"
          rx="11"
        />

        {/* House outline */}
        <path
          className="roomly-mark-line"
          d="M20 9L10 17.5V29C10 29.8284 10.6716 30.5 11.5 30.5H28.5C29.3284 30.5 30 29.8284 30 29V17.5L20 9Z"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center dot */}
        <circle
          className="roomly-mark-dot"
          cx="20"
          cy="19"
          r="2.6"
        />

        {/* Center vertical line */}
        <path
          className="roomly-mark-line"
          d="M20 21.6V25.5"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/* =========================================================
   SERVICES MODAL
========================================================= */

function ServicesModal({ open, onClose, showListCta }) {
  const [tab, setTab] = useState("offer");

  useEffect(() => {
    if (open) {
      setTab("offer");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="dd-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="dd-modal svc-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Roomly services"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =================================================
            MODAL HEADER
        ================================================= */}

        <div className="dd-modal-head">
          <div>
            <h3>Our services</h3>

            <p className="svc-sub">
              More than a PG finder: a full stay-and-manage service.
            </p>
          </div>

          <button
            type="button"
            className="dd-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* =================================================
            MODAL BODY
        ================================================= */}

        <div className="dd-modal-body">

          {/* Tabs */}
          <div
            className="svc-tabs"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "offer"}
              className={`svc-tab ${
                tab === "offer" ? "active" : ""
              }`}
              onClick={() => setTab("offer")}
            >
              What we offer
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={tab === "custom"}
              className={`svc-tab ${
                tab === "custom" ? "active" : ""
              }`}
              onClick={() => setTab("custom")}
            >
              Customise your stay
            </button>
          </div>

          {/* =================================================
              WHAT WE OFFER
          ================================================= */}

          {tab === "offer" ? (
            <div className="svc-grid">
              {SERVICES.map((service) => (
                <div
                  className="svc-item"
                  key={service.title}
                >
                  <span
                    className="svc-item-icon"
                    aria-hidden="true"
                  >
                    {service.icon}
                  </span>

                  <strong>
                    {service.title}
                  </strong>

                  <p>
                    {service.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (

            /* =================================================
               CUSTOMISE YOUR STAY
            ================================================= */

            <>
              <ul className="svc-list">
                {CUSTOMISE.map((item) => (
                  <li
                    className="svc-row"
                    key={item.title}
                  >
                    <span
                      className="svc-item-icon"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>

                    <div>
                      <strong>
                        {item.title}
                      </strong>

                      <p>
                        {item.text}
                      </p>
                    </div>

                    <span className="svc-tag">
                      {item.tag}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="svc-note">
                Available add-ons and prices vary by PG.
                Check each listing for details.
              </p>
            </>
          )}

          {/* =================================================
              MODAL ACTIONS
          ================================================= */}

          <div className="svc-actions">

            <Link
              to="/browse"
              className="pill"
              onClick={onClose}
            >
              Browse PGs
            </Link>

            {showListCta && (
              <Link
                to="/register"
                className="pill ghost"
                onClick={onClose}
              >
                List your PG
              </Link>
            )}

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* =========================================================
   NAVBAR
========================================================= */

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navigate = useNavigate();
  const location = useLocation();

  const [servicesOpen, setServicesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  /* =======================================================
     CLOSE SERVICES WHEN PAGE CHANGES
  ======================================================= */

  useEffect(() => {
    setServicesOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  /* =======================================================
     NAVBAR
  ======================================================= */

  return (
    <header className="navbar-container">

      <div className="navbar-inner">

        {/* =================================================
            ROOMLY BRAND
        ================================================= */}

        <Link
          to="/"
          className="brand-wrapper"
          aria-label="Roomly Home"
        >
          <RoomlyLogo />

          <div className="brand-text-container">

            <span className="brand-title">
              Roomly
            </span>

            <span className="brand-badge">
              PG finder &amp; services
            </span>

          </div>
        </Link>

        {/* =================================================
            NAVIGATION LINKS
        ================================================= */}

        {/* Hamburger button (visible only on phones) */}
        <button
          type="button"
          className="nav-toggle"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>

          {/* Browse PGs */}
          <Link
            to="/browse"
            className={`nav-item ${
              location.pathname === "/browse"
                ? "active"
                : ""
            }`}
          >
            Browse PGs
          </Link>

          {/* Services */}
          <button
            type="button"
            className={`nav-item nav-trigger ${
              servicesOpen ? "active" : ""
            }`}
            aria-haspopup="dialog"
            aria-expanded={servicesOpen}
            onClick={() => setServicesOpen(true)}
          >
            Services
          </button>

          {/* Services Modal */}
          <ServicesModal
            open={servicesOpen}
            onClose={() => setServicesOpen(false)}
            showListCta={!user}
          />

          {/* List Your PG */}
          {!user && (
            <Link
              to="/register"
              className={`nav-item ${
                location.pathname === "/register"
                  ? "active"
                  : ""
              }`}
            >
              List your PG
            </Link>
          )}

          {/* Student Dashboard */}
          {user?.role === "student" && (
            <Link
              to="/student/dashboard"
              className={`nav-item ${
                location.pathname.startsWith("/student")
                  ? "active"
                  : ""
              }`}
            >
              My Dashboard
            </Link>
          )}

          {/* Owner Dashboard */}
          {user?.role === "owner" && (
            <Link
              to="/owner/dashboard"
              className={`nav-item ${
                location.pathname.startsWith("/owner")
                  ? "active"
                  : ""
              }`}
            >
              Owner Dashboard
            </Link>
          )}

          {/* =================================================
              DIVIDER
          ================================================= */}

          <div className="nav-divider"></div>

          {/* =================================================
              THEME TOGGLE
          ================================================= */}

          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={
              theme === "light"
                ? "Switch to dark mode"
                : "Switch to light mode"
            }
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          {/* =================================================
              LOGGED-IN USER
          ================================================= */}

          {user ? (

            <div className="user-profile-section">

              <span className="user-greeting">

                <span className="dot-online"></span>

                Hi,{" "}

                <strong>
                  {user.name?.split(" ")[0] || "User"}
                </strong>

              </span>

              <button
                type="button"
                className="btn-logout"
                onClick={handleLogout}
              >
                Logout
              </button>

            </div>

          ) : (

            /* =================================================
               LOGGED-OUT USER
            ================================================= */

            <div className="auth-btn-group">

              <Link
                to="/login"
                className="btn-login"
              >
                Log in
              </Link>

              <Link
                to="/register"
                className="btn-signup"
              >
                Sign up
              </Link>

            </div>
          )}

        </nav>
      </div>
    </header>
  );
}