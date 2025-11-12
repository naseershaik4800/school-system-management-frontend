
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  KeyRound
} from "lucide-react";



const ParentDetails = ({ parent, onBack, role = "parent" }) => {
  const navigate = useNavigate();

  if (!parent) return null;
  

  const handleChildClick = (childId) => {
    navigate(`/details/${childId}`); // Consistent route for both portals
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light border-0 px-4 py-3">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                 
                  <h4 className="mb-0 fw-semibold">Parent Details</h4>
                </div>
                {role === "admin" && (
                  <button className="btn btn-primary">Edit Parent</button>
                )}
              </div>
            </div>
            <div className="card-body p-4">
              <div className="row">
                <div className="col-md-4">
                  <div className="text-center">
                    <img
                      className="rounded-circle border shadow-sm mb-3"
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                      }}
                      src={
                        parent.profileImage
                          ? `http://localhost:5000${parent.profileImage}`
                          : "/default-profile.jpg"
                      }
                      alt={parent.name}
                      onError={(e) => (e.target.src = "/default-profile.jpg")}
                    />
                    <h5 className="fw-semibold">{parent.name}</h5>
                    <p className="text-muted small">ID: {parent._id}</p>
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="mb-4">
                    <h6 className="fw-semibold mb-3">Contact Information</h6>
                    <div className="d-flex align-items-center mb-2">
                      <Mail size={18} className="me-2 text-muted" />
                      <span>{parent.email}</span>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <KeyRound size={18} className="me-2 text-muted" />
                      <span>{parent.password}</span>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <Phone size={18} className="me-2 text-muted" />
                      <span>{parent.phone || "N/A"}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <MapPin size={18} className="me-2 text-muted" />
                      <span>{parent.address || "No address provided"}</span>
                    </div>
                    {role === "admin" && parent.password && (
                      <div className="d-flex align-items-center mt-2">
                        <User size={18} className="me-2 text-muted" />
                        <span>Password: {parent.password}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-3">Children</h6>
                    {parent.children && parent.children.length > 0 ? (
                      <div className="d-flex flex-column gap-3">
                        {parent.children.map((child) => (
                          <div
                            key={child._id}
                            className={`border rounded p-3 bg-light ${
                              role === "admin" ? "hover-bg-primary-subtle" : ""
                            }`}
                            style={{ cursor: "pointer" }}
                            onClick={() => handleChildClick(child._id)}
                          >
                            <div className="d-flex align-items-center">
                              <GraduationCap
                                size={18}
                                className="me-2 text-primary"
                              />
                              <div>
                                <span className="fw-medium">
                                  {child.name || "Unnamed Child"}
                                </span>
                                <div className="text-muted small">
                                  Class:{" "}
                                  {child.className || child.class || "N/A"}{" "}
                                  {child.section || ""}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No children registered</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDetails;