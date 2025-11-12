import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, LogOut, User } from "lucide-react";
import "./Navbar.css"

function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    window.location.reload();
  };

  useEffect(() => {
    const scriptId = "google-translate-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.type = "text/javascript";
      script.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(script);
    }

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: "en" },
        "google_translate_element"
      );
    };
  }, []);

  return (
    <nav className="navbar navbar-custom navbar-expand">
      <div className="container-fluid">
        {/* Left side - Menu button and Logo */}
        <button className="sidebar-toggle" onClick={onToggleSidebar}>
          <Menu size={24} />
        </button>
        <a className="navbar-brand" style={{ marginRight: "auto" }} href="/">
          <h4>Skill Bridge</h4>
        </a>

        {/* Right side - Language Selector */}
        <div
          id="google_translate_element"
          className="custom-translate-dropdown me-3"
        ></div>

        {/* Desktop view */}
        <div className="d-none d-md-flex align-items-center">
          <span className="user-name">{user?.name}</span>
          <button className="btn btn-logout" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>

        {/* Mobile view */}
        <div className="d-md-none">
          <div className="dropdown">
            <button
              className="navbar-dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <User size={24} />
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <span className="dropdown-item">{user?.name}</span>
              </li>
              <li>
                <span className="dropdown-item text-muted">
                  {user?.role || "Guest"}
                </span>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button className="dropdown-item" onClick={handleLogout}>
                  <LogOut size={16} className="me-2" />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
