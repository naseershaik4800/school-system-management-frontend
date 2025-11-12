import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Card,
  Row,
  Col,
  Button,
  Spinner,
  Alert,
  Table,
} from "react-bootstrap";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const Receipt = () => {
  const { receiptId } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const receiptRef = useRef();

  useEffect(() => {
    const fetchReceipt = async () => {
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
          `${BASE_URL}/api/fees/receipt/${receiptId}`,
          config
        );

        console.log("⭐ Receipt API Response:", response.data); // Debugging log

        // Handle different response structures
        const receiptData = response.data.receipt || response.data.data || response.data;
        if (response.data.success && receiptData) {
          setReceipt(receiptData);
        } else {
          setError(response.data.message || "Failed to fetch receipt details");
        }
      } catch (err) {
        console.error("Error fetching receipt:", err);
        setError(
          err.response?.data?.message || "Error retrieving receipt details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (receiptId) {
      fetchReceipt();
    } else {
      setError("Receipt ID is required");
      setLoading(false);
    }
  }, [receiptId]);

  const handleDownloadPDF = () => {
    const input = receiptRef.current;

    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgScaledWidth = imgWidth * ratio;
      const imgScaledHeight = imgHeight * ratio;

      const xOffset = (pdfWidth - imgScaledWidth) / 2;
      const yOffset = (pdfHeight - imgScaledHeight) / 2;

      pdf.addImage(
        imgData,
        "PNG",
        xOffset,
        yOffset,
        imgScaledWidth,
        imgScaledHeight
      );
      pdf.save(`Receipt_${receiptId}.pdf`);
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading receipt...</p>
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

  if (!receipt) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Receipt Not Found</Alert.Heading>
          <p>The requested receipt could not be found.</p>
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
    <Container className="py-4">
      <div className="d-flex justify-content-between mb-4">
        <Button variant="outline-secondary" onClick={handleBack}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-arrow-left me-2"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
            />
          </svg>
          Back
        </Button>
        <Button variant="primary" onClick={handleDownloadPDF}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-download me-2"
            viewBox="0 0 16 16"
          >
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
          </svg>
          Download PDF
        </Button>
      </div>

      <div ref={receiptRef} className="receipt-container">
        <Card className="shadow-sm border-0 mb-4">
          <Card.Body className="p-4">
            <div className="text-center mb-4">
              <h2 className="mb-1">School Management System</h2>
              <p className="text-muted mb-0">
                123 Education Street, Knowledge City
              </p>
              <p className="text-muted">
                Phone: (123) 456-7890 | Email: info@school.edu
              </p>
            </div>

            <div className="text-center mb-4">
              <h3 className="border-bottom border-2 pb-2 d-inline-block">
                Payment Receipt
              </h3>
            </div>

            <Row className="mb-4">
              <Col md={6}>
                <h5>Receipt Details</h5>
                <Table borderless size="sm" className="mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted" width="40%">
                        Receipt No:
                      </td>
                      <td>{receipt.receiptId}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Date:</td>
                      <td>
                        {receipt.paymentDate
                          ? format(
                              new Date(receipt.paymentDate),
                              "dd MMM yyyy, hh:mm a"
                            )
                          : "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Payment Method:</td>
                      <td>{receipt.paymentMethod || "Online"}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Transaction ID:</td>
                      <td>{receipt.transactionId || receipt.orderId}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Status:</td>
                      <td>
                        <span className="text-success fw-bold">
                          {receipt.paymentStatus || "PAID"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <h5>Student Details</h5>
                <Table borderless size="sm" className="mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted" width="40%">
                        Name:
                      </td>
                      <td>{receipt.studentName || "N/A"}</td>
                    </tr>
                    {receipt.studentId && (
                      <tr>
                        <td className="text-muted">Student ID:</td>
                        <td>{receipt.studentId}</td>
                      </tr>
                    )}
                    {receipt.studentEmail && (
                      <tr>
                        <td className="text-muted">Email:</td>
                        <td>{receipt.studentEmail}</td>
                      </tr>
                    )}
                    {receipt.studentPhone && (
                      <tr>
                        <td className="text-muted">Phone:</td>
                        <td>{receipt.studentPhone}</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Col>
            </Row>

            <h5>Payment Details</h5>
            <Table bordered responsive className="mb-4">
              <thead className="bg-light">
                <tr>
                  <th>Description</th>
                  <th>Term</th>
                  <th className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Fee Payment</td>
                  <td>{receipt.termName || "N/A"}</td>
                  <td className="text-end">
                    ₹{receipt.amount?.toLocaleString() || "0"}
                  </td>
                </tr>
                <tr>
                  <td colSpan="2" className="text-end fw-bold">
                    Total
                  </td>
                  <td className="text-end fw-bold">
                    ₹{receipt.amount?.toLocaleString() || "0"}
                  </td>
                </tr>
              </tbody>
            </Table>

            <div className="mt-5 pt-4 border-top">
              <Row>
                <Col md={6}>
                  <p className="mb-1">
                    <strong>Note:</strong>
                  </p>
                  <p className="text-muted small">
                    This is a computer-generated receipt and does not require a
                    physical signature. For any queries regarding this payment,
                    please contact the school administration.
                  </p>
                </Col>
                <Col md={6} className="text-md-end">
                  <div className="mt-4">
                    <p className="mb-0">Authorized Signatory</p>
                    <p className="text-muted small">School Management System</p>
                  </div>
                </Col>
              </Row>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Receipt;