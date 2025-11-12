import React, { useState, useEffect } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';

const FeeManagement = () => {
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
      console.log('Fetching fees with config:', config);
      const response = await fetch(`${BASE_URL}/fees`, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error ${response.status}: ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Fetched fees:', data);
      if (!Array.isArray(data)) {
        throw new Error('Expected an array of fees, got: ' + JSON.stringify(data));
      }
      setFees(data);
    } catch (error) {
      console.error('Error fetching fees:', error);
      setError(error.message);
      Swal.fire('Error', error.message || 'Failed to fetch fee structures', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fee) => {
    setEditingId(fee._id);
    setEditedFee({ ...fee });
  };

  const handleChange = (e) => {
    setEditedFee({ ...editedFee, [e.target.name]: Number(e.target.value) });
  };

  const handleSave = async (id) => {
    try {
      const { tuition, library, transport } = editedFee;
      if (!tuition || !library || !transport || tuition < 0 || library < 0 || transport < 0) {
        Swal.fire('Error', 'All fee fields must be non-negative numbers', 'error');
        return;
      }

      const config = getAuthConfig();
      const response = await fetch(`${BASE_URL}/fees/${id}`, {
        method: 'PUT',
        ...config,
        body: JSON.stringify({ tuition, library, transport }), // No branchId
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update fee');
      }

      const updatedFee = await response.json();
      setFees(fees.map((fee) => (fee._id === id ? updatedFee : fee)));
      setEditingId(null);
      Swal.fire('Success', 'Fee structure updated successfully', 'success');
    } catch (error) {
      console.error('Error updating fee:', error);
      Swal.fire('Error', error.message || 'Failed to update fee structure', 'error');
    }
  };

  return (
    <motion.div
      className="container py-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-center mb-4 fw-bold text-primary">Fee Structure Management</h2>
      <div className="card shadow-lg border-0">
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading fee structures...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger text-center" role="alert-MIB">
              {error}
              <Button variant="link" onClick={fetchFees} className="ms-2">
                Retry
              </Button>
            </div>
          ) : fees.length === 0 ? (
            <div className="alert alert-info text-center" role="alert">
              No fee structures found.
            </div>
          ) : (
            <Table responsive striped bordered hover className="text-center">
              <thead className="bg-primary text-white">
                <tr>
                  <th>Class</th>
                  <th>Tuition Fee (₹)</th>
                  <th>Library Fee (₹)</th>
                  <th>Transport Fee (₹)</th>
                  <th>Total Amount (₹)</th>
                  <th>Payable in 3 Terms (₹)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => {
                  const totalAmount = fee.tuition + fee.library + fee.transport;
                  const payablePerTerm = (totalAmount / 3).toFixed(2);

                  return (
                    <motion.tr
                      key={fee._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <td>{fee.class}</td>
                      <td>
                        {editingId === fee._id ? (
                          <Form.Control
                            type="number"
                            name="tuition"
                            value={editedFee.tuition}
                            onChange={handleChange}
                            min="0"
                            className="w-75 mx-auto"
                          />
                        ) : (
                          fee.tuition
                        )}
                      </td>
                      <td>
                        {editingId === fee._id ? (
                          <Form.Control
                            type="number"
                            name="library"
                            value={editedFee.library}
                            onChange={handleChange}
                            min="0"
                            className="w-75 mx-auto"
                          />
                        ) : (
                          fee.library
                        )}
                      </td>
                      <td>
                        {editingId === fee._id ? (
                          <Form.Control
                            type="number"
                            name="transport"
                            value={editedFee.transport}
                            onChange={handleChange}
                            min="0"
                            className="w-75 mx-auto"
                          />
                        ) : (
                          fee.transport
                        )}
                      </td>
                      <td className="fw-semibold text-success">{totalAmount}</td>
                      <td className="text-info fw-semibold">{payablePerTerm} per term</td>
                      <td>
                        {editingId === fee._id ? (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleSave(fee._id)}
                            className="px-3"
                          >
                            Save
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

export default FeeManagement;