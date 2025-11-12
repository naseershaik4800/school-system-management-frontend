import React, { useState } from "react";
import {
  User,
  GraduationCap,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";


const ParentTable = ({ parents, onEdit, onDelete, onParentSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);

  // Filter and search logic
  const filteredParents = parents.filter((parent) => {
    const matchesSearch =
      parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.phone.includes(searchTerm) ||
      (parent._id &&
        parent._id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "withChildren" &&
        parent.children &&
        parent.children.length > 0) ||
      (filterStatus === "noChildren" &&
        (!parent.children || parent.children.length === 0));

    return matchesSearch && matchesFilter;
  });

  // Pagination
  const indexOfLastParent = currentPage * rowsPerPage;
  const indexOfFirstParent = indexOfLastParent - rowsPerPage;
  const currentParents = filteredParents.slice(
    indexOfFirstParent,
    indexOfLastParent
  );
  const totalPages = Math.ceil(filteredParents.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const filterLabel = {
    all: "All Parents",
    withChildren: "With Children",
    noChildren: "No Children",
  };

  return (
    <div className="container-fluid py-4">
      <style>
        {`
          /* Base table styles */
          .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .table {
            width: 100%;
            margin-bottom: 0;
            table-layout: fixed; /* Ensures columns respect width */
          }

          .table th, .table td {
            vertical-align: middle;
            padding: 12px;
            word-break: break-word; /* Prevents content overflow */
          }

          /* Column widths for desktop */
          .table th:nth-child(1), .table td:nth-child(1) { width: 25%; }
          .table th:nth-child(2), .table td:nth-child(2) { width: 20%; }
          .table th:nth-child(3), .table td:nth-child(3) { width: 20%; }
          .table th:nth-child(4), .table td:nth-child(4) { width: 25%; }
          .table th:nth-child(5), .table td:nth-child(5) { 
            width: 10%; 
            min-width: 80px; /* Ensures space for buttons */
          }

          /* Text truncation with ellipsis */
          .truncate-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }

          /* Action buttons styling */
          .btn-group {
            display: flex;
            gap: 5px;
            justify-content: center;
            width: 100%;
            max-width: 100%; /* Prevents overflow */
            flex-wrap: nowrap; /* Keeps buttons inline on desktop */
          }

          .btn-group .btn {
            padding: 4px 8px;
            font-size: 14px;
            flex: 1; /* Equal width for buttons */
            min-width: 0; /* Allows shrinking */
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .table {
              display: block;
            }

            .table thead {
              display: none; /* Hide header on small screens */
            }

            .table tbody {
              display: block;
            }

            .table tbody tr {
              display: block;
              margin-bottom: 15px;
              border: 1px solid #dee2e6;
              border-radius: 4px;
              background-color: #fff;
            }

            .table tbody td {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 10px;
              border: none;
              border-bottom: 1px solid #dee2e6;
              width: 100% !important; /* Full width for stacking */
            }

            .table tbody td:last-child {
              border-bottom: none;
            }

            /* Add labels before each cell content */
            .table tbody td:before {
              content: attr(data-label);
              font-weight: bold;
              margin-right: 10px;
              color: #495057;
              flex: 0 0 30%;
              min-width: 90px;
            }

            /* Specific column adjustments */
            .table tbody td:nth-child(1) { /* Parent Details */
              flex-direction: column;
              align-items: flex-start;
            }

            .table tbody td:nth-child(4) { /* Children */
              flex-direction: column;
              align-items: flex-start;
            }

            .table tbody td:nth-child(4) .d-flex {
              flex-direction: column;
              gap: 5px;
            }

            /* Actions column on mobile */
            .table tbody td:nth-child(5) { /* Actions */
              justify-content: flex-end;
              padding: 8px 10px;
            }

            .btn-group {
              flex-wrap: wrap; /* Allows stacking if needed */
              gap: 5px;
              justify-content: flex-end;
            }
          }

          @media (max-width: 576px) {
            .table tbody td {
              font-size: 14px;
              padding: 8px;
            }

            .table tbody td:before {
              flex: 0 0 40%;
              font-size: 12px;
            }

            .btn-group {
              flex-direction: row; /* Keep buttons inline */
              gap: 3px;
            }

            .btn-group .btn {
              padding: 3px 6px;
              font-size: 12px;
            }

            .badge {
              font-size: 12px;
              padding: 4px 8px;
            }

            .truncate-text {
              font-size: 12px;
            }
          }

          /* Pagination responsiveness */
          .pagination {
            margin-top: 15px;
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            justify-content: center;
          }

          .pagination .page-link {
            padding: 6px 12px;
            font-size: 14px;
          }

          @media (max-width: 576px) {
            .pagination .page-link {
              padding: 4px 8px;
              font-size: 12px;
            }

            .showing-text {
              font-size: 12px;
              text-align: center;
              margin-bottom: 10px;
            }
          }

          /* Card and hover styles */
          .card {
            border-radius: 8px;
            overflow: hidden;
          }

          .hover-bg-light:hover {
            background-color: #f8f9fa;
          }
        `}
      </style>

      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 ps-4">Parent Details</th>
                      <th className="border-0">Contact Information</th>
                      <th className="border-0">Address</th>
                      <th className="border-0">Children</th>
                      <th className="border-0 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentParents.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-5">
                          <div className="d-flex flex-column align-items-center my-4 text-muted">
                            <AlertCircle
                              size={40}
                              className="mb-3 opacity-50"
                            />
                            <p className="fs-5 fw-medium mb-1">
                              No parents found
                            </p>
                            <p className="small">
                              {searchTerm
                                ? `No results match "${searchTerm}"`
                                : filterStatus !== "all"
                                ? `No parents with the filter "${filterLabel[filterStatus]}"`
                                : "There are no parents in the system yet"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentParents.map((parent) => (
                        <tr
                          key={parent._id}
                          style={{ cursor: "pointer" }}
                          className="hover-bg-light"
                        >
                          <td
                            className="ps-4"
                            onClick={() => onParentSelect(parent)}
                            data-label="Parent Details"
                          >
                            <div className="d-flex align-items-center">
                              <div className="flex-shrink-0">
                                <img
                                  className="rounded-circle border shadow-sm"
                                  style={{
                                    width: "48px",
                                    height: "48px",
                                    objectFit: "cover",
                                  }}
                                  src={
                                    parent.profileImage
                                      ? `http://localhost:5000${parent.profileImage}`
                                      : "/api/placeholder/48/48"
                                  }
                                  alt=""
                                />
                              </div>
                              <div className="ms-3">
                                <div className="fw-semibold truncate-text">
                                  {parent.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td
                            onClick={() => onParentSelect(parent)}
                            data-label="Contact Information"
                          >
                            <div className="truncate-text">{parent.email}</div>
                            <div className="small text-muted truncate-text">
                              {parent.phone}
                            </div>
                          </td>
                          <td
                            onClick={() => onParentSelect(parent)}
                            data-label="Address"
                          >
                            <div className="truncate-text" title={parent.address}>
                              {parent.address || "No address provided"}
                            </div>
                          </td>
                          <td
                            onClick={() => onParentSelect(parent)}
                            data-label="Children"
                          >
                            {parent.children && parent.children.length > 0 ? (
                              <div className="d-flex flex-wrap gap-2">
                                {parent.children.map((child) => (
                                  <div
                                    key={child._id}
                                    className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill d-flex align-items-center py-2 px-3 truncate-text"
                                    title={`${child.name} (${child.class || child.className || "N/A"})`}
                                  >
                                    <GraduationCap size={14} className="me-1" />
                                    <span className="truncate-text">
                                      {child.name}
                                      <small className="ms-1 opacity-75">
                                        (
                                        {child.class ||
                                          child.className ||
                                          "N/A"}
                                        )
                                      </small>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="badge bg-light text-secondary border">
                                No children
                              </span>
                            )}
                          </td>
                          <td
                            className="text-center"
                            data-label="Actions"
                          >
                            <div className="btn-group" role="group">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(parent);
                                }}
                                className="btn btn-sm btn-outline-primary"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="Edit Parent"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(parent._id);
                                }}
                                className="btn btn-sm btn-outline-danger"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="Delete Parent"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredParents.length > 0 && (
                <div className="d-flex justify-content-between align-items-center border-top p-3 bg-light">
                  <div className="showing-text">
                    <p className="mb-0 small text-muted">
                      Showing{" "}
                      <span className="fw-semibold">
                        {indexOfFirstParent + 1}
                      </span>{" "}
                      to{" "}
                      <span className="fw-semibold">
                        {Math.min(indexOfLastParent, filteredParents.length)}
                      </span>{" "}
                      of{" "}
                      <span className="fw-semibold">
                        {filteredParents.length}
                      </span>{" "}
                      results
                    </p>
                  </div>
                  <nav aria-label="Page navigation">
                    <ul className="pagination mb-0">
                      <li
                        className={`page-item ${
                          currentPage === 1 ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => paginate(currentPage - 1)}
                        >
                          <span aria-hidden="true">«</span>
                        </button>
                      </li>
                      {[...Array(totalPages)].map((_, index) => (
                        <li
                          key={index}
                          className={`page-item ${
                            currentPage === index + 1 ? "active" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => paginate(index + 1)}
                          >
                            {index + 1}
                          </button>
                        </li>
                      ))}
                      <li
                        className={`page-item ${
                          currentPage === totalPages ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => paginate(currentPage + 1)}
                        >
                          <span aria-hidden="true">»</span>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentTable;