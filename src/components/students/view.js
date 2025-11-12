import 'animate.css';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Modal,
  Row,
  Spinner,
  Tab,
  Table,
  Tabs,
} from 'react-bootstrap';
import { toast } from 'react-toastify';

// const API_BASE_URL = 'http://localhost:5000/api';

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

const HealthRecordManagement = () => {
  const [healthRecords, setHealthRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [message, setMessage] = useState({ text: '', type: '' });

  const [editFormData, setEditFormData] = useState({
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

  const fetchStudentDetails = async (admissionNo) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/students/admission/${admissionNo}`,
        getAuthConfig()
      );
      return response.data;
    } catch (err) {
      console.error('Error fetching student details:', err);
      return { name: 'Unknown', className: 'N/A', section: 'N/A' };
    }
  };
  
  const fetchHealthRecords = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/health-records`,
        getAuthConfig()
      );
      const recordsWithStudentInfo = await Promise.all(
        response.data.map(async (record) => {
          const studentDetails = await fetchStudentDetails(record.admissionNo);
          return { ...record, studentInfo: studentDetails };
        })
      );
      setHealthRecords(recordsWithStudentInfo);
      setFilteredRecords(recordsWithStudentInfo);
      setError(null);
    } catch (err) {
      setError(
        'Failed to load health records: ' +
          (err.response?.data?.message || err.message)
      );
      setMessage({ text: 'Failed to load health records.', type: 'danger' });
      toast.error('Error loading health records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthRecords();
  }, []);

  useEffect(() => {
    let filtered = [...healthRecords];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.admissionNo?.toLowerCase().includes(term) ||
          record.studentInfo?.name?.toLowerCase().includes(term) ||
          record.bloodGroup?.toLowerCase().includes(term)
      );
    }

    if (filterType === 'hasAllergies') {
      filtered = filtered.filter((record) =>
        record.allergies?.some((a) => a.trim())
      );
    } else if (filterType === 'hasMedicalConditions') {
      filtered = filtered.filter((record) =>
        record.chronicConditions?.some((c) => c.condition.trim())
      );
    } else if (filterType === 'onMedication') {
      filtered = filtered.filter((record) =>
        record.medications?.some((m) => m.name.trim())
      );
    }

    setFilteredRecords(filtered);
  }, [searchTerm, filterType, healthRecords]);

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setEditFormData({
      bloodGroup: record.bloodGroup || '',
      height: record.height || { value: '', unit: 'cm' },
      weight: record.weight || { value: '', unit: 'kg' },
      allergies: record.allergies?.length ? [...record.allergies] : [''],
      chronicConditions: record.chronicConditions?.length
        ? [...record.chronicConditions]
        : [{ condition: '', diagnosedDate: '', notes: '' }],
      medications: record.medications?.length
        ? [...record.medications]
        : [{ name: '', dosage: '', frequency: '', startDate: '', endDate: '' }],
      immunizations: record.immunizations?.length
        ? [...record.immunizations]
        : [{ name: '', date: '', nextDueDate: '' }],
      emergencyNotes: record.emergencyNotes || '',
      lastCheckup: record.lastCheckup || { date: '', doctor: '', findings: '' },
    });
    setShowEditModal(true);
  };

  const handleDeletePrompt = (record) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  };

  const handleArrayChange = (fieldName, index, e) => {
    const { name, value } = e.target;
    const updatedArray = [...editFormData[fieldName]];
    if (typeof updatedArray[index] === 'string') {
      updatedArray[index] = value;
    } else {
      updatedArray[index] = { ...updatedArray[index], [name]: value };
    }
    setEditFormData({ ...editFormData, [fieldName]: updatedArray });
  };

  const addArrayItem = (fieldName) => {
    const fieldArray = [...editFormData[fieldName]];
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
    setEditFormData({ ...editFormData, [fieldName]: fieldArray });
  };

  const removeArrayItem = (fieldName, index) => {
    const fieldArray = [...editFormData[fieldName]];
    if (fieldArray.length > 1) {
      fieldArray.splice(index, 1);
      setEditFormData({ ...editFormData, [fieldName]: fieldArray });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleHeightWeightChange = (e) => {
    const { name, value } = e.target;
    const [field, property] = name?.split('.');
    setEditFormData({
      ...editFormData,
      [field]: { ...editFormData[field], [property]: value },
    });
  };

  const handleLastCheckupChange = (e) => {
    const { name, value } = e.target;
    const field = name?.split('.')[1];
    setEditFormData({
      ...editFormData,
      lastCheckup: { ...editFormData.lastCheckup, [field]: value },
    });
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanedData = {
        ...editFormData,
        allergies: editFormData.allergies.filter((a) => a.trim()),
        chronicConditions: editFormData.chronicConditions.filter((c) =>
          c.condition.trim()
        ),
        medications: editFormData.medications.filter((m) => m.name.trim()),
        immunizations: editFormData.immunizations.filter((i) => i.name.trim()),
        height: editFormData.height.value ? editFormData.height : undefined,
        weight: editFormData.weight.value ? editFormData.weight : undefined,
        lastCheckup: editFormData.lastCheckup.date
          ? editFormData.lastCheckup
          : undefined,
      };

      const response = await axios.put(
        `${BASE_URL}/api/health-records/${selectedRecord._id}`,
        cleanedData,
        getAuthConfig()
      );

      setHealthRecords((prevRecords) =>
        prevRecords.map((record) =>
          record._id === selectedRecord._id
            ? { ...response.data, studentInfo: record.studentInfo }
            : record
        )
      );
      setMessage({
        text: 'Health record updated successfully!',
        type: 'success',
      });
      toast.success('Health record updated!');
      setShowEditModal(false);
    } catch (err) {
      setMessage({
        text:
          'Failed to update health record: ' +
          (err.response?.data?.message || err.message),
        type: 'danger',
      });
      toast.error('Error updating health record');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(
        `${BASE_URL}/api/health-records/${selectedRecord._id}`,
        getAuthConfig()
      );
      setHealthRecords((prevRecords) =>
        prevRecords.filter((record) => record._id !== selectedRecord._id)
      );
      setMessage({
        text: 'Health record deleted successfully!',
        type: 'success',
      });
      toast.success('Health record deleted!');
      setShowDeleteModal(false);
    } catch (err) {
      setMessage({
        text:
          'Failed to delete health record: ' +
          (err.response?.data?.message || err.message),
        type: 'danger',
      });
      toast.error('Error deleting health record');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
  };

  return (
    <Container fluid className='my-4 animate__animated animate__fadeIn'>
      <Card className='shadow-sm mb-4'>
        <Card.Header className='bg-primary text-white d-flex justify-content-between align-items-center'>
          <h4 className='mb-0'>Health Records Management</h4>
          
        </Card.Header>

        <Card.Body>
          {message.text && (
            <Alert
              variant={message.type}
              dismissible
              onClose={() => setMessage({ text: '', type: '' })}
            >
              {message.text}
            </Alert>
          )}

          <Row className='mb-4'>
            <Col xs={12} md={6} className='mb-3 mb-md-0'>
              <InputGroup>
                <InputGroup.Text>
                  <i className='bi bi-search'></i>
                </InputGroup.Text>
                <Form.Control
                  type='text'
                  placeholder='Search by admission number, name, or blood group...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col xs={12} md={6}>
              <Form.Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value='all'>All Records</option>
                <option value='hasAllergies'>Has Allergies</option>
                <option value='hasMedicalConditions'>
                  Has Medical Conditions
                </option>
                <option value='onMedication'>On Medication</option>
              </Form.Select>
            </Col>
          </Row>

          {loading && !filteredRecords.length ? (
            <div className='text-center my-5'>
              <Spinner animation='border' variant='primary' />
              <p className='mt-2'>Loading health records...</p>
            </div>
          ) : error ? (
            <Alert variant='danger'>{error}</Alert>
          ) : !filteredRecords.length ? (
            <Alert variant='info'>
              {searchTerm || filterType !== 'all'
                ? 'No health records match your search criteria.'
                : 'No health records found in the system.'}
            </Alert>
          ) : (
            <div className='table-responsive'>
              <Table striped bordered hover>
                <thead className='bg-light'>
                  <tr>
                    <th>Admission #</th>
                    <th>Student Name</th>
                    <th>Blood Group</th>
                    <th>Health Flags</th>
                    <th>Last Updated</th>
                    <th className='text-center'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record._id}>
                      <td>{record.admissionNo}</td>
                      <td>{record.studentInfo?.name || 'N/A'}</td>
                      <td>{record.bloodGroup || 'Not Specified'}</td>
                      <td>
                        {record.allergies?.some((a) => a.trim()) && (
                          <Badge bg='warning' className='me-1'>
                            Allergies
                          </Badge>
                        )}
                        {record.chronicConditions?.some((c) =>
                          c.condition.trim()
                        ) && (
                          <Badge bg='danger' className='me-1'>
                            Chronic Condition
                          </Badge>
                        )}
                        {record.medications?.some((m) => m.name.trim()) && (
                          <Badge bg='info'>On Medication</Badge>
                        )}
                      </td>
                      <td>{formatDate(record.updatedAt)}</td>
                      <td className='text-center'>
                        <Button
                          variant='outline-primary'
                          size='sm'
                          className='me-1 mt-1'
                          onClick={() => handleViewRecord(record)}
                        >
                          <i className='bi bi-eye'></i>
                        </Button>
                        <Button
                          variant='outline-success'
                          size='sm'
                          className='me-1 mt-1'
                          onClick={() => handleEditRecord(record)}
                        >
                          <i className='bi bi-pencil'></i>
                        </Button>
                        <Button
                          variant='outline-danger'
                          size='sm'
                           className='me-1 mt-1'
                          onClick={() => handleDeletePrompt(record)}
                        >
                          <i className='bi bi-trash'></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* View Health Record Modal */}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        size='lg'
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className='bi bi-clipboard2-pulse me-2'></i>Health Record Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord && (
            <>
              <Card className='mb-3'>
                <Card.Body>
                  <Row>
                    <Col xs={12} md={6}>
                      <h5>Student Information</h5>
                      <p>
                        <strong>Name:</strong>{' '}
                        {selectedRecord.studentInfo?.name || 'N/A'}
                      </p>
                      <p>
                        <strong>Admission No:</strong>{' '}
                        {selectedRecord.admissionNo}
                      </p>
                      <p>
                        <strong>Class:</strong>{' '}
                        {selectedRecord.studentInfo?.className}{' '}
                        {selectedRecord.studentInfo?.section}
                      </p>
                    </Col>
                    <Col xs={12} md={6}>
                      <h5>Basic Health Information</h5>
                      <p>
                        <strong>Blood Group:</strong>{' '}
                        {selectedRecord.bloodGroup || 'Not specified'}
                      </p>
                      <p>
                        <strong>Height:</strong>{' '}
                        {selectedRecord.height?.value
                          ? `${selectedRecord.height.value} ${selectedRecord.height.unit}`
                          : '-'}
                      </p>
                      <p>
                        <strong>Weight:</strong>{' '}
                        {selectedRecord.weight?.value
                          ? `${selectedRecord.weight.value} ${selectedRecord.weight.unit}`
                          : '-'}
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Tabs defaultActiveKey='allergies' className='mb-3'>
                <Tab eventKey='allergies' title='Allergies & Emergency'>
                  <Card>
                    <Card.Body>
                      <h5>Allergies</h5>
                      {selectedRecord.allergies?.some((a) => a.trim()) ? (
                        <ul>
                          {selectedRecord.allergies
                            .filter((a) => a.trim())
                            .map((allergy, index) => (
                              <li key={index}>{allergy}</li>
                            ))}
                        </ul>
                      ) : (
                        <p className='text-muted'>No allergies recorded</p>
                      )}
                      <h5 className='mt-4'>Emergency Notes</h5>
                      <p>
                        {selectedRecord.emergencyNotes ||
                          'No emergency notes recorded'}
                      </p>
                    </Card.Body>
                  </Card>
                </Tab>
                <Tab eventKey='conditions' title='Medical Conditions'>
                  <Card>
                    <Card.Body>
                      <h5>Chronic Conditions</h5>
                      {selectedRecord.chronicConditions?.some((c) =>
                        c.condition.trim()
                      ) ? (
                        <Table striped bordered responsive>
                          <thead>
                            <tr>
                              <th>Condition</th>
                              <th>Diagnosed Date</th>
                              <th>Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRecord.chronicConditions
                              .filter((c) => c.condition.trim())
                              .map((condition, index) => (
                                <tr key={index}>
                                  <td>{condition.condition}</td>
                                  <td>{formatDate(condition.diagnosedDate)}</td>
                                  <td>{condition.notes || 'N/A'}</td>
                                </tr>
                              ))}
                          </tbody>
                        </Table>
                      ) : (
                        <p className='text-muted'>
                          No chronic conditions recorded
                        </p>
                      )}
                    </Card.Body>
                  </Card>
                </Tab>
                <Tab eventKey='medications' title='Medications'>
                  <Card>
                    <Card.Body>
                      <h5>Current & Past Medications</h5>
                      {selectedRecord.medications?.some((m) =>
                        m.name.trim()
                      ) ? (
                        <Table striped bordered responsive>
                          <thead>
                            <tr>
                              <th>Medication</th>
                              <th>Dosage</th>
                              <th>Frequency</th>
                              <th>Start Date</th>
                              <th>End Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRecord.medications
                              .filter((m) => m.name.trim())
                              .map((medication, index) => (
                                <tr key={index}>
                                  <td>{medication.name}</td>
                                  <td>{medication.dosage || 'N/A'}</td>
                                  <td>{medication.frequency || 'N/A'}</td>
                                  <td>{formatDate(medication.startDate)}</td>
                                  <td>
                                    {medication.endDate
                                      ? formatDate(medication.endDate)
                                      : 'Ongoing'}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </Table>
                      ) : (
                        <p className='text-muted'>No medications recorded</p>
                      )}
                    </Card.Body>
                  </Card>
                </Tab>
                <Tab eventKey='immunizations' title='Immunizations'>
                  <Card>
                    <Card.Body>
                      <h5>Immunizations</h5>
                      {selectedRecord.immunizations?.some((i) =>
                        i.name.trim()
                      ) ? (
                        <Table striped bordered responsive>
                          <thead>
                            <tr>
                              <th>Immunization</th>
                              <th>Date Given</th>
                              <th>Next Due Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRecord.immunizations
                              .filter((i) => i.name.trim())
                              .map((immunization, index) => (
                                <tr key={index}>
                                  <td>{immunization.name}</td>
                                  <td>{formatDate(immunization.date)}</td>
                                  <td>
                                    {immunization.nextDueDate
                                      ? formatDate(immunization.nextDueDate)
                                      : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </Table>
                      ) : (
                        <p className='text-muted'>No immunizations recorded</p>
                      )}
                    </Card.Body>
                  </Card>
                </Tab>
                <Tab eventKey='checkup' title='Last Checkup'>
                  <Card>
                    <Card.Body>
                      <h5>Last Medical Checkup</h5>
                      {selectedRecord.lastCheckup?.date ? (
                        <Row>
                          <Col xs={12} md={4}>
                            <p>
                              <strong>Date:</strong>{' '}
                              {formatDate(selectedRecord.lastCheckup.date)}
                            </p>
                          </Col>
                          <Col xs={12} md={4}>
                            <p>
                              <strong>Doctor:</strong>{' '}
                              {selectedRecord.lastCheckup.doctor ||
                                'Not specified'}
                            </p>
                          </Col>
                          <Col xs={12}>
                            <p>
                              <strong>Findings:</strong>
                            </p>
                            <p className='border p-2 rounded bg-light'>
                              {selectedRecord.lastCheckup.findings ||
                                'No findings recorded'}
                            </p>
                          </Col>
                        </Row>
                      ) : (
                        <p className='text-muted'>
                          No checkup information recorded
                        </p>
                      )}
                    </Card.Body>
                  </Card>
                </Tab>
              </Tabs>

              <div className='mt-3 text-muted text-end'>
                <small>
                  Record ID: {selectedRecord._id}
                  <br />
                  Created: {formatDate(selectedRecord.createdAt)}
                  <br />
                  Last Updated: {formatDate(selectedRecord.updatedAt)}
                </small>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={() => setShowViewModal(false)}>
            Close
          </Button>
          <Button
            variant='primary'
            onClick={() => {
              setShowViewModal(false);
              handleEditRecord(selectedRecord);
            }}
          >
            Edit Record
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Health Record Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size='lg'
        centered
      >
        <Form onSubmit={handleSubmitEdit}>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className='bi bi-pencil-square me-2'></i>Edit Health Record
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {selectedRecord && (
              <>
                <Card className='mb-4'>
                  <Card.Header className='bg-light'>
                    Basic Health Information
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col xs={12} md={4}>
                        <Form.Group className='mb-3'>
                          <Form.Label>Blood Group</Form.Label>
                          <Form.Select
                            name='bloodGroup'
                            value={editFormData.bloodGroup}
                            onChange={handleInputChange}
                          >
                            <option value=''>Select Blood Group</option>
                            {[
                              'A+',
                              'A-',
                              'B+',
                              'B-',
                              'AB+',
                              'AB-',
                              'O+',
                              'O-',
                            ].map((bg) => (
                              <option key={bg} value={bg}>
                                {bg}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={4}>
                        <Form.Group className='mb-3'>
                          <Form.Label>Height</Form.Label>
                          <Row>
                            <Col xs={8}>
                              <Form.Control
                                type='number'
                                name='height.value'
                                value={editFormData.height.value}
                                onChange={handleHeightWeightChange}
                                placeholder='Height'
                                min='0'
                              />
                            </Col>
                            <Col xs={4}>
                              <Form.Select
                                name='height.unit'
                                value={editFormData.height.unit}
                                onChange={handleHeightWeightChange}
                              >
                                <option value='cm'>cm</option>
                                <option value='in'>in</option>
                              </Form.Select>
                            </Col>
                          </Row>
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={4}>
                        <Form.Group className='mb-3'>
                          <Form.Label>Weight</Form.Label>
                          <Row>
                            <Col xs={8}>
                              <Form.Control
                                type='number'
                                name='weight.value'
                                value={editFormData.weight.value}
                                onChange={handleHeightWeightChange}
                                placeholder='Weight'
                                min='0'
                              />
                            </Col>
                            <Col xs={4}>
                              <Form.Select
                                name='weight.unit'
                                value={editFormData.weight.unit}
                                onChange={handleHeightWeightChange}
                              >
                                <option value='kg'>kg</option>
                                <option value='lb'>lb</option>
                              </Form.Select>
                            </Col>
                          </Row>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className='mb-3'>
                      <Form.Label>Allergies</Form.Label>
                      {editFormData.allergies.map((allergy, index) => (
                        <Row
                          key={`allergy-${index}`}
                          className='mb-2 align-items-center'
                        >
                          <Col xs={9} sm={10}>
                            <Form.Control
                              type='text'
                              value={allergy}
                              onChange={(e) =>
                                handleArrayChange('allergies', index, e)
                              }
                              placeholder='Enter allergy'
                            />
                          </Col>
                          <Col xs={3} sm={2}>
                            <Button
                              variant='outline-danger'
                              size='sm'
                              onClick={() =>
                                removeArrayItem('allergies', index)
                              }
                              disabled={editFormData.allergies.length === 1}
                              className='w-100'
                            >
                              <i className='bi bi-trash'></i>
                            </Button>
                          </Col>
                        </Row>
                      ))}
                      <Button
                        variant='outline-primary'
                        size='sm'
                        onClick={() => addArrayItem('allergies')}
                        className='mt-2'
                      >
                        <i className='bi bi-plus-circle me-1'></i> Add Allergy
                      </Button>
                    </Form.Group>
                    <Form.Group className='mb-3'>
                      <Form.Label>Emergency Notes</Form.Label>
                      <Form.Control
                        as='textarea'
                        rows={3}
                        name='emergencyNotes'
                        value={editFormData.emergencyNotes}
                        onChange={handleInputChange}
                        placeholder='Add emergency medical information'
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>

                <Card className='mb-4'>
                  <Card.Header className='bg-light'>
                    Chronic Conditions
                  </Card.Header>
                  <Card.Body>
                    {editFormData.chronicConditions.map((condition, index) => (
                      <Row
                        key={`condition-${index}`}
                        className='mb-3 align-items-end'
                      >
                        <Col xs={12} md={4}>
                          <Form.Control
                            type='text'
                            name='condition'
                            value={condition.condition}
                            onChange={(e) =>
                              handleArrayChange('chronicConditions', index, e)
                            }
                            placeholder='Condition'
                          />
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Control
                            type='date'
                            name='diagnosedDate'
                            value={condition.diagnosedDate?.split('T')[0] || ''}
                            onChange={(e) =>
                              handleArrayChange('chronicConditions', index, e)
                            }
                          />
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Control
                            type='text'
                            name='notes'
                            value={condition.notes}
                            onChange={(e) =>
                              handleArrayChange('chronicConditions', index, e)
                            }
                            placeholder='Notes'
                          />
                        </Col>
                        <Col xs={12} md={2}>
                          <Button
                            variant='outline-danger'
                            size='sm'
                            onClick={() =>
                              removeArrayItem('chronicConditions', index)
                            }
                            disabled={
                              editFormData.chronicConditions.length === 1
                            }
                            className='w-100'
                          >
                            <i className='bi bi-trash'></i>
                          </Button>
                        </Col>
                      </Row>
                    ))}
                    <Button
                      variant='outline-primary'
                      size='sm'
                      onClick={() => addArrayItem('chronicConditions')}
                    >
                      <i className='bi bi-plus-circle me-1'></i> Add Condition
                    </Button>
                  </Card.Body>
                </Card>

                <Card className='mb-4'>
                  <Card.Header className='bg-light'>Medications</Card.Header>
                  <Card.Body>
                    {editFormData.medications.map((medication, index) => (
                      <Row
                        key={`medication-${index}`}
                        className='mb-3 align-items-end'
                      >
                        <Col xs={12} md={3}>
                          <Form.Control
                            type='text'
                            name='name'
                            value={medication.name}
                            onChange={(e) =>
                              handleArrayChange('medications', index, e)
                            }
                            placeholder='Medication Name'
                          />
                        </Col>
                        <Col xs={12} md={2}>
                          <Form.Control
                            type='text'
                            name='dosage'
                            value={medication.dosage}
                            onChange={(e) =>
                              handleArrayChange('medications', index, e)
                            }
                            placeholder='Dosage'
                          />
                        </Col>
                        <Col xs={12} md={2}>
                          <Form.Control
                            type='text'
                            name='frequency'
                            value={medication.frequency}
                            onChange={(e) =>
                              handleArrayChange('medications', index, e)
                            }
                            placeholder='Frequency'
                          />
                        </Col>
                        <Col xs={12} md={2}>
                          <Form.Control
                            type='date'
                            name='startDate'
                            value={medication.startDate?.split('T')[0] || ''}
                            onChange={(e) =>
                              handleArrayChange('medications', index, e)
                            }
                          />
                        </Col>
                        <Col xs={12} md={2}>
                          <Form.Control
                            type='date'
                            name='endDate'
                            value={medication.endDate?.split('T')[0] || ''}
                            onChange={(e) =>
                              handleArrayChange('medications', index, e)
                            }
                          />
                        </Col>
                        <Col xs={12} md={1}>
                          <Button
                            variant='outline-danger'
                            size='sm'
                            onClick={() =>
                              removeArrayItem('medications', index)
                            }
                            disabled={editFormData.medications.length === 1}
                            className='w-100'
                          >
                            <i className='bi bi-trash'></i>
                          </Button>
                        </Col>
                      </Row>
                    ))}
                    <Button
                      variant='outline-primary'
                      size='sm'
                      onClick={() => addArrayItem('medications')}
                    >
                      <i className='bi bi-plus-circle me-1'></i> Add Medication
                    </Button>
                  </Card.Body>
                </Card>

                <Card className='mb-4'>
                  <Card.Header className='bg-light'>Immunizations</Card.Header>
                  <Card.Body>
                    {editFormData.immunizations.map((immunization, index) => (
                      <Row
                        key={`immunization-${index}`}
                        className='mb-3 align-items-end'
                      >
                        <Col xs={12} md={4}>
                          <Form.Control
                            type='text'
                            name='name'
                            value={immunization.name}
                            onChange={(e) =>
                              handleArrayChange('immunizations', index, e)
                            }
                            placeholder='Vaccine Name'
                          />
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Control
                            type='date'
                            name='date'
                            value={immunization.date?.split('T')[0] || ''}
                            onChange={(e) =>
                              handleArrayChange('immunizations', index, e)
                            }
                          />
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Control
                            type='date'
                            name='nextDueDate'
                            value={immunization.nextDueDate?.split('T')[0] || ''}
                            onChange={(e) =>
                              handleArrayChange('immunizations', index, e)
                            }
                          />
                        </Col>
                        <Col xs={12} md={2}>
                          <Button
                            variant='outline-danger'
                            size='sm'
                            onClick={() =>
                              removeArrayItem('immunizations', index)
                            }
                            disabled={editFormData.immunizations.length === 1}
                            className='w-100'
                          >
                            <i className='bi bi-trash'></i>
                          </Button>
                        </Col>
                      </Row>
                    ))}
                    <Button
                      variant='outline-primary'
                      size='sm'
                      onClick={() => addArrayItem('immunizations')}
                    >
                      <i className='bi bi-plus-circle me-1'></i> Add
                      Immunization
                    </Button>
                  </Card.Body>
                </Card>

                <Card className='mb-4'>
                  <Card.Header className='bg-light'>
                    Last Medical Checkup
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col xs={12} md={4}>
                        <Form.Group className='mb-3'>
                          <Form.Label>Checkup Date</Form.Label>
                          <Form.Control
                            type='date'
                            name='lastCheckup.date'
                            value={
                              editFormData.lastCheckup.date?.split('T')[0] || ''
                            }
                            onChange={handleLastCheckupChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={4}>
                        <Form.Group className='mb-3'>
                          <Form.Label>Doctor's Name</Form.Label>
                          <Form.Control
                            type='text'
                            name='lastCheckup.doctor'
                            value={editFormData.lastCheckup.doctor}
                            onChange={handleLastCheckupChange}
                            placeholder="Doctor's name"
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={4}>
                        <Form.Group className='mb-3'>
                          <Form.Label>Findings/Notes</Form.Label>
                          <Form.Control
                            type='text'
                            name='lastCheckup.findings'
                            value={editFormData.lastCheckup.findings}
                            onChange={handleLastCheckupChange}
                            placeholder='Medical findings'
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant='secondary'
              onClick={() => setShowEditModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button variant='success' type='submit' disabled={loading}>
              {loading ? (
                <>
                  <Spinner
                    as='span'
                    animation='border'
                    size='sm'
                    className='me-2'
                  />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        size='md'
        centered
      >
        <Modal.Header closeButton className='bg-danger text-white'>
          <Modal.Title>
            <i className='bi bi-exclamation-triangle me-2'></i>Confirm Deletion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord && (
            <>
              <p className='mb-3'>
                Are you sure you want to delete the health record for:
              </p>
              <Card className='bg-light mb-3'>
                <Card.Body>
                  <p className='mb-0'>
                    <strong>Student:</strong>{' '}
                    {selectedRecord.studentInfo?.name || 'Unknown'}
                    <br />
                    <strong>Admission No:</strong> {selectedRecord.admissionNo}
                    <br />
                    {selectedRecord.studentInfo?.className && (
                      <>
                        <strong>Class:</strong>{' '}
                        {selectedRecord.studentInfo?.className}{' '}
                        {selectedRecord.studentInfo?.section}
                      </>
                    )}
                  </p>
                </Card.Body>
              </Card>
              <p className='text-danger'>
                <i className='bi bi-exclamation-circle me-1'></i>
                This action cannot be undone. All health information will be
                permanently removed.
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant='secondary'
            onClick={() => setShowDeleteModal(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant='danger'
            onClick={handleConfirmDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as='span'
                  animation='border'
                  size='sm'
                  className='me-2'
                />
                Deleting...
              </>
            ) : (
              'Delete Permanently'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default HealthRecordManagement;
