import { useState, useEffect } from "react";
import axios from "axios";

// const API_BASE_URL = "http://localhost:5000";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

export default function SubjectsManagement() {
  const classes = [
    { _id: "lkg", name: "LKG" },
    { _id: "ukg", name: "UKG" },
    { _id: "1st Grade", name: "1st Grade" },
    { _id: "2nd Grade", name: "2nd Grade" },
    { _id: "3rd Grade", name: "3rd Grade" },
    { _id: "4th Grade", name: "4th Grade" },
    { _id: "5th Grade", name: "5th Grade" },
    { _id: "6th Grade", name: "6th Grade" },
    { _id: "7th Grade", name: "7th Grade" },
    { _id: "8th Grade", name: "8th Grade" },
    { _id: "9th Grade", name: "9th Grade" },
    { _id: "10th Grade", name: "10th Grade" },
  ];

  const [selectedClass, setSelectedClass] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    if (selectedClass) {
      fetchSubjects();
    } else {
      setSubjects([]);
    }
  }, [selectedClass]);

  const fetchSubjects = async () => {
    if (!token) {
      setError("Please log in to manage subjects.");
      return;
    }

    try {
      const res = await api.get(`/api/subjects/${selectedClass}`);
      setSubjects(res.data.subjects || []);
      setError("");
    } catch (err) {
      console.error("Error fetching subjects:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Error fetching subjects");
      setSubjects([]);
    }
  };

  const addSubject = async () => {
    if (!newSubject.trim()) return;
    if (!token) {
      setError("Please log in to add a subject.");
      return;
    }

    try {
      const res = await api.post("/api/subjects", { className: selectedClass, name: newSubject });
      setSubjects(res.data.data.subjects);
      setNewSubject("");
      setError("");
    } catch (err) {
      console.error("Error adding subject:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Error adding subject");
    }
  };

  const deleteSubject = async (subjectId) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    if (!token) {
      setError("Please log in to delete a subject.");
      return;
    }

    try {
      const res = await api.delete(`/api/subjects/${selectedClass}/${subjectId}`);
      setSubjects(res.data.data.subjects);
      setError("");
    } catch (err) {
      console.error("Error deleting subject:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Error deleting subject");
    }
  };

  return (
    <div className="subjects-container">
      <style>{`
        .subjects-container {
          padding: 1rem;
          margin: 0 auto;
          width: 100%;
          max-width: 1200px;
          box-sizing: border-box;
        }

        h2 {
          text-align: center;
          margin-bottom: 1.5rem;
          font-size: clamp(1.5rem, 4vw, 2rem);
        }

        .error-message {
          color: #d32f2f;
          text-align: center;
          margin-bottom: 1rem;
          font-size: clamp(0.9rem, 2.5vw, 1rem);
        }

        .class-selection {
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .class-selection label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: clamp(1rem, 3vw, 1.2rem);
        }

        .class-selection select {
          width: min(100%, 300px);
          padding: 0.5rem;
          font-size: clamp(0.9rem, 2.5vw, 1rem);
          border-radius: 4px;
          border: 1px solid #ccc;
        }

        .subjects-section {
          margin-top: 1rem;
        }

        .subjects-section h3 {
          margin-bottom: 1rem;
          font-size: clamp(1.2rem, 3.5vw, 1.5rem);
          text-align: center;
        }

        .subject-input {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
          justify-content: center;
        }

        .subject-input input {
          flex: 1;
          min-width: 200px;
          max-width: 400px;
          padding: 0.5rem;
          font-size: clamp(0.9rem, 2.5vw, 1rem);
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .add-subject-btn {
          padding: 0.5rem 1rem;
          font-size: clamp(0.9rem, 2.5vw, 1rem);
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .add-subject-btn:hover {
          background-color: #45a049;
        }

        .subjects-table {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          border-collapse: collapse;
          font-size: clamp(0.85rem, 2.5vw, 1rem);
          overflow-x: auto;
          display: block;
        }

        .subjects-table thead,
        .subjects-table tbody {
          width: 100%;
          display: table;
        }

        .subjects-table th,
        .subjects-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #ddd;
          min-width: 120px;
        }

        .subjects-table th {
          background-color: #f5f5f5;
          position: sticky;
          top: 0;
        }

        .subjects-table tr:hover {
          background-color: #f9f9f9;
        }

        .delete-btn {
          padding: 0.3rem 0.75rem;
          font-size: clamp(0.8rem, 2vw, 0.9rem);
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
          width: 100%;
          max-width: 80px;
        }

        .delete-btn:hover {
          background-color: #da190b;
        }

        @media (max-width: 480px) {
          .subjects-table {
            font-size: 0.8rem;
          }

          .subjects-table th,
          .subjects-table td {
            padding: 0.5rem;
            min-width: 100px;
          }

          .subject-input {
            flex-direction: column;
            align-items: center;
          }

          .subject-input input {
            width: 100%;
            max-width: none;
          }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          .subjects-table {
            display: block;
            max-width: 100%;
          }

          .subjects-table th,
          .subjects-table td {
            padding: 0.6rem;
            min-width: 110px;
          }

          .delete-btn {
            padding: 0.4rem;
            font-size: 0.85rem;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .subjects-table {
            max-width: 700px;
          }

          .subjects-table th,
          .subjects-table td {
            padding: 0.7rem;
          }

          .subject-input input {
            max-width: 350px;
          }
        }

        @media (min-width: 2560px) {
          .subjects-container {
            max-width: 1800px;
          }

          .subjects-table {
            max-width: 1200px;
          }

          .subjects-table th,
          .subjects-table td {
            padding: 1rem;
          }
        }
      `}</style>

      <h2>Manage Subjects</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="class-selection">
        <label>Select Class:</label>
        <select onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="">-- Select Class --</option>
          {classes.map((cls) => (
            <option key={cls._id} value={cls.name}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <div className="subjects-section">
          <h3>Subjects for {selectedClass}</h3>

          <div className="subject-input">
            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Enter subject name"
            />
            <button className="add-subject-btn" onClick={addSubject}>
              + Add Subject
            </button>
          </div>

          <table className="subjects-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan="2">No subjects found.</td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject._id}>
                    <td>{subject.name}</td>
                    <td className="text-center">
                      <button
                        className="delete-btn"
                        onClick={() => deleteSubject(subject._id)}
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}