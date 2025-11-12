import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Row,
  Spinner,
} from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const PaymentStatus = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const status = queryParams.get('status');
  const orderId = queryParams.get('orderId') || queryParams.get('order_id');

  const handleBackToDashboard = () => {
    if (
      paymentDetails?.studentId &&
      /^[0-9a-fA-F]{24}$/.test(paymentDetails.studentId)
    ) {
      // navigate(`/fees/${paymentDetails.studentId}`);
      navigate('/fees');
    } else {
      console.log(
        '⭐ Invalid or missing studentId:',
        paymentDetails?.studentId
      );
      navigate('/');
    }
  };

  useEffect(() => {
    console.log('⭐ PaymentStatus Query Params:', {
      status,
      orderId,
      raw: location.search,
    });

    const verifyPayment = async () => {
      if (!orderId) {
        setError('Missing order information');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        };

        const response = await axios.get(
          `${BASE_URL}/api/fees/verify-payment?order_id=${orderId}`,
          config
        );
        console.log('⭐ Raw API Response:', response.data);

        // Handle nested response structure
        const paymentData = response.data.data || response.data;
        setPaymentDetails(paymentData);
        console.log('⭐ Payment Details:', paymentData);

        if (!paymentData || !paymentData.status) {
          setError('Invalid payment data received from server');
        }
        setLoading(false);
      } catch (err) {
        console.error('⭐ Verify Payment Error:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        setError(
          err.response?.data?.message || 'Failed to verify payment status.'
        );
        setLoading(false);
      }
    };

    setLoading(true);
    verifyPayment();
  }, [orderId]);

  // console.log(paymentDetails.receiptId);

  const handleViewReceipt = () => {
    navigate(`/receipt/${paymentDetails.receiptId}`);
  };

  if (loading) {
    return (
      <Container className='py-5 text-center'>
        <Spinner animation='border' variant='primary' />
        <p className='mt-3'>Verifying payment status...</p>
      </Container>
    );
  }

  // Determine success based solely on paymentDetails.status
  const isSuccess = paymentDetails && paymentDetails.status === 'SUCCESS';

  return (
    <Container className='py-5'>
      <Row className='justify-content-center'>
        <Col md={8} lg={6}>
          <Card className='shadow-sm border-0'>
            <Card.Header
              className={`text-white ${isSuccess ? 'bg-success' : 'bg-danger'}`}
            >
              <h3 className='mb-0 text-center'>
                {isSuccess ? 'Payment Successful' : 'Payment Failed'}
              </h3>
            </Card.Header>
            <Card.Body className='p-4 text-center'>
              <div className='mb-4'>
                {isSuccess ? (
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='64'
                    height='64'
                    fill='currentColor'
                    className='bi bi-check-circle-fill text-success'
                    viewBox='0 0 16 16'
                  >
                    <path d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z' />
                  </svg>
                ) : (
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='64'
                    height='64'
                    fill='currentColor'
                    className='bi bi-x-circle-fill text-danger'
                    viewBox='0 0 16 16'
                  >
                    <path d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z' />
                  </svg>
                )}
              </div>

              <h4 className='mb-3'>
                {isSuccess
                  ? 'Your payment has been processed successfully!'
                  : 'Your payment could not be processed.'}
              </h4>

              <p className='mb-4'>
                {isSuccess
                  ? `Your payment of ₹${
                      paymentDetails?.amount?.toLocaleString() || '0'
                    } has been received.`
                  : 'Please try again or contact the school administration for assistance.'}
              </p>

              {error && (
                <Alert variant='warning' className='mb-4'>
                  {error}
                </Alert>
              )}

              {paymentDetails && (
                <Card className='mb-4 text-start'>
                  <Card.Body>
                    <h5 className='card-title mb-3'>Payment Details</h5>
                    <Row className='mb-2'>
                      <Col xs={5} className='text-muted'>
                        Order ID:
                      </Col>
                      <Col xs={7}>{paymentDetails.orderId}</Col>
                    </Row>
                    {paymentDetails.receiptId && (
                      <Row className='mb-2'>
                        <Col xs={5} className='text-muted'>
                          Receipt ID:
                        </Col>
                        <Col xs={7}>{paymentDetails.receiptId}</Col>
                      </Row>
                    )}
                    {paymentDetails.termName && (
                      <Row className='mb-2'>
                        <Col xs={5} className='text-muted'>
                          Term:
                        </Col>
                        <Col xs={7}>{paymentDetails.termName}</Col>
                      </Row>
                    )}
                    <Row className='mb-2'>
                      <Col xs={5} className='text-muted'>
                        Date:
                      </Col>
                      <Col xs={7}>
                        {paymentDetails.date
                          ? new Date(paymentDetails.date).toLocaleString()
                          : 'N/A'}
                      </Col>
                    </Row>
                    <Row className='mb-2'>
                      <Col xs={5} className='text-muted'>
                        Payment Method:
                      </Col>
                      <Col xs={7}>
                        {paymentDetails.paymentMethod || 'Online'}
                      </Col>
                    </Row>
                    <Row className='mb-2'>
                      <Col xs={5} className='text-muted'>
                        Status:
                      </Col>
                      <Col xs={7}>
                        <span
                          className={isSuccess ? 'text-success' : 'text-danger'}
                        >
                          {isSuccess ? 'Successful' : 'Failed'}
                        </span>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              <div className='d-grid gap-2 d-md-flex justify-content-center'>
                {isSuccess && (
                  <Button
                    variant='outline-primary'
                    onClick={handleViewReceipt}
                    className='me-md-2'
                  >
                    View Receipt
                  </Button>
                )}
                <Button variant='primary' onClick={handleBackToDashboard}>
                  Back to Dashboard
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PaymentStatus;
