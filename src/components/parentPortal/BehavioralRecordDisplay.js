import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const BehavioralRecordDisplay = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const studentId = localStorage.getItem("selectedChild");

  // Setup Axios Interceptor for Authorization
  useEffect(() => {
    const setupAxiosInterceptors = () => {
      axios.interceptors.request.use(
        (config) => {
          const token = localStorage.getItem("token");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          } else {
            throw new Error("No authentication token found");
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            toast.error("Session expired. Please log in again.");
            localStorage.removeItem("token");
            navigate("/login");
          } else if (error.response?.status === 403) {
            toast.error("Access denied: Insufficient permissions");
          }
          return Promise.reject(error);
        }
      );
    };
    setupAxiosInterceptors();
  }, [navigate]);

  const fetchBehavioralRecords = async () => {
    if (!studentId) {
      setError("No student ID provided");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to continue");
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/api/students/${studentId}/behavioral-records`
      );
      setRecords(response.data.data || []);
    } catch (err) {
      console.error("Error fetching behavioral records:", err);
      setError(
        err.response?.data?.message || "Failed to fetch behavioral records"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBehavioralRecords();
  }, [studentId]);

  // Custom CSS for animations and responsiveness
  const styles = `
    .fade-in {
      animation: fadeIn 0.5s ease-in;
    }
    .record-card:hover {
      transform: translateY(-5px);
      transition: transform 0.3s ease;
      box-shadow: 0 8px 16px rgba(0,0,0,0.2) !important;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 576px) {
      .card-body { padding: 1rem; }
      .card-header h5 { font-size: 1.1rem; }
      .card-footer small { font-size: 0.8rem; }
    }
  `;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger d-flex align-items-center fade-in" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
          <div>Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <style>{styles}</style>
      <div className="d-flex align-items-center mb-5 fade-in">
        <i className="bi bi-clipboard-data fs-2 me-3 text-primary"></i>
        <h1 className="mb-0 fw-bold text-dark">Behavioral Records</h1>
      </div>

      {records.length === 0 ? (
        <div className="alert alert-info text-center fade-in py-4">
          <i className="bi bi-info-circle fs-4 me-2"></i>
          No behavioral records available
        </div>
      ) : (
        <div className="row g-4">
          {records.map((record, index) => (
            <div className="col-12 col-md-6 col-lg-4 fade-in" key={record._id} style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="card h-100 shadow-sm border-0 record-card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0 fw-semibold">
                    {record.student?.name || "Unknown"} - Term: {record.term}
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-4">
                    <h6 className="card-subtitle mb-2 text-muted fw-bold">
                      <i className="bi bi-clock me-2"></i>Punctuality
                    </h6>
                    <div className="ps-3">
                      <strong className="text-dark">{record.punctuality?.status || "N/A"}</strong>
                      <p className="text-secondary mb-0 small">{record.punctuality?.comments || "No comments"}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h6 className="card-subtitle mb-2 text-muted fw-bold">
                      <i className="bi bi-person-workspace me-2"></i>Classroom Behavior
                    </h6>
                    <div className="ps-3">
                      <div className="mb-2">
                        <span className="badge bg-secondary me-2">
                          Rating: {record.classroomBehaviour?.rating || 0}/5
                        </span>
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`bi bi-star${i < (record.classroomBehaviour?.rating || 0) ? "-fill" : ""} text-warning`}
                          ></i>
                        ))}
                      </div>
                      <p className="text-secondary mb-0 small">{record.classroomBehaviour?.comments || "No comments"}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h6 className="card-subtitle mb-2 text-muted fw-bold">
                      <i className="bi bi-people me-2"></i>Peer Interaction
                    </h6>
                    <div className="ps-3">
                      <strong className="text-dark">{record.peerInteraction?.quality || "N/A"}</strong>
                      <p className="text-secondary mb-0 small">{record.peerInteraction?.comments || "No comments"}</p>
                    </div>
                  </div>

                  {record.disciplineRecords?.length > 0 && (
                    <div className="mb-4">
                      <h6 className="card-subtitle mb-2 text-muted fw-bold">
                        <i className="bi bi-exclamation-triangle me-2"></i>Discipline Records
                      </h6>
                      <div className="ps-3">
                        <ul className="list-group list-group-flush border-top border-bottom">
                          {record.disciplineRecords.map((dr, index) => (
                            <li key={index} className="list-group-item px-0 py-2">
                              <span className="badge bg-danger me-2">{dr.type}</span>
                              {dr.description}
                              <div className="text-muted small mt-1">
                                <i className="bi bi-calendar me-1"></i>
                                {new Date(dr.date).toLocaleDateString()}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="mb-0">
                    <h6 className="card-subtitle mb-2 text-muted fw-bold">
                      <i className="bi bi-chat-left-text me-2"></i>Teacher Comments
                    </h6>
                    <div className="ps-3 py-2 bg-light rounded">
                      <p className="mb-0 fst-italic text-dark">{record.teacherComments || "No comments"}</p>
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-light d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    <i className="bi bi-person me-1"></i>{record.recordedBy || "Unknown"}
                  </small>
                  <small className="text-muted">
                    <i className="bi bi-clock-history me-1"></i>
                    {new Date(record.lastUpdated).toLocaleString()}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BehavioralRecordDisplay;