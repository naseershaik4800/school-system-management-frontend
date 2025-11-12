import React, { useState, useEffect } from "react";
import axios from "axios";
import { Tabs, Tab, Form, Button, Card, Alert, ListGroup, Spinner } from "react-bootstrap";
import "./notification.css";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const Notification = () => {
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState({ teachers: [], students: [], parents: [] });
  const [filteredUsers, setFilteredUsers] = useState({ teachers: [], students: [], parents: [] });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [targetRoles, setTargetRoles] = useState({
    teacher: false,
    student: false,
    parent: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/api/notifications/role/principal`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      const details = err.response?.data?.details || '';
      setError(`Failed to fetch principal notifications: ${errorMsg} - ${details}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersByRole = async (role) => {
    try {
      setLoading(true);
      const endpoints = {
        teacher: "/api/teachers",
        student: "/api/student",
        parent: "/api/parents",
      };
      const endpoint = endpoints[role] || `/api/users/${role}`;
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedUsers = response.data.map((user) => ({
        ...user,
        name: user.name || "Unnamed",
        email: user.email || "No email",
      }));
      setUsers((prev) => ({
        ...prev,
        [`${role}s`]: fetchedUsers,
      }));
      setFilteredUsers((prev) => ({
        ...prev,
        [`${role}s`]: fetchedUsers,
      }));
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      const details = err.response?.data?.details || '';
      setError(`Failed to fetch ${role}s: ${errorMsg} - ${details}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleCheckbox = (role) => {
    setTargetRoles((prev) => {
      const newRoles = { ...prev, [role]: !prev[role] };
      if (!prev[role]) {
        fetchUsersByRole(role);
        fetchRoleNotifications(role);
      } else {
        setUsers((prev) => ({ ...prev, [`${role}s`]: [] }));
        setFilteredUsers((prev) => ({ ...prev, [`${role}s`]: [] }));
        setSelectedUsers((prev) => prev.filter((id) => !users[`${role}s`].some((user) => user._id === id)));
      }
      setSearchTerm("");
      return newRoles;
    });
  };

  const fetchRoleNotifications = async (role) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BASE_URL}/api/notifications/role/${role}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications(response.data);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError("Failed to fetch role notifications: " + errorMsg);
    }
  };

  const handleUserCheckbox = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = (role) => {
    const allUserIds = filteredUsers[`${role}s`].map((user) => user._id);
    const allSelected = allUserIds.every((id) => selectedUsers.includes(id));
    setSelectedUsers((prev) =>
      allSelected
        ? prev.filter((id) => !allUserIds.includes(id))
        : [...new Set([...prev, ...allUserIds])]
    );
  };

  const handleSearch = (role) => (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = users[`${role}s`].filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    );
    setFilteredUsers((prev) => ({
      ...prev,
      [`${role}s`]: filtered,
    }));
  };

  const sendNotification = async () => {
    if (!message.trim() || !Object.values(targetRoles).some(Boolean) || selectedUsers.length === 0) {
      setError("Please enter a message and select at least one role and recipient");
      return;
    }

    if (!window.confirm("Are you sure you want to send this notification?")) {
      return;
    }

    setLoading(true);
    try {
      const selectedRoles = Object.entries(targetRoles)
        .filter(([_, value]) => value)
        .map(([role]) => role);

      const recipients = [];
      selectedRoles.forEach((role) => {
        const roleUsers = filteredUsers[`${role}s`]
          .filter((user) => selectedUsers.includes(user._id))
          .map((user) => ({
            id: user._id,
            email: user.email,
          }));
        recipients.push(...roleUsers);
      });

      const token = localStorage.getItem("token");
      const payload = {
        message,
        senderRole: "principal",
        targetRoles: selectedRoles,
        recipientIds: recipients.map((r) => r.id),
        recipientEmails: recipients.map((r) => r.email),
      };

      const response = await axios.post(
        `${BASE_URL}/api/notifications/send`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Notification stored successfully!");
      setTimeout(() => setSuccess(null), 3000);
      resetForm();
      fetchNotifications();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      const details = err.response?.data?.details || '';
      setError(`Failed to store notification: ${errorMsg} - ${details}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMessage("");
    setSelectedUsers([]);
    setTargetRoles({ teacher: false, student: false, parent: false });
    setUsers({ teachers: [], students: [], parents: [] });
    setFilteredUsers({ teachers: [], students: [], parents: [] });
    setSearchTerm("");
    setError(null);
  };

  const renderUserTab = (role) => (
    <>
      <Form.Control
        type="text"
        placeholder={`Search ${role}s by name or email`}
        value={searchTerm}
        onChange={handleSearch(role)}
        className="mb-3"
        disabled={loading}
      />
      {loading ? (
        <div className="v-text-center">
          <Spinner animation="border" />
        </div>
      ) : filteredUsers[`${role}s`].length > 0 ? (
        <>
          <Form.Check
            label={`Select All ${role.charAt(0).toUpperCase() + role.slice(1)}s`}
            checked={filteredUsers[`${role}s`].every((user) => selectedUsers.includes(user._id))}
            onChange={() => handleSelectAll(role)}
            className="mb-2"
            disabled={loading}
          />
          <ListGroup style={{ maxHeight: "200px", overflowY: "auto" }}>
            {filteredUsers[`${role}s`].map((user) => (
              <ListGroup.Item key={user._id}>
                <Form.Check
                  label={`${user.name} - ${user.email}`}
                  checked={selectedUsers.includes(user._id)}
                  onChange={() => handleUserCheckbox(user._id)}
                  disabled={loading}
                />
              </ListGroup.Item>
            ))}
          </ListGroup>
        </>
      ) : (
        <p>No {role}s found</p>
      )}
    </>
  );

  return (
    <div className="v-notification-container">
      <h2>📨 Principal Notification Dashboard</h2>

      {/* Error/Success Toasts */}
      {error && (
        <div className="v-toast-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      {success && (
        <div className="v-toast-success">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Notification Form */}
      <Card className="mb-4 v-notification-card">
        <Card.Header>Create Notification</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>📝 Notification Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your notification message..."
              disabled={loading}
            />
          </Form.Group>

          <h3>🎯 Select Target Roles</h3>
          <div className="mb-3 v-role-checkboxes">
            {["teacher", "student", "parent"].map((role) => (
              <Form.Check
                key={role}
                inline
                label={`${role.charAt(0).toUpperCase() + role.slice(1)}s`}
                type="checkbox"
                checked={targetRoles[role]}
                onChange={() => handleRoleCheckbox(role)}
                className="me-3"
                disabled={loading}
              />
            ))}
          </div>

          <Tabs defaultActiveKey="teachers" id="user-tabs" className="mb-3 v-custom-tabs">
            <Tab eventKey="teachers" title="👩‍🏫 Teachers" disabled={!targetRoles.teacher}>
              {targetRoles.teacher && renderUserTab("teacher")}
            </Tab>
            <Tab eventKey="students" title="👩‍🎓 Students" disabled={!targetRoles.student}>
              {targetRoles.student && renderUserTab("student")}
            </Tab>
            <Tab eventKey="parents" title="👪 Parents" disabled={!targetRoles.parent}>
              {targetRoles.parent && renderUserTab("parent")}
            </Tab>
          </Tabs>
            {/* Floating Action Button */}
      <button className="btn btn-outline-success btn-send" onClick={sendNotification} disabled={loading}>
        {loading ? <Spinner animation="border" size="sm" /> : "Send"}
      </button>
        </Card.Body>
      </Card>

      {/* Sent Notifications */}
      {notifications.length > 0 && (
        <Card className="v-notification-card">
          <Card.Header>📬 Sent Notifications</Card.Header>
          <Card.Body>
            <ListGroup variant="flush">
              {notifications.map((notif) => (
                <ListGroup.Item key={notif._id}>
                  <strong>{notif.message}</strong>
                  <br />
                  <small>{new Date(notif.createdAt).toLocaleString()}</small>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card.Body>
        </Card>
      )}

    
    </div>
  );
};

export default Notification;