import axios from 'axios';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  ProgressBar,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const FeeDashboard = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const studentId = localStorage.getItem('selectedChild');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const response = await axios.get(
          `${BASE_URL}/api/fees/${studentId}`,
          config
        );

        if (response.data.success && response.data.data) {
          setStudent(response.data.data);
          // console.log(`kamal : ${JSON.stringify(response.data.data)}`);
        } else {
          setError('Invalid API response format');
        }
      } catch (err) {
        console.error('Error fetching fee details:', err);
        setError(err.response?.data?.message || 'Error fetching fee details');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchStudentData();
    } else {
      setLoading(false);
      setError('Student ID is required');
    }
  }, [studentId]); // Re-fetch when studentId changes

  if (loading) {
    return (
      <Container className='py-5 text-center'>
        <Spinner animation='border' variant='info' />
        <p className='mt-2 text-muted'>Loading fee details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className='py-5'>
        <Alert variant='danger'>
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          {error === 'No authentication token found' && (
            <Button variant='outline-danger' onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </Alert>
      </Container>
    );
  }

  if (!student || !student.feeDetails) {
    return (
      <Container className='py-5'>
        <Alert variant='warning'>
          <Alert.Heading>No Data</Alert.Heading>
          <p>No fee details available for this student.</p>
        </Alert>
      </Container>
    );
  }

  const { feeDetails } = student;

  // console.log("feeDetails:", feeDetails.terms[0]._id);



  const totalPaid = feeDetails.terms.reduce(
    (sum, term) => sum + (term.paidAmount || 0),
    0
  );

  const overallProgress = Math.round((totalPaid / feeDetails.totalFee) * 100);

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge bg='success'>Paid</Badge>;
      case 'partial':
        return <Badge bg='warning'>Partial</Badge>;
      case 'pending':
        return <Badge bg='danger'>Pending</Badge>;
      default:
        return <Badge bg='secondary'>{status}</Badge>;
    }
  };

  const getDueStatus = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);

    if (due < today) {
      return <Badge bg='danger'>Overdue</Badge>;
    } else if (due.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return <Badge bg='warning'>Due Soon</Badge>;
    } else {
      return <Badge bg='info'>Upcoming</Badge>;
    }
  };

  const handlePayNow = (termId) => {
    navigate(`/pay/${studentId}?termId=${termId}`);
    console.log(termId);
  };

  const handleViewHistory = () => {
    navigate(`/payment-history/${studentId}`);
  };

  const handleViewReceipt = (receiptId) => {
    navigate(`/receipt/${receiptId}`);
  };

  // console.log( `FeeDetails: ${feeDetails.term}`)

  return (
    <Container className='py-4'>
      <Row>
        <Col>
          <Card className='shadow-sm mb-4 border-0'>
            <Card.Header className='bg-info bg-opacity-25 border-0'>
              <h2 className='mb-0 text-info'>Fee Details</h2>
            </Card.Header>
            <Card.Body className='bg-light bg-opacity-50'>
              <Row className='mb-4'>
                <Col md={6}>
                  <h4>{student.name}</h4>
                  <p className='text-muted mb-0'>
                    Class: {student.className} | Section: {student.section}
                  </p>
                  <p className='text-muted'>
                    Admission No: {student.admissionNo}
                  </p>
                </Col>
                <Col
                  md={6}
                  className='d-flex justify-content-md-end align-items-center'
                >
                  <div className='d-grid gap-2 d-md-flex'>
                    <Button
                      variant='info'
                      className='text-white'
                      onClick={() => handlePayNow()}
                    >
                      Pay Fees
                    </Button>
                    <Button variant='outline-info' onClick={handleViewHistory}>
                      Payment History
                    </Button>
                  </div>
                </Col>
              </Row>

              <Card className='mb-4 border-0'>
                <Card.Body className='bg-white rounded shadow-sm'>
                  <Row className='align-items-center'>
                    <Col md={3}>
                      <h5 className='mb-0 text-info'>
                        Total Fee: ₹{feeDetails.totalFee.toLocaleString()}
                      </h5>
                    </Col>
                    <Col md={3}>
                      <h5 className='mb-0 text-success'>
                        Paid: ₹{totalPaid.toLocaleString()}
                      </h5>
                    </Col>
                    <Col md={3}>
                      <h5 className='mb-0 text-warning'>
                        Balance: ₹
                        {(feeDetails.totalFee - totalPaid).toLocaleString()}
                      </h5>
                    </Col>
                    <Col md={3}>
                      <h5 className='mb-0 text-secondary'>
                        Payment Option: {feeDetails.paymentOption}
                      </h5>
                    </Col>
                  </Row>
                </Card.Body>
                <Card.Footer className='bg-white border-0'>
                  <div className='mb-1'>Overall Payment Progress</div>
                  <ProgressBar
                    now={overallProgress}
                    label={`${overallProgress}%`}
                    variant={
                      overallProgress === 100
                        ? 'success'
                        : overallProgress > 50
                        ? 'info'
                        : 'warning'
                    }
                    style={{ height: '25px' }}
                  />
                </Card.Footer>
              </Card>

              <h4 className='mb-3 text-info'>Payment Terms</h4>
              <div className='table-responsive bg-white rounded shadow-sm'>
                <Table hover borderless>
                  <thead className='bg-light'>
                    <tr>
                      <th>Term</th>
                      <th>Total Amount</th>
                      <th>Paid Amount</th>
                      <th>Remaining</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeDetails.terms.map((term) => (
                      
                      
                      <tr key={term._id}>
                        <td className='fw-bold'>{term.termName}</td>
                        <td>₹{term.amount.toLocaleString()}</td>
                        <td className='text-success'>
                          ₹{(term.paidAmount || 0).toLocaleString()}
                        </td>
                        <td className='text-warning'>
                          ₹
                          {(
                            term.amount - (term.paidAmount || 0)
                          ).toLocaleString()}
                        </td>
                        <td>
                          {format(new Date(term.dueDate), 'dd MMM yyyy')}
                          <div className='mt-1'>
                            {getDueStatus(term.dueDate)}
                          </div>
                        </td>
                        <td>{getStatusBadge(term.status)}</td>
                        <td>
                          {term.status.toLowerCase() !== 'paid' && (
                            <Button
                              size='sm'
                              variant='outline-info'
                              onClick={() => handlePayNow(term._id)}
                              className='rounded-pill px-3'
                            >
                              Pay Now
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {feeDetails.paymentHistory &&
            feeDetails.paymentHistory.length > 0 && (
              <Card className='shadow-sm border-0'>
                <Card.Header className='bg-info bg-opacity-25 border-0'>
                  <h3 className='mb-0 text-info'>Recent Payments</h3>
                </Card.Header>
                <Card.Body className='bg-light bg-opacity-50'>
                  <div className='table-responsive bg-white rounded shadow-sm'>
                    <Table hover borderless>
                      <thead className='bg-light'>
                        <tr>
                          <th>Date</th>
                          <th>Receipt</th>
                          <th>Term</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Status</th>
                          <th>Failure Reason</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feeDetails.paymentHistory
                          .slice(0, 3)
                          .map((payment) => (
                            <tr key={payment.receiptNumber}>
                              <td>
                                {payment.paymentDate
                                  ? format(
                                      new Date(payment.paymentDate),
                                      'dd MMM yyyy'
                                    )
                                  : 'N/A'}
                              </td>
                              <td className='fw-bold'>
                                {payment.receiptNumber}
                              </td>
                              <td>{payment.termName || 'N/A'}</td>
                              <td className='text-success'>
                                ₹{payment.amountPaid.toLocaleString()}
                              </td>
                              <td>{payment.paymentMethod || 'Unknown'}</td>
                              <td>
                                <Badge
                                  bg={
                                    payment.status === 'SUCCESS'
                                      ? 'success'
                                      : payment.status === 'FAILED'
                                      ? 'danger'
                                      : 'warning'
                                  }
                                  className='rounded-pill px-3'
                                >
                                  {payment.status || 'Unknown'}
                                </Badge>
                              </td>
                              <td className='text-danger'>
                                {payment.failureReason || '-'}
                              </td>
                              <td>
                                {payment.status === 'SUCCESS' && (
                                  <Button
                                    size='sm'
                                    variant='outline-info'
                                    onClick={() =>
                                      handleViewReceipt(payment.receiptNumber)
                                    }
                                    className='rounded-pill px-3'
                                  >
                                    View Receipt
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </Table>
                  </div>
                  {feeDetails.paymentHistory.length > 3 && (
                    <div className='text-center mt-4'>
                      <Button
                        variant='outline-info'
                        onClick={handleViewHistory}
                        className='rounded-pill px-4'
                      >
                        View All Payments
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
        </Col>
      </Row>
    </Container>
  );
};

export default FeeDashboard;
