import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const BehavioralRecordForm = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    term: "",
    punctuality: { status: "", comments: "" },
    disciplineRecords: [],
    classroomBehaviour: { rating: 3, comments: "" },
    peerInteraction: { quality: "", comments: "" },
    teacherComments: "",
    recordedBy: user?.name || "",
  });

  const [formErrors, setFormErrors] = useState({
    term: "",
    punctualityStatus: "",
    punctualityComments: "",
    disciplineRecords: [],
    classroomBehaviourComments: "",
    peerInteractionQuality: "",
    peerInteractionComments: "",
    teacherComments: "",
  });

  useEffect(() => {
    if (!user?.email || !token) {
      setError("Please log in to access this page.");
      setLoading(false);
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch students in the teacher's class
        const studentsResponse = await axios.get(
          `${BASE_URL}/api/class-students/${user.email}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStudents(studentsResponse.data.students || []);

        // Fetch behavioral records separately
        const recordsResponse = await axios.get(
          `${BASE_URL}/api/behavioralRecords/${user.email}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecords(recordsResponse.data.records || []);
      } catch (err) {
        setError(
          err.response?.status === 404 &&
            err.response?.data?.message.includes("students")
            ? "No students found in your class."
            : err.response?.status === 404
            ? "No behavioral records found for your class."
            : "Failed to fetch data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.email, token, navigate]);

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setShowModal(false);
    setIsEditing(false);
    setEditingRecord(null);
  };

  const validateField = (name, value) => {
    if (typeof value === "string" && !value.trim()) {
      return "This field is required and cannot be just spaces";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData };
    let newErrors = { ...formErrors };

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      newFormData[parent] = { ...newFormData[parent], [child]: value };
      newErrors[parent + child.charAt(0).toUpperCase() + child.slice(1)] =
        validateField(name, value);
    } else {
      newFormData[name] = value;
      newErrors[name] = validateField(name, value);
    }

    setFormData(newFormData);
    setFormErrors(newErrors);
  };

  const handleRatingChange = (e) => {
    setFormData({
      ...formData,
      classroomBehaviour: {
        ...formData.classroomBehaviour,
        rating: parseInt(e.target.value, 10),
      },
    });
  };

  const addDisciplineRecord = () => {
    setFormData({
      ...formData,
      disciplineRecords: [
        ...formData.disciplineRecords,
        {
          type: "",
          description: "",
          date: new Date().toISOString().slice(0, 10),
        },
      ],
    });
    setFormErrors({
      ...formErrors,
      disciplineRecords: [
        ...formErrors.disciplineRecords,
        { type: "", description: "", date: "" },
      ],
    });
  };

  const handleDisciplineChange = (index, field, value) => {
    const newRecords = [...formData.disciplineRecords];
    newRecords[index][field] = value;
    setFormData({ ...formData, disciplineRecords: newRecords });

    const newDisciplineErrors = [...formErrors.disciplineRecords];
    newDisciplineErrors[index] = {
      ...newDisciplineErrors[index],
      [field]: validateField(`${field}${index}`, value),
    };
    setFormErrors({ ...formErrors, disciplineRecords: newDisciplineErrors });
  };

  const removeDisciplineRecord = (index) => {
    setFormData({
      ...formData,
      disciplineRecords: formData.disciplineRecords.filter(
        (_, i) => i !== index
      ),
    });
    setFormErrors({
      ...formErrors,
      disciplineRecords: formErrors.disciplineRecords.filter(
        (_, i) => i !== index
      ),
    });
  };

  const resetForm = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingRecord(null);
    setFormData({
      term: "",
      punctuality: { status: "", comments: "" },
      disciplineRecords: [],
      classroomBehaviour: { rating: 3, comments: "" },
      peerInteraction: { quality: "", comments: "" },
      teacherComments: "",
      recordedBy: user?.name || "",
    });
    setFormErrors({
      term: "",
      punctualityStatus: "",
      punctualityComments: "",
      disciplineRecords: [],
      classroomBehaviourComments: "",
      peerInteractionQuality: "",
      peerInteractionComments: "",
      teacherComments: "",
    });
  };

  const validateForm = () => {
    const errors = {
      term: validateField("term", formData.term),
      punctualityStatus: validateField(
        "punctuality.status",
        formData.punctuality.status
      ),
      punctualityComments: validateField(
        "punctuality.comments",
        formData.punctuality.comments
      ),
      classroomBehaviourComments: validateField(
        "classroomBehaviour.comments",
        formData.classroomBehaviour.comments
      ),
      peerInteractionQuality: validateField(
        "peerInteraction.quality",
        formData.peerInteraction.quality
      ),
      peerInteractionComments: validateField(
        "peerInteraction.comments",
        formData.peerInteraction.comments
      ),
      teacherComments: validateField(
        "teacherComments",
        formData.teacherComments
      ),
      disciplineRecords: formData.disciplineRecords.map((record, index) => ({
        type: validateField(`disciplineRecords[${index}].type`, record.type),
        description: validateField(
          `disciplineRecords[${index}].description`,
          record.description
        ),
        date: validateField(`disciplineRecords[${index}].date`, record.date),
      })),
    };

    setFormErrors(errors);
    return Object.values(errors).every((error) =>
      typeof error === "string"
        ? !error
        : error.every((e) => !e.type && !e.description && !e.date)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    setLoading(true);
    try {
      let updatedRecord;
      if (isEditing && editingRecord) {
        const response = await axios.put(
          `${BASE_URL}/api/behavioral-records/${editingRecord._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        updatedRecord = response.data.data;
        setRecords(
          records.map((r) => (r._id === editingRecord._id ? updatedRecord : r))
        );
        toast.success("Behavioral record updated successfully");
      } else {
        const response = await axios.post(
          `${BASE_URL}/api/students/${selectedStudent._id}/behavioral-records`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        updatedRecord = response.data.data;
        setRecords([updatedRecord, ...records]); // Add new record to the top of the list
        toast.success("Behavioral record added successfully");
      }
      resetForm();
    } catch (err) {
      console.error("Error saving record:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to save record");
    } finally {
      setLoading(false);
      window.location.reload();
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    setLoading(true);
    try {
      await axios.delete(`${BASE_URL}/api/behavioral-records/${recordId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(records.filter((r) => r._id !== recordId));
      toast.success("Behavioral record deleted successfully");
    } catch (err) {
      console.error("Error deleting record:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to delete record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid my-3 px-2 px-md-4">
      <h3 className="mb-3 text-primary fw-bold">📊 Behavioral Records</h3>

      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      {error && <div className="alert alert-danger text-center">{error}</div>}

      {!loading && !error && (
        <div className="row g-3">
          {/* Student List */}
          <div className="col-12 col-md-4 col-lg-3">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-secondary text-white">
                <h5 className="mb-0">Students</h5>
              </div>
              <div className="card-body p-2">
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Search Student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div
                  className="list-group"
                  style={{ maxHeight: "60vh", overflowY: "auto" }}
                >
                  {students.length === 0 ? (
                    <div className="list-group-item text-center py-3">
                      No students found
                    </div>
                  ) : (
                    students
                      .filter((student) =>
                        student.name
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      )
                      .map((student) => (
                        <button
                          key={student._id}
                          className={`list-group-item list-group-item-action text-start py-2 ${
                            selectedStudent?._id === student._id
                              ? "bg-info"
                              : ""
                          }`}
                          onClick={() => handleStudentClick(student)}
                        >
                          <strong className="text-dark">
                            {student.name || "Unknown"}
                          </strong>
                          <br />
                          <small className="text-dark">
                            Roll: {student.rollNumber || "N/A"}
                          </small>
                        </button>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Student Details */}
          <div className="col-12 col-md-8 col-lg-9">
            {selectedStudent ? (
              <div className="card shadow-sm">
                <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center flex-wrap">
                  <h5 className="mb-0">
                    Records for {selectedStudent.name} (Admission No:{" "}
                    {selectedStudent.admissionNo || "N/A"})
                  </h5>
                  <div className="mt-2 mt-md-0">
                    <button
                      className="btn btn-outline-light btn-sm px-3 py-1"
                      onClick={() => setShowModal(true)}
                    >
                      <FaPlus className="me-1" /> Add
                    </button>
                  </div>
                </div>
                <div className="card-body p-2 p-md-3">
                  <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th scope="col">Term</th>
                          <th scope="col">Punctuality</th>
                          <th scope="col">Classroom Behaviour</th>
                          <th scope="col">Peer Interaction</th>
                          <th scope="col">Comments</th>
                          <th scope="col" className="text-center">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {records
                          .filter(
                            (record) =>
                              record.student._id === selectedStudent._id
                          )
                          .map((record) => (
                            <tr key={record._id}>
                              <td>{record.term}</td>
                              <td>{record.punctuality.status || "N/A"}</td>
                              <td>
                                {record.classroomBehaviour.rating || "N/A"}
                              </td>
                              <td>{record.peerInteraction.quality || "N/A"}</td>
                              <td>{record.teacherComments || "None"}</td>
                              <td className="text-center">
                                <button
                                  className="btn btn-outline-warning btn-sm me-2 px-2 py-1 mb-2"
                                  onClick={() => {
                                    setEditingRecord(record);
                                    setFormData(record);
                                    setIsEditing(true);
                                    setShowModal(true);
                                  }}
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="btn btn-outline-danger btn-sm me-2 px-2 py-1 mb-2"
                                  onClick={() => handleDelete(record._id)}
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))}
                        {records.filter(
                          (r) => r.student._id === selectedStudent._id
                        ).length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center py-3">
                              No records for this student
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-info text-center py-4">
                Select a student to view or manage their records
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  {isEditing
                    ? "Edit Behavioral Record"
                    : "Add New Behavioral Record"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={resetForm}
                ></button>
              </div>
              <div
                className="modal-body"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Term</label>
                    <input
                      type="text"
                      className={`form-control ${
                        formErrors.term ? "is-invalid" : ""
                      }`}
                      name="term"
                      value={formData.term}
                      onChange={handleChange}
                      required
                    />
                    {formErrors.term && (
                      <div className="invalid-feedback">{formErrors.term}</div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Punctuality</label>
                    <select
                      className={`form-select mb-2 ${
                        formErrors.punctualityStatus ? "is-invalid" : ""
                      }`}
                      name="punctuality.status"
                      value={formData.punctuality.status}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Status</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Satisfactory">Satisfactory</option>
                      <option value="Needs Improvement">
                        Needs Improvement
                      </option>
                      <option value="Poor">Poor</option>
                    </select>
                    {formErrors.punctualityStatus && (
                      <div className="invalid-feedback d-block">
                        {formErrors.punctualityStatus}
                      </div>
                    )}
                    <textarea
                      className={`form-control ${
                        formErrors.punctualityComments ? "is-invalid" : ""
                      }`}
                      name="punctuality.comments"
                      value={formData.punctuality.comments}
                      onChange={handleChange}
                      placeholder="Comments"
                      rows="2"
                      required
                    />
                    {formErrors.punctualityComments && (
                      <div className="invalid-feedback">
                        {formErrors.punctualityComments}
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Classroom Behavior
                    </label>
                    <input
                      type="range"
                      className="form-range"
                      min="1"
                      max="5"
                      value={formData.classroomBehaviour.rating}
                      onChange={handleRatingChange}
                    />
                    <small className="d-block text-muted mb-2">
                      Rating: {formData.classroomBehaviour.rating}/5
                    </small>
                    <textarea
                      className={`form-control ${
                        formErrors.classroomBehaviourComments
                          ? "is-invalid"
                          : ""
                      }`}
                      name="classroomBehaviour.comments"
                      value={formData.classroomBehaviour.comments}
                      onChange={handleChange}
                      placeholder="Comments"
                      rows="2"
                      required
                    />
                    {formErrors.classroomBehaviourComments && (
                      <div className="invalid-feedback">
                        {formErrors.classroomBehaviourComments}
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Peer Interaction
                    </label>
                    <select
                      className={`form-select mb-2 ${
                        formErrors.peerInteractionQuality ? "is-invalid" : ""
                      }`}
                      name="peerInteraction.quality"
                      value={formData.peerInteraction.quality}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Quality</option>
                      <option value="Very Interactive">Very Interactive</option>
                      <option value="Friendly">Friendly</option>
                      <option value="Neutral">Neutral</option>
                      <option value="Occasional Conflicts">
                        Occasional Conflicts
                      </option>
                      <option value="Isolated">Isolated</option>
                      <option value="Bullying Behavior">
                        Bullying Behavior
                      </option>
                    </select>
                    {formErrors.peerInteractionQuality && (
                      <div className="invalid-feedback d-block">
                        {formErrors.peerInteractionQuality}
                      </div>
                    )}
                    <textarea
                      className={`form-control ${
                        formErrors.peerInteractionComments ? "is-invalid" : ""
                      }`}
                      name="peerInteraction.comments"
                      value={formData.peerInteraction.comments}
                      onChange={handleChange}
                      placeholder="Comments"
                      rows="2"
                      required
                    />
                    {formErrors.peerInteractionComments && (
                      <div className="invalid-feedback">
                        {formErrors.peerInteractionComments}
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Teacher Comments
                    </label>
                    <textarea
                      className={`form-control ${
                        formErrors.teacherComments ? "is-invalid" : ""
                      }`}
                      name="teacherComments"
                      value={formData.teacherComments}
                      onChange={handleChange}
                      placeholder="Overall comments"
                      rows="3"
                      required
                    />
                    {formErrors.teacherComments && (
                      <div className="invalid-feedback">
                        {formErrors.teacherComments}
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Discipline Records
                    </label>
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm mb-2 px-3 py-1"
                      onClick={addDisciplineRecord}
                    >
                      <FaPlus className="me-1" /> Add Discipline
                    </button>
                    {formData.disciplineRecords.map((record, index) => (
                      <div key={index} className="card mb-2 p-2 shadow-sm">
                        <select
                          className={`form-select mb-1 ${
                            formErrors.disciplineRecords[index]?.type
                              ? "is-invalid"
                              : ""
                          }`}
                          value={record.type}
                          onChange={(e) =>
                            handleDisciplineChange(
                              index,
                              "type",
                              e.target.value
                            )
                          }
                          required
                        >
                          <option value="">Select Type</option>
                          <option value="Verbal Warning">Verbal Warning</option>
                          <option value="Written Warning">
                            Written Warning
                          </option>
                          <option value="Detention">Detention</option>
                          <option value="Parent Conference">
                            Parent Conference
                          </option>
                          <option value="Suspension">Suspension</option>
                          <option value="Expulsion">Expulsion</option>
                          <option value="Other">Other</option>
                        </select>
                        {formErrors.disciplineRecords[index]?.type && (
                          <div className="invalid-feedback d-block">
                            {formErrors.disciplineRecords[index].type}
                          </div>
                        )}
                        <input
                          type="text"
                          className={`form-control mb-1 ${
                            formErrors.disciplineRecords[index]?.description
                              ? "is-invalid"
                              : ""
                          }`}
                          value={record.description}
                          onChange={(e) =>
                            handleDisciplineChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Description"
                          required
                        />
                        {formErrors.disciplineRecords[index]?.description && (
                          <div className="invalid-feedback">
                            {formErrors.disciplineRecords[index].description}
                          </div>
                        )}
                        <input
                          type="date"
                          className={`form-control mb-1 ${
                            formErrors.disciplineRecords[index]?.date
                              ? "is-invalid"
                              : ""
                          }`}
                          value={record.date}
                          onChange={(e) =>
                            handleDisciplineChange(
                              index,
                              "date",
                              e.target.value
                            )
                          }
                          required
                        />
                        {formErrors.disciplineRecords[index]?.date && (
                          <div className="invalid-feedback">
                            {formErrors.disciplineRecords[index].date}
                          </div>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm px-3 py-1"
                          onClick={() => removeDisciplineRecord(index)}
                        >
                          <FaTrash className="me-1" /> Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary px-4 py-2"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : isEditing ? "Update" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4 py-2"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BehavioralRecordForm;