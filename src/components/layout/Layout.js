"use client";

import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Container } from "react-bootstrap";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "animate.css";
import "./Layout.css";

function Layout() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Calculate main content margin based on sidebar state and screen size
  const getMainContentMargin = () => {
    if (windowWidth <= 768) {
      // On mobile, don't add margin regardless of sidebar state
      return "0px";
    } else {
      // On desktop, add margin based on sidebar state
      return showSidebar ? "280px" : "60px";
    }
  };

  return (
    <div className="d-flex flex-column layout-wrapper">
      <Navbar onToggleSidebar={toggleSidebar} />
      <div className="d-flex flex-grow-1">
        <Sidebar showSidebar={showSidebar} toggleSidebar={toggleSidebar} />
        <main
          className="main-content flex-grow-1 animate__animated animate__fadeIn"
          style={{
            marginLeft: getMainContentMargin(),
            position: "relative",
            zIndex: 900,
            marginTop: "100px",
            height: "calc(100vh - 10px)",
            overflowY: "auto",
            overflowX: "hidden",
            transition: "margin-left 0.4s ease-in-out",
          }}
        >
          <Container fluid className="py-4">
            <Outlet />
          </Container>
        </main>
      </div>
    </div>
  );
}

export default Layout;
