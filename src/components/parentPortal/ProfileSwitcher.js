"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import PropTypes from "prop-types"
import { Box, Avatar, Typography, MenuItem, Select, FormControl, styled } from "@mui/material"
import { motion } from "framer-motion"

const AnimatedSelect = styled(Select)(({ theme }) => ({
  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
  "&:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
  background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  borderRadius: "25px",
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
    transform: "translateY(-2px)",
  },
}))

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;
const ProfileSwitcher = ({ parentId, onChildSelect, selectedChildId }) => {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem("token")

  // Get current studentId from localStorage
  const studentId = localStorage.getItem("selectedChild") || ""

  useEffect(() => {
    const fetchChildren = async () => {
      if (!parentId || !token) return

      try {
        setLoading(true)
        const response = await axios.get(
          `${BASE_URL}/api/parents/${parentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Assuming the response contains a single parent object with children array
        const parentData = response.data
        const childList = Array.isArray(parentData.children) ? parentData.children : []
        setChildren(childList)

        if (childList.length === 0) {
          console.warn("No children found for parent:", parentId)
          localStorage.setItem("selectedChild", "")
          onChildSelect(null)
        } else {
          const storedChildId = localStorage.getItem("selectedChild")
          const validStoredChild = storedChildId && childList.some((c) => c._id === storedChildId)
          const defaultChildId = validStoredChild ? storedChildId : childList[0]._id

          if (!studentId || !validStoredChild) {
            localStorage.setItem("selectedChild", defaultChildId)
            onChildSelect(defaultChildId)
          } else {
            // Ensure the selected child is properly set
            onChildSelect(studentId)
          }
        }
      } catch (err) {
        console.error("Error fetching children:", err.response?.data || err.message)
      } finally {
        setLoading(false)
      }
    }

    if (parentId) fetchChildren()
  }, [parentId, onChildSelect, studentId])

  const handleChildChange = (event) => {
    const childId = event.target.value
    localStorage.setItem("selectedChild", childId)
    onChildSelect(childId)
  }

  const selectedChild = children.find((c) => c._id === studentId)

  return (
    <FormControl sx={{ minWidth: 220 }}>
      <AnimatedSelect
        value={studentId || ""}
        onChange={handleChildChange}
        renderValue={() =>
          loading ? (
            <Typography>Loading...</Typography>
          ) : children.length === 0 ? (
            <Typography>No children</Typography>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 0.5 }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
                <Avatar
                  src={selectedChild?.profileImage || "/default-avatar.png"}
                  sx={{ width: 32, height: 32, border: "2px solid white" }}
                />
              </motion.div>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {selectedChild?.name || "Select Child"}
              </Typography>
            </Box>
          )
        }
      >
        {children.map((child) => (
          <MenuItem key={child._id} value={child._id} sx={{ py: 1 }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
              }}
            >
              <Avatar src={child.profileImage || "/default-avatar.png"} sx={{ width: 28, height: 28 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {child.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {child.admissionNo} - {child.className} {child.section}
                </Typography>
              </Box>
            </motion.div>
          </MenuItem>
        ))}
      </AnimatedSelect>
    </FormControl>
  )
}

ProfileSwitcher.propTypes = {
  parentId: PropTypes.string.isRequired,
  onChildSelect: PropTypes.func.isRequired,
  selectedChildId: PropTypes.string, // Added to match ParentDashboard props
}

export default ProfileSwitcher

