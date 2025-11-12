import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Card,
  Table,
  Button,
  Spinner,
  Alert,
  Form,
  Row,
  Col,
  Badge,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { format } from "date-fns";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const PaymentHistory = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTerm, setFilterTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found. Please log in.");
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        };

        const paymentResponse = await axios.get(
          `${BASE_URL}/api/fees/payment-history/${studentId}`,
          config
        );

        console.log("⭐ Payment History API Response:", paymentResponse.data);

        if (paymentResponse.data && paymentResponse.data.success) {
          const responseData = paymentResponse.data.data; // Adjusted for nested 'data'
          setStudent(responseData.student);
          setPayments(responseData.paymentHistory || []);
          console.log("⭐ Payments Set:", responseData.paymentHistory);
        } else {
          setError(paymentResponse.data.message || "Invalid payment history data");
        }
      } catch (err) {
        console.error("Error fetching payment history:", err);
        setError(
          err.response?.data?.message || "Failed to load payment history"
        );
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchData();
    } else {
      setError("Student ID is required");
      setLoading(false);
    }
  }, [studentId]);

  const handleViewReceipt = (receiptId) => {
    navigate(`/receipt/${receiptId}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleDateRangeChange = (e, field) => {
    setDateRange({
      ...dateRange,
      [field]: e.target.value,
    });
  };

  const resetFilters = () => {
    setFilterTerm("");
    setFilterStatus("");
    setDateRange({ from: "", to: "" });
  };

 // Filter payments based on selected filters
 const filteredPayments = payments.filter((payment) => {
  if (filterTerm && payment.termName !== filterTerm) {
    return false;
  }
  if (filterStatus && payment.status !== filterStatus) {
    return false;
  }
  // Date range filter
const paymentDate = new Date(payment.paymentDate);

// From date filter
if (dateRange.from) {
  const fromDate = new Date(dateRange.from);
  if (paymentDate < fromDate) {
    return false;
  }
}

// To date filter - ensure dates are compared correctly
if (dateRange.to) {
  const toDate = new Date(dateRange.to);
  // Set time to end of day for toDate
  toDate.setHours(23, 59, 59, 999);
  if (paymentDate > toDate) {
    return false;
  }
}
  return true;
});

  console.log("⭐ Filtered Payments:", filteredPayments);

  // Get unique terms for filter dropdown
  const uniqueTerms = [...new Set(payments.map((payment) => payment.termName))];

  // Calculate summary statistics
  const totalPaid = filteredPayments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, payment) => sum + payment.amount, 0);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div
          className="d-flex flex-column align-items-center justify-content-center"
          style={{ minHeight: "50vh" }}
        >
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading payment history...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-primary" onClick={handleBack}>
              Go Back
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid="lg" className="py-4">
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-light text-primary border-bottom">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <h3 className="mb-0">Payment History</h3>
           
          </div>
        </Card.Header>
        <Card.Body className="bg-white">
          {student && (
            <Card className="mb-4 border-0 bg-light">
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h5 className="text-primary">{student.name}</h5>
                    <p className="text-muted mb-0">
                      <strong>Class:</strong> {student.className} |{" "}
                      <strong>Section:</strong> {student.section}
                    </p>
                    <p className="text-muted">
                      <strong>Admission No:</strong> {student.admissionNo}
                    </p>
                  </Col>
                  <Col md={6} className="text-md-end mt-3 mt-md-0">
                    <div className="d-inline-block bg-white p-3 rounded shadow-sm">
                      <h6 className="text-muted mb-1">
                        Total Paid (Successful)
                      </h6>
                      <h4 className="text-success mb-0">
                        ₹{totalPaid.toLocaleString()}
                      </h4>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          <Card className="mb-4 border">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <Button
                    variant="link"
                    className="text-decoration-none p-0 text-dark"
                    onClick={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className={`bi me-2 ${
                        isFiltersCollapsed ? "bi-plus-square" : "bi-dash-square"
                      }`}
                      viewBox="0 0 16 16"
                    >
                      {isFiltersCollapsed ? (
                        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                      ) : (
                        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z" />
                      )}
                    </svg>
                    Filter Payments
                  </Button>
                </h5>
                <Badge bg="info" className="rounded-pill">
                  {filteredPayments.length} of {payments.length} records
                </Badge>
              </div>
            </Card.Header>

            {!isFiltersCollapsed && (
              <Card.Body>
                <Row>
                  <Col md={6} lg={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Term</Form.Label>
                      <Form.Select
                        value={filterTerm}
                        onChange={(e) => setFilterTerm(e.target.value)}
                        className="shadow-sm"
                      >
                        <option value="">All Terms</option>
                        {uniqueTerms.map((term) => (
                          <option key={term} value={term}>
                            {term}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} lg={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="shadow-sm"
                      >
                        <option value="">All Statuses</option>
                        <option value="SUCCESS">Successful</option>
                        <option value="FAILED">Failed</option>
                        <option value="PENDING">Pending</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} lg={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>From Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => handleDateRangeChange(e, "from")}
                        className="shadow-sm"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} lg={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>To Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => handleDateRangeChange(e, "to")}
                        className="shadow-sm"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex justify-content-end">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={resetFilters}
                    className="me-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-x-circle me-1"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 0 0 8 0a8 8 0 0 0 0 16z" />
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                    </svg>
                    Reset Filters
                  </Button>
                </div>
              </Card.Body>
            )}
          </Card>

          {filteredPayments.length === 0 ? (
            payments.length === 0 ? (
              <Alert variant="info" className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  className="bi bi-info-circle mb-3"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 0 0 8 0a8 8 0 0 0 0 16z" />
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                </svg>
                <p>No payment records found for this student.</p>
              </Alert>
            ) : (
              <Alert variant="info" className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  className="bi bi-info-circle mb-3"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 0 0 8 0a8 8 0 0 0 0 16z" />
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                </svg>
                <p>No payment records found matching the selected filters.</p>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={resetFilters}
                >
                  Clear Filters
                </Button>
              </Alert>
            )
          ) : (
            <div className="table-responsive">
              <Table hover className="bg-white border">
                <thead className="bg-light">
                  <tr>
                    <th>Date</th>
                    <th>Receipt ID</th>
                    <th>Term</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.receiptId}>
                      <td>
                        {payment.paymentDate
                          ? format(new Date(payment.paymentDate), "dd MMM yyyy")
                          : "N/A"}
                      </td>
                      <td>
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip>
                              {payment.orderId
                                ? `Order ID: ${payment.orderId}`
                                : "No order ID available"}
                            </Tooltip>
                          }
                        >
                          <span>{payment.receiptId}</span>
                        </OverlayTrigger>
                      </td>
                      <td>{payment.termName}</td>
                      <td>₹{payment.amount.toLocaleString()}</td>
                      <td>{payment.paymentMethod}</td>
                      <td>
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip>
                              {payment.status === "FAILED" &&
                              payment.failureReason
                                ? `Reason: ${payment.failureReason}`
                                : payment.status === "SUCCESS"
                                ? "Payment successful"
                                : "Payment pending"}
                            </Tooltip>
                          }
                        >
                          <Badge
                            bg={
                              payment.status === "SUCCESS"
                                ? "success"
                                : payment.status === "FAILED"
                                ? "danger"
                                : "warning"
                            }
                            pill
                            className="px-3 py-2"
                          >
                            {payment.status}
                          </Badge>
                        </OverlayTrigger>
                      </td>
                      <td>
                        {payment.status === "SUCCESS" ? (
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => handleViewReceipt(payment.receiptId)}
                            className="rounded-pill"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              fill="currentColor"
                              className="bi bi-receipt me-1"
                              viewBox="0 0 16 16"
                            >
                              <path d="M1.92.506a.5.5 0 0 1 .434.14L3 1.293l.646-.647a.5.5 0 0 1 .708 0L5 1.293l.646-.647a.5.5 0 0 1 .708 0L7 1.293l.646-.647a.5.5 0 0 1 .708 0L9 1.293l.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .801.13l.5 1A.5.5 0 0 1 15 2v12a.5.5 0 0 1-.053.224l-.5 1a.5.5 0 0 1-.8.13L13 14.707l-.646.647a.5.5 0 0 1-.708 0L11 14.707l-.646.647a.5.5 0 0 1-.708 0L9 14.707l-.646.647a.5.5 0 0 1-.708 0L7 14.707l-.646.647a.5.5 0 0 1-.708 0L5 14.707l-.646.647a.5.5 0 0 1-.708 0L3 14.707l-.646.647a.5.5 0 0 1-.801-.13l-.5-1A.5.5 0 0 1 1 14V2a.5.5 0 0 1 .053-.224l.5-1a.5.5 0 0 1 .367-.27zm.217 1.338L2 2.118v11.764l.137.274.51-.51a.5.5 0 0 1 .707 0l.646.647.646-.646a.5.5 0 0 1 .708 0l.646.646.646-.646a.5.5 0 0 1 .708 0l.646.646.646-.646a.5.5 0 0 1 .708 0l.646.646.646-.646a.5.5 0 0 1 .708 0l.646.646.646-.646a.5.5 0 0 1 .708 0l.509.509.137-.274V2.118l-.137-.274-.51.51a.5.5 0 0 1-.707 0L12 1.707l-.646.647a.5.5 0 0 1-.708 0L10 1.707l-.646.647a.5.5 0 0 1-.708 0L8 1.707l-.646.647a.5.5 0 0 1-.708 0L6 1.707l-.646.647a.5.5 0 0 1-.708 0L4 1.707l-.646.647a.5.5 0 0 1-.708 0l-.509-.51z" />
                              <path d="M3 4.5a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 1 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm8-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z" />
                            </svg>
                            Receipt
                          </Button>
                        ) : payment.status === "FAILED" ? (
                          <Badge
                            bg="light"
                            text="dark"
                            className="border px-3 py-2"
                          >
                            {payment.failureReason ? "Failed" : "N/A"}
                          </Badge>
                        ) : (
                          <Badge
                            bg="light"
                            text="dark"
                            className="border px-3 py-2"
                          >
                            Pending
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {payments.length > 0 && (
            <Card className="mt-4 bg-light border-0">
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>Payment Summary</h6>
                    <ul className="list-unstyled">
                      <li>
                        <span className="text-muted">Total Records:</span>{" "}
                        <strong>
                          {filteredPayments.length} of {payments.length}
                        </strong>
                      </li>
                      <li>
                        <span className="text-muted">Successful Payments:</span>{" "}
                        <strong>
                          {
                            filteredPayments.filter(
                              (p) => p.status === "SUCCESS"
                            ).length
                          }
                        </strong>
                      </li>
                      <li>
                        <span className="text-muted">Failed Payments:</span>{" "}
                        <strong>
                          {
                            filteredPayments.filter(
                              (p) => p.status === "FAILED"
                            ).length
                          }
                        </strong>
                      </li>
                    </ul>
                  </Col>
                  <Col md={6} className="text-md-end mt-3 mt-md-0">
                    <h5 className="text-muted">Total Amount Paid</h5>
                    <h3 className="text-success">
                      ₹{totalPaid.toLocaleString()}
                    </h3>
                    <p className="text-muted small">
                      (Successful payments only)
                    </p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PaymentHistory;