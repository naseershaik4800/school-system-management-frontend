import React, { useState, useEffect } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';

const HostelFeeManagement = () => {
  const [fees, setFees] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedFee, setEditedFee] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const BASE_URL = 'http://localhost:5000';
  const BASE_URL =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_DEPLOYED_URL
      : process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchFees();
  }, []);

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire('Error', 'Please log in to access this feature', 'error');
      throw new Error('No token found');
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  };

  const fetchFees = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = getAuthConfig();
      console.log('Fetching hostel fees with config:', config);
      const response = await fetch(`${BASE_URL}/api/hostelFees`, config);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error ${response.status}: ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Fetched hostel fees:', data);
      if (!Array.isArray(data)) {
        throw new Error('Expected an array of fees, got: ' + JSON.stringify(data));
      }
      setFees(data);
    } catch (error) {
      console.error('Error fetching hostel fees:', error);
      setError(error.message);
      Swal.fire('Error', error.message || 'Failed to fetch hostel fee structures', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fee) => {
    setEditingId(fee._id);
    setEditedFee({ ...fee });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedFee((prev) => ({
      ...prev,
      [name]: name === 'class' ? value : Number(value) || 0,
    }));
  };

  const handleSave = async (id) => {
    try {
      const { tuition, library, hostel } = editedFee;
      if (!tuition || !library || !hostel || tuition < 0 || library < 0 || hostel < 0) {
        Swal.fire('Error', 'All fee fields must be non-negative numbers', 'error');
        return;
      }

      const config = getAuthConfig();
      const response = await fetch(`${BASE_URL}/api/hostelFees/${id}`, {
        method: 'PUT',
        ...config,
        body: JSON.stringify({ tuition, library, hostel }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update hostel fee');
      }

      const updatedFee = await response.json();
      setFees(fees.map((fee) => (fee._id === id ? updatedFee : fee)));
      setEditingId(null);
      Swal.fire('Success', 'Hostel fee structure updated successfully', 'success');
    } catch (error) {
      console.error('Error updating hostel fee:', error);
      Swal.fire('Error', error.message || 'Failed to update hostel fee structure', 'error');
    }
  };

  const calculateTotal = (fee) => {
    return (fee.tuition || 0) + (fee.library || 0) + (fee.hostel || 0);
  };

  return (
    <motion.div
      className="container py-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-center mb-4 fw-bold text-primary">Hostel Fee Management</h2>
      <div className="card shadow-lg border-0">
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading hostel fee structures...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger text-center" role="alert">
              {error}
              <Button variant="link" onClick={fetchFees} className="ms-2">
                Retry
              </Button>
            </div>
          ) : fees.length === 0 ? (
            <div className="alert alert-info text-center" role="alert">
              No hostel fee structures found.
            </div>
          ) : (
            <Table responsive striped bordered hover className="text-center">
              <thead className="bg-primary text-white">
                <tr>
                  <th>Class</th>
                  <th>Tuition Fee (₹)</th>
                  <th>Library Fee (₹)</th>
                  <th>Hostel Fee (₹)</th>
                  <th>Total Amount (₹)</th>
                  <th>Payable in 3 Terms (₹)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => {
                  const totalAmount = calculateTotal(fee);
                  const payablePerTerm = (totalAmount / 3).toFixed(2);

                  return (
                    <motion.tr
                      key={fee._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <td>
                        {editingId === fee._id ? (
                          <Form.Control
                            type="text"
                            name="class"
                            value={editedFee.class || ''}
                            onChange={handleChange}
                            className="w-75 mx-auto"
                          />
                        ) : (
                          fee.class
                        )}
                      </td>
                      <td>
                        {editingId === fee._id ? (
                          <Form.Control
                            type="number"
                            name="tuition"
                            value={editedFee.tuition || 0}
                            onChange={handleChange}
                            min="0"
                            className="w-75 mx-auto"
                          />
                        ) : (
                          `₹${(fee.tuition || 0).toLocaleString('en-IN')}`
                        )}
                      </td>
                      <td>
                        {editingId === fee._id ? (
                          <Form.Control
                            type="number"
                            name="library"
                            value={editedFee.library || 0}
                            onChange={handleChange}
                            min="0"
                            className="w-75 mx-auto"
                          />
                        ) : (
                          `₹${(fee.library || 0).toLocaleString('en-IN')}`
                        )}
                      </td>
                      <td>
                        {editingId === fee._id ? (
                          <Form.Control
                            type="number"
                            name="hostel"
                            value={editedFee.hostel || 0}
                            onChange={handleChange}
                            min="0"
                            className="w-75 mx-auto"
                          />
                        ) : (
                          `₹${(fee.hostel || 0).toLocaleString('en-IN')}`
                        )}
                      </td>
                      <td className="fw-semibold text-success">
                        ₹{totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="text-info fw-semibold">
                        ₹{payablePerTerm.toLocaleString('en-IN')} per term
                      </td>
                      <td>
                        {editingId === fee._id ? (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleSave(fee._id)}
                            className="px-3"
                            disabled={loading}
                          >
                            {loading ? 'Saving...' : 'Save'}
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleEdit(fee)}
                            className="px-3"
                          >
                            Edit
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default HostelFeeManagement;