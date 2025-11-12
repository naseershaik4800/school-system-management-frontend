import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Card,
  Form,
  Button,
  Row,
  Col,
  Alert,
  Spinner,
  Table,
} from "react-bootstrap";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const PaymentForm = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [amount, setAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    const fetchStudentData = async () => {
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

        const response = await axios.get(
          `${BASE_URL}/api/fees/${studentId}`,
          config
        );

        // Log the full response for debugging
        console.log("API Response:", response.data);

        // Check if response contains valid student data
        const studentData = response.data.student || response.data.data || response.data;
        if (studentData && studentData.name && studentData.feeDetails) {
          setStudent(studentData);
          setCustomerName(studentData.name);
          setCustomerEmail(studentData.email || "");
          setCustomerPhone(studentData.phone || "");

          const params = new URLSearchParams(location.search);
          const termId = params.get("termId");

          if (termId) {
            const term = studentData.feeDetails.terms.find(
              (t) => t._id === termId
            );
            if (term) {
              setSelectedTerm(termId);
              const remainingAmount = term.amount - (term.paidAmount || 0);
              setAmount(remainingAmount > 0 ? remainingAmount : term.amount);
            }
          }
        } else {
          setError("Invalid student data received from server");
        }
      } catch (err) {
        console.error("Error fetching student data:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load student information"
        );
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchStudentData();
    } else {
      setLoading(false);
      setError("Student ID is required");
    }
  }, [studentId, location.search]);

  const handleTermChange = (e) => {
    const termId = e.target.value;
    setSelectedTerm(termId);

    if (termId && student) {
      const term = student.feeDetails.terms.find((t) => t._id === termId);
      if (term) {
        const remainingAmount = term.amount - (term.paidAmount || 0);
        setAmount(remainingAmount > 0 ? remainingAmount : term.amount);
      }
    } else {
      setAmount("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!customerEmail || !customerPhone) {
      setError("Email and phone number are required");
      return;
    }

    try {
      setPaymentProcessing(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const paymentData = {
        studentId,
        termId: selectedTerm,
        amount: parseFloat(amount),
        customerName,
        customerEmail,
        customerPhone,
      };

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const response = await axios.post(
        `${BASE_URL}/api/fees/initiate-payment`,
        paymentData,
        config
      );

      if (response.data && response.data.paymentLink) {
        window.location.href = response.data.paymentLink;
      } else {
        setError("Invalid response from payment service");
        setPaymentProcessing(false);
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
      setError(
        err.response?.data?.message || "Failed to initiate payment"
      );
      setPaymentProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading payment form...</p>
      </Container>
    );
  }

  if (error && !student) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button
              variant="outline-primary"
              onClick={() => navigate("/dashboard")}
            >
              Return to Dashboard
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-primary text-white py-3">
              <h3 className="mb-0">Fee Payment</h3>
            </Card.Header>
            <Card.Body className="p-4">
              {student && (
                <div className="mb-4">
                  <h5>{student.name}</h5>
                  <p className="text-muted mb-0">
                    Class: {student.className} | Section: {student.section}
                  </p>
                  <p className="text-muted">
                    Admission No: {student.admissionNo}
                  </p>
                </div>
              )}

              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              {student && student.feeDetails && (
                <div className="mb-4">
                  <h5>Fee Summary</h5>
                  <Table responsive striped className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Total Fee</th>
                        <th>Paid Amount</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>₹{student.feeDetails.totalFee.toLocaleString()}</td>
                        <td>
                          ₹
                          {student.feeDetails.terms
                            .reduce(
                              (sum, term) => sum + (term.paidAmount || 0),
                              0
                            )
                            .toLocaleString()}
                        </td>
                        <td>
                          ₹
                          {(
                            student.feeDetails.totalFee -
                            student.feeDetails.terms.reduce(
                              (sum, term) => sum + (term.paidAmount || 0),
                              0
                            )
                          ).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Term</Form.Label>
                  <Form.Select
                    value={selectedTerm}
                    onChange={handleTermChange}
                    required
                    disabled={paymentProcessing}
                  >
                    <option value="">Select a term</option>
                    {student &&
                      student.feeDetails &&
                      student.feeDetails.terms.map((term) => (
                        <option
                          key={term._id}
                          value={term._id}
                          disabled={term.status === "Paid"}
                        >
                          {term.termName} - ₹{term.amount.toLocaleString()} (
                          {term.status === "Paid"
                            ? "Paid"
                            : term.status === "Partial"
                            ? `₹${term.paidAmount.toLocaleString()} paid, ₹${(
                                term.amount - term.paidAmount
                              ).toLocaleString()} remaining`
                            : "Pending"}
                          )
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Amount (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    disabled={paymentProcessing}
                  />
                  <Form.Text className="text-muted">
                    Enter the amount you want to pay
                  </Form.Text>
                </Form.Group>

                <hr className="my-4" />

                <h5 className="mb-3">Contact Information</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    disabled={paymentProcessing}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                    disabled={paymentProcessing}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    disabled={paymentProcessing}
                  />
                </Form.Group>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                  <Button
                    variant="outline-secondary"
                    onClick={handleCancel}
                    disabled={paymentProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={paymentProcessing || !selectedTerm || !amount}
                  >
                    {paymentProcessing ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Processing...
                      </>
                    ) : (
                      "Proceed to Payment"
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentForm;