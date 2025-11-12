import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useCallback, useEffect, useState } from 'react';

function App() {
  const [teachers, setTeachers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editTeacherId, setEditTeacherId] = useState(null);
  const [passwordError, setPasswordError] = useState('');
  const [idError, setIdError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [timetableError, setTimetableError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timetable, setTimetable] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempFilterClass, setTempFilterClass] = useState('');
  const [tempFilterSection, setTempFilterSection] = useState('');
  const [tempFilterSubject, setTempFilterSubject] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [staffType, setStaffType] = useState('Teaching');
  const [formData, setFormData] = useState({});
  const [nameError, setNameError] = useState('');
  const teachersPerPage = 10;

  const classes = [
    'Nursery', 'LKG', 'UKG', '1st Grade', '2nd Grade', '3rd Grade',
    '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade',
    '9th Grade', '10th Grade'
  ];
  const sections = ['A', 'B'];
  const subjects = [
    'Math', 'Science', 'English', 'History', 'Geography', 'Hindi', 'Computer Science'
  ];

  const classSectionOptions = classes.flatMap((cls) =>
    sections.map((sec) => `${cls}-${sec}`)
  );
  // const BASE_URL = 'http://localhost:5000/api';

  const BASE_URL =
    process.env.NODE_ENV === "production"
      ? process.env.REACT_APP_API_DEPLOYED_URL
      : process.env.REACT_APP_API_URL;

  const initialTimetable = [
    { time: '9:00 - 9:45', class: '' },
    { time: '9:45 - 10:30', class: '' },
    { time: '10:30 - 10:45', class: 'Break' },
    { time: '10:45 - 11:30', class: '' },
    { time: '11:30 - 12:15', class: '' },
    { time: '12:15 - 1:15', class: 'Lunch' },
    { time: '1:15 - 2:00', class: '' },
    { time: '2:00 - 2:45', class: '' },
    { time: '2:45 - 3:00', class: 'Break' },
    { time: '3:00 - 3:45', class: '' },
    { time: '3:45 - 4:30', class: '' },
  ];

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found, please log in');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    };
  };

const fetchTeachers = useCallback(async () => {
  try {
    const config = getAuthConfig(); // Ensure getAuthConfig is stable
    const response = await axios.get(`${BASE_URL}/api/teachers`, config);
    setTeachers(response.data);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    alert(error.response?.data?.message || "Failed to fetch teachers");
  }
}, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleAddTeacher = async (newTeacher) => {
    try {
      // Check if the teacherId already exists in the current teachers list
    const isDuplicateId = teachers.some(
      (teacher) => teacher.teacherId === newTeacher.teacherId && teacher._id !== editTeacherId
    );

    if (isDuplicateId) {
      alert(`Staff ID "${newTeacher.teacherId}" already exists. Please use a unique ID.`);
      return;
    }
      const formData = new FormData();
      for (const key in newTeacher) {
        if (key === 'profilePic' && newTeacher[key] instanceof File) {
          formData.append(key, newTeacher[key]);
        } else if (key === 'timetable') {
          formData.append('timetable', JSON.stringify(newTeacher.timetable));
        } else {
          formData.append(key, newTeacher[key]);
        }
      }

      const config = getAuthConfig();
      let response;

      if (editTeacherId) {
        response = await axios.put(
          `${BASE_URL}/api/teachers/${editTeacherId}`,
          formData,
          config
        );
        setTeachers(
          teachers.map((t) =>
            t._id === editTeacherId ? response.data.data : t
          )
        );
      } else {
        response = await axios.post(`${BASE_URL}/api/teachers`, formData, config);
        setTeachers([...teachers, response.data.data]);
      }

      setShowForm(false);
      setEditTeacherId(null);
      setSelectedTeacher(response.data.data);
      setShowPassword(false);
      setTimetable(initialTimetable);
      setStaffType('Teaching');
      setFormData({});
      setNameError('');
    } catch (error) {
      console.error('Error saving teacher:', error);
      alert(error.response?.data?.message || 'Failed to save teacher');
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        const config = getAuthConfig();
        await axios.delete(`${BASE_URL}/api/teachers/${id}`, config);
        setTeachers(teachers.filter((teacher) => teacher._id !== id));
      } catch (error) {
        console.error('Error deleting teacher:', error);
        alert(error.response?.data?.message || 'Failed to delete teacher');
      }
    }
  };

  const handleEditTeacher = (id) => {
    const teacherToEdit = teachers.find((teacher) => teacher._id === id);
    if (teacherToEdit) {
      setEditTeacherId(id);
      setShowForm(true);
      setTimetable(teacherToEdit.timetable || initialTimetable);
      setStaffType(teacherToEdit.staffType || 'Teaching');
      setShowPassword(false);
      setFormData({
        teacherId: teacherToEdit.teacherId,
        name: teacherToEdit.name,
        email: teacherToEdit.email,
        phoneNo: teacherToEdit.phoneNo,
        joiningDate: formatDate(teacherToEdit.joiningDate),
        dateOfBirth: formatDate(teacherToEdit.dateOfBirth),
        gender: teacherToEdit.gender,
        address: teacherToEdit.address,
        password: teacherToEdit.password,
        salary: teacherToEdit.salary,
        ...(teacherToEdit.staffType === 'Teaching' && {
          qualification: teacherToEdit.qualification,
          classTeacherFor: teacherToEdit.classTeacherFor,
          section: teacherToEdit.section,
          subject: teacherToEdit.subject,
        }),
        ...(teacherToEdit.staffType === 'Non-Teaching' && {
          designation: teacherToEdit.designation,
        }),
      });
    }
  };

  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password
    );

  const validateTeacherId = (id, staffType) => {
    return staffType === 'Teaching' ? /^T\d{3}$/.test(id) : /^N\d{3}$/.test(id);
  };

  const validateEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z]{2,}\.[a-zA-Z]{2,}$/.test(email);

  const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);

  const validateTimetable = (timetable) => {
    const classes = timetable
      .map((slot) => slot.class)
      .filter((cls) => cls !== 'Break' && cls !== 'Lunch');
    const uniqueClasses = [...new Set(classes)];
    return classes.length === uniqueClasses.length;
  };

  const validateName = (name) => /^[a-zA-Z\s]*$/.test(name);

  const handleSort = (field) => {
    const order = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(order);
  };

  const sortedTeachers = [...teachers].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    
    // Handle numeric sorting for salary
    if (sortField === 'salary') {
      return sortOrder === 'asc'
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    }
    
    // String sorting for other fields
    return sortOrder === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const searchedTeachers = sortedTeachers.filter(
    (teacher) =>
      teacher.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.teacherId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${teacher.classTeacherFor ?? ''} - ${teacher.section ?? ''}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      teacher.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeachers = searchedTeachers.filter(
    (teacher) =>
      (filterClass ? teacher.classTeacherFor === filterClass : true) &&
      (filterSection ? teacher.section === filterSection : true) &&
      (filterSubject ? teacher.subject === filterSubject : true)
  );

  const teachingStaff = filteredTeachers.filter(
    (teacher) => teacher.staffType === 'Teaching'
  );
  const nonTeachingStaff = filteredTeachers.filter(
    (teacher) => teacher.staffType === 'Non-Teaching'
  );

  const indexOfLastTeacher = currentPage * teachersPerPage;
  const indexOfFirstTeacher = indexOfLastTeacher - teachersPerPage;
  const currentTeachingStaff = teachingStaff.slice(
    indexOfFirstTeacher,
    indexOfLastTeacher
  );
  const currentNonTeachingStaff = nonTeachingStaff.slice(
    indexOfFirstTeacher,
    indexOfLastTeacher
  );
  const totalPagesTeaching = Math.ceil(teachingStaff.length / teachersPerPage);
  const totalPagesNonTeaching = Math.ceil(
    nonTeachingStaff.length / teachersPerPage
  );

  const today = new Date();
  const maxBirthDate = new Date();
  maxBirthDate.setFullYear(today.getFullYear() - 21);
  const maxBirthDateStr = maxBirthDate.toISOString().split('T')[0];

  const handleTimetableTimeChange = (index, newTime) => {
    const updatedTimetable = [...timetable];
    updatedTimetable[index] = { ...updatedTimetable[index], time: newTime };
    setTimetable(updatedTimetable);
    if (staffType === 'Teaching') {
      setTimetableError(
        validateTimetable(updatedTimetable)
          ? ''
          : 'Each class in timetable must be unique'
      );
    }
  };

  const handleTimetableClassChange = (index, newClass) => {
    const updatedTimetable = [...timetable];
    updatedTimetable[index] = { ...updatedTimetable[index], class: newClass };
    setTimetable(updatedTimetable);
    if (staffType === 'Teaching') {
      setTimetableError(
        validateTimetable(updatedTimetable)
          ? ''
          : 'Each class in timetable must be unique'
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));

    switch (name) {
      case 'password':
        setPasswordError(
          validatePassword(value)
            ? ''
            : 'Password must be at least 8 characters with one uppercase, lowercase, number, and special character.'
        );
        break;
      case 'teacherId':
        setIdError(
          validateTeacherId(value, staffType)
            ? ''
            : staffType === 'Teaching'
            ? 'ID must be T followed by 3 digits (e.g., T001)'
            : 'ID must be N followed by 3 digits (e.g., N001)'
        );
        break;
      case 'email':
        setEmailError(
          validateEmail(value) ? '' : 'Email must be valid (e.g., example@domain.topleveldomain)'
        );
        break;
      case 'phoneNo':
        setPhoneError(
          validatePhone(value) ? '' : 'Phone must be 10 digits starting with 6-9'
        );
        break;
      case 'name':
        setNameError(
          validateName(value) ? '' : 'Name must contain only letters and spaces'
        );
        break;
      default:
        break;
    }
  };

  return (
    <div
      className="container-fluid"
      style={{ minHeight: "100vh", padding: "1rem" }}
    >
      <div className="row">
        <div className="col-12 p-0">
          {!showForm && !selectedTeacher && (
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
              <div className="w-100 w-md-50">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Name, ID, Class & Section, Phone No, or Subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    borderRadius: "1rem",
                    boxShadow: "0 0.25rem 0.5rem rgba(0,0,0,0.1)",
                    borderColor: "#6f42c1",
                  }}
                />
              </div>
              <div className="d-flex flex-wrap gap-2">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowFilterModal(true)}
                  style={{
                    borderRadius: "1rem",
                    backgroundColor: "#6f42c1",
                    borderColor: "#6f42c1",
                  }}
                >
                  <i className="bi bi-funnel"></i> Filter
                </button>
                {(filterClass || filterSection || filterSubject) && (
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => {
                      setFilterClass("");
                      setFilterSection("");
                      setFilterSubject("");
                      setTempFilterClass("");
                      setTempFilterSection("");
                      setTempFilterSubject("");
                      setCurrentPage(1);
                    }}
                    style={{ borderRadius: "1rem" }}
                  >
                    <i className="bi bi-x-circle"></i> Clear
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowForm(true);
                    setEditTeacherId(null);
                    setTimetable(initialTimetable);
                    setShowPassword(false);
                    setStaffType("Teaching");
                    setFormData({});
                  }}
                  style={{
                    borderRadius: "1rem",
                    backgroundColor: "#6f42c1",
                    borderColor: "#6f42c1",
                  }}
                >
                  <i className="bi bi-plus-circle"></i> Add Staff
                </button>
              </div>
            </div>
          )}

          {showFilterModal && (
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div
                  className="modal-content"
                  style={{
                    borderRadius: "1rem",
                    borderColor: "#6f42c1",
                  }}
                >
                  <div
                    className="modal-header"
                    style={{
                      backgroundColor: "#6f42c1",
                      color: "white",
                      borderRadius: "1rem 1rem 0 0",
                    }}
                  >
                    <h5 className="modal-title">Filter Teachers</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowFilterModal(false)}
                      style={{ filter: "invert(1)" }}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label text-dark">Class</label>
                      <select
                        className="form-control"
                        value={tempFilterClass}
                        onChange={(e) => setTempFilterClass(e.target.value)}
                        style={{
                          borderRadius: "0.5rem",
                          borderColor: "#6f42c1",
                        }}
                      >
                        <option value="">All Classes</option>
                        {classes.map((cls, index) => (
                          <option key={index} value={cls}>
                            {cls}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-dark">Section</label>
                      <select
                        className="form-control"
                        value={tempFilterSection}
                        onChange={(e) => setTempFilterSection(e.target.value)}
                        style={{
                          borderRadius: "0.5rem",
                          borderColor: "#6f42c1",
                        }}
                      >
                        <option value="">All Sections</option>
                        {sections.map((sec, index) => (
                          <option key={index} value={sec}>
                            {sec}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-dark">Subject</label>
                      <select
                        className="form-control"
                        value={tempFilterSubject}
                        onChange={(e) => setTempFilterSubject(e.target.value)}
                        style={{
                          borderRadius: "0.5rem",
                          borderColor: "#6f42c1",
                        }}
                      >
                        <option value="">All Subjects</option>
                        {subjects.map((sub, index) => (
                          <option key={index} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowFilterModal(false)}
                      style={{ borderRadius: "1rem" }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setFilterClass(tempFilterClass);
                        setFilterSection(tempFilterSection);
                        setFilterSubject(tempFilterSubject);
                        setShowFilterModal(false);
                        setCurrentPage(1);
                      }}
                      style={{
                        borderRadius: "1rem",
                        backgroundColor: "#6f42c1",
                        borderColor: "#6f42c1",
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showForm && !selectedTeacher && (
            <>
              <div
                className="card shadow mb-4"
                style={{
                  borderRadius: "1rem",
                  background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
                  borderColor: "#6f42c1",
                }}
              >
                <h1
                  className="card-header"
                  style={{
                    color: "#6f42c1",
                    fontSize: "clamp(1.5rem, 3vw, 2rem)",
                    backgroundColor: "#fff",
                    borderBottom: "2px solid #6f42c1",
                  }}
                >
                  Teaching Staff List
                </h1>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead
                        style={{ backgroundColor: "#6f42c1", color: "white" }}
                      >
                        <tr>
                          <th>Photo</th>
                          <th onClick={() => handleSort("teacherId")}>
                            ID{" "}
                            {sortField === "teacherId"
                              ? sortOrder === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </th>
                          <th onClick={() => handleSort("name")}>
                            Name{" "}
                            {sortField === "name"
                              ? sortOrder === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </th>
                          <th onClick={() => handleSort("classTeacherFor")}>
                            Class{" "}
                            {sortField === "classTeacherFor"
                              ? sortOrder === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </th>
                          <th onClick={() => handleSort("subject")}>
                            Subject{" "}
                            {sortField === "subject"
                              ? sortOrder === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </th>
                          <th onClick={() => handleSort("phoneNo")}>
                            Phone{" "}
                            {sortField === "phoneNo"
                              ? sortOrder === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </th>
                          <th onClick={() => handleSort("salary")}>
                            Salary{" "}
                            {sortField === "salary"
                              ? sortOrder === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTeachingStaff.map((teacher) => (
                          <tr key={teacher._id}>
                            <td>
                              {teacher.profilePic && (
                                <img
                                  src={`${BASE_URL}/${teacher.profilePic}`}
                                  alt="Profile"
                                  className="rounded-circle"
                                  style={{
                                    width: "2rem",
                                    height: "2rem",
                                    cursor: "pointer",
                                  }}
                                  onClick={() => setSelectedTeacher(teacher)}
                                />
                              )}
                            </td>
                            <td>{teacher.teacherId}</td>
                            <td>{teacher.name}</td>
                            <td>
                              {teacher.classTeacherFor} - {teacher.section}
                            </td>
                            <td>{teacher.subject}</td>
                            <td>{teacher.phoneNo}</td>
                            <td>{teacher.salary}</td>
                            <td>
                              <div className="d-flex gap-1 flex-wrap">
                                <button
                                  className="btn btn-warning btn-sm"
                                  onClick={() => handleEditTeacher(teacher._id)}
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() =>
                                    handleDeleteTeacher(teacher._id)
                                  }
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                                <button
                                  className="btn btn-info btn-sm"
                                  onClick={() => setSelectedTeacher(teacher)}
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <nav className="d-flex justify-content-between align-items-center mt-3">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-arrow-left"></i>
                    </button>
                    <span>
                      {currentPage} of {totalPagesTeaching}
                    </span>
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPagesTeaching}
                    >
                      <i className="bi bi-arrow-right"></i>
                    </button>
                  </nav>
                </div>
              </div>

              <div
                className="card shadow"
                style={{
                  borderRadius: "1rem",
                  background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
                  borderColor: "#6f42c1",
                }}
              >
                <h1
                  className="card-header"
                  style={{
                    color: "#6f42c1",
                    fontSize: "clamp(1.5rem, 3vw, 2rem)",
                    backgroundColor: "#fff",
                    borderBottom: "2px solid #6f42c1",
                  }}
                >
                  Non-Teaching Staff List
                </h1>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead
                        style={{ backgroundColor: "#6f42c1", color: "white" }}
                      >
                        <tr>
                          <th>Photo</th>
                          <th onClick={() => handleSort("teacherId")}>
                            ID{" "}
                            {sortField === "teacherId"
                              ? sortOrder === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </th>
                          <th onClick={() => handleSort("name")}>
                            Name{" "}
                            {sortField === "name"
                              ? sortOrder === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </th>
                          <th onClick={() => handleSort("designation")}>
                            Designation{" "}
                            {sortField === "designation"
                              ? sortOrder === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </th>
                          <th onClick={() => handleSort("phoneNo")}>
                            Phone{" "}
                            {sortField === "phoneNo"
                              ? sortOrder === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </th>
                          <th onClick={() => handleSort("salary")}>
                            Salary{" "}
                            {sortField === "salary"
                              ? sortOrder === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentNonTeachingStaff.map((staff) => (
                          <tr key={staff._id}>
                            <td>
                              {staff.profilePic && (
                                <img
                                  src={`${BASE_URL}/${staff.profilePic}`}
                                  alt="Profile"
                                  className="rounded-circle"
                                  style={{
                                    width: "2rem",
                                    height: "2rem",
                                    cursor: "pointer",
                                  }}
                                  onClick={() => setSelectedTeacher(staff)}
                                />
                              )}
                            </td>
                            <td>{staff.teacherId}</td>
                            <td>{staff.name}</td>
                            <td>{staff.designation}</td>
                            <td>{staff.phoneNo}</td>
                            <td>{staff.salary}</td>
                            <td>
                              <div className="d-flex gap-1 flex-wrap">
                                <button
                                  className="btn btn-warning btn-sm"
                                  onClick={() => handleEditTeacher(staff._id)}
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteTeacher(staff._id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                                <button
                                  className="btn btn-info btn-sm"
                                  onClick={() => setSelectedTeacher(staff)}
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <nav className="d-flex justify-content-between align-items-center mt-3">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-arrow-left"></i>
                    </button>
                    <span>
                      {currentPage} of {totalPagesNonTeaching}
                    </span>
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPagesNonTeaching}
                    >
                      <i className="bi bi-arrow-right"></i>
                    </button>
                  </nav>
                </div>
              </div>
            </>
          )}

          {showForm && (
            <div
              className="card shadow"
              style={{
                borderRadius: "1rem",
                backgroundColor: "white",
                borderColor: "#6f42c1",
              }}
            >
              <div className="card-body">
                <h3
                  className="mb-4"
                  style={{
                    color: "#6f42c1",
                    fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  }}
                >
                  {editTeacherId ? "Edit Staff" : "Add Staff"}
                </h3>
                {editTeacherId &&
                  teachers.find((t) => t._id === editTeacherId)?.profilePic && (
                    <div className="mb-3 text-center">
                      <img
                        src={`${BASE_URL}/${
                          teachers.find((t) => t._id === editTeacherId)
                            .profilePic
                        }`}
                        alt="Current Profile"
                        className="rounded-circle mb-2"
                        style={{
                          width: "min(100px, 25vw)",
                          height: "min(100px, 25vw)",
                        }}
                      />
                      <p className="text-muted small">
                        Upload a new file to replace (optional)
                      </p>
                    </div>
                  )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const newTeacher = {
                      ...formData,
                      staffType,
                      ...(formData.profilePic && {
                        profilePic: formData.profilePic,
                      }),
                      ...(staffType === "Teaching" && { timetable }),
                    };

                    if (
                      !formData.teacherId ||
                      !formData.name ||
                      !formData.email ||
                      !formData.phoneNo ||
                      !formData.joiningDate ||
                      !formData.dateOfBirth ||
                      !formData.gender ||
                      !formData.address ||
                      !formData.password ||
                      !formData.salary ||
                      (staffType === "Teaching" &&
                        (!formData.qualification ||
                          !formData.classTeacherFor ||
                          !formData.section ||
                          !formData.subject)) ||
                      (staffType === "Non-Teaching" && !formData.designation) ||
                      (!formData.profilePic && !editTeacherId)
                    ) {
                      alert("All fields are required!");
                      return;
                    }

                    if (
                      passwordError ||
                      idError ||
                      emailError ||
                      phoneError ||
                      timetableError ||
                      nameError
                    ) {
                      alert("Please fix all errors before submitting");
                      return;
                    }

                    if (
                      window.confirm(
                        editTeacherId ? "Update staff?" : "Add staff?"
                      )
                    ) {
                      handleAddTeacher(newTeacher);
                    }
                  }}
                >
                  <div className="row g-3">
                    <div className="col-12 col-md-6 col-lg-4">
                      <select
                        name="staffType"
                        className="form-control"
                        value={staffType}
                        onChange={(e) => {
                          setStaffType(e.target.value);
                          setFormData((prev) => ({
                            ...prev,
                            staffType: e.target.value,
                          }));
                          setIdError(
                            validateTeacherId(
                              formData.teacherId || "",
                              e.target.value
                            )
                              ? ""
                              : e.target.value === "Teaching"
                              ? "ID must be T followed by 3 digits (e.g., T001)"
                              : "ID must be N followed by 3 digits (e.g., N001)"
                          );
                        }}
                        style={{
                          borderRadius: "0.5rem",
                          borderColor: "#6f42c1",
                        }}
                      >
                        <option value="Teaching">Teaching</option>
                        <option value="Non-Teaching">Non-Teaching</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <input
                        type="text"
                        name="teacherId"
                        placeholder="Staff ID (e.g., T001 or N001)"
                        className="form-control"
                        required
                        value={formData.teacherId || ""}
                        onChange={handleInputChange}
                        style={{
                          borderRadius: "0.5rem",
                          borderColor: "#6f42c1",
                        }}
                      />
                      {idError && (
                        <p className="text-danger small">{idError}</p>
                      )}
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <input
                        type="text"
                        name="name"
                        placeholder="Name"
                        className="form-control"
                        required
                        value={formData.name || ""}
                        onChange={handleInputChange}
                        style={{
                          borderRadius: "0.5rem",
                          borderColor: "#6f42c1",
                        }}
                      />
                      {nameError && (
                        <p className="text-danger small">{nameError}</p>
                      )}
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        className="form-control"
                        required
                        value={formData.email || ""}
                        onChange={handleInputChange}
                        style={{
                          borderRadius: "0.5rem",
                          borderColor: "#6f42c1",
                        }}
                      />
                      {emailError && (
                        <p className="text-danger small">{emailError}</p>
                      )}
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <input
                        type="text"
                        name="phoneNo"
                        placeholder="Phone (e.g., 9876543210)"
                        className="form-control"
                        maxLength={10}
                        required
                        value={formData.phoneNo || ""}
                        onChange={handleInputChange}
                        style={{
                          borderRadius: "0.5rem",
                          borderColor: "#6f42c1",
                        }}
                      />
                      {phoneError && (
                        <p className="text-danger small">{phoneError}</p>
                      )}
                    </div>
                    {staffType === "Teaching" && (
                      <>
                        <div className="col-12 col-md-6 col-lg-4">
                          <input
                            type="text"
                            name="qualification"
                            placeholder="Qualification"
                            className="form-control"
                            required
                            value={formData.qualification || ""}
                            onChange={handleInputChange}
                            style={{
                              borderRadius: "0.5rem",
                              borderColor: "#6f42c1",
                            }}
                          />
                        </div>
                        <div className="col-12 col-md-6 col-lg-4">
                          <select
                            name="subject"
                            className="form-control"
                            required
                            value={formData.subject || ""}
                            onChange={handleInputChange}
                            style={{
                              borderRadius: "0.5rem",
                              borderColor: "#6f42c1",
                            }}
                          >
                            <option value="">Select Subject</option>
                            {subjects.map((subject, index) => (
                              <option key={index} value={subject}>
                                {subject}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-12 col-md-6 col-lg-4">
                          <select
                            name="classTeacherFor"
                            className="form-control"
                            required
                            value={formData.classTeacherFor || ""}
                            onChange={handleInputChange}
                            style={{
                              borderRadius: "0.5rem",
                              borderColor: "#6f42c1",
                            }}
                          >
                            <option value="">Select Class</option>
                            {classes.map((cls, index) => (
                              <option key={index} value={cls}>
                                {cls}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-12 col-md-6 col-lg-4">
                          <select
                            name="section"
                            className="form-control"
                            required
                            value={formData.section || ""}
                            onChange={handleInputChange}
                            style={{
                              borderRadius: "0.5rem",
                              borderColor: "#6f42c1",
                            }}
                          >
                            <option value="">Select Section</option>
                            {sections.map((sec, index) => (
                              <option key={index} value={sec}>
                                {sec}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    {staffType === "Non-Teaching" && (
                      <div className="col-12 col-md-6 col-lg-4">
                        <input
                          type="text"
                          name="designation"
                          placeholder="Designation"
                          className="form-control"
                          required
                          value={formData.designation || ""}
                          onChange={handleInputChange}
                          style={{
                            borderRadius: "0.5rem",
                            borderColor: "#6f42c1",
                          }}
                        />
                      </div>
                    )}
                    <div className="col-12 col-md-6 col-lg-4">
                      <input
                        type="text"
                        name="joiningDate"
                        className="form-control"
                        placeholder="Date of Joining"
                        required
                        value={formData.joiningDate || ""}
                        onChange={handleInputChange}
                        onFocus={(e) => (e.target.type = "date")}
                        onBlur={(e) =>
                          !e.target.value && (e.target.type = "text")
                        }
                        style={{
                          borderRadius: "0.5rem",
                          borderColor: "#6f42c1",
                        }}
                      />
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <input
                        type="text"
                        name="dateOfBirth"
                        className="form-control"
                        placeholder="Date of Birth"
                        required
                        max={maxBirthDateStr}
                        value={formData.dateOfBirth || ""}
                        onChange={handleInputChange}
                        onFocus={(e) => (e.target.type = "date")}
                        onBlur={(e) =>
                          !e.target.value && (e.target.type = "text")
                        }
                        style={{
                          borderRadius: "0.5rem",
                          borderColor: "#6f42c1",
                        }}
                      />
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <select
                        name="gender"
                        className="form-control"
                        required
                        value={formData.gender || ""}
                        onChange={handleInputChange}
                        style={{
                          borderRadius: "0.5rem",
                          borderColor: "#6f42c1",
                        }}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <input
                        type="text"
                        name="address"
                        placeholder="Address"
                        className="form-control"
                        required
                        value={formData.address || ""}
                        onChange={handleInputChange}
                        style={{
                          borderRadius: "0.5rem",
                          borderColor: "#6f42c1",
                        }}
                      />
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <div>
                        <label
                          htmlFor="profilePic"
                          className="form-label text-dark"
                        >
                          {editTeacherId
                            ? "New Picture (Optional)"
                            : "Profile Picture"}
                        </label>
                        <input
                          type="file"
                          name="profilePic"
                          id="profilePic"
                          className="form-control"
                          required={!editTeacherId}
                          onChange={handleInputChange}
                          style={{
                            borderRadius: "0.5rem",
                            borderColor: "#6f42c1",
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <div className="input-group">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Password"
                          className="form-control"
                          required
                          value={formData.password || ""}
                          onChange={handleInputChange}
                          style={{
                            borderRadius: "0.5rem 0 0 0.5rem",
                            borderColor: "#6f42c1",
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ borderRadius: "0 0.5rem 0.5rem 0" }}
                        >
                          {showPassword ? (
                            <i className="bi bi-eye-slash"></i>
                          ) : (
                            <i className="bi bi-eye"></i>
                          )}
                        </button>
                      </div>
                      {passwordError && (
                        <p className="text-danger small">{passwordError}</p>
                      )}
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                      <input
                        type="number"
                        name="salary"
                        placeholder="Salary"
                        className="form-control"
                        required
                        min="1"
                        step="0.01"
                        value={formData.salary || ""}
                        onChange={handleInputChange}
                        style={{
                          borderRadius: "0.5rem",
                          borderColor: "#6f42c1",
                        }}
                      />
                    </div>
                    {staffType === "Teaching" && (
                      <div className="col-12">
                        <h4
                          style={{
                            color: "#6f42c1",
                            fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
                          }}
                        >
                          <i className="bi bi-clock"></i> Time Table
                        </h4>
                        {timetableError && (
                          <p className="text-danger small">{timetableError}</p>
                        )}
                        <div className="table-responsive">
                          <table className="table table-bordered">
                            <thead className="bg-light">
                              <tr>
                                <th>Time</th>
                                <th>Class & Section</th>
                              </tr>
                            </thead>
                            <tbody>
                              {timetable.map((slot, index) => (
                                <tr key={index}>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={slot.time}
                                      onChange={(e) =>
                                        handleTimetableTimeChange(
                                          index,
                                          e.target.value
                                        )
                                      }
                                      style={{
                                        borderRadius: "0.5rem",
                                        borderColor: "#6f42c1",
                                      }}
                                    />
                                  </td>
                                  <td>
                                    {slot.class === "Break" ||
                                    slot.class === "Lunch" ? (
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={slot.class}
                                        disabled
                                        style={{
                                          borderRadius: "0.5rem",
                                          borderColor: "#6f42c1",
                                        }}
                                      />
                                    ) : (
                                      <select
                                        className="form-control"
                                        value={slot.class}
                                        onChange={(e) =>
                                          handleTimetableClassChange(
                                            index,
                                            e.target.value
                                          )
                                        }
                                        style={{
                                          borderRadius: "0.5rem",
                                          borderColor: "#6f42c1",
                                        }}
                                      >
                                        <option value="">
                                          Select Class & Section
                                        </option>
                                        {classSectionOptions.map(
                                          (option, idx) => (
                                            <option key={idx} value={option}>
                                              {option}
                                            </option>
                                          )
                                        )}
                                      </select>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-2 mt-3 flex-wrap">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{
                        borderRadius: "1rem",
                        backgroundColor: "#6f42c1",
                        borderColor: "#6f42c1",
                      }}
                    >
                      {editTeacherId ? "Update" : "Submit"}{" "}
                      <i className="bi bi-save"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowForm(false);
                        setShowPassword(false);
                        setFormData({});
                      }}
                      style={{ borderRadius: "1rem" }}
                    >
                      Cancel <i className="bi bi-x-circle"></i>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {selectedTeacher && (
            <div
              className="card shadow-lg"
              style={{
                borderRadius: "1rem",
                background: "linear-gradient(145deg, #ffffff, #f0f4f8)",
              }}
            >
              <div className="card-body p-3 p-md-5">
                <div
                  className="d-flex justify-content-between align-items-center mb-4 p-3"
                  style={{
                    background: "linear-gradient(to right, #6f42c1, #8a5dd6)",
                    borderRadius: "1rem 1rem 0 0",
                    color: "white",
                  }}
                >
                  <h3
                    style={{ margin: 0, fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
                  >
                    <i className="bi bi-person-vcard me-2"></i> Staff Details
                  </h3>
                  <button
                    className="btn btn-light btn-sm"
                    onClick={() => setSelectedTeacher(null)}
                    style={{ borderRadius: "50%" }}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                <div className="row g-4">
                  <div className="col-12 col-md-6">
                    <div
                      className="text-center p-3"
                      style={{ background: "#fff", borderRadius: "1rem" }}
                    >
                      {selectedTeacher.profilePic && (
                        <img
                          src={`${BASE_URL}/${selectedTeacher.profilePic}`}
                          alt="Profile"
                          className="rounded-circle mb-3"
                          style={{
                            width: "clamp(100px, 30vw, 180px)",
                            height: "clamp(100px, 30vw, 180px)",
                            objectFit: "cover",
                            border: "4px solid #6f42c1",
                          }}
                        />
                      )}
                      <h4
                        style={{
                          color: "#6f42c1",
                          fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
                        }}
                      >
                        {selectedTeacher.name}
                      </h4>
                      <p>{selectedTeacher.email}</p>
                      <p>{selectedTeacher.phoneNo}</p>
                    </div>

                    <div
                      className="mt-4 p-3"
                      style={{ background: "#fff", borderRadius: "1rem" }}
                    >
                      <h4
                        style={{
                          color: "#6f42c1",
                          fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
                        }}
                      >
                        <i className="bi bi-info-circle me-2"></i> Personal
                        Information
                      </h4>
                      <p>
                        <strong>Address:</strong> {selectedTeacher.address}
                      </p>
                      <p>
                        <strong>Joining Date:</strong>{" "}
                        {formatDate(selectedTeacher.joiningDate)}
                      </p>
                      <p>
                        <strong>Date of Birth:</strong>{" "}
                        {formatDate(selectedTeacher.dateOfBirth)}
                      </p>
                      <p>
                        <strong>Salary:</strong> {selectedTeacher.salary}
                      </p>
                      <p>
                        <strong>Gender:</strong> {selectedTeacher.gender}
                      </p>
                      {selectedTeacher.staffType === "Teaching" && (
                        <>
                          <p>
                            <strong>Qualification:</strong>{" "}
                            {selectedTeacher.qualification}
                          </p>
                          <p>
                            <strong>Subject:</strong> {selectedTeacher.subject}
                          </p>
                        </>
                      )}
                      {selectedTeacher.staffType === "Non-Teaching" && (
                        <p>
                          <strong>Designation:</strong>{" "}
                          {selectedTeacher.designation}
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedTeacher.staffType === "Teaching" && (
                    <div className="col-12 col-md-6">
                      <div
                        className="p-3 h-100"
                        style={{ background: "#fff", borderRadius: "1rem" }}
                      >
                        <h4
                          style={{
                            color: "#6f42c1",
                            fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
                          }}
                        >
                          <i className="bi bi-clock me-2"></i> Time Table
                        </h4>
                        <div className="table-responsive">
                          <table className="table table-striped table-hover">
                            <thead
                              style={{ background: "#6f42c1", color: "white" }}
                            >
                              <tr>
                                <th>Time</th>
                                <th>Class & Section</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedTeacher.timetable.map((slot, index) => (
                                <tr key={index}>
                                  <td>{slot.time}</td>
                                  <td>{slot.class}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className="btn btn-primary mt-4"
                  onClick={() => setSelectedTeacher(null)}
                  style={{
                    borderRadius: "1rem",
                    backgroundColor: "#6f42c1",
                    borderColor: "#6f42c1",
                  }}
                >
                  <i className="bi bi-arrow-left-circle me-2"></i> Back to List
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// const styles = `
//   @keyframes fadeIn {
//     from { opacity: 0; transform: translateY(20px); }
//     to { opacity: 1; transform: translateY(0); }
//   }

//   .card {
//     transition: all 0.3s ease;
//   }

//   .table-responsive {
//     animation: fadeIn 0.5s ease-in-out;
//   }

//   @media (max-width: 576px) {
//     .btn {
//       padding: 0.25rem 0.5rem;
//       font-size: 0.875rem;
//     }
    
//     .form-control {
//       font-size: 0.875rem;
//     }
    
//     .card-body {
//       padding: 1rem;
//     }
    
//     .table th, .table td {
//       padding: 0.5rem;
//       font-size: 0.875rem;
//     }
//   }

//   @media (min-width: 577px) and (max-width: 768px) {
//     .btn {
//       padding: 0.375rem 0.75rem;
//     }
    
//     .table th, .table td {
//       padding: 0.75rem;
//     }
//   }

//   @media (min-width: 769px) and (max-width: 992px) {
//     .col-md-6 {
//       flex: 0 0 50%;
//       max-width: 50%;
//     }
//   }

//   @media (min-width: 1441px) {
//     .container-fluid {
//       max-width: 90%;
//       margin: 0 auto;
//     }
    
//     .table th, .table td {
//       padding: 1rem;
//       font-size: 1.1rem;
//     }
//   }

//   @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&family=Roboto:wght@400;500&display=swap');
// `;

export default App;