import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrash } from 'react-icons/fa';

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const TeacherNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const notificationsPerPage = 10;

  useEffect(() => {
    fetchNotifications(currentPage);
  }, [currentPage]);

  const fetchNotifications = async (page) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      console.log("Fetching teacher notifications with token:", token);
      const response = await axios.get(
        `${BASE_URL}/api/notifications/role/teacher?page=${page}&limit=${notificationsPerPage}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Notifications response:", response.data); // Debug
      const { notifications, total, totalPages } = response.data;

      setNotifications(notifications || []);
      setTotalPages(totalPages || Math.ceil(total / notificationsPerPage) || 1);
      setError(null);
    } catch (err) {
      const errorMessage = err.response
        ? `Server error: ${err.response.status} - ${err.response.data?.error || 'No Found'}`
        : `Network error: ${err.message}`;
      setError(errorMessage);
      setNotifications([]);
      setTotalPages(1);
      console.error("Fetch notifications error:", err.response || err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to delete notifications");
        return;
      }

      await axios.delete(`${BASE_URL}/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedNotifications = notifications.filter((notif) => notif._id !== id);
      setNotifications(updatedNotifications);

      if (updatedNotifications.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else if (updatedNotifications.length === 0 && currentPage === 1) {
        setTotalPages(1);
      } else {
        setTotalPages(Math.ceil(updatedNotifications.length / notificationsPerPage) || 1);
      }
      setError(null);
    } catch (err) {
      const errorMessage = err.response
        ? `Delete error: ${err.response.status} - ${err.response.data?.error || 'Not Found'}`
        : `Network error: ${err.message}`;
      setError(errorMessage);
      console.error("Delete notification error:", err.response || err);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const styles = {
    container: { padding: '30px', maxWidth: '900px', margin: '0 auto', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' },
    header: { color: '#2c3e50', marginBottom: '25px', paddingBottom: '15px', borderBottom: '3px solid #3498db', textShadow: '1px 1px 2px rgba(0,0,0,0.1)', animation: 'slideInFromTop 0.5s ease-out' },
    notificationCard: { background: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', padding: '20px', margin: '15px 0', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', borderLeft: '5px solid #3498db', animation: 'slideInFromLeft 0.4s ease-out', transition: 'all 0.3s ease', position: 'relative' },
    error: { color: '#721c24', background: '#f8d7da', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #f5c6cb', animation: 'shake 0.5s' },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '30px' },
    button: { padding: '10px 20px', background: 'linear-gradient(to right, #3498db, #2980b9)', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
    disabledButton: { background: '#bdc3c7', cursor: 'not-allowed', boxShadow: 'none' },
    noNotifications: { color: '#7f8c8d', textAlign: 'center', padding: '25px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', margin: '15px 0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', animation: 'fadeIn 0.5s ease-in' },
    pageIndicator: { padding: '10px 20px', background: '#ecf0f1', borderRadius: '20px', color: '#2c3e50', fontWeight: 'bold' },
    deleteIcon: { position: 'absolute', top: '10px', right: '10px', color: '#e74c3c', cursor: 'pointer', transition: 'color 0.3s ease' },
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes slideInFromLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes slideInFromTop { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes shake { 0% { transform: translateX(0); } 25% { transform: translateX(-5px); } 50% { transform: translateX(5px); } 75% { transform: translateX(-5px); } 100% { transform: translateX(0); } }
          @keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-5px); } 60% { transform: translateY(-3px); } }
          .notification-card:hover { transform: translateY(-5px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); border-left-color: #2980b9; }
          button:hover:not(:disabled) { background: linear-gradient(to right, #2980b9, #1f618d); animation: bounce 0.5s; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
          .delete-icon:hover { color: #c0392b; }
        `}
      </style>

      <h2 style={styles.header}>Teacher Notifications ({notifications.length})</h2>
      {error && <p style={styles.error}>{error}</p>}
      {notifications.length > 0 ? (
        notifications.map((notif, index) => (
          <div key={notif._id || `notif-${index}`} style={styles.notificationCard} className="notification-card">
            <p style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '16px' }}>{notif.message}</p>
            <small style={{ color: '#7f8c8d', fontSize: '12px' }}>
              {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Date unavailable'}
            </small>
            <FaTrash style={styles.deleteIcon} className="delete-icon" onClick={() => deleteNotification(notif._id)} />
          </div>
        ))
      ) : (
        <p style={styles.noNotifications}>No notifications yet</p>
      )}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button style={{ ...styles.button, ...(currentPage === 1 ? styles.disabledButton : {}) }} onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
          <span style={styles.pageIndicator}>Page {currentPage} of {totalPages}</span>
          <button style={{ ...styles.button, ...(currentPage === totalPages ? styles.disabledButton : {}) }} onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
        </div>
      )}
    </div>
  );
};

export default TeacherNotification;