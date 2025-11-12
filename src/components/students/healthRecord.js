import 'animate.css';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { toast } from 'react-toastify';
import HealthRecordManagement from './view';

// const API_URL = 'http://localhost:5000/api';


const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    toast.error('Please log in to access this feature');
    throw new Error('No token found');
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

const HealthRecordForm = () => {
  const [admissionNo, setAdmissionNo] = useState('');
  const [studentFound, setStudentFound] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    bloodGroup: '',
    height: { value: '', unit: 'cm' },
    weight: { value: '', unit: 'kg' },
    allergies: [''],
    chronicConditions: [{ condition: '', diagnosedDate: '', notes: '' }],
    medications: [
      { name: '', dosage: '', frequency: '', startDate: '', endDate: '' },
    ],
    immunizations: [{ name: '', date: '', nextDueDate: '' }],
    emergencyNotes: '',
    lastCheckup: { date: '', doctor: '', findings: '' },
  });

  // Fetch student and health record
  const findStudent = async () => {
    if (!/^\d{3}$/.test(admissionNo)) {
      setMessage({ text: 'Admission number must be 3 digits', type: 'danger' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/students/admission/${admissionNo}`,
        getAuthConfig()
      );
      setStudentInfo(response.data);
      setStudentFound(true);
      setMessage({ text: 'Student found successfully', type: 'success' });

      if (response.data.healthRecord) {
        const healthRecordResponse = await axios.get(
          `${BASE_URL}/api/health-records/${response.data.healthRecord}`,
          getAuthConfig()
        );
        const healthData = healthRecordResponse.data;
        setFormData({
          bloodGroup: healthData.bloodGroup || '',
          height: healthData.height || { value: '', unit: 'cm' },
          weight: healthData.weight || { value: '', unit: 'kg' },
          allergies: healthData.allergies.length ? healthData.allergies : [''],
          chronicConditions: healthData.chronicConditions.length
            ? healthData.chronicConditions
            : [{ condition: '', diagnosedDate: '', notes: '' }],
          medications: healthData.medications.length
            ? healthData.medications
            : [
                {
                  name: '',
                  dosage: '',
                  frequency: '',
                  startDate: '',
                  endDate: '',
                },
              ],
          immunizations: healthData.immunizations.length
            ? healthData.immunizations
            : [{ name: '', date: '', nextDueDate: '' }],
          emergencyNotes: healthData.emergencyNotes || '',
          lastCheckup: healthData.lastCheckup || {
            date: '',
            doctor: '',
            findings: '',
          },
        });
        setMessage({ text: 'Existing health record loaded', type: 'info' });
      }
    } catch (error) {
      setStudentFound(false);
      setMessage({
        text: error.response?.data?.message || 'Student not found',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  // Generic input change handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleHeightWeightChange = (e) => {
    const { name, value } = e.target;
    const [field, property] = name.split('.');
    setFormData({
      ...formData,
      [field]: { ...formData[field], [property]: value },
    });
  };

  const handleArrayChange = (fieldName, index, e) => {
    const { name, value } = e.target;
    const updatedArray = [...formData[fieldName]];
    if (typeof updatedArray[index] === 'string') {
      updatedArray[index] = value;
    } else {
      updatedArray[index] = { ...updatedArray[index], [name]: value };
    }
    setFormData({ ...formData, [fieldName]: updatedArray });
  };

  const addArrayItem = (fieldName) => {
    const fieldArray = [...formData[fieldName]];
    if (fieldName === 'allergies') fieldArray.push('');
    else if (fieldName === 'chronicConditions')
      fieldArray.push({ condition: '', diagnosedDate: '', notes: '' });
    else if (fieldName === 'medications')
      fieldArray.push({
        name: '',
        dosage: '',
        frequency: '',
        startDate: '',
        endDate: '',
      });
    else if (fieldName === 'immunizations')
      fieldArray.push({ name: '', date: '', nextDueDate: '' });
    setFormData({ ...formData, [fieldName]: fieldArray });
  };

  const removeArrayItem = (fieldName, index) => {
    const fieldArray = [...formData[fieldName]];
    if (fieldArray.length > 1) {
      fieldArray.splice(index, 1);
      setFormData({ ...formData, [fieldName]: fieldArray });
    }
  };

  const handleLastCheckupChange = (e) => {
    const { name, value } = e.target;
    const field = name.split('.')[1];
    setFormData({
      ...formData,
      lastCheckup: { ...formData.lastCheckup, [field]: value },
    });
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentInfo) {
      setMessage({ text: 'Please find a student first', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const healthRecordData = {
        ...formData,
        studentId: studentInfo._id,
        admissionNo: studentInfo.admissionNo,
        height: formData.height.value ? formData.height : undefined,
        weight: formData.weight.value ? formData.weight : undefined,
        allergies: formData.allergies.filter((a) => a.trim()),
        chronicConditions: formData.chronicConditions.filter((c) =>
          c.condition.trim()
        ),
        medications: formData.medications.filter((m) => m.name.trim()),
        immunizations: formData.immunizations.filter((i) => i.name.trim()),
        lastCheckup: formData.lastCheckup.date
          ? formData.lastCheckup
          : undefined,
      };

      let response;
      if (studentInfo.healthRecord) {
        response = await axios.put(
          `${BASE_URL}/api/health-records/${studentInfo.healthRecord}`,
          healthRecordData,
          getAuthConfig()
        );
        setMessage({
          text: 'Health record updated successfully',
          type: 'success',
        });
      } else {
        response = await axios.post(
          `${BASE_URL}/api/health-records`,
          healthRecordData,
          getAuthConfig()
        );
        await axios.put(
          `${BASE_URL}/api/students/${studentInfo._id}/link-health-record`,
          { healthRecordId: response.data._id },
          getAuthConfig()
        );
        setMessage({
          text: 'Health record created and linked to student successfully',
          type: 'success',
        });
      }

      const updatedStudent = await axios.get(
        `${BASE_URL}/api/students/admission/${admissionNo}`,
        getAuthConfig()
      );
      setStudentInfo(updatedStudent.data);
      toast.success('Health record saved successfully!');
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || 'Failed to save health record',
        type: 'danger',
      });
      toast.error(
        error.response?.data?.message || 'Error saving health record'
      );
    } finally {
      setLoading(false);
    }
  };

  // Responsive styling
  const cardStyle = { transition: 'all 0.3s ease-in-out' };
  const formStyle = {
    maxHeight: '70vh',
    overflowY: 'auto',
    paddingRight: '15px',
  };

  return (
    <Container fluid className='my-4'>
      <HealthRecordManagement />
    </Container>
  );
};

export default HealthRecordForm;
