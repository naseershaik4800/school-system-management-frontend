import 'animate.css'; // Animations
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Timetable.css'; // Custom CSS for unique styling

const Timetable = () => {
  const navigate = useNavigate();
  return (
    <div className='timetable-container d-flex flex-column align-items-center justify-content-center min-vh-100 text-center text-white animate__animated animate__fadeIn'>
      <h1 className='display-4 fw-bold text-white mb-4 animate__animated animate__bounceInDown'>
        Welcome to Our School Timetable
      </h1>
      {/* <img
        src='https://via.placeholder.com/200' // Replace with your school image
        alt='School'
        className='img-fluid rounded shadow-lg mb-4 animate__animated animate__zoomIn'
        style={{ maxWidth: '200px' }}
      /> */}
      <div className='row g-4 justify-content-center timetable-cards animate__animated animate__fadeInUp'>
        <div
          className='col-12 col-md-6 col-lg-4'
          onClick={() => {
            navigate('/timetable/exam');
          }}
        >
          <div className='card timetable-card h-100 shadow-lg'>
            <div className='card-body d-flex flex-column justify-content-center'>
              <h2 className='card-title h4 fw-bold text-primary'>
                Exam Timetable
              </h2>
              <p className='card-text text-muted'>
                View the schedule for upcoming exams.
              </p>
            </div>
          </div>
        </div>
        <div
          className='col-12 col-md-6 col-lg-4'
          onClick={() => {
            navigate('/timetable/period');
          }}
        >
          <div className='card timetable-card h-100 shadow-lg'>
            <div className='card-body d-flex flex-column justify-content-center'>
              <h2 className='card-title h4 fw-bold text-primary'>
                Period Timetable
              </h2>
              <p className='card-text text-muted'>
                Check your daily class schedule.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timetable;
