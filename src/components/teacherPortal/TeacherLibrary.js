import axios from 'axios';
import { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import "./TeacherLibrary.css";

// const API_URL = 'http://localhost:5000/api';

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

export default function TeacherLibrary() {
  const [books, setBooks] = useState([]);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const booksPerPage = 12;
  const categories = [
    'All',
    'Subject',
    'GK',
    'Politics',
    'Fiction',
    'Non-Fiction',
    'Science',
  ];
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // Authorization Check
  useEffect(() => {
    if (!user || !token) {
      setError('Please log in to access this page.');
      navigate('/login');
      return;
    }
    if (user.role !== 'teacher') {
      setError('You are not authorized to access this page.');
      navigate('/login');
      return;
    }
  }, [user, token, navigate]);

  // Fetch books with authorization
  useEffect(() => {
    if (!user?.email || user.role !== 'teacher') return;

    const fetchBooks = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/api/books`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBooks(response.data);
      } catch (error) {
        console.error(
          'Error fetching books:',
          error.response?.data || error.message
        );
        setError(
          error.response?.status === 401 || error.response?.status === 403
            ? 'Access denied. Please log in again.'
            : 'Failed to fetch books.'
        );
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [user?.email, token, navigate]);

  const handleBorrow = async (teacherDetails) => {
    if (!user?.email || user.role !== 'teacher') {
      setError('You are not authorized to borrow books.');
      navigate('/login');
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}/api/borrow`,
        {
          bookId: selectedBook._id,
          Borrowers: {
            name: teacherDetails.name,
            class: teacherDetails.department,
            section: "N/A",
            borrowDate: teacherDetails.borrowDate,
            returnDate: teacherDetails.returnDate,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the local state to reflect the new availability
    const updatedBooks = books.map((book) => {
      if (book._id === selectedBook._id) {
        return { ...book, available: book.available - 1 };
      }
      return book;
    });

    setBooks(updatedBooks); // Update the books state
      setShowBorrowModal(false);
      setSelectedBook(null);
      // Optionally refresh books here if backend updates availability
      // fetchBooks();
    } catch (error) {
      console.error(
        'Error borrowing book:',
        error.response?.data || error.message
      );
      setError(
        error.response?.status === 401 || error.response?.status === 403
          ? 'Access denied. Please log in again.'
          : 'Failed to borrow book.'
      );
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const paginateBooks = () => {
    const indexOfLastBook = currentPage * booksPerPage;
    const indexOfFirstBook = indexOfLastBook - booksPerPage;
    return filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  };

  const totalBookPages = Math.ceil(filteredBooks.length / booksPerPage);

  const BookCard = ({ book }) => {
    return (
      <div className="col-6 col-sm-4 col-md-3 mb-4" style={cardContainerStyle}>
        <div className="card h-100" style={cardStyle}>
          <img
            src={
              book.image
                ? book.image.startsWith("http")
                  ? book.image
                  : `${BASE_URL}${book.image}`
                : "/placeholder.svg"
            }
            alt={book.name}
            className="card-img-top"
            style={imageStyle}
          />
          <div className="card-body p-2" style={cardBodyStyle}>
            <h6 className="card-title mb-1" style={titleStyle}>
              {book.name}
            </h6>
            <p className="card-text small mb-1" style={textStyle}>
              by {book.author}
            </p>
            <p className="card-text small mb-1" style={textStyle}>
              Cat: {book.category}
            </p>
            <div
              className="d-flex justify-content-between small"
              style={infoStyle}
            >
              <span>Total: {book.total}</span>
              <span
                className={book.available > 0 ? "text-success" : "text-danger"}
                style={availabilityStyle(book.available)}
              >
                Avail: {book.available}
              </span>
            </div>
          </div>
          <div className="card-footer bg-transparent p-2" style={footerStyle}>
            {book.available > 0 ? (
              <button
                className="btn  btn-sm w-100"
                style={{ backgroundColor: "#F7C948" }}
                onClick={() => {
                  setSelectedBook(book);
                  setShowBorrowModal(true);
                }}
                // style={borrowButtonStyle}
              >
                Borrow
              </button>
            ) : (
              <button
                className="btn btn-secondary btn-sm w-100"
                disabled
                style={disabledButtonStyle}
              >
                Not Available
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const BorrowBookModal = ({ show, handleClose }) => {
    const user = JSON.parse(localStorage.getItem('user')); // Get user from localStorage
    const [teacherDetails, setTeacherDetails] = useState({
      name: user?.name || '', // Set name from localStorage user
      department: '',
      borrowDate: new Date().toISOString().split('T')[0],
      returnDate: '',
    });
  
    const departments = [
      'Mathematics',
      'Science',
      'English',
      'History',
      'Physical Education',
    ];
  
    const handleChange = (e) => {
      setTeacherDetails({ ...teacherDetails, [e.target.name]: e.target.value });
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      if (/\d/.test(teacherDetails.name)) {
        alert('Name should not contain numbers.');
        return;
      }
      if (!teacherDetails.department) {
        alert('Please select a department.');
        return;
      }
      const today = new Date();
      const borrowDate = new Date(teacherDetails.borrowDate);
      if (borrowDate < today.setHours(0, 0, 0, 0)) {
        alert('Borrow date cannot be in the past.');
        return;
      }
      const returnDate = new Date(teacherDetails.returnDate);
      const maxReturnDate = new Date(borrowDate);
      maxReturnDate.setDate(maxReturnDate.getDate() + 20);
      if (returnDate > maxReturnDate) {
        alert('Return date must be within 20 days from the borrow date.');
        return;
      }
      handleBorrow(teacherDetails);
      setTeacherDetails({
        name: user?.name || '', // Reset to user's name
        department: '',
        borrowDate: new Date().toISOString().split('T')[0],
        returnDate: '',
      });
    };
  
    return (
      <div
        className={`modal ${show ? 'show d-block' : 'd-none'}`}
        tabIndex='-1'
        style={modalStyle(show)}
      >
        <div
          className='modal-dialog modal-dialog-centered'
          style={modalDialogStyle}
        >
          <div className='modal-content' style={modalContentStyle}>
            <div className='modal-header' style={modalHeaderStyle}>
              <h5 className='modal-title' style={modalTitleStyle}>
                Borrow Book
              </h5>
              <button
                type='button'
                className='btn-close'
                onClick={handleClose}
                style={closeButtonStyle}
              ></button>
            </div>
            <div className='modal-body' style={modalBodyStyle}>
              <form onSubmit={handleSubmit}>
                {/* Display name as read-only text instead of input */}
                <div className='mb-3' style={formGroupStyle}>
                  <label className='form-label' style={labelStyle}>
                    Teacher Name
                  </label>
                  <p style={{ ...inputStyle, backgroundColor: '#f8f9fa', padding: '0.5rem' }}>
                    {teacherDetails.name}
                  </p>
                </div>
                <div className='mb-3' style={formGroupStyle}>
                  <label className='form-label' style={labelStyle}>
                    Department
                  </label>
                  <select
                    name='department'
                    className='form-control'
                    value={teacherDetails.department}
                    onChange={handleChange}
                    required
                    style={selectStyle}
                  >
                    <option value=''>Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept} style={optionStyle}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='mb-3' style={formGroupStyle}>
                  <label className='form-label' style={labelStyle}>
                    Borrow Date
                  </label>
                  <input
                    type='date'
                    name='borrowDate'
                    className='form-control'
                    value={teacherDetails.borrowDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    style={inputStyle}
                  />
                </div>
                <div className='mb-3' style={formGroupStyle}>
                  <label className='form-label' style={labelStyle}>
                    Return Date
                  </label>
                  <input
                    type='date'
                    name='returnDate'
                    className='form-control'
                    value={teacherDetails.returnDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    style={inputStyle}
                  />
                </div>
                <div className='modal-footer' style={modalFooterStyle}>
                  <button
                    type='button'
                    className='btn btn-secondary'
                    onClick={handleClose}
                    style={closeModalButtonStyle}
                  >
                    Close
                  </button>
                  <button
                    type='submit'
                    className='btn btn-primary'
                    style={submitButtonStyle}
                  >
                    Borrow Book
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const Pagination = ({ totalPages, currentPage, setPage }) => {
    return (
      <nav className='mt-3' style={paginationNavStyle}>
        <ul
          className='pagination justify-content-center flex-wrap'
          style={paginationStyle}
        >
          <li
            className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}
            style={pageItemStyle(currentPage === 1)}
          >
            <button
  className='page-link'
  onClick={() => setPage(currentPage - 1)}
  style={{ ...pageLinkStyle(false), color: '#fff' }} // White text color
>
  Previous
</button>
          </li>
          {[...Array(totalPages)].map((_, i) => (
            <li
              key={i}
              className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
              style={pageItemStyle(currentPage === i + 1)}
            >
              <button
                className='page-link'
                onClick={() => setPage(i + 1)}
                style={pageLinkStyle(currentPage === i + 1)}
              >
                {i + 1}
              </button>
            </li>
          ))}
          <li
            className={`page-item ${
              currentPage === totalPages ? 'disabled' : ''
            }`}
            style={pageItemStyle(currentPage === totalPages)}
          >
            <button
              className='page-link'
              onClick={() => setPage(currentPage + 1)}
              style={{ ...pageLinkStyle(false), color: '#fff' }}  // No active state for Next
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div
      className='container-fluid px-2 px-md-4 my-4'
      style={{
        maxWidth: '1260px',
        backgroundColor: '#fff',
        borderRadius: '15px',
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
        padding: '2rem',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <h1
        className='mb-4 text-center'
        style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          color: '#2c3e50',
          textShadow: '2px 2px 5px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        📚 Teacher Library Portal
      </h1>

      <div
        className='row mb-4 align-items-center'
        style={{ flexDirection: 'column', gap: '1rem' }}
      >
        <div
          className='col-12 col-md-8 mb-2 mb-md-0'
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div
            className='d-flex flex-column flex-md-row gap-2'
            style={{ gap: '1rem', flexWrap: 'wrap' }}
          >
            <input
              type='text'
              className='form-control'
              placeholder='Search by title or author'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.9rem',
                transition: 'box-shadow 0.3s ease',
                boxShadow: 'none',
              }}
              onFocus={(e) =>
                (e.target.style.boxShadow = '0 0 10px rgba(102, 126, 234, 0.3)')
              }
              onBlur={(e) => (e.target.style.boxShadow = 'none')}
            />
            <select
              className='form-control'
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                maxWidth: '200px',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.9rem',
                transition: 'box-shadow 0.3s ease',
                boxShadow: 'none',
              }}
              onFocus={(e) =>
                (e.target.style.boxShadow = '0 0 10px rgba(102, 126, 234, 0.3)')
              }
              onBlur={(e) => (e.target.style.boxShadow = 'none')}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} style={{ fontSize: '0.9rem' }}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div
          className='alert alert-danger'
          style={{ borderRadius: '8px', marginBottom: '1rem' }}
        >
          {error}
        </div>
      )}
      {loading && (
        <div style={{ textAlign: 'center', margin: '1rem 0' }}>
          <Spinner animation='border' variant='primary' />
        </div>
      )}
      <div className='row'>
        {paginateBooks().map((book) => (
          <BookCard key={book._id} book={book} />
        ))}
      </div>
      <Pagination
        totalPages={totalBookPages}
        currentPage={currentPage}
        setPage={setCurrentPage}
      />

      <BorrowBookModal
        show={showBorrowModal}
        handleClose={() => {
          setShowBorrowModal(false);
          setSelectedBook(null);
        }}
      />
    </div>
  );
}

// Inline Styles
const cardContainerStyle = {
  padding: '0.5rem',
};

const cardStyle = {
  borderRadius: '10px',
  overflow: 'hidden',
  transition: 'transform 0.3s ease',
};

const imageStyle = {
  height: '180px',
  objectFit: 'cover',
  borderBottom: '1px solid #eee',
};

const cardBodyStyle = {
  padding: '0.75rem',
};

const titleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#2c3e50',
  marginBottom: '0.5rem',
};

const textStyle = {
  color: '#7f8c8d',
  marginBottom: '0.25rem',
};

const infoStyle = {
  color: '#34495e',
};

const availabilityStyle = (available) => ({
  fontWeight: '500',
  color: available > 0 ? '#27ae60' : '#e74c3c',
});

const footerStyle = {
  padding: '0.75rem',
  borderTop: 'none',
};

const borrowButtonStyle = {
  borderRadius: '8px',
  fontSize: '0.9rem',
  padding: '0.5rem',
  transition: 'transform 0.3s ease',
};

const disabledButtonStyle = {
  borderRadius: '8px',
  fontSize: '0.9rem',
  padding: '0.5rem',
  opacity: 0.65,
};

const modalStyle = (show) => ({
  display: show ? 'block' : 'none',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 1050,
});

const modalDialogStyle = {
  maxWidth: '500px',
  margin: '1.75rem auto',
};

const modalContentStyle = {
  borderRadius: '10px',
  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
};

const modalHeaderStyle = {
  borderBottom: '1px solid #eee',
  padding: '1rem',
};

const modalTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: '600',
  color: '#2c3e50',
};

const closeButtonStyle = {
  fontSize: '1.5rem',
};

const modalBodyStyle = {
  padding: '1.5rem',
};

const formGroupStyle = {
  marginBottom: '1rem',
};

const labelStyle = {
  fontSize: '0.9rem',
  color: '#34495e',
  fontWeight: '500',
};

const inputStyle = {
  borderRadius: '8px',
  padding: '0.5rem',
  fontSize: '0.9rem',
  border: '1px solid #ddd',
  transition: 'box-shadow 0.3s ease',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage:
    "url('data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'12\\' height=\\'12\\' fill=\\'currentColor\\' class=\\'bi bi-caret-down-fill\\' viewBox=\\'0 0 16 16\\'\\>%3Cpath d=\\'M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z\\'/\\>%3C/svg\\>')",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  backgroundSize: '12px',
};

const optionStyle = {
  fontSize: '0.9rem',
};

const modalFooterStyle = {
  borderTop: '1px solid #eee',
  padding: '1rem',
  justifyContent: 'flex-end',
};

const closeModalButtonStyle = {
  borderRadius: '8px',
  padding: '0.5rem 1rem',
  fontSize: '0.9rem',
};

const submitButtonStyle = {
  ...closeModalButtonStyle,
  background: 'linear-gradient(90deg, #667eea, #764ba2)',
  color: '#fff',
  border: 'none',
  transition: 'transform 0.3s ease',
};

const paginationNavStyle = {
  marginTop: '2rem',
};

const paginationStyle = {
  flexWrap: 'wrap',
  gap: '0.5rem',
};

const pageItemStyle = (isActiveOrDisabled) => ({
  borderRadius: '8px',
  backgroundColor: isActiveOrDisabled ? '#667eea' : 'transparent', // Active or disabled styling
  color: isActiveOrDisabled ? '#fff' : '#007bff',
  cursor: isActiveOrDisabled ? 'default' : 'pointer',
});

const pageLinkStyle = (isActive) => ({
  border: 'none',
  background: 'transparent',
  color: isActive ? '#fff' : '#007bff',
  padding: '0.5rem 1rem',
  fontSize: '0.9rem',
  transition: 'color 0.3s ease',
  cursor: isActive ? 'default' : 'pointer',
});
