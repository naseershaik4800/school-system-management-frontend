import axios from 'axios';
import React, { useEffect, useState } from 'react';
import "./TeacherAtt.css";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const TeacherAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Retrieve logged-in teacher data from localStorage
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    // Prevent state updates if the component unmounts
    let isMounted = true;

    const fetchAttendance = async () => {
      // Retrieve logged-in teacher data from localStorage
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;

      if (!user || !user.id) {
        if (isMounted) {
          setError(
            'User not logged in. Please log in to view your attendance.'
          );
          setLoading(false);
        }
        return;
      }

      try {
        // Set up axios with authorization header
        const token = localStorage.getItem('token'); // Adjust based on your auth setup
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        // Fetch attendance records for this teacher
        const response = await axios.get(
          `${BASE_URL}/api/attendance/teacher/attendance/${user.id}`,
          config
        );

        if (isMounted) {
          setAttendanceRecords(response.data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || 'Error fetching attendance records.'
          );
          setLoading(false);
        }
      }
    };

    fetchAttendance();

    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - runs only on mount

  return (
    <div className='Kt-div'
    >
      <h2
         className='Kt-na'
      >
        My Attendance Records
      </h2>

      {loading && <p style={{ color: 'rgb(183, 252, 216)', fontSize: '1.1rem', fontStyle: 'italic' }}>Loading attendance records...</p>}
      {error && <p style={{ color: 'rgb(250, 209, 209)', backgroundColor: 'rgba(255, 0, 0, 0.1)', padding: '10px', borderRadius: '5px' }}>{error}</p>}

      {!loading && attendanceRecords.length === 0 && !error ? (
        <p style={{ color: 'rgb(250, 209, 209)', fontStyle: 'italic', backgroundColor: 'rgba(221, 237, 255, 0.5)', padding: '10px', borderRadius: '5px' }}>No attendance records found.</p>
      ) : (
        <table className='Kt-tab'>
          <thead>
            <tr>
              <th className='Kt-th'>
                Date
              </th>
              <th className='Kt-th'>
                Teacher Name
              </th>
              <th className='Kt-th'>
                Status
              </th>
              {/* <th className='Kt-th'>
                Branch ID
              </th> */}
            </tr>
          </thead>
          <tbody>
            {attendanceRecords.map((record, index) => (
              <tr key={index} style={{ transition: 'background-color 0.3s', ':hover': { backgroundColor: 'rgb(239, 223, 255)' } }}>
                <td  className='Kt-td'>
                  {new Date(record.date).toLocaleDateString()}
                </td>
                <td  className='Kt-td'>
                  {record.teacherName}
                </td>
                <td  className='Kt-td'>
                  {record.status}
                </td>
                {/* <td  className='Kt-td'>
                  {record.branchName || 'N/A'}
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TeacherAttendance;
