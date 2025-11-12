import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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

const BusRouteDisplay = () => {
  const [busRoute, setBusRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverLat, setDriverLat] = useState(null);
  const [driverLon, setDriverLon] = useState(null);
  const [mapScriptLoaded, setMapScriptLoaded] = useState(false);

  const navigate = useNavigate();
  const studentId = localStorage.getItem("selectedChild");

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Setup Axios Interceptors for Authorization
  useEffect(() => {
    const setupAxiosInterceptors = () => {
      axios.interceptors.request.use(
        (config) => {
          const token = localStorage.getItem("token");
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
            toast.error("Session expired. Please log in again.");
            localStorage.removeItem("token");
            navigate("/login");
          } else if (error.response?.status === 403) {
            toast.error("Access denied: Insufficient permissions");
          }
          return Promise.reject(error);
        }
      );
    };
    setupAxiosInterceptors();
  }, [navigate]);

  // Load Google Maps script
  useEffect(() => {
    loadGoogleMapsScript(() => {
      setMapScriptLoaded(true);
    });
  }, []);

  // Function to fetch driver location based on route number
  const fetchDriverLocation = async (routeNumber) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/driver/route/${routeNumber}/location`
      );
      const driverData = response.data;
      setDriverLat(driverData.latitude);
      setDriverLon(driverData.longitude);
      return { latitude: driverData.latitude, longitude: driverData.longitude };
    } catch (err) {
      console.error("Error fetching driver location:", err);
      setError(err.message || "Failed to fetch driver location");
      return null;
    }
  };

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

  // Update map with driver location
  const updateMapWithDriverLocation = async (routeNumber) => {
    const location = await fetchDriverLocation(routeNumber);
    if (!location) return;

    const { latitude, longitude } = location;
    updateMapLocation(latitude, longitude);
  };

  // Fetch bus route on component mount
  useEffect(() => {
    fetchBusRoute();
  }, [studentId]);

  // Update driver location every 3 seconds when busRoute is available
  useEffect(() => {
    if (!busRoute || !busRoute.routeNumber || !mapScriptLoaded) return;

    // Initial fetch
    updateMapWithDriverLocation(busRoute.routeNumber);

    // Set interval to fetch every 3 seconds
    const intervalId = setInterval(() => {
      updateMapWithDriverLocation(busRoute.routeNumber);
    }, 3000);

    // Cleanup interval on unmount or when busRoute changes
    return () => clearInterval(intervalId);
  }, [busRoute, mapScriptLoaded]);

  // Fetch Bus Route Data
  const fetchBusRoute = async () => {
    if (!studentId) {
      setError("No student ID provided");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to continue");
        navigate("/login");
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/api/students/${studentId}`
      );
      const studentData = response.data;
      setBusRoute(studentData.busRoute || null);
    } catch (err) {
      console.error("Error fetching bus route:", err);
      setError(err.response?.data?.message || "Failed to fetch bus route data");
    } finally {
      setLoading(false);
    }
  };

  // Custom CSS with Enhanced Animations
  const styles = `
    .fade-in {
      animation: fadeIn 0.8s ease-in;
    }
    .slide-in {
      animation: slideIn 0.6s ease-out;
    }
    .bounce {
      animation: bounce 1s infinite;
    }
    .pulse {
      animation: pulse 1.5s infinite;
    }
    .bus-card:hover {
      transform: translateY(-8px) scale(1.02);
      transition: transform 0.4s ease, box-shadow 0.4s ease;
      box-shadow: 0 12px 24px rgba(0,0,0,0.3) !important;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.06); }
      100% { transform: scale(1); }
    }
    @media (max-width: 576px) {
      .card-body { padding: 1rem; }
      .card-header h5 { font-size: 1.1rem; }
      .card-footer small { font-size: 0.8rem; }
      .bus-icon { font-size: 1.5rem; }
    }
  `;

  // Check if busRoute is effectively empty
  const isBusRouteEmpty = (route) => {
    if (!route) return true;
    const {
      routeNumber,
      pickupLocation,
      dropLocation,
      driverName,
      driverContact,
    } = route;
    return (
      (!routeNumber || routeNumber.trim() === "") &&
      (!pickupLocation || pickupLocation.trim() === "") &&
      (!dropLocation || dropLocation.trim() === "") &&
      (!driverName || driverName.trim() === "") &&
      (!driverContact || driverContact.trim() === "")
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div
          className="spinner-border text-success bounce"
          role="status"
          style={{ width: "3rem", height: "3rem" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-5">
        <div
          className="alert alert-danger d-flex align-items-center fade-in"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
          <div>Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <style>{styles}</style>
      <div className="d-flex align-items-center mb-5 fade-in">
        <i className="bi bi-bus-front fs-2 me-3 text-success bus-icon bounce"></i>
        <h1 className="mb-0 fw-bold text-dark">Bus Route Details</h1>
      </div>

      {isBusRouteEmpty(busRoute) ? (
        <div className="alert alert-info text-center fade-in py-4">
          <i className="bi bi-info-circle fs-4 me-2"></i>
          No bus route assigned to this child
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-12 col-md-8 col-lg-6 mx-auto slide-in">
            <div className="card h-100 shadow-sm border-0 bus-card pulse">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0 fw-semibold">
                  Route #{busRoute.routeNumber || "Not Assigned"}
                </h5>
              </div>
              <div className="card-body">
                {/* Route Number */}
                <div
                  className="mb-4 slide-in"
                  style={{ animationDelay: "0.1s" }}
                >
                  <h6 className="card-subtitle mb-2 text-muted fw-bold">
                    <i className="bi bi-signpost-2-fill me-2 text-info"></i>
                    Route Number
                  </h6>
                  <div className="ps-3">
                    <strong className="text-dark">
                      {busRoute.routeNumber || "Not Assigned"}
                    </strong>
                  </div>
                </div>

                {/* Pickup Location */}
                <div
                  className="mb-4 slide-in"
                  style={{ animationDelay: "0.2s" }}
                >
                  <h6 className="card-subtitle mb-2 text-muted fw-bold">
                    <i className="bi bi-geo-alt-fill me-2 text-primary"></i>
                    Pickup Location
                  </h6>
                  <div className="ps-3">
                    <strong className="text-dark">
                      {busRoute.pickupLocation || "Not specified"}
                    </strong>
                  </div>
                </div>

                {/* Drop Location */}
                <div
                  className="mb-4 slide-in"
                  style={{ animationDelay: "0.3s" }}
                >
                  <h6 className="card-subtitle mb-2 text-muted fw-bold">
                    <i className="bi bi-geo-fill me-2 text-danger"></i>
                    Drop Location
                  </h6>
                  <div className="ps-3">
                    <strong className="text-dark">
                      {busRoute.dropLocation || "Not specified"}
                    </strong>
                  </div>
                </div>

                {/* Driver Information */}
                <div
                  className="mb-4 slide-in"
                  style={{ animationDelay: "0.4s" }}
                >
                  <h6 className="card-subtitle mb-2 text-muted fw-bold">
                    <i className="bi bi-person-circle me-2 text-warning"></i>
                    Driver Details
                  </h6>
                  <div className="ps-3">
                    <p className="mb-1">
                      <strong className="text-dark">
                        {busRoute.driverName || "Unknown"}
                      </strong>
                    </p>
                    <p className="text-secondary mb-0 small">
                      <i className="bi bi-telephone-fill me-1"></i>
                      {busRoute.driverContact || "No contact available"}
                    </p>
                    {/* <p className="text-secondary mb-0 small">
                      <i className="bi bi-telephone-fill me-1"></i>
                      {busRoute.email || "No contact available"}
                    </p> */}
                  </div>
                </div>
              </div>
              <div className="card-footer bg-light text-center">
                <small className="text-muted">
                  <i className="bi bi-clock-history me-1"></i>
                  Last Updated: {new Date().toLocaleString()}
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={mapRef} style={{ width: '100%', height: '400px', marginTop: '20px' }}>
        {!mapScriptLoaded && (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading map...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusRouteDisplay;