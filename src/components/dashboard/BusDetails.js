import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Grid,
} from "@mui/material";
import { motion } from "framer-motion";
import axios from "axios";
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAh5_Kpyp50F3pTseyYR9YzOm8JDuZ6CVo';

const loadGoogleMapsScript = (callback) => {
  if (window.google && window.google.maps) {
    callback();
    return;
  }

  const existingScript = document.getElementById('google-maps-script');
  if (!existingScript) {
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => callback();
    script.onerror = () => console.error('Failed to load Google Maps script');
    
    document.head.appendChild(script);
  }
};

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const BusDetails = () => {
  const location = useLocation();
  const [buses, setBuses] = useState(location.state?.buses || []);
  const [loading, setLoading] = useState(!location.state?.buses);
  const [selectedBus, setSelectedBus] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const [mapScriptLoaded, setMapScriptLoaded] = useState(false);
  const [error, setError] = useState(null);
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found, please log in");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    if (!location.state?.buses) {
      const fetchBuses = async () => {
        setLoading(true);
        try {
          const config = getAuthConfig();
          const response = await axios.get(
            `{${BASE_URL}/driver-profiles`,
            config
          );
          setBuses(response.data);
        } catch (error) {
          console.error("Error fetching buses:", error);
          setError("Failed to load bus data");
        } finally {
          setLoading(false);
        }
      };
      fetchBuses();
    }
  }, [location.state]);

  useEffect(() => {
    loadGoogleMapsScript(() => {
      setMapScriptLoaded(true);
    });
  }, []);

  const fetchBusLocation = async (busNumber) => {
    try {
      const config = getAuthConfig();
      const response = await axios.get(
        `${BASE_URL}/driver/route/${busNumber}/location`,
        config
      );
      
      if (!response.data.success) {
        return { error: true, message: response.data.message };
      }
      
      return {
        success: true,
        latitude: response.data.latitude,
        longitude: response.data.longitude
      };
    } catch (error) {
      console.error("Error fetching bus location:", error);
      return { 
        error: true, 
        message: error.response?.data?.message || "Failed to fetch location" 
      };
    }
  };

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
      mapTypeId: 'roadmap'
    };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
    markerRef.current = new window.google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map: mapInstanceRef.current,
      title: `Bus ${selectedBus?.busNumber} Location`
    });
  };

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

  const handleCardClick = async (bus) => {
    if (selectedBus?.busNumber === bus.busNumber) {
      setSelectedBus(null);
      setBusLocation(null);
      setError(null);
      if (markerRef.current) {
        markerRef.current.setMap(null);
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    } else {
      setSelectedBus(bus);
      setError(null);
      const location = await fetchBusLocation(bus.busNumber);
      if (location.error) {
        setError(location.message);
        setBusLocation(null);
      } else {
        setBusLocation(location);
        if (location.success && mapScriptLoaded) {
          updateMapLocation(location.latitude, location.longitude);
        }
      }
    }
  };

  useEffect(() => {
    if (!selectedBus || !mapScriptLoaded) return;

    const updateLocation = async () => {
      const location = await fetchBusLocation(selectedBus.busNumber);
      if (location.error) {
        setError(location.message);
        setBusLocation(null);
      } else {
        setBusLocation(location);
        if (location.success) {
          updateMapLocation(location.latitude, location.longitude);
        }
      }
    };

    updateLocation();
    const intervalId = setInterval(updateLocation, 3000);

    return () => clearInterval(intervalId);
  }, [selectedBus, mapScriptLoaded]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: { xs: 1, sm: 3 }, maxWidth: "1000px", margin: "auto" }}>
        <Typography variant="h4" sx={{ mb: 3, fontSize: { xs: "1.5rem", sm: "2rem" } }}>
          Bus Details
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {buses.length > 0 ? (
            buses.map((bus) => (
              <Grid item xs={12} sm={6} md={4} key={bus._id}>
                <Card sx={{ 
                  bgcolor: selectedBus?.busNumber === bus.busNumber ? '#e3f2fd' : 'white',
                  transition: 'background-color 0.3s',
                  width: { xs: '100%', sm: 'auto' }, // Full width on small screens
                  minWidth: { xs: '280px', sm: 'auto' }, // Minimum width for 320px screens
                  maxWidth: { xs: '320px', sm: 'none' }, // Maximum width for small screens
                  mx: 'auto' // Center on small screens
                }}>
                  <CardActionArea onClick={() => handleCardClick(bus)}>
                    <CardContent sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      py: 2,
                      px: { xs: 1.5, sm: 2 }
                    }}>
                      <DirectionsBusIcon sx={{ 
                        color: '#1976d2', 
                        fontSize: { xs: 30, sm: 40 },
                        mr: { xs: 1, sm: 2 }
                      }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: '#1976d2',
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                            lineHeight: 1.2,
                            mb: 0.5
                          }}
                        >
                          Bus {bus.busNumber}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 'medium', 
                            color: '#d81b60',
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            lineHeight: 1.2,
                            wordBreak: 'break-word' // Ensure long names wrap properly
                          }}
                        >
                          {bus.driverName}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography>No buses available</Typography>
            </Grid>
          )}
        </Grid>

        {selectedBus && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ mt: 4, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Location for {selectedBus.driverName} (Bus {selectedBus.busNumber})
              </Typography>
              <Box sx={{ height: { xs: "300px", sm: "400px" }, borderRadius: 1, overflow: "hidden" }}>
                {!mapScriptLoaded ? (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <CircularProgress />
                  </Box>
                ) : !busLocation || !busLocation.success ? (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <Typography variant="body2" color="text.secondary">
                      {error || "Loading location..."}
                    </Typography>
                  </Box>
                ) : (
                  <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                )}
              </Box>
              {busLocation && busLocation.success && !error && (
                <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                  Last Updated: {new Date().toLocaleString()}
                </Typography>
              )}
            </Box>
          </motion.div>
        )}
      </Box>
    </motion.div>
  );
};

export default BusDetails;