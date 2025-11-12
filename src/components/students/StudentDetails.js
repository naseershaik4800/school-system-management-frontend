import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Card,
  Row,
  Col,
  Nav,
  Tab,
  Table,
  Badge,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";
import './StudentDetails.css';
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

const StudentDetailsPage = ({ role = "parent" }) => {
  const { id, childId } = useParams();
  const studentId = id || childId;
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [healthRecord, setHealthRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  console.log(`Params: id=${id}, childId=${childId}, role=${role}, studentId=${studentId}`);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (!studentId || studentId === "undefined") {
        setError("Invalid student ID");
        setLoading(false);
        return;
      }

      try {
        const config = getAuthConfig();
        console.log("Fetching student with token:", localStorage.getItem("token"));

        const studentResponse = await axios.get(
          `${BASE_URL}/api/students/${studentId}`,
          config
        );
        const studentData = studentResponse.data.student || studentResponse.data;
        setStudent(studentData);
        console.log("⭐ Student Data:", studentData);

        if (studentData.healthRecord) {
          const healthResponse = await axios.get(
            `${BASE_URL}/api/health-records/${studentData.healthRecord}`,
            config
          );
          setHealthRecord(healthResponse.data);
          console.log("⭐ Health Record:", healthResponse.data);
        }
      } catch (err) {
        console.error("Error fetching student details:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          toast.error("Session expired or unauthorized. Please log in again.");
          navigate("/login");
        } else if (err.response?.status === 403) {
          setError("Access denied: You do not have permission to view this student.");
          toast.error("Access denied");
        } else {
          setError(
            err.response?.data?.message || "Error fetching student details"
          );
          toast.error("Failed to load student details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [studentId, navigate, role]);

  // Function to handle printing the ID card
  const handlePrint = () => {
    const printContent = document.getElementById("id-card-content").innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Student ID Card</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .id-card { 
              width: 300px; 
              border: 2px solid #007bff; 
              border-radius: 10px; 
              padding: 20px; 
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .id-card img { 
              width: 100px; 
              height: 100px; 
              border-radius: 50%; 
              margin-bottom: 15px; 
            }
            .id-card h4 { margin: 10px 0; color: #007bff; }
            .id-card p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="id-card">${printContent}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading student details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="text-center mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!student) {
    return (
      <Container className="text-center mt-5">
        <Alert variant="warning">No student data found</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4" style={{ backgroundColor: "#f8f9fa" }}>
      <Card
        className="shadow-sm animate__animated animate__fadeIn"
        style={{ borderRadius: "15px", backgroundColor: "#fff" }}
      >
        <Card.Body className="p-4">
          <Row className="align-items-center mb-4">
            <Col xs={12} md={9}>
              <h2 className="fw-bold text-primary mb-1">{student.name}</h2>
              <p className="text-muted mb-1">
                {student.className} - {student.section}
              </p>
              <p className="text-muted mb-0">{student.email}</p>
            </Col>
            {role === "admin" && (
              <Col xs={12} md={3} className="text-md-end mt-3 mt-md-0">
                <Button variant="primary">Edit Student</Button>
              </Col>
            )}
          </Row>

          <Tab.Container id="student-tabs" defaultActiveKey="personalInfo">
            <Nav
              variant="tabs"
              className="mb-3"
              style={{ backgroundColor: "#e9ecef" }}
            >
              <Nav.Item>
                <Nav.Link
                  eventKey="personalInfo"
                  className="fw-semibold text-primary"
                >
                  Personal Info
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="fees" className="fw-semibold text-primary">
                  Fee Details
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  eventKey="additionalInfo"
                  className="fw-semibold text-primary"
                >
                  Additional Info
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  eventKey="printIdCard"
                  className="fw-semibold text-primary"
                >
                  Print ID Card
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              {/* Personal Information */}
              <Tab.Pane eventKey="personalInfo" className="fade">
                <Row>
                  <Col xs={12} md={6}>
                    <Card className="p-3 mb-3">
                      <h5 className="fw-semibold text-primary">
                        Personal Details
                      </h5>
                      <p>
                        <strong>Admission No:</strong> {student.admissionNo}
                      </p>
                      <p>
                        <strong>Roll Number:</strong> {student.rollNumber}
                      </p>
                      <p>
                        <strong>Name:</strong> {student.name}
                      </p>
                      <p>
                        <strong>Date of Birth:</strong>{" "}
                        {student.dateOfBirth
                          ? new Date(student.dateOfBirth).toLocaleDateString()
                          : "N/A"}
                      </p>
                      <p>
                        <strong>Gender:</strong> {student.gender}
                      </p>
                      <p>
                        <strong>Class:</strong> {student.className}
                      </p>
                      <p>
                        <strong>Section:</strong> {student.section}
                      </p>
                      <p>
                        <strong>Phone:</strong> {student.phone}
                      </p>
                      <p>
                        <strong>Email:</strong> {student.email}
                      </p>
                      <p>
                        <strong>Address:</strong>{" "}
                        {student.address
                          ? `${student.address.street}, ${student.address.city}, 
                            ${student.address.state}, ${student.address.zipCode}, 
                            ${student.address.country}`
                          : "N/A"}
                      </p>
                      <p>
                        <strong>Password:</strong> {student.password}
                      </p>
                    </Card>
                  </Col>
                  <Col xs={12} md={6}>
                    {student.emergencyContact && (
                      <Card className="p-3 mb-3 bg-primary text-white">
                        <h5>Emergency Contact</h5>
                        <p>
                          <strong style={{ color: "white" }}>Name:</strong>{" "}
                          {student.emergencyContact.name}
                        </p>
                        <p>
                          <strong style={{ color: "white" }}>Relation:</strong>{" "}
                          {student.emergencyContact.relation}
                        </p>
                        <p>
                          <strong style={{ color: "white" }}>Phone:</strong>{" "}
                          {student.emergencyContact.phone}
                        </p>
                      </Card>
                    )}
                    {student.parents?.length > 0 && (
                      <Card className="p-3 mb-3">
                        <h5>Parents Information</h5>
                        {student.parents.map((parent, index) => (
                          <p key={index}>
                            <strong>Parent {index + 1}:</strong>{" "}
                            {typeof parent === "object" ? parent.name : parent}
                          </p>
                        ))}
                      </Card>
                    )}
                  </Col>
                </Row>

                {healthRecord && (
                  <Card className="p-3 mt-3">
                    <h5 className="fw-semibold text-primary">Health Record</h5>
                    <Row>
                      <Col xs={12} md={6}>
                        <p>
                          <strong>Blood Group:</strong>{" "}
                          {healthRecord.bloodGroup || "N/A"}
                        </p>
                        <p>
                          <strong>Height:</strong>{" "}
                          {healthRecord.height
                            ? `${healthRecord.height.value} ${healthRecord.height.unit}`
                            : "N/A"}
                        </p>
                        <p>
                          <strong>Weight:</strong>{" "}
                          {healthRecord.weight
                            ? `${healthRecord.weight.value} ${healthRecord.weight.unit}`
                            : "N/A"}
                        </p>
                        <p>
                          <strong>Allergies:</strong>{" "}
                          {healthRecord.allergies?.length
                            ? healthRecord.allergies.join(", ")
                            : "None"}
                        </p>
                        <p>
                          <strong>Emergency Notes:</strong>{" "}
                          {healthRecord.emergencyNotes || "None"}
                        </p>
                      </Col>
                      <Col xs={12} md={6}>
                        {healthRecord.lastCheckup && (
                          <>
                            <p>
                              <strong>Last Checkup Date:</strong>{" "}
                              {new Date(
                                healthRecord.lastCheckup.date
                              ).toLocaleDateString()}
                            </p>
                          </>
                        )}
                      </Col>
                    </Row>

                    {healthRecord.chronicConditions?.length > 0 && (
                      <div className="mt-3">
                        <h6>Chronic Conditions</h6>
                        <Table responsive bordered>
                          <thead className="table-light">
                            <tr>
                              <th>Condition</th>
                              <th>Diagnosed Date</th>
                              <th>Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {healthRecord.chronicConditions.map(
                              (condition, index) => (
                                <tr key={index}>
                                  <td>{condition.condition}</td>
                                  <td>
                                    {condition.diagnosedDate
                                      ? new Date(
                                          condition.diagnosedDate
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </td>
                                  <td>{condition.notes || "N/A"}</td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card>
                )}
              </Tab.Pane>

              {/* Fee Details */}
              <Tab.Pane eventKey="fees" className="fade">
                <Card className="p-4 shadow-lg border-0 rounded-4">
                  <h4 className="fw-bold text-primary mb-3">
                    <i className="bi bi-cash-stack me-2"></i> Fee Details
                  </h4>

                  {student.feeDetails ? (
                    <>
                      <Row className="mb-3">
                        <Col xs={12} md={6}>
                          <p className="fs-5">
                            <strong>Total Fee:</strong> ₹
                            {student.feeDetails.totalFee}
                          </p>
                          <p className="fs-6 text-muted">
                            <i className="bi bi-credit-card me-1"></i>
                            <strong>Payment Option:</strong>{" "}
                            {student.feeDetails.paymentOption}
                          </p>
                        </Col>
                      </Row>

                      <h5 className="fw-semibold mt-3">Installment Details</h5>
                      <div className="table-responsive">
                        <Table bordered hover className="shadow-sm rounded-3">
                          <thead className="table-primary text-center">
                            <tr>
                              <th>Term Name</th>
                              <th>Amount</th>
                              <th>Due Date</th>
                              <th>Paid Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody className="text-center">
                            {student.feeDetails.terms?.length > 0 ? (
                              student.feeDetails.terms.map((term, index) => (
                                <tr
                                  key={index}
                                  className={
                                    index % 2 === 0 ? "table-light" : ""
                                  }
                                >
                                  <td>{term.termName}</td>
                                  <td>₹{term.amount}</td>
                                  <td>
                                    {term.dueDate
                                      ? new Date(
                                          term.dueDate
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </td>
                                  <td>₹{term.paidAmount}</td>
                                  <td>
                                    <Badge
                                      bg={
                                        term.status === "Paid"
                                          ? "success"
                                          : "warning"
                                      }
                                      className="text-white px-3 py-2 rounded-pill"
                                    >
                                      {term.status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan="5"
                                  className="text-center text-muted"
                                >
                                  <i className="bi bi-info-circle me-1"></i> No
                                  installment details available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>

                      <h5 className="fw-semibold mt-4">Payment History</h5>
                      <div className="table-responsive">
                        <Table bordered hover className="shadow-sm rounded-3">
                          <thead className="table-success text-center">
                            <tr>
                              <th>Amount Paid</th>
                              <th>Payment Date</th>
                              <th>Payment Method</th>
                              <th>Receipt No.</th>
                              <th>Status</th>
                              <th>Term Paid</th>
                            </tr>
                          </thead>
                          <tbody className="text-center">
                            {student.feeDetails.paymentHistory?.length > 0 ? (
                              student.feeDetails.paymentHistory.map(
                                (payment, index) => (
                                  <tr
                                    key={index}
                                    className={
                                      index % 2 === 0 ? "table-light" : ""
                                    }
                                  >
                                    <td>₹{payment.amountPaid}</td>
                                    <td>
                                      {payment.paymentDate
                                        ? new Date(
                                            payment.paymentDate
                                          ).toLocaleDateString()
                                        : "N/A"}
                                    </td>
                                    <td>
                                      <i className="bi bi-wallet me-1"></i>{" "}
                                      {payment.paymentMethod}
                                    </td>
                                    <td>{payment.receiptNumber}</td>
                                    <td>
                                      <Badge
                                        bg={
                                          payment.status === "SUCCESS"
                                            ? "success"
                                            : payment.status === "FAILED"
                                            ? "danger"
                                            : "warning"
                                        }
                                        className="text-white px-3 py-2 rounded-pill"
                                      >
                                        {payment.status}
                                      </Badge>
                                    </td>
                                    <td>
                                      {payment.termName ||
                                        payment.termPaid ||
                                        "N/A"}
                                    </td>
                                  </tr>
                                )
                              )
                            ) : (
                              <tr>
                                <td
                                  colSpan="6"
                                  className="text-center text-muted"
                                >
                                  <i className="bi bi-info-circle me-1"></i> No
                                  payment history available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>

                      {role === "admin" && (
                        <div className="text-center mt-4">
                          <Button
                            variant="primary"
                            className="px-4 py-2 fw-bold shadow-sm"
                          >
                            <i className="bi bi-gear-fill me-2"></i> Manage Fees
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <Alert variant="info" className="text-center">
                      <i className="bi bi-exclamation-triangle me-2"></i> No fee
                      details available
                    </Alert>
                  )}
                </Card>
              </Tab.Pane>

              {/* Additional Information */}
              <Tab.Pane eventKey="additionalInfo" className="fade">
                <Card className="p-3">
                  <h5 className="fw-semibold text-primary">
                    Additional Information
                  </h5>
                  {student.busRoute && (
                    <div className="mb-4">
                      <h6>Bus Route Details</h6>
                      <Row>
                        <Col xs={12} md={6}>
                          <p>
                            <strong>Route Number:</strong>{" "}
                            {student.busRoute.routeNumber || "N/A"}
                          </p>
                          <p>
                            <strong>Pickup Location:</strong>{" "}
                            {student.busRoute.pickupLocation || "N/A"}
                          </p>
                        </Col>
                        <Col xs={12} md={6}>
                          <p>
                            <strong>Drop Location:</strong>{" "}
                            {student.busRoute.dropLocation || "N/A"}
                          </p>
                          <p>
                            <strong>Driver:</strong>{" "}
                            {student.busRoute.driverName
                              ? `${student.busRoute.driverName} (${
                                  student.busRoute.driverContact || "N/A"
                                })`
                              : "N/A"}
                          </p>
                        </Col>
                      </Row>
                    </div>
                  )}
                </Card>
              </Tab.Pane>

              {/* Print ID Card */}
              <Tab.Pane eventKey="printIdCard" className="fade">
                <div className="p-4 justify-content-center d-flex IdCard">
                  <Card className="p-4">
                    <h5 className="fw-semibold text-primary mb-4 text-center">
                      Student ID Card
                    </h5>
                    <div id="id-card-content" className="text-center cardstyle">
                      <p>
                        <strong>SkillBridge School</strong>
                      </p>
                      <img
                        src={`${BASE_URL}/uploads/${student.profilePicture}`}
                        alt="Student"
                        className="rounded-circle mb-3"
                        style={{ width: "100px", height: "100px" }}
                        onError={(e) =>
                          (e.target.src = "https://via.placeholder.com/100")
                        }
                      />
                      <h4 className="mt-4">{student.name}</h4>
                      <p style={{ color: "rgb(107,7,131)" }}>
                        <strong>Admission No:</strong> {student.admissionNo}
                      </p>
                      <p style={{ color: "rgb(107,7,131)" }}>
                        <strong>Class:</strong> {student.className} -{" "}
                        {student.section}
                      </p>
                      <p style={{ color: "rgb(107,7,131)" }}>
                        <strong>Roll No:</strong> {student.rollNumber}
                      </p>
                      <p style={{ color: "rgb(107,7,131)" }}>
                        <strong>Phone:</strong> {student.phone}
                      </p>
                      <p style={{ color: "rgb(107,7,131)" }}>
                        <strong>Blood Group:</strong>{" "}
                        {healthRecord?.bloodGroup || "N/A"}
                      </p>
                    </div>
                    <div className="text-center mt-4">
                      <Button variant="primary" onClick={handlePrint}>
                        Print ID Card
                      </Button>
                    </div>
                  </Card>
                </div>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default StudentDetailsPage;