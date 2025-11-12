import React from "react";
import { Table, Button, Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css";

const StudentTable = ({ students, onEdit, onDelete }) => {
  const renderTooltip = (text) => (
    <Tooltip id="tooltip">{text}</Tooltip>
  );

  return (
    <div className="table-responsive shadow-sm rounded animate__animated animate__fadeIn">
      <Table striped bordered hover className="mb-0">
        <thead className="table-dark">
          <tr>
            <th className="align-middle">Admission No</th>
            <th className="align-middle">Name</th>
            <th className="align-middle">Class</th>
            <th className="align-middle">Parents</th>
            <th className="align-middle text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center py-4 text-muted">
                <i className="bi bi-emoji-frown me-2"></i>
                No students found
              </td>
            </tr>
          ) : (
            students.map((student) => (
              <tr key={student._id} className="align-middle">
                <td>
                  <Badge bg="primary" className="fw-normal">
                    {student.admissionNo}
                  </Badge>
                </td>
                <td>
                  <span className="fw-semibold text-primary">{student.name}</span>
                </td>
                <td>{student.class}</td>
                <td>
                  {student.parents && student.parents.length > 0 ? (
                    <ul className="list-unstyled mb-0">
                      {student.parents.map((parent) => (
                        <li key={parent._id} className="d-flex align-items-center mb-1">
                          <i className="bi bi-person-fill text-muted me-2"></i>
                          <OverlayTrigger
                            placement="top"
                            overlay={renderTooltip(parent.email)}
                          >
                            <span className="text-truncate" style={{ maxWidth: "200px" }}>
                              {parent.name}
                              <small className="text-muted ms-1">({parent.email})</small>
                            </span>
                          </OverlayTrigger>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted fst-italic">
                      <i className="bi bi-info-circle me-1"></i>No parents assigned
                    </span>
                  )}
                </td>
                <td className="text-center">
                  <div className="d-flex justify-content-center gap-2">
                    <OverlayTrigger
                      placement="top"
                      overlay={renderTooltip("Edit student details")}
                    >
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => onEdit(student)}
                        className="px-3 animate__animated animate__pulse animate__infinite"
                        style={{ animationDuration: "2s" }}
                      >
                        <i className="bi bi-pencil-fill"></i>
                      </Button>
                    </OverlayTrigger>
                    <OverlayTrigger
                      placement="top"
                      overlay={renderTooltip("Delete student record")}
                    >
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => onDelete(student._id)}
                        className="px-3"
                      >
                        <i className="bi bi-trash-fill"></i>
                      </Button>
                    </OverlayTrigger>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default StudentTable;