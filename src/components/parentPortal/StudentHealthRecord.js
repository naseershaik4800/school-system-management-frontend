import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Add useNavigate
import axios from "axios";
import { toast } from "react-toastify"; // Add toast for notifications
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
} from "@mui/material";
import {
  MedicalServices,
  Person,
  Favorite,
  Medication,
  Shield,
  Warning,
  EventNote,
  ArrowBack,
} from "@mui/icons-material";


const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

// const API_URL = "http://localhost:5000/api";

// Reusable function to get auth config with token
const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Please log in to access this feature");
    throw new Error("No token found");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// Configure Axios with base URL
const api = axios.create({
  baseURL: `${BASE_URL}`,
  validateStatus: (status) => status >= 200 && status < 500, // Accept 200-499 as success
});

const StudentHealthRecord = ({ studentId }) => {
  const [healthRecord, setHealthRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Add navigate hook

  useEffect(() => {
    const fetchHealthRecord = async () => {
      if (!studentId || studentId === "undefined") {
        setError("No student ID provided");
        setLoading(false);
        return;
      }

      try {
        const config = getAuthConfig();
        console.log("Fetching health record with token:", localStorage.getItem("token"));
        const response = await api.get(`/api/healthrecord/${studentId}`, config);

        if (response.status === 200) {
          setHealthRecord(response.data); // Record found
          console.log("⭐ Health Record:", response.data);
        } else if (response.status === 404) {
          setHealthRecord(null); // No record found
        } else {
          setError("Unexpected response status: " + response.status);
          toast.error("Unexpected response from server");
        }
      } catch (err) {
        console.error("Error fetching health record:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          toast.error("Session expired or unauthorized. Please log in again.");
          navigate("/login");
        } else if (err.response?.status === 403) {
          setError("Access denied: You do not have permission to view this health record.");
          toast.error("Access denied");
        } else {
          setError(
            err.response?.data?.message || "Failed to fetch health record"
          );
          toast.error("Failed to load health record");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHealthRecord();
  }, [studentId, navigate]); // Added navigate to dependencies

  const handleBack = () => {
    navigate(-1); // Navigate back to previous page
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ mb: 2, textAlign: "right" }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBack}
            color="primary"
          >
            Back
          </Button>
        </Box>
        <Alert severity="error" icon={<Warning />}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, backgroundColor: "#fafafa" }}>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ color: "#1976d2", fontWeight: 500 }}
        >
          <MedicalServices sx={{ mr: 1, verticalAlign: "middle" }} />
          Student Health Record
        </Typography>
        
      </Box>

      {healthRecord ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card
              elevation={2}
              sx={{ height: "100%", border: "1px solid #e0e7ff" }}
            >
              <CardHeader
                title="Health Summary"
                avatar={<Person sx={{ color: "#90caf9" }} />}
                titleTypographyProps={{ variant: "h6", color: "#1976d2" }}
                sx={{ backgroundColor: "#e3f2fd", py: 1 }}
              />
              <CardContent>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Blood Group
                    </Typography>
                    <Typography variant="body1">
                      {healthRecord.bloodGroup || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Height
                    </Typography>
                    <Typography variant="body1">
                      {healthRecord.height?.value
                        ? `${healthRecord.height.value} ${healthRecord.height.unit}`
                        : "N/A"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Weight
                    </Typography>
                    <Typography variant="body1">
                      {healthRecord.weight?.value
                        ? `${healthRecord.weight.value} ${healthRecord.weight.unit}`
                        : "N/A"}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card
              elevation={2}
              sx={{ height: "100%", border: "1px solid #e0e7ff" }}
            >
              <CardHeader
                title="Medical Conditions"
                avatar={<Favorite sx={{ color: "#90caf9" }} />}
                titleTypographyProps={{ variant: "h6", color: "#1976d2" }}
                sx={{ backgroundColor: "#e3f2fd", py: 1 }}
              />
              <CardContent>
                {healthRecord.allergies?.length > 0 && (
                  <>
                    <Typography
                      variant="subtitle1"
                      color="error.main"
                      gutterBottom
                    >
                      Allergies
                    </Typography>
                    <List dense>
                      {healthRecord.allergies.map((allergy, index) => (
                        <ListItem
                          key={index}
                          sx={{
                            backgroundColor: "#ffebee",
                            borderRadius: 1,
                            mb: 0.5,
                          }}
                        >
                          <ListItemText primary={allergy} />
                        </ListItem>
                      ))}
                    </List>
                    <Divider sx={{ my: 2 }} />
                  </>
                )}
                {healthRecord.chronicConditions?.length > 0 && (
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#e0e7ff" }}>
                          <TableCell>Condition</TableCell>
                          <TableCell>Diagnosed Date</TableCell>
                          <TableCell>Notes</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {healthRecord.chronicConditions.map(
                          (condition, index) => (
                            <TableRow key={index}>
                              <TableCell>{condition.condition}</TableCell>
                              <TableCell>
                                {condition.diagnosedDate
                                  ? new Date(
                                      condition.diagnosedDate
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </TableCell>
                              <TableCell>{condition.notes || "-"}</TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                {!healthRecord.allergies?.length &&
                  !healthRecord.chronicConditions?.length && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                    >
                      No medical conditions recorded
                    </Typography>
                  )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              elevation={2}
              sx={{ height: "100%", border: "1px solid #e0e7ff" }}
            >
              <CardHeader
                title="Medications"
                avatar={<Medication sx={{ color: "#90caf9" }} />}
                titleTypographyProps={{ variant: "h6", color: "#1976d2" }}
                sx={{ backgroundColor: "#e3f2fd", py: 1 }}
              />
              <CardContent>
                {healthRecord.medications?.length > 0 ? (
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#e0e7ff" }}>
                          <TableCell>Medication</TableCell>
                          <TableCell>Dosage</TableCell>
                          <TableCell>Frequency</TableCell>
                          <TableCell>Duration</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {healthRecord.medications.map((med, index) => (
                          <TableRow key={index}>
                            <TableCell>{med.name}</TableCell>
                            <TableCell>{med.dosage}</TableCell>
                            <TableCell>{med.frequency}</TableCell>
                            <TableCell>
                              {med.startDate
                                ? `${new Date(
                                    med.startDate
                                  ).toLocaleDateString()} - ${
                                    med.endDate
                                      ? new Date(
                                          med.endDate
                                        ).toLocaleDateString()
                                      : "Ongoing"
                                  }`
                                : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    No medications recorded
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
{/* 
          <Grid item xs={12} md={6}>
            <Card
              elevation={2}
              sx={{ height: "100%", border: "1px solid #e0e7ff" }}
            >
              <CardHeader
                title="Immunizations"
                avatar={<Shield sx={{ color: "#90caf9" }} />}
                titleTypographyProps={{ variant: "h6", color: "#1976d2" }}
                sx={{ backgroundColor: "#e3f2fd", py: 1 }}
              />
              <CardContent>
                {healthRecord.immunizations?.length > 0 ? (
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#e0e7ff" }}>
                          <TableCell>Vaccine</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Next Due</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {healthRecord.immunizations.map(
                          (immunization, index) => (
                            <TableRow key={index}>
                              <TableCell>{immunization.name}</TableCell>
                              <TableCell>
                                {immunization.date
                                  ? new Date(
                                      immunization.date
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                {immunization.nextDueDate
                                  ? new Date(
                                      immunization.nextDueDate
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    No immunizations recorded
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid> */}

          {(healthRecord.lastCheckup || healthRecord.emergencyNotes) && (
            <Grid item xs={12}>
              <Grid container spacing={3}>
                {healthRecord.lastCheckup && (
                  <Grid item xs={12} md={8}>
                    <Card
                      elevation={2}
                      sx={{ height: "100%", border: "1px solid #e0e7ff" }}
                    >
                      <CardHeader
                        title="Last Checkup"
                        avatar={<EventNote sx={{ color: "#90caf9" }} />}
                        titleTypographyProps={{
                          variant: "h6",
                          color: "#1976d2",
                        }}
                        sx={{ backgroundColor: "#e3f2fd", py: 1 }}
                      />
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Date
                            </Typography>
                            <Typography variant="body1">
                              {healthRecord.lastCheckup.date
                                ? new Date(
                                    healthRecord.lastCheckup.date
                                  ).toLocaleDateString()
                                : "N/A"}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Doctor
                            </Typography>
                            <Typography variant="body1">
                              {healthRecord.lastCheckup.doctor || "N/A"}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2" color="text.secondary">
                              Findings
                            </Typography>
                            <Typography variant="body1">
                              {healthRecord.lastCheckup.findings || "N/A"}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {healthRecord.emergencyNotes && (
                  <Grid item xs={12} md={4}>
                    <Card
                      elevation={2}
                      sx={{ height: "100%", border: "1px solid #ffcdd2" }}
                    >
                      <CardHeader
                        title="Emergency Notes"
                        avatar={<Warning sx={{ color: "#ef5350" }} />}
                        titleTypographyProps={{
                          variant: "h6",
                          color: "#d32f2f",
                        }}
                        sx={{ backgroundColor: "#ffebee", py: 1 }}
                      />
                      <CardContent>
                        <Typography variant="body1" color="error.main">
                          {healthRecord.emergencyNotes}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}
        </Grid>
      ) : (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Alert severity="info" sx={{ justifyContent: "center" }}>
            No health records found for this student.
          </Alert>
        </Box>
      )}
    </Container>
  );
};

export default StudentHealthRecord;