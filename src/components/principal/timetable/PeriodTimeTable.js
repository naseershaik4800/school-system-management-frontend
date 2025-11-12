import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import './PeriodTimeTable.css';
import axios from "axios";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const PeriodTimeTable = () => {
  const [timetable, setTimetable] = useState({});
  const [selectedClass, setSelectedClass] = useState("Nursery-A");
  const [showTimetable, setShowTimetable] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [daySchedule, setDaySchedule] = useState({
    "9:00 - 9:30": "",
    "9:45 - 10:30": "",
    "10:30 - 10:45": "Break",
    "10:45 - 11:30": "",
    "11:30 - 12:15": "",
    "12:15 - 1:15": "Lunch",
    "1:15 - 2:00": "",
    "2:00 - 2:45": "",
    "2:45 - 3:00": "Break1",
    "3:00 - 3:45": "",
    "3:45 - 4:30": ""
  });
  const [error, setError] = useState("");
  const [editingTimeSlots, setEditingTimeSlots] = useState(false);
  const [tempTimeSlots, setTempTimeSlots] = useState([]);
  const classes = [
    "Nursery", "LKG", "UKG", "1st Grade-A", "1st Grade-B", "2nd Grade-A", "2nd Grade-B",
    "3rd Grade-A", "3rd Grade-B", "4th Grade-A", "4th Grade-B", "5th Grade-A", "5th Grade-B",
    "6th Grade-A", "6th Grade-B", "7th Grade-A", "7th Grade-B", "8th Grade-A", "8th Grade-B",
    "9th Grade-A", "9th Grade-B", "10th Grade-A", "10th Grade-B"
  ];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [timeSlots, setTimeSlots] = useState([]);

  // Helper function to parse time to minutes
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    // Handle both "HH:MM" and "H.MM" formats
    const time = timeStr.replace('.', ':');
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to get start and end times from slot
  const parseTimeSlot = (slot) => {
    if (!slot || !slot.includes('-')) return { start: 0, end: 0 };
    const [start, end] = slot.split('-').map(str => str.trim());
    return {
      start: parseTimeToMinutes(start),
      end: parseTimeToMinutes(end)
    };
  };

  // Check for identical time slots
  const hasIdenticalTimeSlots = (slots) => {
    const timeRanges = slots.map(slot => parseTimeSlot(slot));
    
    for (let i = 0; i < timeRanges.length; i++) {
      for (let j = i + 1; j < timeRanges.length; j++) {
        if (timeRanges[i].start === timeRanges[j].start && 
            timeRanges[i].end === timeRanges[j].end) {
          return true;
        }
      }
    }
    return false;
  };

  // Setup Axios interceptors for authorization
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          throw new Error("No authentication token found");
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          setError("Session expired. Please log in again.");
          localStorage.clear();
          window.location.href = "/login";
        } else if (error.response?.status === 403) {
          setError("Access denied. You don’t have permission to perform this action.");
        }
        return Promise.reject(error);
      }
    );
  }, []);

  useEffect(() => {
    const fetchTimetableData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/studentTimeTable/${selectedClass}`
        );
        const backendData = response.data.schedule;
        setTimeSlots(response.data.timeSlots);
        const daysOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const transformedData = daysOrder.map(day => backendData[day] || []);
        setTimetable(prev => ({
          ...prev,
          [selectedClass]: transformedData
        }));
      } catch (error) {
        if (error.response?.status === 404) {
          setTimetable(prev => ({
            ...prev,
            [selectedClass]: Array(days.length).fill().map(() => [])
          }));
          setTimeSlots([
            "9:00 - 9:45", "9:45 - 10:30", "10:30 - 10:45", "10:45 - 11:30",
            "11:30 - 12:15", "12:15 - 1:15", "1:15 - 2:00", "2:00 - 2:45",
            "2:45 - 3:00", "3:00 - 3:45", "3:45 - 4:30"
          ]);
        } else {
          console.error("Error fetching timetable:", error.response?.data || error.message);
          setError(error.response?.data?.message || "Failed to fetch timetable.");
        }
      }
    };
    fetchTimetableData();
  }, [selectedClass]);

  const handleEditDay = (dayIndex) => {
    setEditingDay(dayIndex);
    setError("");
    if (!timetable[selectedClass] || !timetable[selectedClass][dayIndex]) {
      const initialSchedule = {};
      timeSlots.forEach(slot => {
        initialSchedule[slot] = "";
      });
      setDaySchedule(initialSchedule);
    } else {
      const scheduleArray = timetable[selectedClass][dayIndex];
      const scheduleObject = {};
      timeSlots.forEach((slot, index) => {
        scheduleObject[slot] = scheduleArray[index] || "";
      });
      setDaySchedule(scheduleObject);
    }
  };

  const handleSaveDay = async () => {
    if (editingDay !== null) {
      const updatedTimetable = { ...timetable };
      if (!updatedTimetable[selectedClass]) {
        updatedTimetable[selectedClass] = Array(days.length).fill().map(() => []);
      }
      const scheduleArray = timeSlots.map(slot => daySchedule[slot]);
      updatedTimetable[selectedClass][editingDay] = scheduleArray;
      setTimetable(updatedTimetable);

      const requestData = {
        class: selectedClass,
        day: days[editingDay],
        schedule: scheduleArray,
        timeSlots
      };

      try {
        await axios.post(`${BASE_URL}/studentTimeTable`, requestData);
        alert("Timetable saved successfully!");
        setEditingDay(null);
        setError("");
      } catch (error) {
        console.error("Error saving timetable:", error.response?.data || error.message);
        setError(error.response?.data?.message || "Failed to save timetable. Please try again.");
      }
    }
  };

  const handleTimeSlotChange = (slot, value) => {
    setDaySchedule(prev => ({
      ...prev,
      [slot]: value
    }));
  };

  const handleEditTimeSlots = () => {
    setEditingTimeSlots(true);
    setTempTimeSlots([...timeSlots]);
    setError("");
  };

  const handleTimeSlotEditChange = (index, value) => {
    const newTempTimeSlots = [...tempTimeSlots];
    newTempTimeSlots[index] = value;
    setTempTimeSlots(newTempTimeSlots);
  };

  const handleSaveTimeSlots = async () => {
    // Check for empty or invalid time slots
    if (tempTimeSlots.some(slot => !slot || slot.trim() === '' || !slot.includes('-'))) {
      setError("All time slots must be filled and contain a hyphen (e.g., 9:00-9:45 or 9.00-9.45).");
      return;
    }

    // Check for identical time slots
    if (hasIdenticalTimeSlots(tempTimeSlots)) {
      setError("Identical time slots are not allowed (same start and end times).");
      return;
    }

    try {
      setTimeSlots([...tempTimeSlots]);
      setEditingTimeSlots(false);

      const requestData = {
        class: selectedClass,
        day: days[editingDay || 0],
        schedule: timetable[selectedClass]?.[editingDay || 0] || [],
        timeSlots: tempTimeSlots
      };
      await axios.post(`${BASE_URL}/studentTimeTable`, requestData);
      alert("Time slots saved successfully!");
      setError("");
    } catch (error) {
      console.error("Error saving time slots:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to save time slots. Please try again.");
    }
  };

  const handleShowTimetable = () => {
    setShowTimetable(true);
    setError("");
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Student Timetable</h1>
      {error && (
        <div className="alert alert-danger text-center" role="alert">
          {error}
        </div>
      )}
      <div className="row mb-4">
        <div className="col-md-6">
          <label className="form-label">Select Class and Section:</label>
          <select className="form-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            {classes.map((cls) => (
              <option key={cls} value={cls}>Class {cls}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="text-center mb-4">
        <button className="btn btn-primary" onClick={handleShowTimetable}>Show Timetable</button>
      </div>
      {showTimetable && (
        <div className="table-responsive">
          <table className="table table-bordered text-center timetable-table">
            <thead className="table-dark">
              <tr>
                <th>Day</th>
                {timeSlots.map((time, index) => (
                  <th key={index}>
                    {editingTimeSlots ? (
                      <input
                        type="text"
                        className="form-control"
                        value={tempTimeSlots[index]}
                        onChange={(e) => handleTimeSlotEditChange(index, e.target.value)}
                        placeholder="Enter Time Slot (e.g., 9:00-9:45)"
                      />
                    ) : (
                      <span>{time}</span>
                    )}
                  </th>
                ))}
                <th>
                  {editingTimeSlots ? (
                    <button className="btn btn-success btn-sm" onClick={handleSaveTimeSlots}>Save Times</button>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={handleEditTimeSlots}>Edit Times</button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {days.map((day, dayIndex) => (
                <tr key={dayIndex}>
                  <td>{day}</td>
                  {timeSlots.map((time, timeIndex) => (
                    <td key={timeIndex}>
                      {editingDay === dayIndex ? (
                        <input
                          type="text"
                          className="form-control"
                          value={daySchedule[time]}
                          onChange={(e) => handleTimeSlotChange(time, e.target.value)}
                          placeholder="Enter Subject"
                        />
                      ) : (
                        <span>{timetable[selectedClass]?.[dayIndex]?.[timeIndex] || "-"}</span>
                      )}
                    </td>
                  ))}
                  <td>
                    {editingDay === dayIndex ? (
                      <button className="btn btn-success btn-sm" onClick={handleSaveDay}>Save</button>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => handleEditDay(dayIndex)}>Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PeriodTimeTable;