import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Paper,
  Alert,
  Input,
  Divider,
} from "@mui/material";
import { motion } from "framer-motion";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PersonIcon from "@mui/icons-material/Person";
import HomeIcon from "@mui/icons-material/Home";
import EmergencyIcon from "@mui/icons-material/Emergency";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

function Profile() {
  const [studentData, setStudentData] = useState({
    name: "",
    admissionNo: "",
    email: "",
    phone: "",
    className: "",
    section: "",
    profilePicture: "",
    document: "",
    branchId: "",
    parents: [],
    address: { street: "", city: "", state: "", zipCode: "", country: "" },
    emergencyContact: { name: "", relation: "", phone: "" },
  });
  const [apiError, setApiError] = useState("");

  // Retrieve token and user from localStorage
  const token = localStorage.getItem("token");
  const userLocalStorage = localStorage.getItem("user");
  // Memoize user to ensure stable reference
  const user = useMemo(() => JSON.parse(userLocalStorage), [userLocalStorage]);

  // Axios instance with token in headers
  const api = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: { Authorization: `Bearer ${token}` },
  });

  // Fetch student data on mount or when user/token changes
  useEffect(() => {
    console.log("Profile useEffect triggered", { user, token }); // Debug log
    if (!user || !token) {
      setApiError("Please log in to view profile.");
      return;
    }

    const fetchStudentData = async () => {
      try {
        const response = await api.get(`/student/email/${user.email}`);
        console.log("Student data fetched:", response.data); // Debug log
        setStudentData({ ...response.data });
      } catch (error) {
        console.error("Error fetching student data:", error); // Debug log
        setApiError("Failed to load student data.");
      }
    };
    fetchStudentData();
  }, [user, token]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Box className="f-main-container">
        {apiError && (
          <Alert severity="error" className="f-error-alert">
            {apiError}
          </Alert>
        )}
        <Paper className="f-paper">
          {/* Header Section */}
          <Box className="f-header-section">
            <Avatar
              className="f-avatar"
              src={`${BASE_URL}/uploads/${studentData.profilePicture}`}
            />
            <Box className="f-user-info">
              <Typography variant="h4" className="f-user-name">
                {studentData.name || "Student Name"}
              </Typography>
              <Typography variant="subtitle1" className="f-admission-no">
                Admission No: {studentData.admissionNo || "N/A"}
              </Typography>
            </Box>
            <Box className="f-spacer" />
          </Box>

          <Divider className="f-divider" />

          {/* Form Sections */}
          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12} md={6}>
              <Card className="f-card">
                <CardContent>
                  <Box className="f-card-header">
                    <PersonIcon className="f-icon" />
                    <Typography variant="h6" className="f-card-title">
                      Personal Information
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {[
                      "name",
                      "admissionNo",
                      "email",
                      "phone",
                      "className",
                      "section",
                    ].map((field) => (
                      <Grid item xs={12} sm={6} key={field}>
                        <TextField
                          fullWidth
                          label={field.charAt(0).toUpperCase() + field.slice(1)}
                          name={field}
                          value={studentData[field]}
                          disabled
                          variant="outlined"
                          className="f-text-field"
                          InputProps={{
                            style: { color: "#333" },
                          }}
                          InputLabelProps={{
                            style: { color: "#333" },
                          }}
                        />
                      </Grid>
                    ))}
                    {studentData.document && (
                      <Grid item xs={12}>
                        <Typography className="f-dark-text">
                          Document:{" "}
                          <a
                            href={studentData.document}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="f-document-link"
                          >
                            View PDF
                          </a>
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Address Information */}
            <Grid item xs={12} md={6}>
              <Card className="f-card">
                <CardContent>
                  <Box className="f-card-header">
                    <HomeIcon className="f-icon" />
                    <Typography variant="h6" className="f-card-title">
                      Address Information
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {["street", "city", "state", "zipCode", "country"].map(
                      (field) => (
                        <Grid item xs={12} sm={6} key={field}>
                          <TextField
                            fullWidth
                            label={
                              field.charAt(0).toUpperCase() + field.slice(1)
                            }
                            name={`address.${field}`}
                            value={studentData.address[field]}
                            disabled
                            variant="outlined"
                            className="f-text-field"
                            InputProps={{
                              style: { color: "#333" },
                            }}
                            InputLabelProps={{
                              style: { color: "#333" },
                            }}
                          />
                        </Grid>
                      )
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Emergency Contact */}
            <Grid item xs={12} md={6}>
              <Card className="f-card">
                <CardContent>
                  <Box className="f-card-header">
                    <EmergencyIcon className="f-icon" />
                    <Typography variant="h6" className="f-card-title">
                      Emergency Contact
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {["name", "relation", "phone"].map((field) => (
                      <Grid item xs={12} sm={4} key={field}>
                        <TextField
                          fullWidth
                          label={field.charAt(0).toUpperCase() + field.slice(1)}
                          name={`emergencyContact.${field}`}
                          value={studentData.emergencyContact[field]}
                          disabled
                          variant="outlined"
                          className="f-text-field"
                          InputProps={{
                            style: { color: "#333" },
                          }}
                          InputLabelProps={{
                            style: { color: "#333" },
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Parent Information */}
            {studentData.parents.length > 0 && (
              <Grid item xs={12}>
                <Card className="f-card">
                  <CardContent>
                    <Box className="f-card-header">
                      <FamilyRestroomIcon className="f-icon" />
                      <Typography variant="h6" className="f-card-title">
                        Parent/Guardian Information
                      </Typography>
                    </Box>
                    {studentData.parents.map((parent, index) => (
                      <Grid container key={index} spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography className="f-dark-text">
                            Parent {index + 1}:
                          </Typography>
                          <Typography className="f-dark-text">
                            Name: {parent.name || "N/A"}
                          </Typography>
                          <Typography className="f-dark-text">
                            Phone: {parent.phone || "N/A"}
                          </Typography>
                        </Grid>
                      </Grid>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>

      {/* CSS */}
      <style>{`
        .f-main-container {
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          padding: 8px 16px 16px;
        }

        .f-error-alert {
          margin-bottom: 24px;
          border-radius: 16px;
        }

        .f-paper {
          padding: 8px 16px 16px;
          border-radius: 12px;
          border: 2px solid #6b0783;
          background-color: #f4f8fc;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        .f-header-section {
          display: flex;
          flex-direction: row;
          align-items: center;
          margin-bottom: 32px;
        }

        .f-avatar {
          width: 120px;
          height: 120px;
          margin-right: 24px;
          border: 3px solid #6b0783;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .f-user-info {
          text-align: left;
        }

        .f-user-name {
          font-weight: 600;
          color: #6b0783;
        }

        .f-admission-no {
          color: #333;
        }

        .f-spacer {
          flex-grow: 1;
        }

        .f-divider {
          margin-bottom: 32px;
          border-color: #6b0783;
        }

        .f-card {
          border-radius: 8px;
          border: 1px solid #6b0783;
          box-shadow: none;
        }

        .f-card-header {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }

        .f-icon {
          color: #6b0783;
          margin-right: 8px;
        }

        .f-card-title {
          font-weight: 500;
          color: #6b0783;
        }

        .f-text-field .MuiOutlinedInput-root {
          border-radius: 8px;
          background-color: #f4f8fc;
          & fieldset {
            border-color: #6b0783;
          }
          &:hover fieldset {
            border-color: #5a066c;
          }
          color: #333;
        }

        .f-dark-text {
          color: #333;
        }

        .f-document-link {
          color: #6b0783;
        }

        @media (max-width: 600px) {
          .f-main-container {
            padding: 8px;
          }

          .f-paper {
            padding: 8px;
          }

          .f-header-section {
            flex-direction: column;
          }

          .f-avatar {
            width: 80px;
            height: 80px;
          }

          .f-user-info {
            text-align: center;
          }
        }
      `}</style>
    </motion.div>
  );
}

export default Profile;
