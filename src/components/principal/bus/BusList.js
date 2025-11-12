import axios from 'axios';
import { motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import './BusList.css';

const BusList = () => {
  const [formData, setFormData] = useState({
    driverName: '',
    phoneNumber: '',
    fromLocation: '',
    toLocation: '',
    busNumber: '',
    email: '',
    password: '',
  });
  const [file, setFile] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});
  const driversPerPage = 5;

  const driverFormRef = useRef(null);

  const BASE_URL =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_DEPLOYED_URL
      : process.env.REACT_APP_API_URL;
  // const BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchDrivers();
  }, []);

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to access this feature');
      throw new Error('No token found');
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    };
  };

  const fetchDrivers = async () => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(`${BASE_URL}/driver-profiles`, config);
      const sortedDrivers = response.data
        .map((driver) => ({
          ...driver,
          profileImage: driver.profileImage || '',
        }))
        .sort((a, b) => (a._id < b._id ? 1 : -1));
      setDrivers(sortedDrivers);
    } catch (error) {
      console.error('Error fetching driver profiles:', error);
      alert(error.response?.data?.message || 'Failed to fetch drivers');
    }
  };

  // Real-time field validation
  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'driverName':
        if (!value.trim()) error = 'Driver Name is required';
        else if (!/^[A-Za-z\s]+$/.test(value))
          error = 'Driver Name must contain only letters and spaces';
        break;
      case 'phoneNumber':
        if (!value.trim()) error = 'Phone Number is required';
        else if (!/^[6789]\d{9}$/.test(value))
          error = 'Phone Number must start with 6, 7, 8, or 9 and be 10 digits';
        break;
      case 'fromLocation':
        if (!value.trim()) error = 'From Location is required';
        break;
      case 'toLocation':
        if (!value.trim()) error = 'To Location is required';
        break;
      case 'busNumber':
        if (!value.trim()) error = 'Bus Number is required';
        else if (!/^[a-zA-Z0-9]+$/.test(value.trim()))
          error = 'Bus Number must be alphanumeric';
        break;
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z]{2,}\.[a-zA-Z]{2,}$/.test(value))
          error = 'Please enter a valid email (e.g., user123@domain.com)';
        break;
      case 'password':
        if (editIndex === null || (editIndex !== null && value.trim())) {
          if (!value.trim()) error = 'Password is required';
          else if (value.length < 8)
            error = 'Password must be at least 8 characters';
          else if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*]).+$/.test(value))
            error = 'Password needs uppercase, lowercase, and special character';
        }
        break;
      default:
        break;
    }
    return error;
  };

  // Validate all fields before submission
  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes with real-time validation
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Allow input updates, apply restrictions only for specific cases
    let sanitizedValue = value;
    if (name === 'phoneNumber') {
      sanitizedValue = value.replace(/[^0-9]/g, ''); // Only allow digits
    } else if (name === 'busNumber') {
      sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, ''); // Only allow alphanumeric
    } else if (name === 'driverName') {
      sanitizedValue = value.replace(/[^A-Za-z\s]/g, ''); // Only allow letters and spaces
    }

    // Update formData with sanitized value
    setFormData({ ...formData, [name]: sanitizedValue });

    // Perform real-time validation
    const error = validateField(name, sanitizedValue);
    setErrors({ ...errors, [name]: error });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) setFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('Please fix the errors before submitting');
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key !== 'password' || (key === 'password' && formData.password)) {
        data.append(key, formData[key]);
      }
    });
    if (file) data.append('profileImage', file);
    if (!file && (editIndex === null || !drivers[editIndex]?.profileImage)) {
      alert('Profile image is required!');
      return;
    }
    try {
      const config = getAuthConfig();
      if (editIndex !== null) {
        const driverId = drivers[editIndex]._id;
        const response = await axios.put(
          `${BASE_URL}/driver-profile/${driverId}`,
          data,
          config
        );
        alert(response.data.message);
        setDrivers(
          drivers.map((d, i) =>
            i === editIndex ? response.data.updatedDriver : d
          )
        );
      } else {
        const response = await axios.post(
          `${BASE_URL}/driver-profile`,
          data,
          config
        );
        alert(response.data.message);
        setDrivers([response.data.newDriver, ...drivers]);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving driver profile:', error);
      alert(error.response?.data?.message || 'Failed to save driver profile');
    }
  };

  const resetForm = () => {
    setFormData({
      driverName: '',
      phoneNumber: '',
      fromLocation: '',
      toLocation: '',
      busNumber: '',
      email: '',
      password: '',
    });
    setFile(null);
    setEditIndex(null);
    setShowForm(false);
    setErrors({});
  };

  const handleEdit = (index) => {
    const driver = filteredDrivers[index];
    setFormData({
      driverName: driver.driverName,
      phoneNumber: driver.phoneNumber,
      fromLocation: driver.fromLocation,
      toLocation: driver.toLocation,
      busNumber: driver.busNumber,
      email: driver.email || '',
      password: '',
    });
    setFile(null);
    setEditIndex(index);
    setShowForm(true);
    scrollToForm();
  };

  const handleDelete = async (index) => {
    const driver = filteredDrivers[index];
    const confirmDelete = window.confirm('Are you sure you want to delete this driver?');
    if (confirmDelete) {
      try {
        const config = getAuthConfig();
        const response = await axios.delete(
          `${BASE_URL}/driver-profile/${driver._id}`,
          config
        );
        alert(response.data.message);
        setDrivers(drivers.filter((d) => d._id !== driver._id));
      } catch (error) {
        console.error('Error deleting driver:', error);
        alert(error.response?.data?.message || 'Failed to delete driver');
      }
    }
  };

  const scrollToForm = () => {
    setTimeout(() => {
      if (driverFormRef.current) {
        driverFormRef.current.scrollIntoView({ behavior: 'smooth' });
        driverFormRef.current.classList.add('buslist-highlight-form');
        setTimeout(
          () => driverFormRef.current.classList.remove('buslist-highlight-form'),
          1500
        );
      }
    }, 100);
  };

  const filteredDrivers = drivers.filter((driver) =>
    Object.values(driver)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const indexOfLastDriver = currentPage * driversPerPage;
  const indexOfFirstDriver = indexOfLastDriver - driversPerPage;
  const currentDrivers = filteredDrivers.slice(indexOfFirstDriver, indexOfLastDriver);
  const totalPages = Math.ceil(filteredDrivers.length / driversPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const tdStyle = {
    width: '100px',
    maxWidth: '100px',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    padding: '5px',
    border: '1px solid #ccc',
  };

  return (
    <motion.div
      className="buslist-driver-profile-container container-fluid px-2 px-sm-3 px-md-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ maxWidth: '800px', margin: 'auto' }}
    >
      <h2 className="buslist-h2 fs-4 fs-sm-3 fs-md-2">Driver Management</h2>

      <div className="buslist-header-controls d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div className="buslist-control-group d-flex flex-column flex-sm-row gap-2 align-items-start align-items-sm-center">
          <input
            type="text"
            className="buslist-search-input form-control fs-6 fs-sm-5"
            placeholder="Search drivers..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={{ maxWidth: '250px' }}
          />
          <select
            className="buslist-sort-select form-select fs-6 fs-sm-5"
            onChange={(e) => {
              const sorted = [...drivers].sort((a, b) =>
                e.target.value === 'name'
                  ? a.driverName.localeCompare(b.driverName)
                  : a._id < b._id
                  ? 1
                  : -1
              );
              setDrivers(sorted);
            }}
            style={{ maxWidth: '150px' }}
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
        <button
          className="buslist-btn-success btn btn-success btn-sm"
          onClick={() => {
            resetForm();
            setShowForm(true);
            scrollToForm();
          }}
        >
          Add Driver
        </button>
      </div>

      {showForm && (
        <div ref={driverFormRef}>
          <h3 className="buslist-h3 fs-5 fs-sm-4 fs-md-3">
            {editIndex !== null ? 'Edit Driver Profile' : 'Add New Driver'}
          </h3>
          <form onSubmit={handleSubmit} className="buslist-form mb-4">
            <div className="buslist-form-group mb-3">
              <label className="buslist-label fs-6 fs-sm-5">Driver Name</label>
              <input
                type="text"
                name="driverName"
                value={formData.driverName}
                onChange={handleChange}
                placeholder="Enter Driver Name"
                className={`buslist-form-control form-control fs-6 fs-sm-5 ${
                  errors.driverName ? 'is-invalid' : ''
                }`}
              />
              {errors.driverName && (
                <div className="invalid-feedback">{errors.driverName}</div>
              )}
            </div>
            <div className="buslist-form-group mb-3">
              <label className="buslist-label fs-6 fs-sm-5">Phone Number</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Enter Phone Number"
                className={`buslist-form-control form-control fs-6 fs-sm-5 ${
                  errors.phoneNumber ? 'is-invalid' : ''
                }`}
              />
              {errors.phoneNumber && (
                <div className="invalid-feedback">{errors.phoneNumber}</div>
              )}
            </div>
            <div className="buslist-form-group mb-3">
              <label className="buslist-label fs-6 fs-sm-5">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter Email"
                className={`buslist-form-control form-control fs-6 fs-sm-5 ${
                  errors.email ? 'is-invalid' : ''
                }`}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email}</div>
              )}
            </div>
            <div className="buslist-form-group mb-3">
              <label className="buslist-label fs-6 fs-sm-5">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter Password"
                className={`buslist-form-control form-control fs-6 fs-sm-5 ${
                  errors.password ? 'is-invalid' : ''
                }`}
              />
              {errors.password && (
                <div className="invalid-feedback">{errors.password}</div>
              )}
            </div>
            <div className="buslist-form-group mb-3">
              <label className="buslist-label fs-6 fs-sm-5">Routing</label>
              <div className="buslist-routing-group d-flex flex-column flex-sm-row gap-2">
                <input
                  type="text"
                  name="fromLocation"
                  value={formData.fromLocation}
                  onChange={handleChange}
                  placeholder="From"
                  className={`buslist-form-control form-control fs-6 fs-sm-5 ${
                    errors.fromLocation ? 'is-invalid' : ''
                  }`}
                />
                {errors.fromLocation && (
                  <div className="invalid-feedback">{errors.fromLocation}</div>
                )}
                <input
                  type="text"
                  name="toLocation"
                  value={formData.toLocation}
                  onChange={handleChange}
                  placeholder="To"
                  className={`buslist-form-control form-control fs-6 fs-sm-5 ${
                    errors.toLocation ? 'is-invalid' : ''
                  }`}
                />
                {errors.toLocation && (
                  <div className="invalid-feedback">{errors.toLocation}</div>
                )}
              </div>
            </div>
            <div className="buslist-form-group mb-3">
              <label className="buslist-label fs-6 fs-sm-5">Bus Number</label>
              <input
                type="text"
                name="busNumber"
                value={formData.busNumber}
                onChange={handleChange}
                placeholder="Enter Bus Number"
                className={`buslist-form-control form-control fs-6 fs-sm-5 ${
                  errors.busNumber ? 'is-invalid' : ''
                }`}
              />
              {errors.busNumber && (
                <div className="invalid-feedback">{errors.busNumber}</div>
              )}
            </div>
            <div className="buslist-form-group mb-3">
              <label className="buslist-label fs-6 fs-sm-5">Profile Image</label>
              <input
                type="file"
                name="profileImage"
                accept="image/*"
                onChange={handleImageUpload}
                className="buslist-form-control form-control fs-6 fs-sm-5"
              />
              {file && (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="buslist-preview-img mt-2 img-fluid"
                  style={{ maxWidth: '100px' }}
                />
              )}
              {editIndex !== null && drivers[editIndex]?.profileImage && !file && (
                <img
                  src={`${BASE_URL}${drivers[editIndex].profileImage}`}
                  alt="Current"
                  className="buslist-preview-img mt-2 img-fluid"
                  style={{ maxWidth: '100px' }}
                  onError={(e) => (e.target.src = '/uploads/default-driver.png')}
                />
              )}
            </div>
            <div className="buslist-button-group d-flex flex-column flex-sm-row gap-2">
              <button
                type="submit"
                className="buslist-btn-primary btn btn-primary btn-sm w-100"
              >
                {editIndex !== null ? 'Update' : 'Submit'}
              </button>
              <button
                type="button"
                className="buslist-btn-secondary btn btn-secondary btn-sm w-100"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <h2 className="buslist-h2 fs-4 fs-sm-3 fs-md-2">Driver List</h2>
      <table className="buslist-table table table-striped">
        <thead>
          <tr>
            <th>Profile</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>From</th>
            <th>To</th>
            <th>Bus Number</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentDrivers.map((driver, index) => (
            <tr key={driver._id}>
              <td style={tdStyle}>
                {driver.profileImage ? (
                  <img
                    src={`${BASE_URL}${driver.profileImage}`}
                    alt="Profile"
                    className="buslist-table-img"
                    onError={(e) => (e.target.src = '/uploads/default-driver.png')}
                  />
                ) : (
                  'No Image'
                )}
              </td>
              <td style={tdStyle}>{driver.driverName}</td>
              <td style={tdStyle}>{driver.email}</td>
              <td style={tdStyle}>{driver.phoneNumber}</td>
              <td style={tdStyle}>{driver.fromLocation}</td>
              <td style={tdStyle}>{driver.toLocation}</td>
              <td style={tdStyle}>{driver.busNumber}</td>
              <td style={tdStyle}>
                <button
                  className="buslist-btn-edit btn btn-primary btn-sm me-2 mt-2"
                  onClick={() => handleEdit(index)}
                >
                  Edit
                </button>
                <button
                  className="buslist-btn-delete btn btn-danger btn-sm mt-2"
                  onClick={() => handleDelete(index)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <nav>
          <ul className="buslist-pagination pagination pagination-sm justify-content-center mt-3">
            <li className={`buslist-page-item page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button
                className="buslist-page-link page-link mb-2"
                onClick={() => paginate(currentPage - 1)}
              >
                Previous
              </button>
            </li>
            <li className="mx-2"></li> {/* Added gap */}
            {Array.from({ length: totalPages }, (_, i) => (
              <li
                key={i}
                className={`buslist-page-item page-item ${
                  currentPage === i + 1 ? 'active' : ''
                }`}
              >
                <button
                  className="buslist-page-link page-link"
                  onClick={() => paginate(i + 1)}
                >
                  {i + 1}
                </button>
              </li>
              
            ))}
              <li className="mx-2"></li> {/* Added gap */}
            <li
              className={`buslist-page-item page-item ${
                currentPage === totalPages ? 'disabled' : ''
              }`}
            >
              <button
                className="buslist-page-link page-link mb-2"
                onClick={() => paginate(currentPage + 1)}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </motion.div>
  );
};

export default BusList;