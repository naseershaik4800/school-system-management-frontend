import "animate.css";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState, useCallback } from "react";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./AddStudent.css";

// const API_URL = "http://localhost:5000";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Please log in to access this feature");
    throw new Error("No token found");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const AddStudent = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [existingStudents, setExistingStudents] = useState([]);
  const [currentPageHostel, setCurrentPageHostel] = useState(1);
  const [currentPageDayScholar, setCurrentPageDayScholar] = useState(1);
  const [studentsPerPage] = useState(10);
  const [feeStructure, setFeeStructure] = useState([]);
  const [hostelFeeStructure, setHostelFeeStructure] = useState([]);
  const [busRoutes, setBusRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [driverInfo, setDriverInfo] = useState({
    driverName: "",
    phoneNumber: "",
    fromLocation: "",
    toLocation: "",
  });
  const [remainingDayScholarFee, setRemainingDayScholarFee] = useState(0);
  const [remainingHostelFee, setRemainingHostelFee] = useState(0);

  const [formData, setFormData] = useState({
    admissionNo: "",
    rollNumber: "",
    name: "",
    password: "",
    dateOfBirth: "",
    gender: "Male",
    className: "",
    section: "",
    phone: "",
    email: "",
    address: { street: "", city: "", state: "", zipCode: "", country: "" },
    emergencyContact: { name: "", relation: "", phone: "" },
    feeDetails: {
      totalFee: "",
      paymentOption: "Full Payment",
      terms: [],
      paymentHistory: [],
    },
    busRoute: {
      routeNumber: "",
      pickupLocation: "",
      dropLocation: "",
      driverName: "",
      driverContact: "",
    },
    parents: [],
    profilePicture: null,
    isHostelStudent: false,
    healthRecord: {
      height: "",
      weight: "",
      bloodGroup: "",
      allergies: "",
      medicalConditions: "",
      medications: "",
      lastCheckupDate: "",
    },
  });

  const [termCount, setTermCount] = useState(1);
  const [termDetails, setTermDetails] = useState([
    {
      termName: "Term 1",
      amount: 0,
      dueDate: "",
      paidAmount: 0,
      status: "Pending",
    },
  ]);
  const [errors, setErrors] = useState({});

  const classAgeLimits = {
    UKG: { min: 3, max: 5 },
    LKG: { min: 3, max: 4 },
    "1st Grade": { min: 5, max: 6 },
    "2nd Grade": { min: 6, max: 7 },
    "3rd Grade": { min: 7, max: 8 },
    "4th Grade": { min: 8, max: 9 },
    "5th Grade": { min: 9, max: 10 },
    "6th Grade": { min: 10, max: 11 },
    "7th Grade": { min: 11, max: 12 },
    "8th Grade": { min: 12, max: 13 },
    "9th Grade": { min: 13, max: 14 },
    "10th Grade": { min: 14, max: 15 },
    "11th Grade": { min: 15, max: 16 },
    "12th Grade": { min: 16, max: 17 },
  };
  const sectionOptions = ["A", "B"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, feeRes, hostelFeeRes, busRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/students`, getAuthConfig()),
          axios.get(`${BASE_URL}/fees`, getAuthConfig()),
          axios.get(`${BASE_URL}/api/hostelFees`, getAuthConfig()),
          axios.get(`${BASE_URL}/driver-profiles`, getAuthConfig()),
        ]);
        setExistingStudents(studentsRes.data);
        setFeeStructure(feeRes.data);
        setHostelFeeStructure(hostelFeeRes.data);
        setBusRoutes(busRes.data);
      } catch (error) {
        toast.error(
          "Error fetching data: " +
          (error.response?.data?.message || error.message)
        );
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      }
    };
    fetchData();
  }, [navigate]);

  const fetchStudents = useCallback(async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/students`,
        getAuthConfig()
      );
      setExistingStudents(response.data);
    } catch (error) {
      toast.error(
        "Error fetching students: " +
        (error.response?.data?.message || error.message)
      );
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (
      formData.feeDetails.paymentOption === "Installments" &&
      formData.feeDetails.totalFee
    ) {
      const totalFee = parseFloat(formData.feeDetails.totalFee) || 0;
      const perTermAmount = Math.round((totalFee / termCount) * 100) / 100;
      const newTerms = Array(termCount)
        .fill()
        .map((_, index) => ({
          termName: `Term ${index + 1}`,
          amount: perTermAmount,
          dueDate: termDetails[index]?.dueDate || "",
          paidAmount: termDetails[index]?.paidAmount || 0,
          status: termDetails[index]?.status || "Pending",
        }));
      setTermDetails(newTerms);

      const totalPaid = newTerms.reduce(
        (sum, term) => sum + (term.status === "Paid" ? term.amount : 0),
        0
      );
      if (formData.isHostelStudent) {
        setRemainingHostelFee(totalFee - totalPaid);
        setRemainingDayScholarFee(0);
      } else {
        setRemainingDayScholarFee(totalFee - totalPaid);
        setRemainingHostelFee(0);
      }
    }
  }, [
    termCount,
    formData.feeDetails.totalFee,
    formData.feeDetails.paymentOption,
  ]);

  useEffect(() => {
    if (selectedRoute && !formData.isHostelStudent) {
      const selectedDriver = busRoutes.find(
        (bus) => bus.busNumber === selectedRoute
      );
      if (selectedDriver) {
        setDriverInfo({
          driverName: selectedDriver.driverName || "",
          phoneNumber: selectedDriver.phoneNumber || "",
          fromLocation: selectedDriver.fromLocation || "",
          toLocation: selectedDriver.toLocation || "",
        });
        setFormData((prev) => ({
          ...prev,
          busRoute: {
            routeNumber: selectedRoute,
            driverName: selectedDriver.driverName || "",
            driverContact: selectedDriver.phoneNumber || "",
            pickupLocation: selectedDriver.fromLocation || "",
            dropLocation: selectedDriver.toLocation || "",
          },
        }));
      }
    } else if (formData.isHostelStudent) {
      setSelectedRoute("");
      setDriverInfo({
        driverName: "",
        phoneNumber: "",
        fromLocation: "",
        toLocation: "",
      });
      setFormData((prev) => ({
        ...prev,
        busRoute: {
          routeNumber: "",
          pickupLocation: "",
          dropLocation: "",
          driverName: "",
          driverContact: "",
        },
      }));
    }
  }, [selectedRoute, formData.isHostelStudent, busRoutes]);

  useEffect(() => {
    // Reset pagination to page 1 when search term changes
    setCurrentPageHostel(1);
    setCurrentPageDayScholar(1);
  }, [searchTerm]);


  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    let newErrors = { ...errors };

    if (type === "checkbox" && name === "isHostelStudent") {
      const newIsHostelStudent = checked;
      setFormData((prev) => ({
        ...prev,
        isHostelStudent: newIsHostelStudent,
        busRoute: newIsHostelStudent
          ? {
            routeNumber: "",
            pickupLocation: "",
            dropLocation: "",
            driverName: "",
            driverContact: "",
          }
          : prev.busRoute,
      }));
      if (newIsHostelStudent) {
        setSelectedRoute("");
        delete newErrors.busRoute;
        const selectedFee = hostelFeeStructure.find(
          (fee) => fee.class === formData.className
        );
        if (selectedFee) {
          const totalHostelFee =
            selectedFee.tuition + selectedFee.library + selectedFee.hostel;
          setFormData((prev) => ({
            ...prev,
            feeDetails: { ...prev.feeDetails, totalFee: totalHostelFee },
          }));
          setRemainingHostelFee(totalHostelFee);
          setRemainingDayScholarFee(0);
        }
      } else {
        if (!selectedRoute) {
          newErrors.busRoute = "Bus Route is required for day scholars";
        }
        const selectedFee = feeStructure.find(
          (fee) => fee.class === formData.className
        );
        if (selectedFee) {
          const totalDayScholarFee =
            selectedFee.tuition + selectedFee.library + selectedFee.transport;
          setFormData((prev) => ({
            ...prev,
            feeDetails: { ...prev.feeDetails, totalFee: totalDayScholarFee },
          }));
          setRemainingDayScholarFee(totalDayScholarFee);
          setRemainingHostelFee(0);
        }
      }
      setErrors(newErrors);
      return;
    }

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "file" ? files[0] : value,
      }));
      if (name === "className" && value) {
        const feeData = formData.isHostelStudent
          ? hostelFeeStructure
          : feeStructure;
        const selectedFee = feeData.find((fee) => fee.class === value);
        if (selectedFee) {
          const totalFee = formData.isHostelStudent
            ? selectedFee.tuition + selectedFee.library + selectedFee.hostel
            : selectedFee.tuition + selectedFee.library + selectedFee.transport;
          setFormData((prev) => ({
            ...prev,
            feeDetails: { ...prev.feeDetails, totalFee },
          }));
          if (formData.isHostelStudent) {
            setRemainingHostelFee(totalFee);
            setRemainingDayScholarFee(0);
          } else {
            setRemainingDayScholarFee(totalFee);
            setRemainingHostelFee(0);
          }
        }
      }
    }

    if (name === "admissionNo") {
      if (!/^\d{3,5}$/.test(value) || /^0+$/.test(value)) {
        newErrors.admissionNo =
          "Admission Number must be 3-5 digits and not all zeros";
      } else {
        delete newErrors.admissionNo;
      }
    }
    if (name === "rollNumber") {
      if (!/^\d{3}$/.test(value) || /^0+$/.test(value)) {
        newErrors.rollNumber =
          "Roll Number must be exactly 3 digits and not all zeros";
      } else {
        delete newErrors.rollNumber;
      }
    }
    if (name === "name") {
      if (!value) {
        newErrors.name = "Full Name is required";
      } else if (!/^[A-Za-z ]+$/.test(value)) {
        newErrors.name = "Full Name must contain only letters and spaces";
      } else {
        delete newErrors.name;
      }
    }
    if (name === "password") {
      if (!value) {
        newErrors.password = "Password is required";
      } else if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
          value
        )
      ) {
        newErrors.password =
          "Password must be 8+ chars with uppercase, lowercase, number, and special char";
      } else {
        delete newErrors.password;
      }
    }
    if (name === "dateOfBirth" && value) {
      const age = calculateAge(value);
      if (age < 3) {
        newErrors.dateOfBirth = "Student must be at least 3 years old";
      } else {
        delete newErrors.dateOfBirth;
      }
    }
    if (name === "className") {
      if (!value) {
        newErrors.className = "Class is required";
      } else {
        delete newErrors.className;
      }
    }
    if (name === "section") {
      if (!value) {
        newErrors.section = "Section is required";
      } else {
        delete newErrors.section;
      }
    }
    if (name === "phone") {
      if (!value) {
        newErrors.phone = "Phone Number is required";
      } else if (!/^[6-9]\d{9}$/.test(value)) {
        newErrors.phone =
          "Phone Number must be 10 digits starting with 6, 7, 8, or 9";
      } else {
        delete newErrors.phone;
      }
    }
    if (name === "email") {
      if (!value) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@0-9]+\.[^\s@]+$/.test(value)) {
        newErrors.email = "Invalid email format (e.g., abc23@xyz.asd)";
      } else {
        delete newErrors.email;
      }
    }
    if (name === "address.street") {
      if (!value) {
        newErrors.street = "Street is required";
      } else {
        delete newErrors.street;
      }
    }
    if (name === "address.city") {
      if (!value) {
        newErrors.city = "City is required";
      } else if (!/^[A-Za-z ]+$/.test(value)) {
        newErrors.city = "City must contain only letters and spaces";
      } else {
        delete newErrors.city;
      }
    }
    if (name === "address.state") {
      if (!value) {
        newErrors.state = "State is required";
      } else if (!/^[A-Za-z ]+$/.test(value)) {
        newErrors.state = "State must contain only letters and spaces";
      } else {
        delete newErrors.state;
      }
    }
    if (name === "address.zipCode") {
      if (!value) {
        newErrors.zipCode = "ZIP Code is required";
      } else if (!/^\d{6}$/.test(value)) {
        newErrors.zipCode = "ZIP Code must be exactly 6 digits";
      } else {
        delete newErrors.zipCode;
      }
    }
    if (name === "address.country") {
      if (!value) {
        newErrors.country = "Country is required";
      } else if (!/^[A-Za-z ]+$/.test(value)) {
        newErrors.country = "Country must contain only letters and spaces";
      } else {
        delete newErrors.country;
      }
    }
    if (name === "emergencyContact.name") {
      if (!value) {
        newErrors.emergencyContactName = "Contact Name is required";
      } else if (!/^[A-Za-z ]+$/.test(value)) {
        newErrors.emergencyContactName =
          "Contact Name must contain only letters and spaces";
      } else {
        delete newErrors.emergencyContactName;
      }
    }
    if (name === "emergencyContact.relation") {
      if (!value) {
        newErrors.emergencyContactRelation = "Relation is required";
      } else if (!/^[A-Za-z ]+$/.test(value)) {
        newErrors.emergencyContactRelation =
          "Relation must contain only letters and spaces";
      } else {
        delete newErrors.emergencyContactRelation;
      }
    }
    if (name === "emergencyContact.phone") {
      if (!value) {
        newErrors.emergencyContactPhone = "Contact Phone Number is required";
      } else if (!/^[6-9]\d{9}$/.test(value)) {
        newErrors.emergencyContactPhone =
          "Phone Number must be 10 digits starting with 6, 7, 8, or 9";
      } else {
        delete newErrors.emergencyContactPhone;
      }
    }
    if (name === "feeDetails.totalFee") {
      if (!value) {
        newErrors.totalFee = `${formData.isHostelStudent ? "Hostel" : "Day Scholar"
          } Total Fee is required`;
      } else if (parseFloat(value) <= 0) {
        newErrors.totalFee = `${formData.isHostelStudent ? "Hostel" : "Day Scholar"
          } Total Fee must be greater than 0`;
      } else {
        const feeData = formData.isHostelStudent
          ? hostelFeeStructure
          : feeStructure;
        const selectedFee = feeData.find(
          (fee) => fee.class === formData.className
        );
        if (selectedFee) {
          const expectedFee = formData.isHostelStudent
            ? selectedFee.tuition + selectedFee.library + selectedFee.hostel
            : selectedFee.tuition + selectedFee.library + selectedFee.transport;
          if (parseFloat(value) < expectedFee) {
            newErrors.totalFee = `${formData.isHostelStudent ? "Hostel" : "Day Scholar"
              } Fee cannot be less than ₹${expectedFee}`;
          } else {
            delete newErrors.totalFee;
          }
        } else {
          delete newErrors.totalFee;
        }
      }
    }

    setErrors(newErrors);
  };

  const handleHealthChange = (e) => {
    const { name, value } = e.target;
    let newErrors = { ...errors };

    if (name === "height" && value && parseFloat(value) < 0) {
      newErrors.height = "Height cannot be negative";
    } else {
      delete newErrors.height;
    }
    if (name === "weight" && value && parseFloat(value) < 0) {
      newErrors.weight = "Weight cannot be negative";
    } else {
      delete newErrors.weight;
    }
    if (name === "lastCheckupDate" && value) {
      const checkupDate = new Date(value);
      const today = new Date();
      if (checkupDate > today) {
        newErrors.lastCheckupDate = "Last checkup date cannot be in the future";
      } else {
        delete newErrors.lastCheckupDate;
      }
    }

    setErrors(newErrors);
    setFormData((prev) => ({
      ...prev,
      healthRecord: { ...prev.healthRecord, [name]: value },
    }));
  };

  const handleTermChange = (index, field, value) => {
    const updatedTerms = [...termDetails];
    const today = new Date().toISOString().split("T")[0];
    let newErrors = { ...errors };

    if (field === "termName") {
      if (!value) {
        newErrors[`termName${index}`] = "Term Name is required";
      } else {
        delete newErrors[`termName${index}`];
      }
      updatedTerms[index][field] = value;
    }
    if (field === "amount") {
      const amount = parseFloat(value) || 0;
      if (amount <= 0) {
        newErrors[`termAmount${index}`] = "Amount must be greater than 0";
      } else {
        delete newErrors[`termAmount${index}`];
      }
      updatedTerms[index][field] = amount;
    }
    if (field === "dueDate" && value) {
      const prevDueDate = index > 0 ? termDetails[index - 1].dueDate : null;
      if (updatedTerms[index].status !== "Paid") {
        if (value < today) {
          newErrors[`termDueDate${index}`] = "Due date cannot be in the past";
        } else if (prevDueDate && value <= prevDueDate) {
          newErrors[`termDueDate${index}`] =
            "Due date must be after previous term";
        } else {
          delete newErrors[`termDueDate${index}`];
        }
      }
      updatedTerms[index][field] = value;
    }
    if (field === "status") {
      if (value === "Paid") {
        updatedTerms[index].dueDate = "";
        delete newErrors[`termDueDate${index}`];
      }
      updatedTerms[index][field] = value;
    }

    setTermDetails(updatedTerms);
    setErrors(newErrors);

    const totalFee = parseFloat(formData.feeDetails.totalFee) || 0;
    const totalPaid = updatedTerms.reduce(
      (sum, term) => sum + (term.status === "Paid" ? term.amount : 0),
      0
    );
    if (formData.isHostelStudent) {
      setRemainingHostelFee(totalFee - totalPaid);
      if (totalFee - totalPaid < 0) {
        newErrors.remainingFee = "Hostel fee paid exceeds total fee";
      } else {
        delete newErrors.remainingFee;
      }
    } else {
      setRemainingDayScholarFee(totalFee - totalPaid);
      if (totalFee - totalPaid < 0) {
        newErrors.remainingFee = "Day scholar fee paid exceeds total fee";
      } else {
        delete newErrors.remainingFee;
      }
    }
    setErrors(newErrors);
  };

  const validateForm = () => {
    let newErrors = {};

    if (
      !/^\d{3,5}$/.test(formData.admissionNo) ||
      /^0+$/.test(formData.admissionNo)
    ) {
      newErrors.admissionNo =
        "Admission Number must be 3-5 digits and not all zeros";
    }
    if (
      !/^\d{3}$/.test(formData.rollNumber) ||
      /^0+$/.test(formData.rollNumber)
    ) {
      newErrors.rollNumber =
        "Roll Number must be exactly 3 digits and not all zeros";
    }
    if (!formData.name) {
      newErrors.name = "Full Name is required";
    } else if (!/^[A-Za-z ]+$/.test(formData.name)) {
      newErrors.name = "Full Name must contain only letters and spaces";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        formData.password
      )
    ) {
      newErrors.password =
        "Password must be 8+ chars with uppercase, lowercase, number, and special char";
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of Birth is required";
    } else {
      const age = calculateAge(formData.dateOfBirth);
      const classLimit = classAgeLimits[formData.className];
      if (age < 3) {
        newErrors.dateOfBirth = "Student must be at least 3 years old";
      } else if (classLimit && (age < classLimit.min || age > classLimit.max)) {
        newErrors.dateOfBirth = `Age must be between ${classLimit.min} and ${classLimit.max} for ${formData.className}`;
      }
    }
    if (!formData.className) {
      newErrors.className = "Class is required";
    }
    if (!formData.section) {
      newErrors.section = "Section is required";
    }
    if (!formData.phone) {
      newErrors.phone = "Phone Number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone =
        "Phone Number must be 10 digits starting with 6, 7, 8, or 9";
    }
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@0-9]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format (e.g., abc23@xyz.asd)";
    }
    if (!formData.address.street) {
      newErrors.street = "Street is required";
    }
    if (!formData.address.city) {
      newErrors.city = "City is required";
    } else if (!/^[A-Za-z ]+$/.test(formData.address.city)) {
      newErrors.city = "City must contain only letters and spaces";
    }
    if (!formData.address.state) {
      newErrors.state = "State is required";
    } else if (!/^[A-Za-z ]+$/.test(formData.address.state)) {
      newErrors.state = "State must contain only letters and spaces";
    }
    if (!formData.address.zipCode) {
      newErrors.zipCode = "ZIP Code is required";
    } else if (!/^\d{6}$/.test(formData.address.zipCode)) {
      newErrors.zipCode = "ZIP Code must be exactly 6 digits";
    }
    if (!formData.address.country) {
      newErrors.country = "Country is required";
    } else if (!/^[A-Za-z ]+$/.test(formData.address.country)) {
      newErrors.country = "Country must contain only letters and spaces";
    }
    if (!formData.emergencyContact.name) {
      newErrors.emergencyContactName = "Contact Name is required";
    } else if (!/^[A-Za-z ]+$/.test(formData.emergencyContact.name)) {
      newErrors.emergencyContactName =
        "Contact Name must contain only letters and spaces";
    }
    if (!formData.emergencyContact.relation) {
      newErrors.emergencyContactRelation = "Relation is required";
    } else if (!/^[A-Za-z ]+$/.test(formData.emergencyContact.relation)) {
      newErrors.emergencyContactRelation =
        "Relation must contain only letters and spaces";
    }
    if (!formData.emergencyContact.phone) {
      newErrors.emergencyContactPhone = "Contact Phone Number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.emergencyContact.phone)) {
      newErrors.emergencyContactPhone =
        "Phone Number must be 10 digits starting with 6, 7, 8, or 9";
    }
    if (!formData.feeDetails.totalFee) {
      newErrors.totalFee = `${formData.isHostelStudent ? "Hostel" : "Day Scholar"
        } Total Fee is required`;
    } else if (parseFloat(formData.feeDetails.totalFee) <= 0) {
      newErrors.totalFee = `${formData.isHostelStudent ? "Hostel" : "Day Scholar"
        } Total Fee must be greater than 0`;
    } else {
      const feeData = formData.isHostelStudent
        ? hostelFeeStructure
        : feeStructure;
      const selectedFee = feeData.find(
        (fee) => fee.class === formData.className
      );
      if (selectedFee) {
        const expectedFee = formData.isHostelStudent
          ? selectedFee.tuition + selectedFee.library + selectedFee.hostel
          : selectedFee.tuition + selectedFee.library + selectedFee.transport;
        if (parseFloat(formData.feeDetails.totalFee) < expectedFee) {
          newErrors.totalFee = `${formData.isHostelStudent ? "Hostel" : "Day Scholar"
            } Fee cannot be less than ₹${expectedFee}`;
        }
      }
    }
    if (formData.feeDetails.paymentOption === "Installments") {
      termDetails.forEach((term, index) => {
        if (!term.termName)
          newErrors[`termName${index}`] = "Term Name is required";
        if (term.amount <= 0)
          newErrors[`termAmount${index}`] = "Amount must be greater than 0";
        if (term.status !== "Paid" && !term.dueDate) {
          newErrors[`termDueDate${index}`] =
            "Due Date is required for pending terms";
        }
        const totalTermAmount = termDetails.reduce(
          (sum, t) => sum + t.amount,
          0
        );
        if (totalTermAmount > parseFloat(formData.feeDetails.totalFee)) {
          newErrors[`termAmount${index}`] = `${formData.isHostelStudent ? "Hostel" : "Day Scholar"
            } Term amounts exceed total fee`;
        }
      });
    }
    if (!formData.isHostelStudent && !selectedRoute) {
      newErrors.busRoute = "Bus Route is required for day scholars";
    }
    if (
      formData.healthRecord.height &&
      parseFloat(formData.healthRecord.height) < 0
    ) {
      newErrors.height = "Height cannot be negative";
    }
    if (
      formData.healthRecord.weight &&
      parseFloat(formData.healthRecord.weight) < 0
    ) {
      newErrors.weight = "Weight cannot be negative";
    }
    if (formData.healthRecord.lastCheckupDate) {
      const checkupDate = new Date(formData.healthRecord.lastCheckupDate);
      const today = new Date();
      if (checkupDate > today) {
        newErrors.lastCheckupDate = "Last checkup date cannot be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please correct the form errors.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("admissionNo", formData.admissionNo);
    formDataToSend.append("rollNumber", formData.rollNumber);
    formDataToSend.append("name", formData.name);
    formDataToSend.append("password", formData.password);
    formDataToSend.append("dateOfBirth", formData.dateOfBirth);
    formDataToSend.append("gender", formData.gender);
    formDataToSend.append("className", formData.className);
    formDataToSend.append("section", formData.section);
    formDataToSend.append("phone", formData.phone);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("address", JSON.stringify(formData.address));
    formDataToSend.append(
      "emergencyContact",
      JSON.stringify(formData.emergencyContact)
    );
    formDataToSend.append(
      "feeDetails",
      JSON.stringify({ ...formData.feeDetails, terms: termDetails })
    );
    formDataToSend.append("busRoute", JSON.stringify(formData.busRoute));
    formDataToSend.append("parents", JSON.stringify(formData.parents));
    formDataToSend.append("isHostelStudent", formData.isHostelStudent);
    if (
      formData.profilePicture &&
      typeof formData.profilePicture !== "string"
    ) {
      formDataToSend.append("profilePicture", formData.profilePicture);
    }
    if (
      formData.healthRecord &&
      Object.values(formData.healthRecord).some((v) => v)
    ) {
      formDataToSend.append(
        "healthRecord",
        JSON.stringify(formData.healthRecord)
      );
    }

    try {
      let response;
      if (isEditing) {
        response = await axios.put(
          `${BASE_URL}/api/students/${editId}`,
          formDataToSend,
          getAuthConfig()
        );
        toast.success("Student updated successfully!");
      } else {
        const duplicate = existingStudents.find(
          (student) => student.admissionNo === formData.admissionNo
        );
        if (duplicate) {
          toast.error("Student with the same admission number already exists.");
          return;
        }
        response = await axios.post(
          `${BASE_URL}/api/students`,
          formDataToSend,
          getAuthConfig()
        );
        toast.success("Student added successfully!");
      }
      setShowForm(false);
      fetchStudents();
      resetForm();
    } catch (error) {
      toast.error(
        `Error: ${error.response?.data?.message || "Failed to add/update student"
        }`
      );
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  };

  const handleEdit = async (student) => {
    if (!student) return;

    try {
      const formattedDOB = student.dateOfBirth
        ? new Date(student.dateOfBirth).toISOString().split("T")[0]
        : "";
      const mergedAddress = {
        ...{ street: "", city: "", state: "", zipCode: "", country: "" },
        ...(student.address || {}),
      };
      const mergedBusRoute = {
        ...{
          routeNumber: "",
          pickupLocation: "",
          dropLocation: "",
          driverName: "",
          driverContact: "",
        },
        ...(student.busRoute || {}),
      };
      const mergedFeeDetails = {
        ...{
          totalFee: "",
          paymentOption: "Full Payment",
          terms: [],
          paymentHistory: [],
        },
        ...(student.feeDetails || {}),
      };
      const formattedTerms = (mergedFeeDetails.terms || []).map((term) => ({
        termName: term.termName || "Term",
        amount: term.amount || 0,
        dueDate: term.dueDate
          ? new Date(term.dueDate).toISOString().split("T")[0]
          : "",
        paidAmount: term.paidAmount || 0,
        status: term.status || "Pending",
      }));

      // Fetch health record data
      let healthRecordData = {
        height: "",
        weight: "",
        bloodGroup: "",
        allergies: "",
        medicalConditions: "",
        medications: "",
        lastCheckupDate: "",
      };
      try {
        const healthResponse = await axios.get(
          `${BASE_URL}/api/health-records/student/${student.admissionNo}`,
          getAuthConfig()
        );

        const apiHealthData = healthResponse.data || {};

        // Flatten the health record data based on the new structure
        healthRecordData = {
          height: apiHealthData.height?.value || "",
          weight: apiHealthData.weight?.value || "",
          bloodGroup: apiHealthData.bloodGroup || "",
          allergies: Array.isArray(apiHealthData.allergies)
            ? apiHealthData.allergies.join(", ")
            : apiHealthData.allergies || "",
          medicalConditions: Array.isArray(apiHealthData.chronicConditions)
            ? apiHealthData.chronicConditions.map((cond) => cond.name || cond.condition || "").join(", ")
            : apiHealthData.chronicConditions || "",
          medications: Array.isArray(apiHealthData.medications)
            ? apiHealthData.medications.map((med) => med.name).join(", ")
            : apiHealthData.medications || "",
          lastCheckupDate: apiHealthData.lastCheckup?.date
            ? new Date(apiHealthData.lastCheckup.date).toISOString().split("T")[0]
            : "",
        };
        console.log("Transformed Health Record Data:", healthRecordData);
      } catch (err) {
        if (err.response?.status !== 404) {
          toast.error(
            "Error fetching health record: " +
            (err.response?.data?.message || err.message)
          );
        }
      }

      const editedData = {
        ...student,
        dateOfBirth: formattedDOB,
        address: mergedAddress,
        busRoute: mergedBusRoute,
        feeDetails: { ...mergedFeeDetails, terms: formattedTerms },
        isHostelStudent: student.isHostelStudent || false,
        profilePicture: student.profilePicture || null,
        healthRecord: healthRecordData,
      };

      setFormData(editedData);
      setSelectedRoute(mergedBusRoute.routeNumber || "");
      setIsEditing(true);
      setShowForm(true);
      setTermDetails(formattedTerms);
      setTermCount(formattedTerms.length);
      setEditId(student._id);

      const totalFee = parseFloat(editedData.feeDetails.totalFee) || 0;
      const totalPaid = formattedTerms.reduce(
        (sum, term) => sum + (term.status === "Paid" ? term.amount : 0),
        0
      );
      if (editedData.isHostelStudent) {
        setRemainingHostelFee(totalFee - totalPaid);
        setRemainingDayScholarFee(0);
      } else {
        setRemainingDayScholarFee(totalFee - totalPaid);
        setRemainingHostelFee(0);
      }
    } catch (error) {
      toast.error(
        "Error loading student data: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;
    try {
      await axios.delete(`${BASE_URL}/api/students/${id}`, getAuthConfig());
      toast.success("Student deleted successfully!");
      fetchStudents();
    } catch (error) {
      toast.error(
        "Error deleting student: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  const resetForm = () => {
    setFormData({
      admissionNo: "",
      rollNumber: "",
      name: "",
      password: "",
      dateOfBirth: "",
      gender: "Male",
      className: "",
      section: "",
      phone: "",
      email: "",
      address: { street: "", city: "", state: "", zipCode: "", country: "" },
      emergencyContact: { name: "", relation: "", phone: "" },
      feeDetails: {
        totalFee: "",
        paymentOption: "Full Payment",
        terms: [],
        paymentHistory: [],
      },
      busRoute: {
        routeNumber: "",
        pickupLocation: "",
        dropLocation: "",
        driverName: "",
        driverContact: "",
      },
      parents: [],
      profilePicture: null,
      isHostelStudent: false,
      healthRecord: {
        height: "",
        weight: "",
        bloodGroup: "",
        allergies: "",
        medicalConditions: "",
        medications: "",
        lastCheckupDate: "",
      },
    });
    setTermDetails([
      {
        termName: "Term 1",
        amount: 0,
        dueDate: "",
        paidAmount: 0,
        status: "Pending",
      },
    ]);
    setTermCount(1);
    setIsEditing(false);
    setEditId(null);
    setSelectedRoute("");
    setDriverInfo({
      driverName: "",
      phoneNumber: "",
      fromLocation: "",
      toLocation: "",
    });
    setErrors({});
    setRemainingDayScholarFee(0);
    setRemainingHostelFee(0);
  };

  // Separate hostel and day scholar students
  const hostelStudents = existingStudents.filter(
    (student) =>
      student.isHostelStudent &&
      (selectedClassFilter ? student.className === selectedClassFilter : true) &&
      (searchTerm ? student.admissionNo.includes(searchTerm) : true)
  );

  const dayScholarStudents = existingStudents.filter(
    (student) =>
      !student.isHostelStudent &&
      (selectedClassFilter ? student.className === selectedClassFilter : true) &&
      (searchTerm ? student.admissionNo.includes(searchTerm) : true)
  );

  const renderTable = (students, currentPage, setCurrentPage, title) => (
    <>
      <h2 className="mb-4 fw-bold text-primary">{title}</h2>
      <div className="custom-table-wrapper shadow-lg rounded-lg overflow-hidden">
        <div className="table-responsive">
          <table className="custom-table w-100">
            <thead className="custom-table-header">
              <tr>
                <th className="ps-4 py-3">Admission No</th>
                <th className="py-3">Roll No</th>
                <th className="py-3">Name</th>
                <th className="py-3">Class</th>
                <th className="py-3">Section</th>
                <th className="py-3">Phone</th>
                <th className="py-3">Email</th>
                {/* <th className="py-3">Type</th> */}
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students
                .slice(
                  (currentPage - 1) * studentsPerPage,
                  currentPage * studentsPerPage
                )
                .map((student) => (
                  <tr key={student._id} className="custom-table-row">
                    <td className="ps-4 py-3">{student.admissionNo}</td>
                    <td className="py-3">{student.rollNumber}</td>
                    <td className="py-3">{student.name}</td>
                    <td className="py-3">{student.className}</td>
                    <td className="py-3">{student.section}</td>
                    <td className="py-3">{student.phone}</td>
                    <td className="py-3">{student.email}</td>
                    {/* <td className="py-3">
                      {student.isHostelStudent ? "Hostel" : "Day Scholar"}
                    </td> */}
                    <td className="py-3 text-center">
                      <div className="custom-btn-group">
                        <button
                          className="custom-btn custom-btn-edit"
                          onClick={() => handleEdit(student)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="custom-btn custom-btn-delete"
                          onClick={() => handleDelete(student._id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                        <button
                          className="custom-btn custom-btn-view"
                          onClick={() => navigate(`/details/${student._id}`)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {students.length > studentsPerPage && (
          <nav className="custom-pagination d-flex justify-content-between align-items-center mt-4 px-4">
            <div className="text-muted">
              Showing {(currentPage - 1) * studentsPerPage + 1} to{" "}
              {Math.min(currentPage * studentsPerPage, students.length)} of{" "}
              {students.length} students
            </div>
            <ul className="pagination mb-0">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="custom-page-link"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  Previous
                </button>
              </li>
              {Array.from(
                { length: Math.ceil(students.length / studentsPerPage) },
                (_, i) => (
                  <li
                    key={i + 1}
                    className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                  >
                    <button
                      className="custom-page-link"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                )
              )}
              <li
                className={`page-item ${currentPage === Math.ceil(students.length / studentsPerPage)
                    ? "disabled"
                    : ""
                  }`}
              >
                <button
                  className="custom-page-link"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(
                        prev + 1,
                        Math.ceil(students.length / studentsPerPage)
                      )
                    )
                  }
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </>
  );

  return (
    <div className="container py-4 animate__animated animate__fadeIn">
      {!showForm ? (
        <>
          <button
            className="btn btn-primary mb-4 animate__animated animate__pulse"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            Add New Student
          </button>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label text-dark">Filter by Class</label>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="form-select"
              >
                <option value="">All Classes</option>
                {Object.keys(classAgeLimits).map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label text-dark">
                Search by Admission Number
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                placeholder="Enter Admission Number"
              />
            </div>
          </div>

          {/* Hostel Students Table */}
          {renderTable(
            hostelStudents,
            currentPageHostel,
            setCurrentPageHostel,
            "Hostel Students List"
          )}

          {/* Day Scholar Students Table */}
          <div className="mt-5">
            {renderTable(
              dayScholarStudents,
              currentPageDayScholar,
              setCurrentPageDayScholar,
              "Day Scholar Students List"
            )}
          </div>
        </>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="animate__animated animate__fadeInUp"
        >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">
              {isEditing ? "Edit Student" : "Add New Student"}
            </h2>
            <button
              className="btn btn-secondary"
              onClick={() => setShowForm(false)}
            >
              Back to List
            </button>
          </div>

          <div className="card mb-4 shadow-lg">
            <div className="card-header bg-primary text-white">
              <h3 className="h5 mb-0">Key Identifiers</h3>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Admission Number</label>
                  <input
                    type="text"
                    name="admissionNo"
                    value={formData.admissionNo}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                  {errors.admissionNo && (
                    <div className="text-danger mt-1">{errors.admissionNo}</div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Roll Number</label>
                  <input
                    type="text"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                  {errors.rollNumber && (
                    <div className="text-danger mt-1">{errors.rollNumber}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4 shadow-lg">
            <div className="card-header bg-primary text-white">
              <h3 className="h5 mb-0">Basic Information</h3>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-12 text-center">
                  <label className="form-label fw-bold">Profile Picture</label>
                  <div className="d-flex flex-column align-items-center">
                    {formData.profilePicture && (
                      <img
                        src={
                          typeof formData.profilePicture === "string"
                            ? `${BASE_URL}/uploads/${formData.profilePicture}`
                            : URL.createObjectURL(formData.profilePicture)
                        }
                        alt="Profile Preview"
                        className="rounded-circle mb-2"
                        style={{
                          width: "120px",
                          height: "120px",
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <input
                      type="file"
                      name="profilePicture"
                      accept="image/jpeg,image/jpg,image/png"
                      className="form-control"
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                  {errors.name && (
                    <div className="text-danger mt-1">{errors.name}</div>
                  )}
                </div>
                <div className="col-md-6 position-relative">
                  <label className="form-label fw-bold">Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "👁️" : "🔒"}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="text-danger mt-1">{errors.password}</div>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                  {errors.dateOfBirth && (
                    <div className="text-danger mt-1">{errors.dateOfBirth}</div>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Class</label>
                  <select
                    name="className"
                    value={formData.className}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select Class</option>
                    {feeStructure.map((fee) => (
                      <option key={fee._id} value={fee.class}>
                        {fee.class}
                      </option>
                    ))}
                  </select>
                  {errors.className && (
                    <div className="text-danger mt-1">{errors.className}</div>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Section</label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select Section</option>
                    {sectionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.section && (
                    <div className="text-danger mt-1">{errors.section}</div>
                  )}
                </div>
                <div className="col-md-4">
                  <div className="form-check mt-4">
                    <input
                      type="checkbox"
                      name="isHostelStudent"
                      checked={formData.isHostelStudent}
                      onChange={handleChange}
                      className="form-check-input"
                      id="isHostelStudent"
                    />
                    <label
                      className="form-check-label fw-bold"
                      htmlFor="isHostelStudent"
                    >
                      Hostel Student
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4 shadow-lg">
            <div className="card-header bg-primary text-white">
              <h3 className="h5 mb-0">Contact Information</h3>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                  {errors.phone && (
                    <div className="text-danger mt-1">{errors.phone}</div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                  {errors.email && (
                    <div className="text-danger mt-1">{errors.email}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4 shadow-lg">
            <div className="card-header bg-primary text-white">
              <h3 className="h5 mb-0">Address</h3>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-bold">Street</label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                  {errors.street && (
                    <div className="text-danger mt-1">{errors.street}</div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                  {errors.city && (
                    <div className="text-danger mt-1">{errors.city}</div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">State/Province</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                  {errors.state && (
                    <div className="text-danger mt-1">{errors.state}</div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">ZIP/Postal Code</label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                  {errors.zipCode && (
                    <div className="text-danger mt-1">{errors.zipCode}</div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Country</label>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                  {errors.country && (
                    <div className="text-danger mt-1">{errors.country}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4 shadow-lg">
            <div className="card-header bg-primary text-white">
              <h3 className="h5 mb-0">Emergency Contact</h3>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                  {errors.emergencyContactName && (
                    <div className="text-danger mt-1">
                      {errors.emergencyContactName}
                    </div>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Relation</label>
                  <input
                    type="text"
                    name="emergencyContact.relation"
                    value={formData.emergencyContact.relation}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                  {errors.emergencyContactRelation && (
                    <div className="text-danger mt-1">
                      {errors.emergencyContactRelation}
                    </div>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Phone Number</label>
                  <input
                    type="tel"
                    name="emergencyContact.phone"
                    value={formData.emergencyContact.phone}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                  {errors.emergencyContactPhone && (
                    <div className="text-danger mt-1">
                      {errors.emergencyContactPhone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-4 shadow-lg border-primary">
            <div className="card-header bg-primary text-white">
              <h3 className="h5 mb-0">🔹 Fee Management</h3>
            </div>
            <div className="card-body">
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    {formData.isHostelStudent ? "Hostel" : "Day Scholar"} Total
                    Fee Amount
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input
                      type="number"
                      name="feeDetails.totalFee"
                      value={formData.feeDetails.totalFee}
                      onChange={handleChange}
                      className={`form-control ${
                        errors.totalFee ? "is-invalid" : ""
                      }`}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {errors.totalFee && (
                    <div className="text-danger mt-1">{errors.totalFee}</div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Payment Option</label>
                  <select
                    name="feeDetails.paymentOption"
                    value={formData.feeDetails.paymentOption}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="Full Payment">Full Payment</option>
                    <option value="Installments">Installments</option>
                  </select>
                </div>
              </div>
              {formData.feeDetails.paymentOption === "Installments" && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="h6 fw-bold">
                      {formData.isHostelStudent ? "Hostel" : "Day Scholar"} Fee
                      Term Breakdown
                    </h4>
                    <div className="d-flex align-items-center">
                      <label className="me-2">Number of Terms:</label>
                      <select
                        value={termCount}
                        onChange={(e) => setTermCount(parseInt(e.target.value))}
                        className="form-select form-select-sm"
                        style={{ width: "80px" }}
                      >
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="bg-light p-3 rounded">
                    {termDetails.map((term, index) => {
                      const today = new Date().toISOString().split("T")[0];
                      let minDate =
                        index === 0
                          ? today
                          : termDetails[index - 1].dueDate
                          ? new Date(termDetails[index - 1].dueDate)
                              .toISOString()
                              .split("T")[0] < today
                            ? today
                            : new Date(
                                new Date(
                                  termDetails[index - 1].dueDate
                                ).getTime() + 86400000
                              )
                                .toISOString()
                                .split("T")[0]
                          : today;
                      const isPreviousPaid =
                        index === 0 || termDetails[index - 1].status === "Paid";
                      const isPaid = term.status === "Paid";

                      return (
                        <div
                          key={index}
                          className="row g-3 mb-3 pb-3 border-bottom"
                        >
                          <div className="col-md-3">
                            <label className="form-label text-dark">
                              Term Name
                            </label>
                            <input
                              type="text"
                              value={term.termName}
                              onChange={(e) =>
                                handleTermChange(
                                  index,
                                  "termName",
                                  e.target.value
                                )
                              }
                              className="form-control"
                              required
                            />
                            {errors[`termName${index}`] && (
                              <div className="text-danger mt-1">
                                {errors[`termName${index}`]}
                              </div>
                            )}
                          </div>
                          <div className="col-md-3">
                            <label className="form-label text-dark">
                              Amount (₹)
                            </label>
                            <input
                              type="number"
                              value={term.amount}
                              onChange={(e) =>
                                handleTermChange(
                                  index,
                                  "amount",
                                  e.target.value
                                )
                              }
                              className="form-control"
                              required
                              min="0"
                              step="0.01"
                            />
                            {errors[`termAmount${index}`] && (
                              <div className="text-danger mt-1">
                                {errors[`termAmount${index}`]}
                              </div>
                            )}
                          </div>
                          <div className="col-md-3">
                            <label className="form-label text-dark">
                              Due Date {isPaid ? "(Not Required)" : ""}
                            </label>
                            <input
                              type="date"
                              value={term.dueDate}
                              onChange={(e) =>
                                handleTermChange(
                                  index,
                                  "dueDate",
                                  e.target.value
                                )
                              }
                              className="form-control"
                              min={minDate}
                              disabled={isPaid}
                              required={!isPaid}
                            />
                            {errors[`termDueDate${index}`] && (
                              <div className="text-danger mt-1">
                                {errors[`termDueDate${index}`]}
                              </div>
                            )}
                          </div>
                          <div className="col-md-3">
                            <label className="form-label text-dark">
                              Status
                            </label>
                            <select
                              value={term.status}
                              onChange={(e) =>
                                handleTermChange(
                                  index,
                                  "status",
                                  e.target.value
                                )
                              }
                              className="form-select"
                              required
                            >
                              <option value="Pending">Pending</option>
                              {isPreviousPaid && (
                                <option value="Paid">Paid</option>
                              )}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-3">
                      <p className="fw-bold">
                        Remaining{" "}
                        {formData.isHostelStudent ? "Hostel" : "Day Scholar"}{" "}
                        Fee: ₹
                        {formData.isHostelStudent
                          ? remainingHostelFee
                          : remainingDayScholarFee}
                      </p>
                      {errors.remainingFee && (
                        <div className="text-danger mt-1">
                          {errors.remainingFee}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!formData.isHostelStudent && (
            <div className="card mb-4 shadow-lg">
              <div className="card-header bg-primary text-white">
                <h3 className="h5 mb-0">Bus Route (Day Scholars Only)</h3>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      Select Bus Route
                    </label>
                    <select
                      value={selectedRoute}
                      onChange={(e) => {
                        setSelectedRoute(e.target.value);
                        if (!e.target.value) {
                          setErrors((prev) => ({
                            ...prev,
                            busRoute: "Bus Route is required for day scholars",
                          }));
                        } else {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.busRoute;
                            return newErrors;
                          });
                        }
                      }}
                      className="form-select"
                      required
                    >
                      <option value="">Select Route</option>
                      {busRoutes.map((bus) => (
                        <option key={bus.busNumber} value={bus.busNumber}>
                          {bus.busNumber}
                        </option>
                      ))}
                    </select>
                    {errors.busRoute && (
                      <div className="text-danger mt-1">{errors.busRoute}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Driver Name</label>
                    <input
                      type="text"
                      value={driverInfo.driverName}
                      className="form-control"
                      readOnly
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Phone Number</label>
                    <input
                      type="text"
                      value={driverInfo.phoneNumber}
                      className="form-control"
                      readOnly
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">From Location</label>
                    <input
                      type="text"
                      value={driverInfo.fromLocation}
                      className="form-control"
                      readOnly
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">To Location</label>
                    <input
                      type="text"
                      value={driverInfo.toLocation}
                      className="form-control"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {formData.isHostelStudent && (
            <div className="card mb-4 shadow-lg opacity-50">
              <div className="card-header bg-secondary text-white">
                <h3 className="h5 mb-0">
                  Bus Route (Not Applicable for Hostel Students)
                </h3>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  Bus route details are not required for hostel students.
                </p>
              </div>
            </div>
          )}

          <div className="card mb-4 shadow-lg border-success">
            <div className="card-header bg-success text-white">
              <h3 className="h5 mb-0">Health Record</h3>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.healthRecord.height}
                    onChange={handleHealthChange}
                    className="form-control"
                    min="0"
                    step="0.1"
                  />
                  {errors.height && (
                    <div className="text-danger mt-1">{errors.height}</div>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.healthRecord.weight}
                    onChange={handleHealthChange}
                    className="form-control"
                    min="0"
                    step="0.1"
                  />
                  {errors.weight && (
                    <div className="text-danger mt-1">{errors.weight}</div>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={formData.healthRecord.bloodGroup}
                    onChange={handleHealthChange}
                    className="form-select"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Allergies</label>
                  <textarea
                    name="allergies"
                    value={formData.healthRecord.allergies}
                    onChange={handleHealthChange}
                    className="form-control"
                    rows="2"
                    placeholder="Enter any allergies (e.g., pollen, peanuts)"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Medical Conditions
                  </label>
                  <textarea
                    name="medicalConditions"
                    value={formData.healthRecord.medicalConditions}
                    onChange={handleHealthChange}
                    className="form-control"
                    rows="2"
                    placeholder="Enter any medical conditions (e.g., asthma)"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Medications</label>
                  <textarea
                    name="medications"
                    value={formData.healthRecord.medications}
                    onChange={handleHealthChange}
                    className="form-control"
                    rows="2"
                    placeholder="Enter current medications"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Last Checkup Date
                  </label>
                  <input
                    type="date"
                    name="lastCheckupDate"
                    value={formData.healthRecord.lastCheckupDate}
                    onChange={handleHealthChange}
                    className="form-control"
                  />
                  {errors.lastCheckupDate && (
                    <div className="text-danger mt-1">
                      {errors.lastCheckupDate}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end">
            <button
              type="submit"
              className="btn btn-primary btn-lg animate__animated animate__pulse"
            >
              {isEditing ? "Update Student" : "Add Student"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddStudent;