import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css";

// const API_URL = "http://localhost:5000";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    Swal.fire("Error", "Please log in to access this feature", "error");
    throw new Error("No token found");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

const ExamTimetable = () => {
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [timetables, setTimetables] = useState([]);
  const [newExamName, setNewExamName] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [newSection, setNewSection] = useState("");
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({}); 

  const token = localStorage.getItem("token");

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const sortClasses = (classArray) => {
    const gradeOrder = {
      Nursery: -1,
      LKG: 0,
      UKG: 1,
      KG: 2,
    };
    return classArray.sort((a, b) => {
      if (gradeOrder[a] !== undefined && gradeOrder[b] !== undefined) {
        return gradeOrder[a] - gradeOrder[b];
      }
      if (gradeOrder[a] !== undefined) return -1;
      if (gradeOrder[b] !== undefined) return 1;
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  };

  useEffect(() => {
    fetchClasses();
    fetchTimetables();
  }, []);

  useEffect(() => {
    if (newClassName) {
      fetchSections();
      fetchSubjects(newClassName);
    } else {
      setSections([]);
      setSubjects([]);
      setNewSection("");
    }
  }, [newClassName]);

  const fetchClasses = async () => {
    if (!token) {
      setError("Please log in to view classes.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.get("/api/fees/classes");
      const sortedClasses = sortClasses(response.data);
      setClasses(sortedClasses);
      setError("");
    } catch (error) {
      console.error("Error fetching classes:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    if (!token) {
      setError("Please log in to view sections.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/api/classSections/${newClassName}`);
      setSections(response.data.sections || []);
      setNewSection("");
      setError("");
    } catch (error) {
      console.error("Error fetching sections:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to fetch sections");
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async (className) => {
    if (!token) {
      setError("Please log in to view subjects.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/api/subjects/${className}`);
      setSubjects(response.data.subjects || []);
      setError("");
    } catch (error) {
      console.error("Error fetching subjects:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to fetch subjects");
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetables = async () => {
    setLoading(true);
    try {
      const response = await api.get(`${BASE_URL}/timetables`);
      setTimetables(response.data);
      setError(null);
    } catch (error) {
      setError("Failed to fetch timetables: " + (error.response?.data?.message || error.message));
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const createTimetable = async () => {
    if (!newExamName || !newClassName || !newSection) {
      setError("All fields (Exam Name, Class Name, Section) are required!");
      return;
    }
    // Check if a timetable with the same examName, className, and section already exists
  const isDuplicate = timetables.some(
    (t) =>
      t.examName === newExamName &&
      t.className === newClassName &&
      t.section === newSection
  );

  if (isDuplicate) {
    setError(
      `A timetable for "${newExamName} - ${newClassName} - ${newSection}" already exists. Please use a unique combination.`
    );
    Swal.fire(
      "Error",
      `A timetable for "${newExamName} - ${newClassName} - ${newSection}" already exists.`,
      "error"
    );
    return;
  }
    setLoading(true);
    try {
      const newTimetable = {
        examName: newExamName,
        className: newClassName,
        section: newSection,
        schedule: [],
        saved: false,
      };
      const response = await api.post(`${BASE_URL}/timetables`, newTimetable);
      setTimetables([...timetables, response.data]);
      setNewExamName("");
      setNewClassName("");
      setNewSection("");
      setError(null);
      Swal.fire("Success", "Timetable created successfully!", "success");
    } catch (error) {
      setError("Failed to create timetable: " + (error.response?.data?.message || error.message));
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const openTimetable = (id) => {
    const timetable = timetables.find((t) => t._id === id);
    if (timetable) {
      fetchSubjects(timetable.className);
      setSelectedTimetable(id);
    }
  };

  const handleChange = (id, index, key, value) => {
    setTimetables((prev) =>
      prev.map((timetable) =>
        timetable._id === id
          ? {
              ...timetable,
              schedule: timetable.schedule.map((entry, idx) =>
                idx === index ? { ...entry, [key]: value } : entry
              ),
            }
          : timetable
      )
    );
  };

  const addRow = (id) => {
    setTimetables((prev) =>
      prev.map((timetable) =>
        timetable._id === id
          ? {
              ...timetable,
              schedule: [
                ...timetable.schedule,
                { date: "", day: "", from: "", to: "", subject: "" },
              ],
            }
          : timetable
      )
    );
  };

  const handleDateChange = (id, index, event) => {
    const date = event.target.value;
    const day = new Date(date).toLocaleDateString("en-US", { weekday: "long" });
    handleChange(id, index, "date", date);
    handleChange(id, index, "day", day);
  };

  const validateTime = (from, to) =>
    from && to && moment(from, "HH:mm").isBefore(moment(to, "HH:mm"));

  const validateExamTimes = (examName, from, to) => {
    const start = moment(from, "HH:mm");
    const end = moment(to, "HH:mm");
    const duration = moment.duration(end.diff(start)).asMinutes();
    if (examName.startsWith("F") && duration !== 45) {
      return "FA exam duration must be exactly 45 minutes.";
    }
    if (examName.startsWith("S") && duration !== 150) {
      return "SA exam duration must be exactly 2 hours and 30 minutes.";
    }
    return null;
  };

  const saveTimetable = async (id) => {
    const timetable = timetables.find((t) => t._id === id);
    let errors = [];
  
    // Function to check if two time ranges overlap
    const isOverlapping = (start1, end1, start2, end2) => {
      return moment(start1, "HH:mm").isBefore(moment(end2, "HH:mm")) &&
             moment(start2, "HH:mm").isBefore(moment(end1, "HH:mm"));
    };
  
    timetable.schedule.forEach((row, index) => {
      if (!row.date) errors.push(`Row ${index + 1}: Date is required.`);
      if (!row.from) errors.push(`Row ${index + 1}: Start time is required.`);
      if (!row.to) errors.push(`Row ${index + 1}: End time is required.`);
      if (!row.subject) errors.push(`Row ${index + 1}: Subject is required.`);
      
      if (!validateTime(row.from, row.to)) {
        errors.push(`Row ${index + 1}: Start time must be before end time.`);
      }
  
      const validationError = validateExamTimes(timetable.examName, row.from, row.to);
      if (validationError) {
        errors.push(`Row ${index + 1}: ${validationError}`);
      }
  
      // Check for time conflicts with other exams on the same day
      for (let i = 0; i < timetable.schedule.length; i++) {
        if (i !== index && timetable.schedule[i].date === row.date) { // Ensure it's the same date
          const existing = timetable.schedule[i];
          if (isOverlapping(row.from, row.to, existing.from, existing.to)) {
            errors.push(
              `Row ${index + 1}: Time conflict! Another exam (${existing.subject}) is scheduled from ${existing.from} to ${existing.to}.`
            );
          }
        }
      }
    });
  
    if (errors.length > 0) {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        [id]: errors, // Store errors for this timetable
      }));
    } else {
      setLoading(true);
      try {
        const response = await api.put(`${BASE_URL}/timetables/${id}`, {
          ...timetable,
          saved: true,
        });
        setTimetables((prev) =>
          prev.map((t) => (t._id === id ? response.data : t))
        );
        setSelectedTimetable(null);
        setSubjects([]);
        setError(null);
        setValidationErrors((prevErrors) => ({ ...prevErrors, [id]: [] })); // Clear errors after saving
      } catch (error) {
        setError("Failed to save timetable: " + (error.response?.data?.message || error.message));
        handleAuthError(error);
      } finally {
        setLoading(false);
      }
    }
  };
  

  const editTimetable = async (id) => {
    setLoading(true);
    try {
      const response = await api.get(`${BASE_URL}/timetables/${id}`);
      const timetable = response.data;
      setTimetables((prev) =>
        prev.map((t) => (t._id === id ? { ...timetable, saved: false } : t))
      );
      fetchSubjects(timetable.className);
      setSelectedTimetable(id);
      setError(null);
    } catch (error) {
      setError("Failed to fetch timetable: " + (error.response?.data?.message || error.message));
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTimetable = async (id) => {
    const timetable = timetables.find((t) => t._id === id);
    const result = await Swal.fire({
      title: "Delete Timetable?",
      text: `Are you sure you want to delete "${timetable.examName} - ${timetable.className} - ${timetable.section}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await api.delete(`${BASE_URL}/timetables/${id}`);
        setTimetables((prev) => prev.filter((t) => t._id !== id));
        setSelectedTimetable(null);
        setSubjects([]);
        setError(null);
        Swal.fire("Deleted!", "The timetable has been deleted.", "success");
      } catch (error) {
        setError("Failed to delete timetable: " + (error.response?.data?.message || error.message));
        handleAuthError(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteRow = (timetableId, index) => {
    setTimetables((prev) =>
      prev.map((timetable) =>
        timetable._id === timetableId
          ? {
              ...timetable,
              schedule: timetable.schedule.filter((_, idx) => idx !== index),
            }
          : timetable
      )
    );
  };

  const handleAuthError = (error) => {
    if (error.response?.status === 401 || error.message === "No token found") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  const getCurrentDate = () => new Date().toISOString().split("T")[0];

  const formatTime = (time) => moment(time, "HH:mm").format("h:mm A");

  return (
    <div className="container px-3 py-4 bg-light">
      <div className="d-flex justify-content-between align-items-center mb-3 animate__animated animate__fadeInDown">
        <h1 className="fw-bold text-primary h4">Exam Timetable Manager</h1>
      </div>

      {error && (
        <div className="alert alert-danger animate__animated animate__shakeX mb-3 py-2">{error}</div>
      )}

      {loading && (
        <div className="text-center mb-3">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <div className="card mb-4 shadow-sm animate__animated animate__fadeIn">
        <div className="card-body p-3">
          <h5 className="card-title fw-semibold text-dark mb-3">Create New Timetable</h5>
          <div className="row g-2">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control shadow-sm"
                placeholder="Exam Name (e.g., FA1, SA2)"
                value={newExamName}
                onChange={(e) => setNewExamName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select shadow-sm"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                disabled={loading}
              >
                <option value="">Select Class</option>
                {classes.map((className, index) => (
                  <option key={index} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select shadow-sm"
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                disabled={!newClassName || loading}
              >
                <option value="">Select Section</option>
                {sections.map((sec, index) => (
                  <option key={index} value={sec.sectionName}>
                    {sec.sectionName}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-primary w-100 shadow-sm"
                onClick={createTimetable}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        {timetables.map((timetable) => (
          <div key={timetable._id} className="col-12">
            <div className="card shadow-sm animate__animated animate__fadeIn">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <button
                  className="btn btn-link text-white text-decoration-none fw-semibold"
                  onClick={() => openTimetable(timetable._id)}
                  disabled={loading}
                >
                  {timetable.examName} - {timetable.className} - {timetable.section}
                </button>
                <div>
                  
                <button  className="btn btn-outline-light btn-sm me-2 " onClick={() => openTimetable(timetable._id)}>add</button>
                <button
                  className="btn btn-outline-light btn-sm shadow-sm"
                  onClick={() => deleteTimetable(timetable._id)}
                  disabled={loading}
                >
                  <i className="bi bi-trash"></i> Delete
                </button>
                </div>
              </div>
              {selectedTimetable === timetable._id && (
  <div className="card-body animate__animated animate__zoomIn p-3">
    <h5 className="fw-semibold text-dark mb-2">
      {timetable.examName} - {timetable.className} - {timetable.section} Timetable
    </h5>
    
    <div className="table-responsive">
      <table className="table table-bordered table-hover align-middle">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Day</th>
            <th>From</th>
            <th>To</th>
            <th>Subject</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {timetable.schedule.map((row, index) => (
            <tr key={index}>
              <td>
                <input
                  type="date"
                  className="form-control shadow-sm"
                  value={row.date}
                  min={getCurrentDate()}
                  onChange={(e) => handleDateChange(timetable._id, index, e)}
                  disabled={loading}
                />
              </td>
              <td>{row.day || "-"}</td>
              <td>
                <input
                  type="time"
                  className="form-control shadow-sm"
                  value={row.from}
                  onChange={(e) =>
                    handleChange(timetable._id, index, "from", e.target.value)
                  }
                  disabled={loading}
                />
              </td>
              <td>
                <input
                  type="time"
                  className="form-control shadow-sm"
                  value={row.to}
                  onChange={(e) =>
                    handleChange(timetable._id, index, "to", e.target.value)
                  }
                  disabled={loading}
                />
              </td>
              <td>
                <select
                  className="form-select shadow-sm"
                  value={row.subject}
                  onChange={(e) =>
                    handleChange(timetable._id, index, "subject", e.target.value)
                  }
                  disabled={loading}
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject.name}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button
                  className="btn btn-danger btn-sm shadow-sm"
                  onClick={() => deleteRow(timetable._id, index)}
                  disabled={loading}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Display Error Messages Below Table */}
    {validationErrors[timetable._id] && validationErrors[timetable._id].length > 0 && (
      <div className="alert alert-danger mt-3">
        <ul className="mb-0">
          {validationErrors[timetable._id].map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    )}

    <div className="d-flex gap-2 mt-3">
      <button
        className="btn btn-success shadow-sm"
        onClick={() => addRow(timetable._id)}
        disabled={loading}
      >
        Add Exam
      </button>
      <button
        className="btn btn-primary shadow-sm"
        onClick={() => saveTimetable(timetable._id)}
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Timetable"}
      </button>
    </div>
  </div>
)}

              {timetable.saved && selectedTimetable !== timetable._id && (
                <div className="card-body p-3 animate__animated animate__zoomIn">
                  <h5 className="fw-semibold text-dark mb-2">
                    {timetable.examName} - {timetable.className} - {timetable.section} Timetable
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-success">
                        <tr>
                          <th>Date</th>
                          <th>Day</th>
                          <th>From</th>
                          <th>To</th>
                          <th>Subject</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timetable.schedule.map((row, index) => (
                          <tr key={index}>
                            <td>{row.date || "-"}</td>
                            <td>{row.day || "-"}</td>
                            <td>{row.from ? formatTime(row.from) : "-"}</td>
                            <td>{row.to ? formatTime(row.to) : "-"}</td>
                            <td>{row.subject || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <button
                      className="btn btn-warning shadow-sm"
                      onClick={() => editTimetable(timetable._id)}
                      disabled={loading}
                    >
                      {loading ? "Loading..." : "Edit"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border-radius: 8px;
        }
        .card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
        }
        .btn {
          transition: transform 0.2s ease;
          border-radius: 6px;
          padding: 0.375rem 0.75rem;
        }
        .btn:hover {
          transform: scale(1.03);
        }
        .form-control, .form-select {
          border-radius: 6px;
          transition: border-color 0.3s ease;
          font-size: 0.9rem;
        }
        .form-control:focus, .form-select:focus {
          border-color: #007bff;
          box-shadow: 0 0 4px rgba(0, 123, 255, 0.4);
        }
        .table th, .table td {
          vertical-align: middle;
          padding: 0.5rem;
          font-size: 0.9rem;
        }
        .card-header {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          padding: 0.75rem 1rem;
        }
        h1.h4 {
          font-size: 1.5rem;
        }
        h5 {
          font-size: 1.1rem;
        }
        @media (max-width: 768px) {
          .table-responsive {
            font-size: 0.85rem;
          }
          .btn, .form-control, .form-select {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ExamTimetable;