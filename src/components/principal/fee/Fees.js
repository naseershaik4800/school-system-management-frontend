import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Fees.css'; // Import the separate CSS file

const Fees = () => {
  const navigate = useNavigate();
  return (
    <div className='fees-container1'>
      <h1 className='title1'>
       Fees structure of school
      </h1>
      <div className='card-container1'>
        <div
          className='card-wrapper1'
          onClick={() => {
            navigate('/fees/general');
          }}
        >
          <div className='card1'>
            <div className='card-body1'>
              <h2 className='card-title1'>
                Fees Management
              </h2>
              <p className='card-text1'>
                Manage and view fee details
              </p>
            </div>
          </div>
        </div>
        <div
          className='card-wrapper1'
          onClick={() => {
            navigate('/fees/hostel');
          }}
        >
          <div className='card1'>
            <div className='card-body1'>
              <h2 className='card-title1'>
                Hostel Management
              </h2>
              <p className='card-text1'>
                View hostel fee schedules
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fees;