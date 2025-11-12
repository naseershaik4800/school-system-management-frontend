import "animate.css";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Container, Row, Col, Card, Form, Button, Spinner, InputGroup } from "react-bootstrap";
import EditStudentModal from "./EditStudent";
import StudentTable from "./StudentTable";

// const API_URL = "http://localhost:5000/api";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Please log in to access this feature");
    throw new Error("No token found");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const studentsRes = await axios.get(
        `${BASE_URL}/api/students`,
        getAuthConfig()
      );
      setStudents(studentsRes.data || []);
    } catch (err) {
      toast.error("Failed to fetch data: " + (err.response?.data?.message || err.message));
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;

    try {
      await axios.delete(`${BASE_URL}/api/students/${id}`, getAuthConfig());
      toast.success("Student deleted successfully");
      await fetchData();
    } catch (error) {
      toast.error(`Failed to delete student: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowStudentModal(true);
  };

  const filteredStudents = students.filter((student) =>
    Object.values(student).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Container fluid className="py-4" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Row className="mb-4 align-items-center animate__animated animate__fadeInDown">
        <Col xs={12} md={8}>
          <h1 className="fw-bold text-primary mb-0" style={{ fontSize: "2rem" }}>
            <i className="bi bi-mortarboard-fill me-2"></i>
            School Management Dashboard
          </h1>
          <small className="text-muted">Manage your student records efficiently</small>
        </Col>
        <Col xs={12} md={4} className="text-md-end mt-3 mt-md-0">
          <Button
            variant="success"
            className="shadow-sm animate__animated animate__pulse animate__infinite"
            style={{ animationDuration: "2s" }}
            onClick={() => (window.location.href = "/add-student")}
          >
            <i className="bi bi-person-plus-fill me-2"></i>
            Add Student
          </Button>
        </Col>
      </Row>

      <Row className="mb-4 animate__animated animate__fadeInUp">
        <Col xs={12} md={6} lg={4}>
          <InputGroup className="shadow-sm">
            <InputGroup.Text className="bg-white">
              <i className="bi bi-search text-primary"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search students by name, admission no, etc."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-start-0"
            />
          </InputGroup>
        </Col>
      </Row>

      <Card className="shadow-lg border-0 animate__animated animate__zoomIn" style={{ borderRadius: "15px" }}>
        <Card.Body className="p-4">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" size="lg" />
              <p className="mt-3 text-muted">Loading student data...</p>
            </div>
          ) : (
            <StudentTable students={filteredStudents} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </Card.Body>
      </Card>

      <EditStudentModal
        show={showStudentModal}
        student={editingItem}
        onClose={() => {
          setShowStudentModal(false);
          setEditingItem(null);
        }}
        onUpdate={fetchData}
      />
    </Container>
  );
};

export default StudentList;