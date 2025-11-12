import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Correct import
import React, { useEffect, useState } from 'react';
import { FaCheck, FaDownload, FaPaperPlane } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import "./AttendenceMan.css";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const StudManage = ({ teacherEmail }) => {
  const [attendance, setAttendance] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // Fetch previous attendance records
  useEffect(() => {
    if (!user?.email || !token) {
      setError('Please log in to access this page.');
      setLoading(false);
      navigate('/login');
      return;
    }

    const fetchAttendanceRecords = async () => {
      setLoading(true);
      try {
        console.log('🔄 Fetching attendance for:', user.email);
        const response = await axios.get(
          `${BASE_URL}/teacher-attendance/${user.email}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('✅ API Response:', response.data);

        if (!response.data.success || response.data.records.length === 0) {
          setError('No attendance records found.');
          setAttendanceRecords([]);
        } else {
          setAttendanceRecords(response.data.records);
        }
      } catch (err) {
        console.error(
          '❌ Error fetching attendance records:',
          err.response?.data || err.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceRecords();
  }, [user?.email, token, navigate]);

  // Fetch current attendance (students for today)
  useEffect(() => {
    if (!user?.email || !token) return;

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${BASE_URL}/attendanceStatus/${user.email}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log('✅ Fetched students for today:', response.data);
        const students = response.data.students.map((student) => ({
          ...student,
          attendanceStatus: '',
          reason: '',
        }));
        setAttendance(students);
      } catch (error) {
        console.error(
          '❌ Error fetching students:',
          error.response?.data || error.message
        );
        setError(
          error.response?.status === 404
            ? 'No students found for this teacher.'
            : 'Failed to fetch students for attendance.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user?.email, token]);

  const handleChange = (index, value) => {
    const updatedAttendance = [...attendance];
    updatedAttendance[index].attendanceStatus = value;
    setAttendance(updatedAttendance);
  };

  const handleRequestReason = (student) => {
    if (!student.attendanceStatus || student.attendanceStatus === 'Present') {
      alert('Reason request is only applicable for Absent or Half Day status.');
      return;
    }
    alert(
      `Message sent to parent & student: "Reason for ${student.attendanceStatus} is not mentioned."`
    );
  };

  const handleSubmit = async () => {
    if (!attendance.every((student) => student.attendanceStatus)) {
      alert('Please mark attendance for all students before submitting.');
      return;
    }

    try {
      const formattedAttendance = {
        teacherEmail: user.email,
        attendanceRecords: attendance.map((student) => ({
          rollNumber: student.rollNumber,
          admissionNo: student.admissionNo,
          name: student.name,
          attendanceStatus: student.attendanceStatus,
          reason: student.reason || '',
        })),
      };

      const response = await axios.post(
        `${BASE_URL}/attendance`,
        formattedAttendance,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Attendance submitted successfully!');
        const updatedRecords = await axios.get(
          `${BASE_URL}/teacher-attendance/${user.email}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAttendanceRecords(updatedRecords.data.records || []);
      }
    } catch (error) {
      console.error(
        '❌ Error submitting attendance:',
        error.response?.data || error.message
      );
      alert(
        error.response?.status === 401 || error.response?.status === 403
          ? 'Access denied. Please log in again.'
          : 'Something went wrong while submitting attendance.'
      );
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.clear();
        navigate('/login');
      }
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Add a title to the PDF
    doc.text('Attendance Report', 14, 20);

    // Filter attendance records based on selected date and search term
    const filteredRecords = attendanceRecords
      .filter((record) => !selectedDate || record.date === selectedDate)
      .flatMap((record) => record.attendanceRecords);

    // Prepare table data
    const tableData = filteredRecords
      .filter((student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((student, index) => [
        index + 1,
        new Date(selectedDate).toLocaleDateString(), // Use record.date instead of student.date
        student.rollNumber || 'N/A',
        student.admissionNo || 'N/A',
        student.name || 'Unknown',
        student.attendanceStatus || 'N/A',
      ]);

    // Add the table to the PDF using autoTable
    autoTable(doc, {
      head: [
        [
          'S. No',
          'Date',
          'Roll Number',
          'Admission No',
          'Student Name',
          'Status',
        ],
      ],
      body: tableData,
      startY: 30, // Start the table below the title
    });

    // Save the PDF
    doc.save(`attendance_report_${selectedDate || 'all_dates'}.pdf`);
  };

  const tableHeaderStyle = {
    padding: '10px',
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
  };

  const tableCellStyle = {
    padding: '10px',
    fontSize: '14px',
    textAlign: 'center',
  };

  return (
    <div className='container my-5 p-4 bg-white shadow-lg rounded-lg stud-container'>
      <h3
        className='Kaani animate-fade-in mb-4'
      >
        📅 Student Attendance
      </h3>

      {/* Current Attendance Section */}
      <div className='mb-5 Ka-stu'>
        <h2 className='mb-3 Ka-mark'>
          Mark Today's Attendance
        </h2>
        {loading && <p className='text-center' style={{ color: 'rgb(183, 252, 216)', fontSize: '1.1rem', fontStyle: 'italic' }}>Loading...</p>}
        {error && <p style={{ color: 'rgb(250, 209, 209)', textAlign: 'center', backgroundColor: 'rgba(255, 0, 0, 0.1)', padding: '10px', borderRadius: '5px' }}>{error}</p>}
        {!loading && !error && (
          <>
            <div className='table-responsive' style={{ overflowX: 'auto' }}>
              <table className='table table-bordered text-center stud-table Ka-table'>
                <thead
                  className='thead-custom Ka-cus'
                >
                  <tr>
                    <th className='ka-th'>S. No</th>
                    <th className='ka-th'>Roll Number</th>
                    <th className='ka-th'>Admission No</th>
                    <th className='ka-th'>Date</th>
                    <th className='ka-th'>Student Name</th>
                    <th className='ka-th'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan='6' style={{ padding: '15px', color: 'rgb(250, 209, 209)', fontStyle: 'italic', backgroundColor: 'rgba(221, 237, 255, 0.5)' }}>
                      No students available to mark attendance.
                      </td>
                    </tr>
                  ) : (
                    attendance.map((student, index) => (
                      <tr
                        key={index}
                        className={`row-${
                          student.attendanceStatus?.toLowerCase() || ''
                        }`}
                        style={{ transition: 'background-color 0.3s', ':hover': { backgroundColor: 'rgb(239, 223, 255)' } }}
                      >
                        <td className="ka-td">{index + 1}</td>
                        <td className="ka-td">{student.rollNumber}</td>
                        <td className="ka-td">{student.admissionNo}</td>
                        <td className="ka-td">
                          {new Date().toISOString().split('T')[0]}
                        </td>
                        <td className="ka-td">{student.name}</td>
                        <td className="ka-td">
                          <select
                            className='form-select attendance-dropdown'
                            value={student.attendanceStatus || ''}
                            onChange={(e) =>
                              handleChange(index, e.target.value)
                            }
                            style={{ width: '150px', margin: '0 auto' }}
                          >
                            <option value='' className='Ka-P'>Select</option>
                            <option value='Present' className='Ka-P'>✅ Present</option>
                            <option value='Absent' className='Ka-P'>❌ Absent</option>
                            <option value='Half Day' className='Ka-P'>⏳ Half Day</option>
                          </select>
                          
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button
              className='btn btn-primary d-block mx-auto mt-4 animate-bounce'
              onClick={handleSubmit}
              disabled={loading || attendance.length === 0}
            >
              <FaCheck /> Submit Attendance
            </button>
          </>
        )}
      </div>

      {/* Previous Attendance Records Section */}
      <div className='mt-5'>
        <h2 className='mb-3' style={{ fontSize: '1.5rem', color: '#34495e' }}>
          Previous Attendance Records
        </h2>
        <div className='row mb-3 '>
          <div className='col-md-6 mt-3'>
            <input
              type='text'
              className='form-control'
              placeholder='Search Student...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className='col-md-6 mt-3'>
            <input
              type='date'
              className='form-control'
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}  // Disables future dates
            />
          </div>
        </div>
        <button
          className='btn btn-success mb-3'
          onClick={generatePDF}
          disabled={attendanceRecords.length === 0}
        >
          <FaDownload /> Download PDF
        </button>

        {loading && <p className='text-center'>Loading...</p>}
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        {!loading && !error && (
          <div className='table-responsive'>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #ddd',
                marginTop: '20px',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                  <th style={tableHeaderStyle}>S. No</th>
                  <th style={tableHeaderStyle}>Date</th>
                  <th style={tableHeaderStyle}>Roll Number</th>
                  <th style={tableHeaderStyle}>Admission No</th>
                  <th style={tableHeaderStyle}>Student Name</th>
                  <th style={tableHeaderStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords
                  .filter(
                    (record) => !selectedDate || record.date === selectedDate
                  )
                  .flatMap((record) =>
                    record.attendanceRecords
                      .filter((student) =>
                        student.name
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      )
                      .map((student, index) => (
                        <tr
                          key={index}
                          style={{ borderBottom: '1px solid #ddd' }}
                        >
                          <td style={tableCellStyle}>{index + 1}</td>
                          <td style={tableCellStyle}>
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td style={tableCellStyle}>
                            {student.rollNumber || 'N/A'}
                          </td>
                          <td style={tableCellStyle}>
                            {student.admissionNo || 'N/A'}
                          </td>
                          <td style={tableCellStyle}>
                            {student.name || 'Unknown'}
                          </td>
                          <td style={tableCellStyle}>
                            <span
                              style={{
                                padding: '5px 10px',
                                borderRadius: '5px',
                                fontWeight: 'bold',
                                color: 'white',
                                backgroundColor:
                                  student.attendanceStatus === 'Present'
                                    ? '#2ecc71'
                                    : student.attendanceStatus === 'Absent'
                                    ? '#e74c3c'
                                    : '#f39c12',
                              }}
                            >
                              {student.attendanceStatus || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudManage;
