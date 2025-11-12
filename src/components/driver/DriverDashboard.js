import { useEffect, useState, useRef } from "react";

const GOOGLE_MAPS_API_KEY = 'AIzaSyAh5_Kpyp50F3pTseyYR9YzOm8JDuZ6CVo';

// Function to load Google Maps script with a callback
const loadGoogleMapsScript = (callback) => {
  if (window.google && window.google.maps) {
    callback();
    return;
  }

  const existingScript = document.getElementById('google-maps-script');
  if (!existingScript) {
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    window.initGoogleMaps = () => {
      callback();
    };
  } else if (window.google && window.google.maps) {
    callback();
  }
};


const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const DriverDashboard = () => {
  const [driverDetails, setDriverDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapScriptLoaded, setMapScriptLoaded] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  console.log(user);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Fetch driver details
  useEffect(() => {
    const fetchDriverDetails = async () => {
      try {
        const email = user.email;
        const response = await fetch(`${BASE_URL}/api/driver/me?email=${email}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response body:', data);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        setDriverDetails(data.data);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to fetch driver details');
        setLoading(false);
      }
    };

    fetchDriverDetails();
  }, []);

  // Load Google Maps script
  useEffect(() => {
    loadGoogleMapsScript(() => {
      setMapScriptLoaded(true);
    });
  }, []);

  // Initialize Google Map
  const initializeMap = (latitude, longitude) => {
    if (!window.google || !mapRef.current || !latitude || !longitude) return;

    if (mapInstanceRef.current) {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      mapInstanceRef.current = null;
    }

    const mapOptions = {
      center: { lat: latitude, lng: longitude },
      zoom: 15,
      mapTypeId: 'roadmap',
    };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
    markerRef.current = new window.google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map: mapInstanceRef.current,
      title: "Bus Driver Location",
    });
  };

  // Update Google Map location
  const updateMapLocation = (latitude, longitude) => {
    if (!latitude || !longitude) return;

    if (!mapInstanceRef.current || !markerRef.current) {
      initializeMap(latitude, longitude);
    } else {
      const newPosition = new window.google.maps.LatLng(latitude, longitude);
      markerRef.current.setPosition(newPosition);
      mapInstanceRef.current.panTo(newPosition);
    }
  };

  // Add function to update location in backend
  const updateDriverLocation = async (latitude, longitude) => {
    try {
      const response = await fetch(`${BASE_URL}/driver/location`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          latitude,
          longitude,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update location');
      }
    } catch (err) {
      console.error('Location update error:', err);
      setError(err.message || 'Failed to update location');
    }
  };

  // Handle geolocation and update map
  useEffect(() => {
    if (!mapScriptLoaded || !navigator.geolocation) {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser.");
      }
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        console.log("Latitude:", latitude, "Longitude:", longitude);

        // Update backend
        updateDriverLocation(latitude, longitude);

        // Update map
        updateMapLocation(latitude, longitude);
      },
      (error) => {
        console.log("Geolocation error:", error.message);
        setError(`Geolocation error: ${error.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 5 }
    );

    // Cleanup watchPosition on unmount
    return () => navigator.geolocation.clearWatch(watchId);
  }, [mapScriptLoaded]);

  if (loading) {
    return <div className="loading">Loading driver details...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="driver-dashboard">
      <h1>Welcome, {driverDetails?.user.name}!</h1>
      <div className="profile-card">
        <h2>Driver Profile</h2>
        {/* <img
          src={driverDetails?.driverProfile.profileImage || '/uploads/default-driver.png'}
          alt="Driver Profile"
          className="profile-image"
          onError={(e) => (e.target.src = '/uploads/default-driver.png')}
        /> */}
        <p><strong>Name:</strong> {driverDetails?.driverProfile.driverName}</p>
        <p><strong>Email:</strong> {driverDetails?.user.email}</p>
        <p><strong>Phone Number:</strong> {driverDetails?.driverProfile.phoneNumber || 'N/A'}</p>
        <p>
          <strong>Route:</strong>{' '}
          {driverDetails?.driverProfile.fromLocation || 'N/A'} to{' '}
          {driverDetails?.driverProfile.toLocation || 'N/A'}
        </p>
        <p><strong>Bus Number:</strong> {driverDetails?.driverProfile.busNumber || 'N/A'}</p>
        
      </div>
      <div ref={mapRef} style={{ width: '100%', height: '400px', marginTop: '20px' }}>
        {!mapScriptLoaded && (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading map...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Optional: Add some basic CSS
const styles = `
  .driver-dashboard {
    max-width: 600px;
    margin: 20px auto;
    padding: 20px;
    font-family: Arial, sans-serif;
  }
  .profile-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    background-color: #f9f9f9;
  }
  .profile-image {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 15px;
  }
  .loading {
    text-align: center;
    font-size: 18px;
    margin-top: 50px;
  }
  .error {
    text-align: center;
    color: red;
    font-size: 18px;
    margin-top: 50px;
  }
  h1 {
    color: #333;
    text-align: center;
  }
  h2 {
    color: #555;
  }
  p {
    font-size: 16px;
    margin: 10px 0;
  }
  strong {
    color: #007bff;
  }
  .spinner-border {
    width: 3rem;
    height: 3rem;
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default DriverDashboard;