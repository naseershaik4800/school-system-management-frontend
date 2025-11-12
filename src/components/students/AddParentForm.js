'use client';
import axios from 'axios';
import {
  ArrowLeft,
  Building,
  Eye,
  EyeOff,
  GraduationCap,
  Home,
  Loader,
  Lock,
  Mail,
  Phone,
  Plus,
  Upload,
  User,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const AddParentForm = () => {
  const [parent, setParent] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    children: [],
    branchId: '',
  });
  const [newChild, setNewChild] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatedStudents, setValidatedStudents] = useState([]);
  const [errors, setErrors] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [branches, setBranches] = useState([]);
  const [userRole, setUserRole] = useState('');

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${BASE_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserRole(response.data.role);

        if (response.data.role === 'admin') {
          const branchesResponse = await axios.get(`${BASE_URL}/api/branches`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setBranches(branchesResponse.data);
        } else {
          setParent((prev) => ({ ...prev, branchId: response.data.branchId }));
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, []);

  const validateChildren = async (childrenArray) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const payload = { children: childrenArray };
      if (userRole === 'admin' && parent.branchId) {
        payload.branchId = parent.branchId;
      }

      const response = await axios.post(
        `${BASE_URL}/api/validate-children`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data.valid ? response.data.foundStudents : [];
    } catch (error) {
      console.error('Error validating children:', error);
      setMessage(error.response?.data?.error || 'Error validating students');
      return [];
    }
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      return 'Email is required';
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
    ) {
      return 'Enter a valid email address';
    }
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) {
      return 'Phone number is required';
    } else if (!/^\d{10}$/.test(phone)) {
      return 'Enter a valid 10-digit phone number';
    }
    return '';
  };

  const validateForm = () => {
    const errors = {};

    if (!parent.name.trim()) {
      errors.name = 'Name is required';
    } else if (!/^[A-Za-z\s]+$/.test(parent.name.trim())) {
      errors.name = 'Name should contain only alphabets';
    }

    errors.email = validateEmail(parent.email);

    if (!parent.password) {
      errors.password = 'Password is required';
    } else if (parent.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (parent.password !== parent.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    errors.phone = validatePhone(parent.phone);

    if (!parent.address.trim()) {
      errors.address = 'Address is required';
    }

    if (!parent.children.length) {
      errors.children = 'At least one student is required';
    }

    if (userRole === 'admin' && !parent.branchId) {
      errors.branchId = 'Branch selection is required';
    }

    setErrors(errors);
    return Object.keys(errors).every((key) => !errors[key]);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddChild = async () => {
    if (!newChild.trim()) {
      setErrors((prev) => ({
        ...prev,
        newChild: 'Admission number is required',
      }));
      return;
    }

    const admissionNumber = newChild.trim().toUpperCase();

    if (parent.children.includes(admissionNumber)) {
      setErrors((prev) => ({
        ...prev,
        newChild: 'This admission number already exists',
      }));
      return;
    }

    const newStudent = await validateChildren([admissionNumber]);

    if (newStudent.length) {
      setParent((prev) => ({
        ...prev,
        children: [...prev.children, admissionNumber],
      }));
      // Ensure no duplicates in validatedStudents
      setValidatedStudents((prev) => {
        // Filter out any existing student with the same admission number
        const filteredStudents = prev.filter(
          (student) => student.admissionNo !== admissionNumber
        );
        // Add the new student
        return [...filteredStudents, ...newStudent];
      });
      setNewChild('');
      setMessage('');
      setErrors((prev) => ({ ...prev, newChild: '' }));
    } else {
      setErrors((prev) => ({ ...prev, newChild: 'Invalid admission number' }));
    }
  };

  const handleRemoveChild = async (admissionNo) => {
    try {
      setParent((prev) => ({
        ...prev,
        children: prev.children.filter((child) => child !== admissionNo),
      }));
      setValidatedStudents((prev) =>
        prev.filter((student) => student.admissionNo !== admissionNo)
      );
    } catch (error) {
      setMessage('Error removing student: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const isValid = await validateChildren(parent.children);
      if (!isValid.length)
        throw new Error('One or more admission numbers are invalid');

      const formData = new FormData();
      formData.append('name', parent.name);
      formData.append('email', parent.email);
      formData.append('password', parent.password);
      formData.append('phone', parent.phone);
      formData.append('address', parent.address);
      formData.append('children', JSON.stringify(parent.children));

      if (userRole === 'admin' && parent.branchId) {
        formData.append('branchId', parent.branchId);
      }

      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      const response = await axios.post(
        `${BASE_URL}/api/register-parent`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(response.data.message);
      setParent({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: '',
        children: [],
        branchId: userRole === 'admin' ? '' : parent.branchId,
      });
      setValidatedStudents([]);
      setProfileImage(null);
      setProfilePreview(null);
      setErrors({});
      navigate('/parents');
    } catch (error) {
      setMessage(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setParent((prev) => ({ ...prev, email: value }));
    setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setParent((prev) => ({ ...prev, phone: value }));
    setErrors((prev) => ({ ...prev, phone: validatePhone(value) }));
  };

  const handleNewChildChange = (e) => {
    const value = e.target.value;
    setNewChild(value);
    if (!value.trim()) {
      setErrors((prev) => ({
        ...prev,
        newChild: 'Admission number is required',
      }));
    } else {
      setErrors((prev) => ({ ...prev, newChild: '' }));
    }
  };

  const handleBranchChange = (e) => {
    const value = e.target.value;
    setParent((prev) => ({ ...prev, branchId: value }));
    setErrors((prev) => ({
      ...prev,
      branchId: value ? '' : 'Branch selection is required',
    }));

    if (parent.children.length > 0) {
      setParent((prev) => ({ ...prev, children: [] }));
      setValidatedStudents([]);
    }
  };

  return (
    <div className='container py-5'>
      <div className='card shadow'>
        <div className='card-header bg-primary text-white text-center'>
          <h2 className='mb-0'>Register Parent Account</h2>
          <p className='mt-2 mb-0'>
            Create an account to connect with your children's school
          </p>
        </div>

        {message && (
          <div
            className={`alert mx-3 mt-3 ${
              message.includes('successfully')
                ? 'alert-success'
                : 'alert-danger'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className='card-body'>
          <div className='d-flex justify-content-center mb-4'>
            <div className='position-relative'>
              <div
                className='rounded-circle bg-light d-flex align-items-center justify-content-center overflow-hidden border border-4 border-white shadow'
                style={{ width: '128px', height: '128px' }}
                onClick={() => fileInputRef.current.click()}
              >
                {profilePreview ? (
                  <img
                    src={profilePreview || '/placeholder.svg'}
                    alt='Profile Preview'
                    className='w-100 h-100 object-fit-cover'
                  />
                ) : (
                  <User size={48} className='text-muted' />
                )}
              </div>
              <div
                className='position-absolute bottom-0 end-0 bg-primary text-white p-2 rounded-circle cursor-pointer shadow'
                onClick={() => fileInputRef.current.click()}
              >
                <Upload size={16} />
              </div>
              <input
                type='file'
                ref={fileInputRef}
                onChange={handleImageChange}
                accept='image/*'
                className='d-none'
              />
            </div>
          </div>

          <div className='row g-3'>
            {userRole === 'admin' && (
              <div className='col-12'>
                <label className="form-label text-dark">Branch</label>
                <div className='input-group'>
                  <span className='input-group-text'>
                    <Building size={18} />
                  </span>
                  <select
                    className={`form-select ${
                      errors.branchId ? 'is-invalid' : ''
                    }`}
                    value={parent.branchId}
                    onChange={handleBranchChange}
                  >
                    <option value=''>Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  {errors.branchId && (
                    <div className='invalid-feedback'>{errors.branchId}</div>
                  )}
                </div>
              </div>
            )}

            <div className='col-md-6'>
              <label className="form-label text-dark">Full Name</label>
              <div className='input-group'>
                <span className='input-group-text'>
                  <User size={18} />
                </span>
                <input
                  type='text'
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  placeholder='Enter your full name'
                  value={parent.name}
                  onChange={(e) =>
                    setParent({ ...parent, name: e.target.value })
                  }
                />
                {errors.name && (
                  <div className='invalid-feedback'>{errors.name}</div>
                )}
              </div>
            </div>

            <div className='col-md-6'>
              <label className="form-label text-dark">Email Address</label>
              <div className='input-group'>
                <span className='input-group-text'>
                  <Mail size={18} />
                </span>
                <input
                  type='email'
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder='Enter your email address'
                  value={parent.email}
                  onChange={handleEmailChange}
                />
                {errors.email && (
                  <div className='invalid-feedback'>{errors.email}</div>
                )}
              </div>
            </div>

            <div className='col-md-6'>
              <label className="form-label text-dark">Password</label>
              <div className='input-group'>
                <span className='input-group-text'>
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control ${
                    errors.password ? 'is-invalid' : ''
                  }`}
                  placeholder='Create a password'
                  value={parent.password}
                  onChange={(e) =>
                    setParent({ ...parent, password: e.target.value })
                  }
                />
                <button
                  type='button'
                  className='btn btn-outline-secondary'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.password && (
                  <div className='invalid-feedback'>{errors.password}</div>
                )}
              </div>
            </div>

            <div className='col-md-6'>
              <label className="form-label text-dark">Confirm Password</label>
              <div className='input-group'>
                <span className='input-group-text'>
                  <Lock size={18} />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`form-control ${
                    errors.confirmPassword ? 'is-invalid' : ''
                  }`}
                  placeholder='Confirm your password'
                  value={parent.confirmPassword}
                  onChange={(e) =>
                    setParent({ ...parent, confirmPassword: e.target.value })
                  }
                />
                <button
                  type='button'
                  className='btn btn-outline-secondary'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
                {errors.confirmPassword && (
                  <div className='invalid-feedback'>
                    {errors.confirmPassword}
                  </div>
                )}
              </div>
            </div>

            <div className='col-md-6'>
              <label className="form-label text-dark">Phone Number</label>
              <div className='input-group'>
                <span className='input-group-text'>
                  <Phone size={18} />
                </span>
                <input
                  type='tel'
                  className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                  placeholder='Enter your phone number'
                  value={parent.phone}
                  onChange={handlePhoneChange}
                />
                {errors.phone && (
                  <div className='invalid-feedback'>{errors.phone}</div>
                )}
              </div>
            </div>

            <div className='col-12'>
              <label className="form-label text-dark">Address</label>
              <div className='input-group'>
                <span className='input-group-text align-items-start pt-2'>
                  <Home size={18} />
                </span>
                <textarea
                  className={`form-control ${
                    errors.address ? 'is-invalid' : ''
                  }`}
                  placeholder='Enter your address'
                  rows='3'
                  value={parent.address}
                  onChange={(e) =>
                    setParent({ ...parent, address: e.target.value })
                  }
                ></textarea>
                {errors.address && (
                  <div className='invalid-feedback'>{errors.address}</div>
                )}
              </div>
            </div>

            <div className='col-12'>
              <label className="form-label text-dark">Student Admission Numbers</label>
              <div className='input-group mb-3'>
                <span className='input-group-text'>
                  <GraduationCap size={18} />
                </span>
                <input
                  type='text'
                  className={`form-control ${
                    errors.newChild ? 'is-invalid' : ''
                  }`}
                  placeholder='Enter admission number'
                  value={newChild}
                  onChange={handleNewChildChange}
                />
                <button
                  type='button'
                  onClick={handleAddChild}
                  className='btn btn-primary'
                  disabled={
                    (userRole === 'admin' && !parent.branchId) || !newChild.trim()
                  }
                >
                  <Plus size={18} className='me-1' /> Add
                </button>
                {errors.newChild && (
                  <div className='invalid-feedback'>{errors.newChild}</div>
                )}
              </div>

              {errors.children && (
                <div className='text-danger small mb-3'>{errors.children}</div>
              )}

              {validatedStudents.length > 0 && (
                <div className='mt-3'>
                  {validatedStudents.map((student) => (
                    <div
                      key={student.admissionNo}
                      className='d-flex justify-content-between align-items-center p-3 bg-light border rounded mb-2'
                    >
                      <div className='d-flex align-items-center'>
                        <GraduationCap
                          size={18}
                          className='text-primary me-2'
                        />
                        <div>
                          <p className='mb-0 fw-semibold'>{student.name}</p>
                          <small className='text-muted'>
                            {student.admissionNo} - Class {student.className}
                          </small>
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => handleRemoveChild(student.admissionNo)}
                        className='btn btn-sm btn-danger'
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className='mt-4'>
            <button
              type='submit'
              disabled={loading}
              className='btn btn-primary w-100 d-flex align-items-center justify-content-center'
            >
              {loading ? (
                <>
                  <Loader size={18} className='me-2 animate-spin' />
                  Creating Account...
                </>
              ) : (
                'Register Parent'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddParentForm;