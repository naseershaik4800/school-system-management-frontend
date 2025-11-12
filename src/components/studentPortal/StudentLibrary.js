import { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Alert,
  Pagination,
  Spinner,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css";
import { toast } from "react-toastify";

// const API_URL = "http://localhost:5000/api";
// const BASE_URL = "http://localhost:5000"; // Base URL for static files


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
      "Content-Type": "application/json",
    },
  };
};

export default function StudentLibrary() {
  const [books, setBooks] = useState([]);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showBorrowConfirmation, setShowBorrowConfirmation] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const booksPerPage = 12;
  const categories = [
    "All",
    "Subject",
    "GK",
    "Politics",
    "Fiction",
    "Non-Fiction",
    "Science",
  ];

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/api/books`, getAuthConfig());
      setBooks(response.data);
      setError(null);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to fetch books. Please check the server."
      );
      toast.error("Error fetching books");
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async (studentDetails) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/borrow`,
        {
          bookId: selectedBook._id,
          Borrowers: studentDetails,
        },
        getAuthConfig()
      );
      await fetchBooks();
      setShowBorrowModal(false);
      setShowBorrowConfirmation(true);
      setSelectedBook(null);
      setError(null);
      toast.success("Book borrowed successfully!");
      return true;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to borrow book. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const paginateBooks = () => {
    const indexOfLastBook = currentPage * booksPerPage;
    const indexOfFirstBook = indexOfLastBook - booksPerPage;
    return filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  };

  const totalBookPages = Math.ceil(filteredBooks.length / booksPerPage);

  const BookCard = ({ book }) => {
    const imageUrl = book.image
      ? book.image.startsWith("http")
        ? book.image
        : `${BASE_URL}${book.image}` // e.g., http://localhost:5000/uploads/filename.jpg
      : "https://via.placeholder.com/150?text=No+Image";

    return (
      <Col xs={6} sm={4} md={3} className="mb-3">
        <Card className="h-100 shadow-sm animate_animated animate_fadeIn">
          <Card.Img
            variant="top"
            src={imageUrl}
            alt={book.name}
            style={{ height: "120px", objectFit: "cover" }}
            onError={(e) => (e.target.src = "https://via.placeholder.com/150?text=No+Image")}
          />
          <Card.Body className="p-2">
            <Card.Title className="mb-1" style={{ fontSize: "1rem" }}>
              {book.name}
            </Card.Title>
            <Card.Text className="small mb-1">by {book.author}</Card.Text>
            <Card.Text className="small mb-1">Cat: {book.category}</Card.Text>
            <div className="d-flex justify-content-between small">
              <span>Total: {book.total}</span>
              <span className={book.available > 0 ? "text-success" : "text-danger"}>
                Avail: {book.available}
              </span>
            </div>
          </Card.Body>
          <Card.Footer className="bg-transparent p-2">
            {book.available > 0 ? (
              <Button
                variant="success"
                size="sm"
                className="w-100"
                onClick={() => {
                  setSelectedBook(book);
                  setShowBorrowModal(true);
                  setError(null);
                }}
              >
                Borrow
              </Button>
            ) : (
              <Button variant="secondary" size="sm" className="w-100" disabled>
                Not Available
              </Button>
            )}
          </Card.Footer>
        </Card>
      </Col>
    );
  };

const BorrowBookModal = ({ show, handleClose }) => {
  const user = JSON.parse(localStorage.getItem("user")); // Get user from localStorage
  const [studentDetails, setStudentDetails] = useState({
    name: user?.name || "", // Pre-fill name from localStorage
    class: "", // Will be updated via API
    section: "", // Will be updated via API
    borrowDate: new Date().toISOString().split("T")[0],
    returnDate: "",
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch student profile data when modal opens
  useEffect(() => {
    if (show) {
      const fetchStudentProfile = async () => {
        try {
          const response = await axios.get(
            `${BASE_URL}/api/student/profile?roleId=${user?.roleId || ""}`,
            getAuthConfig()
          );
          console.log("API Response:", response.data); // Debug
          const { class: studentClass, section } = response.data;
          setStudentDetails((prev) => ({
            ...prev,
            class: studentClass || "",
            section: section || "",
          }));
        } catch (error) {
          console.error("Error:", error.response?.data || error.message);
          setModalError(
            "Failed to fetch student profile. Please check your profile data."
          );
          toast.error("Error fetching profile data");
        }
      };
      fetchStudentProfile();
    }
  }, [show, user?.roleId]);

  const handleChange = (e) => {
    setStudentDetails({ ...studentDetails, [e.target.name]: e.target.value });
    setModalError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);

    if (!agreeToTerms) {
      setModalError(
        "You must agree to return the book within 5 days to avoid fines."
      );
      setModalLoading(false);
      return;
    }
    if (/\d/.test(studentDetails.name)) {
      setModalError("Name should not contain numbers.");
      setModalLoading(false);
      return;
    }
    if (!studentDetails.class) {
      setModalError("Class is required.");
      setModalLoading(false);
      return;
    }
    if (!studentDetails.section) {
      setModalError("Please select a section.");
      setModalLoading(false);
      return;
    }

    const borrowDate = new Date(studentDetails.borrowDate);
    const today = new Date();
    if (borrowDate < today.setHours(0, 0, 0, 0)) {
      setModalError("Borrow date cannot be in the past.");
      setModalLoading(false);
      return;
    }

    const returnDate = new Date(studentDetails.returnDate);
    const maxReturnDate = new Date(borrowDate);
    maxReturnDate.setDate(maxReturnDate.getDate() + 5);

    if (returnDate <= borrowDate) {
      setModalError("Return date must be after the borrow date.");
      setModalLoading(false);
      return;
    }
    if (returnDate > maxReturnDate) {
      setModalError("Return date must be within 5 days from the borrow date.");
      setModalLoading(false);
      return;
    }

    const success = await handleBorrow(studentDetails);
    if (success) {
      setStudentDetails({
        name: user?.name || "",
        class: "",
        section: "",
        borrowDate: new Date().toISOString().split("T")[0],
        returnDate: "",
      });
      setAgreeToTerms(false);
    }
    setModalLoading(false);
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Borrow Book: {selectedBook?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {modalError && <Alert variant="danger">{modalError}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Student Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={studentDetails.name}
              readOnly // Make name read-only since it's from localStorage
              plaintext // Optional: removes input styling
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Class</Form.Label>
            <Form.Control
              type="text"
              name="class"
              value={studentDetails.class || ""}
              readOnly // Make class read-only since it's from the API
              plaintext // Optional: removes input styling
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Section</Form.Label>
            <Form.Select
              name="section"
              value={studentDetails.section || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select Section</option>
              <option value="A">A</option>
              <option value="B">B</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Borrow Date</Form.Label>
            <Form.Control
              type="date"
              name="borrowDate"
              value={studentDetails.borrowDate}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Return Date (within 5 days)</Form.Label>
            <Form.Control
              type="date"
              name="returnDate"
              value={studentDetails.returnDate}
              onChange={handleChange}
              min={studentDetails.borrowDate}
              max={
                new Date(
                  new Date(studentDetails.borrowDate).setDate(
                    new Date(studentDetails.borrowDate).getDate() + 5
                  )
                )
                  .toISOString()
                  .split("T")[0]
              }
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="I agree to return the book within 5 days. ₹10 fine per day late."
              id="agreeToTerms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
            />
          </Form.Group>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={modalLoading}
            >
              Close
            </Button>
            <Button variant="primary" type="submit" disabled={modalLoading}>
              {modalLoading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Borrowing...
                </>
              ) : (
                "Borrow Book"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

  const BorrowConfirmationModal = ({ show, handleClose }) => {
    return (
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Borrow Successful</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Book borrowed successfully!</p>
          <Alert variant="warning">
            Reminder: Return within 5 days to avoid a ₹10/day fine.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleClose}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Container fluid className="my-4" style={{ maxWidth: "1260px" }}>
      <h1 className="mb-4 text-center animate_animated animate_fadeIn">
        Student Library Portal
      </h1>

      <Row className="mb-4 align-items-center">
        <Col xs={12} md={8} className="mb-3 mb-md-0">
          <Form>
            <Row className="g-2">
              <Col xs={8}>
                <Form.Control
                  type="text"
                  placeholder="Search by title or author"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
              <Col xs={4}>
                <Form.Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>

      {error && !showBorrowModal && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p>Loading books...</p>
        </div>
      ) : (
        <>
          <Row>
            {paginateBooks().map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </Row>

          <Pagination className="justify-content-center mt-4">
  <Pagination.Prev
    onClick={() => handlePageChange(currentPage - 1)}
    disabled={currentPage === 1}
    className="mx-3" // Adds margin on both sides
  />
  {[...Array(totalBookPages)].map((_, i) => (
    <Pagination.Item
      key={i + 1}
      active={i + 1 === currentPage}
      onClick={() => handlePageChange(i + 1)}
    >
      {i + 1}
    </Pagination.Item>
  ))}
  <Pagination.Next
    onClick={() => handlePageChange(currentPage + 1)}
    disabled={currentPage === totalBookPages}
    className="mx-3" // Adds margin on both sides
  />
</Pagination>
        </>
      )}

      <BorrowBookModal
        show={showBorrowModal}
        handleClose={() => {
          setShowBorrowModal(false);
          setSelectedBook(null);
        }}
      />
      <BorrowConfirmationModal
        show={showBorrowConfirmation}
        handleClose={() => setShowBorrowConfirmation(false)}
      />
    </Container>
  );
}