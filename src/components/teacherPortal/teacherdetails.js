import React, { useState, useEffect } from "react";
import { Row, Col, Card, Table, Modal, Form, Button, Image, Badge } from "react-bootstrap";
import axios from "axios";
import "./TeacherDetails.css"

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

function TeacherDetails() {
  const [teacherDetails, setTeacherDetails] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    subject: "",
    type: "Homework",
    description: "",
    syllabus: "",
    className: "",
    section: "",
    dueDate: "",
  });

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!token || !user?.email) {
        setError("Missing authentication data. Please log in.");
        return;
      }

      // Fetch teacher details (assuming /api/teachers1 remains unchanged)
      const teacherResponse = await axios.get(
        `${BASE_URL}/api/teachers1?email=${user.email}`,
        config
      );

      if (teacherResponse.status === 200) {
        setTeacherDetails(teacherResponse.data.data);
        setTimetable(teacherResponse.data.data.timetable || []);
      }

      // Fetch assignments using updated endpoint
      const assignmentsResponse = await axios.get(
        `${BASE_URL}/get/assignments?email=${user.email}`,
        config // Add auth header
      );

      if (assignmentsResponse.status === 200) {
        const fetchedAssignments = assignmentsResponse.data.assignments;
        setTimetable((prevTimetable) =>
          prevTimetable.map((slot) => {
            const [className, section] = slot.class.split("-").map((s) => s.trim());
            const matchingAssignment = fetchedAssignments.find(
              (a) =>
                a.assignment?.className?.trim() === className &&
                a.assignment.section?.trim() === section
            );
            return { ...slot, assignment: matchingAssignment ? matchingAssignment.assignment : null };
          })
        );
      }

      setError("");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignment, index) => {
    if (!assignment || !assignment.title) {
      alert("No assignment to delete.");
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const response = await axios.delete(`${BASE_URL}/delete/assignment`, {
        ...config, // Add auth header
        data: { email: user.email, title: assignment.title },
      });

      if (response.status === 200) {
        alert("Assignment deleted successfully");
        const updatedTimetable = [...timetable];
        updatedTimetable[index].assignment = null; // Clear assignment data
        setTimetable(updatedTimetable);
      } else {
        alert("Failed to delete assignment");
      }
    } catch (error) {
      alert("Error deleting assignment: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWorkClick = (index) => {
    if (!teacherDetails || !timetable[index]) return;
    setSelectedSlot(index);
    const slot = timetable[index];

    const [classNamePart, sectionPart] = slot.class.split("-");
    let className = slot.class;
    let section = "";

    if (sectionPart) {
      className = classNamePart.trim();
      section = sectionPart.trim();
    }

    setAssignmentForm({
      title: "",
      subject: teacherDetails.subject || "",
      type: "Homework",
      description: "",
      syllabus: "",
      className,
      section,
      dueDate: "",
    });

    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedSlot(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setAssignmentForm((prev) => {
      let updatedForm = { ...prev, [name]: value };
      if (name === "type") {
        updatedForm.title = `${value} for ${prev.className} ${prev.section}`;
      }
      return updatedForm;
    });
  };

  const handleAssignWorkSubmit = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const response = await axios.post(
        `${BASE_URL}/add/assignment`,
        { email: user.email, assignment: assignmentForm },
        config // Add auth header
      );

      const updatedTimetable = [...timetable];
      if (response.status === 200) {
        alert("Assignment updated successfully");
        updatedTimetable[selectedSlot] = {
          ...updatedTimetable[selectedSlot],
          assignment: assignmentForm,
        };
      } else if (response.status === 201) {
        alert("Assignment saved successfully");
        updatedTimetable[selectedSlot] = {
          ...updatedTimetable[selectedSlot],
          assignment: response.data.newAssignment.assignment,
        };
        setAssignmentForm({
          title: "",
          subject: "",
          type: "Homework",
          description: "",
          syllabus: "",
          className: "",
          section: "",
          dueDate: "",
        });
      }

      setTimetable(updatedTimetable);
      handleModalClose();
    } catch (error) {
      alert("Failed to save assignment: " + (error.response?.data?.message || error.message));
      setError("Failed to assign work: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const futureWork = timetable
    .map((slot, index) => ({ ...slot, index }))
    .filter(
      (slot) =>
        slot.assignment &&
        slot.assignment.dueDate &&
        new Date(slot.assignment.dueDate) > new Date(today) &&
        slot.assignment.type !== "Homework"
    )
    .sort((a, b) => new Date(a.assignment.dueDate) - new Date(b.assignment.dueDate));

  const getProfilePicUrl = () => {
    return teacherDetails?.profilePic
      ? `${BASE_URL}/${teacherDetails.profilePic}`
      : "https://via.placeholder.com/100";
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Teacher Dashboard</h1>
      {loading && <p className="loading-text">Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      {!teacherDetails ? (
        <p className="loading-text">Loading teacher details...</p>
      ) : (
        <>
          {/* Teacher Details Section */}
          <div className="teacher-header mb-4">
            <Row className="align-items-center">
              <Col md={2} className="text-center">
                <Image
                  src={getProfilePicUrl()}
                  roundedCircle
                  className="profile-pic Kd-pic"
                  alt="Profile Picture"
                />
              </Col>
              <Col md={10}>
                <h2 className="teacher-name Kd-tn">{teacherDetails.name}</h2>
                <p className="teacher-info Kd-info">
                  <span className="Kd-sp"><strong>ID:</strong> {teacherDetails.teacherId}</span>
                  <span className="Kd-sp"><strong>Email:</strong> {teacherDetails.email}</span> |
                  <span className="Kd-sp"><strong>Phone No:</strong> {teacherDetails.phoneno}</span> |
                  <span className="Kd-sp"><strong>Subject:</strong> {teacherDetails.subject}</span> |
                  <span className="Kd-sp"><strong>Qualification:</strong> {teacherDetails.qualification}</span> |
                  <span className="Kd-sp"><strong>Joining Date:</strong> {teacherDetails.joiningDate}</span> |
                  <span className="Kd-sp"><strong>Address:</strong> {teacherDetails.address}</span>
                </p>
              </Col>
            </Row>
          </div>

          {/* Timetable Section */}
          <Card className="timetable-card mb-4 Kd-tb">
            <Card.Header className="timetable-header Kd-hea">
              <h5 className="Kd-cls">Timetable</h5>
            </Card.Header>
            <Card.Body>
              {timetable.length > 0 ? (
                <Table responsive className="timetable-table Kd-tb1">
                  <thead className="Kd-th4">
                    <tr>
                      <th className="Kd-t">Time</th>
                      <th className="Kd-t">Class</th>
                      <th className="Kd-t">Assignment</th>
                      <th className="Kd-t">Action</th>
                    </tr>
                  </thead>
                  <tbody>
  {timetable.map((slot, index) => {
    const isBreak = slot.class.toLowerCase() === "break";
    const isLunch = slot.class.toLowerCase() === "lunch"; // Added check for "Lunch"
    const rowBg = isBreak
      ? 'rgb(107, 7, 131)'
      : index % 2 === 0
      ? 'rgba(221, 237, 255, 0.5)'
      : 'rgba(255, 193, 7, 0.1)';
    const hoverBg = isBreak ? 'rgb(92, 6, 110)' : 'rgba(255,255,255,0.95)';
    return (
      <tr
        key={index}
        className={isBreak ? "break-row" : ""}
        style={{
          backgroundColor: rowBg,
          color: isBreak ? '#fff' : '#333',
          transition: 'background-color 0.3s ease',
          cursor: isBreak ? 'default' : 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = hoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = rowBg;
        }}
      >
        <td style={{ padding: '12px', fontWeight: '500' }}>{slot.time}</td>
        <td style={{ padding: '12px', fontWeight: '600' }}>{slot.class}</td>
        <td style={{ padding: '12px' }}>
          {slot.assignment ? (
            <div>
              <strong
                style={{
                  color: isBreak ? '#fff' : 'rgb(107, 7, 131)',
                  display: 'block',
                  marginBottom: '4px'
                }}
              >
                {slot.assignment.title}
              </strong>
              <Badge className="Kd-bad"
                bg={slot.assignment.type === "Assignment" ? "info" : "warning"}
              >
                {slot.assignment.type}
              </Badge>
              <p style={{ marginTop: '4px', marginBottom: '4px' }}>{slot.assignment.description}</p>
              {slot.assignment.dueDate && (
                <p
                  className="due-date Kd-date"
                >
                  Due: {new Date(slot.assignment.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <span
              className="no-assignment"
              style={{
                fontStyle: 'italic',
                color: isBreak ? '#ccc' : '#777'
              }}
            >
              No assignment
            </span>
          )}
        </td>
        <td style={{ padding: '12px' }}>
          {!isBreak && !isLunch && (  // Added !isLunch condition
            <>
              {!slot.assignment && (
                <Button
                  variant="outline-primary"
                  className="action-btn Kd-act"
                  onClick={() => handleAssignWorkClick(index)}
                  disabled={loading}
                >
                  Assign
                </Button>
              )}
              {slot.assignment && (
                <Button
                  variant="outline-danger"
                  className="action-btn Kd-act1"
                  onClick={() => handleDeleteAssignment(slot.assignment, index)}
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
            </>
          )}
        </td>
      </tr>
    );
  })}
</tbody>
                </Table>
              ) : (
                <p className="no-data Kd-no">No timetable available.</p>
              )}
            </Card.Body>
          </Card>

          {/* Upcoming Assignments & Projects */}
          <Card className="upcoming-card mb-4 Kd-card">
            <Card.Header className="upcoming-header Kd-head">
              <h5>Upcoming Assignments & Projects</h5>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
    {futureWork.length > 0 ? (
      <Row>
        {futureWork.map((slot) => {
          const daysLeft = Math.ceil(
            (new Date(slot.assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
          );
          return (
            <Col md={4} key={slot.index} className="mb-3">
              <Card
                className={`work-card Kd-cs ${daysLeft < 3 ? 'urgent' : ''}`}
              
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0, 0, 0, 0.08)';
                }}
              >
                <Card.Body>
                  <Card.Title className="Kd-til"
                   
                  >
                    {slot.assignment.title}
                  </Card.Title>
                  <Card.Subtitle
                    className="mb-2 text-muted Kd-til1"
                    
                  >
                    {slot.assignment.type} &mdash; Class: {slot.class}
                  </Card.Subtitle>
                  <p style={{ marginBottom: '6px', fontSize: '14px' }}>
                    <strong>Subject:</strong> {slot.assignment.subject}
                  </p>
                  <p style={{ marginBottom: '6px', fontSize: '14px' }}>
                    <strong>Description:</strong> {slot.assignment.description}
                  </p>
                  <p style={{ marginBottom: '6px', fontSize: '14px' }}>
                    <strong>Syllabus:</strong> {slot.assignment.syllabus || 'N/A'}
                  </p>
                  <p
                    className="due-date Kd-date1"
                    
                  >
                    <strong>Due:</strong> {new Date(slot.assignment.dueDate).toLocaleDateString()}
                    {daysLeft < 3 && (
                      <Badge
                        bg="danger"
                        className="ms-2 Kd-bg1"
                        
                      >
                        Urgent
                      </Badge>
                    )}
                  </p>
                  <Button
                    variant="outline-primary"
                    className="action-btn Kd-acts"
                    onClick={() => handleAssignWorkClick(slot.index)}
                    disabled={loading}
                   
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(107, 7, 131, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Edit Work
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    ) : (
      <p
        className="no-data Kd-data"
      
      >
        No upcoming assignments or projects.
      </p>
    )}
  </Card.Body>
          </Card>

          {/* Assign Work Modal */}
          <Modal
  show={showModal}
  onHide={handleModalClose}
  className="custom-modal"
  centered
  style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
>
  <Modal.Header
    closeButton
    className="modal-header Kd-modal"
    
  >
    <Modal.Title>
      {selectedSlot !== null && timetable[selectedSlot]?.assignment ? "Edit" : "Assign"} Work
      {selectedSlot !== null && ` for ${timetable[selectedSlot]?.time}`}
      {assignmentForm.className && assignmentForm.section && ` - ${assignmentForm.className} ${assignmentForm.section}`}
    </Modal.Title>
  </Modal.Header>

  <Modal.Body
    className="modal-body Kd-bd"
   
  >
    <Form>
      {[ 
        { label: "Title", type: "text", name: "title", value: assignmentForm.title, readOnly: false },
        { label: "Class", type: "text", name: "className", value: assignmentForm?.className || "", readOnly: true },
        { label: "Section", type: "text", name: "section", value: assignmentForm?.section || "", readOnly: true },
        { label: "Subject", type: "text", name: "subject", value: assignmentForm.subject, readOnly: true },
      ].map((field, idx) => (
        <Form.Group className="mb-3" key={idx}>
          <Form.Label style={{ fontWeight: '600', fontSize: '15px' }}>{field.label}</Form.Label>
          <Form.Control
            type={field.type}
            name={field.name}
            value={field.value}
            onChange={handleFormChange}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className="form-input Kd-fr"
            readOnly={field.readOnly}
           
          />
        </Form.Group>
      ))}

      <Form.Group className="mb-3">
        <Form.Label style={{ fontWeight: '600', fontSize: '15px' }}>Type</Form.Label>
        <Form.Select
          name="type"
          value={assignmentForm.type}
          onChange={handleFormChange}
          className="form-input Kd-inpt"
          
        >
          <option value="Assignment">Assignment</option>
          <option value="Project">Project</option>
          <option value="Homework">Homework</option>
        </Form.Select>
      </Form.Group>

      {["description", "syllabus"].map((field, idx) => (
        <Form.Group className="mb-3" key={idx}>
          <Form.Label style={{ fontWeight: '600', fontSize: '15px' }}>
            {field.charAt(0).toUpperCase() + field.slice(1)}
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={field === "description" ? 3 : 2}
            name={field}
            value={assignmentForm[field]}
            onChange={handleFormChange}
            placeholder={`Enter ${field}`}
            className="form-input Kd-inpt"
           
          />
        </Form.Group>
      ))}

      <Form.Group className="mb-3">
        <Form.Label style={{ fontWeight: '600', fontSize: '15px' }}>Due Date</Form.Label>
        <Form.Control
          type="date"
          name="dueDate"
          value={assignmentForm.dueDate}
          onChange={handleFormChange}
          min={new Date(new Date().setDate(new Date().getDate() + 1))
            .toISOString()
            .split("T")[0]}
          className="form-input Kd-inpt1"
         
        />
      </Form.Group>
    </Form>
  </Modal.Body>

  <Modal.Footer
    className="modal-footer Kd-foots"
    style={{
    
    }}
  >
    <Button
      variant="secondary"
      onClick={handleModalClose}
      className="modal-btn Kd-bs"
    
    >
      Cancel
    </Button>
    <Button
      variant="primary"
      onClick={handleAssignWorkSubmit}
      disabled={loading || !assignmentForm.title || !assignmentForm.dueDate}
      className="modal-btn Kd-bs"
      
    >
      {loading ? "Submitting..." : "Submit"}
    </Button>
  </Modal.Footer>
</Modal>
        </>
      )}

      
    </div>
  );
}

export default TeacherDetails;