import axios from 'axios';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2'; // Make sure to install: npm install sweetalert2

// const API_URL = 'http://localhost:5000/api';
// const BASE_URL = 'http://localhost:5000'; // Base URL for static files
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_DEPLOYED_URL
    : process.env.REACT_APP_API_URL;

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    Swal.fire('Error', 'Please log in to access this feature', 'error');
    throw new Error('No token found');
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

export default function LibraryManagement() {
  const [books, setBooks] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [returnedBooks, setReturnedBooks] = useState([]);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [bookToEdit, setBookToEdit] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('books');
  const [currentPage, setCurrentPage] = useState({
    books: 1,
    borrowed: 1,
    returned: 1,
  });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
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

  useEffect(() => {
    fetchBooks();
    fetchReturnedBooks();
    fetchBorrowedBooks();

    const interval = setInterval(() => {
      if (activeTab === 'borrowed') fetchBorrowedBooks();
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/books`, getAuthConfig());
      setBooks(response.data);
      setError(null);
    } catch (error) {
      setError(
        'Failed to fetch books: ' +
          (error.response?.data?.message || error.message)
      );
      handleAuthError(error);
    }
  };

  const fetchBorrowedBooks = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/borrowed`, getAuthConfig());
      setBorrowedBooks(response.data);
      setError(null);
    } catch (error) {
      setError(
        'Failed to fetch borrowed books: ' +
          (error.response?.data?.message || error.message)
      );
      handleAuthError(error);
    }
  };

  const fetchReturnedBooks = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/returned`, getAuthConfig());
      setReturnedBooks(response.data);
      setError(null);
    } catch (error) {
      setError(
        'Failed to fetch returned books: ' +
          (error.response?.data?.message || error.message)
      );
      handleAuthError(error);
    }
  };

  const addBook = async (newBook) => {
    try {
      await axios.post(`${BASE_URL}/api/books`, newBook, {
        ...getAuthConfig(),
        headers: {
          ...getAuthConfig().headers,
          "Content-Type": "multipart/form-data",
        },
      });
      await fetchBooks();
      setError(null);
    } catch (error) {
      setError(
        'Failed to add book: ' +
          (error.response?.data?.message || error.message)
      );
      handleAuthError(error);
    }
  };

  const deleteBook = async (bookId) => {
    try {
      await axios.delete(`${BASE_URL}/api/books/${bookId}`, getAuthConfig());
      await fetchBooks();
      setError(null);
    } catch (error) {
      setError(
        'Failed to delete book: ' +
          (error.response?.data?.message || error.message)
      );
      handleAuthError(error);
    }
  };

  const updateBook = async (updatedBook) => {
    try {
      const borrowedCount =
        books.find((b) => b._id === updatedBook._id)?.total -
          books.find((b) => b._id === updatedBook._id)?.available || 0;
      const newAvailable = updatedBook.total - borrowedCount;

      const formData = new FormData();
      Object.entries(updatedBook).forEach(([key, value]) => {
        if (key !== '_id') formData.append(key, value);
      });
      formData.append('available', newAvailable >= 0 ? newAvailable : 0);

      await axios.put(`${BASE_URL}/api/books/${updatedBook._id}`, formData, {
        ...getAuthConfig(),
        headers: {
          ...getAuthConfig().headers,
          "Content-Type": "multipart/form-data",
        },
      });
      await fetchBooks();
      setError(null);
    } catch (error) {
      setError(
        'Failed to update book: ' +
          (error.response?.data?.message || error.message)
      );
      handleAuthError(error);
    }
  };

  const calculateFine = (borrowDate) => {
    const borrow = new Date(borrowDate);
    const dueDate = new Date(borrow);
    dueDate.setDate(dueDate.getDate() + 5);
    const actualReturn = new Date();
    const daysLate = Math.max(
      0,
      Math.ceil((actualReturn - dueDate) / (1000 * 60 * 60 * 24))
    );
    return daysLate * 10;
  };

  const returnBook = async (borrow, finePaid, fineAmount) => {
    try {
      await axios.post(
        `${BASE_URL}/api/return`,
        { borrowId: borrow._id, finePaid, fineAmount },
        getAuthConfig()
      );
      await Promise.all([
        fetchBooks(),
        fetchBorrowedBooks(),
        fetchReturnedBooks(),
      ]);
      setShowReturnModal(false);
      setSelectedBorrow(null);
      setError(null);
    } catch (error) {
      setError(
        'Failed to return book: ' +
          (error.response?.data?.message || error.message)
      );
      handleAuthError(error);
    }
  };

  const handleAuthError = (error) => {
    if (error.response?.status === 401 || error.message === 'No token found') {
      localStorage.removeItem('token');
      window.location.href = '/login'; // Redirect to login page
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
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
    const indexOfLastBook = currentPage.books * booksPerPage;
    const indexOfFirstBook = indexOfLastBook - booksPerPage;
    return filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  };

  const paginateBorrowed = borrowedBooks.slice(
    (currentPage.borrowed - 1) * booksPerPage,
    currentPage.borrowed * booksPerPage
  );
  const paginateReturned = returnedBooks.slice(
    (currentPage.returned - 1) * booksPerPage,
    currentPage.returned * booksPerPage
  );

  const totalBookPages = Math.ceil(filteredBooks.length / booksPerPage);
  const totalBorrowedPages = Math.ceil(borrowedBooks.length / booksPerPage);
  const totalReturnedPages = Math.ceil(returnedBooks.length / booksPerPage);

  const BookCard = ({ book }) => {
    const imageUrl = book.image
      ? book.image.startsWith('http')
        ? book.image
        : `${BASE_URL}${book.image}`
      : '/placeholder.svg';

    return (
      <div className='col-12 col-sm-6 col-md-4 col-lg-3 mb-4'>
        <div
          className='card h-100 animate__animated animate__fadeIn'
          style={{ transition: 'all 0.3s ease-in-out' }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = 'translateY(-5px)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = 'translateY(0)')
          }
        >
          <img
            src={imageUrl}
            alt={book.name}
            className='card-img-top'
            style={{ height: '150px', objectFit: 'cover' }}
            onError={(e) => (e.target.src = '/placeholder.svg')}
          />
          <div className='card-body p-3'>
            <h6 className='card-title mb-2'>{book.name}</h6>
            <p className='card-text small mb-1'>by {book.author}</p>
            <p className='card-text small mb-1'>
              Category: {book.category || 'Uncategorized'}
            </p>
            <div className='d-flex justify-content-between small'>
              <span>Total: {book.total}</span>
              <span
                className={book.available > 0 ? 'text-success' : 'text-danger'}
              >
                Avail: {book.available}
              </span>
            </div>
          </div>
          <div className='card-footer bg-transparent p-2'>
            <div className='d-flex gap-2'>
              <button
                className='btn btn-warning btn-sm flex-grow-1'
                onClick={() => {
                  setBookToEdit(book);
                  setEditMode(true);
                  setShowAddBookModal(true);
                }}
              >
                <i className='bi bi-pencil me-1'></i>Edit
              </button>
              <button
                className='btn btn-danger btn-sm flex-grow-1'
                onClick={() => deleteBook(book._id)}
              >
                <i className='bi bi-trash me-1'></i>Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AddBookModal = ({ show, handleClose }) => {
    const [formData, setFormData] = useState({
      name: '',
      author: '',
      image: null,
      total: 1,
      category: '',
    });

    useEffect(() => {
      if (bookToEdit) {
        setFormData({
          name: bookToEdit.name,
          author: bookToEdit.author,
          image: bookToEdit.image,
          total: bookToEdit.total,
          category: bookToEdit.category || '',
        });
      } else {
        setFormData({
          name: '',
          author: '',
          image: null,
          total: 1,
          category: '',
        });
      }
    }, [bookToEdit]);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    };

    const handleImageUpload = (e) => {
      setFormData({ ...formData, image: e.target.files[0] });
    };

    const handleSubmit = async () => {
      if (
        !formData.name ||
        !formData.author ||
        !formData.total ||
        !formData.category
      ) {
        setError('All fields are required!');
        return;
      }

      const data = new FormData();
      data.append('name', formData.name);
      data.append('author', formData.author);
      data.append('total', formData.total);
      data.append('category', formData.category);
      if (formData.image && formData.image instanceof File)
        data.append('image', formData.image);

      if (bookToEdit) {
        await updateBook({ ...formData, _id: bookToEdit._id });
      } else {
        await addBook(data);
      }
      handleClose();
    };

    return (
      <div
        className={`modal fade ${show ? 'show d-block' : ''}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <div className='modal-dialog modal-dialog-centered animate__animated animate__zoomIn'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h5 className='modal-title'>
                {bookToEdit ? 'Edit Book' : 'Add New Book'}
              </h5>
              <button
                type='button'
                className='btn-close'
                onClick={handleClose}
              ></button>
            </div>
            <div className='modal-body'>
              {error && (
                <div className='alert alert-danger animate__animated animate__shakeX'>
                  {error}
                </div>
              )}
              <div className='row g-3'>
                <div className='col-12'>
                  <label className='form-label'>Book Name</label>
                  <input
                    type='text'
                    name='name'
                    className='form-control'
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className='col-12'>
                  <label className='form-label'>Author Name</label>
                  <input
                    type='text'
                    name='author'
                    className='form-control'
                    value={formData.author}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className='col-12'>
                  <label className='form-label'>Category</label>
                  <select
                    name='category'
                    className='form-select'
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value=''>Select Category</option>
                    {categories.slice(1).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='col-12'>
                  <label className='form-label'>Book Image</label>
                  <input
                    type='file'
                    className='form-control'
                    onChange={handleImageUpload}
                    accept='image/*'
                  />
                  {formData.image && (
                    <img
                      src={
                        formData.image instanceof File
                          ? URL.createObjectURL(formData.image)
                          : `${BASE_URL}${formData.image}`
                      }
                      alt='Preview'
                      className='mt-2 rounded'
                      style={{ maxWidth: '100px' }}
                    />
                  )}
                </div>
                <div className='col-12'>
                  <label className='form-label'>Total Books</label>
                  <input
                    type='number'
                    name='total'
                    className='form-control'
                    value={formData.total}
                    onChange={handleChange}
                    min='1'
                    required
                  />
                </div>
              </div>
            </div>
            <div className='modal-footer'>
              <button className='btn btn-secondary' onClick={handleClose}>
                Close
              </button>
              <button className='btn btn-success' onClick={handleSubmit}>
                {bookToEdit ? 'Update Book' : 'Add Book'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ReturnConfirmationModal = ({ show, handleClose, borrow }) => {
    const [finePaid, setFinePaid] = useState(false);
    const fineAmount = calculateFine(borrow?.Borrowers?.borrowDate);

    const handleSubmit = () => returnBook(borrow, finePaid, fineAmount);

    return (
      <div
        className={`modal fade ${show ? 'show d-block' : ''}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <div className='modal-dialog modal-dialog-centered'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h5 className='modal-title'>Confirm Book Return</h5>
              <button
                type='button'
                className='btn-close'
                onClick={handleClose}
              ></button>
            </div>
            <div className='modal-body'>
              <p>Book: {borrow?.book?.name || 'N/A'}</p>
              <p>Student: {borrow?.Borrowers?.name || 'N/A'}</p>
              <p>
                Borrow Date:{' '}
                {borrow?.Borrowers?.borrowDate
                  ? new Date(borrow.Borrowers.borrowDate).toLocaleDateString()
                  : 'N/A'}
              </p>
              <p>Return Date: {new Date().toLocaleDateString()}</p>
              {fineAmount > 0 && (
                <>
                  <p className='text-danger'>
                    Late Return! Fine: ₹{fineAmount}
                  </p>
                  <div className='form-check'>
                    <input
                      type='checkbox'
                      className='form-check-input'
                      id='finePaid'
                      checked={finePaid}
                      onChange={(e) => setFinePaid(e.target.checked)}
                    />
                    <label className='form-check-label' htmlFor='finePaid'>
                      Fine Paid (₹{fineAmount})
                    </label>
                  </div>
                </>
              )}
            </div>
            <div className='modal-footer'>
              <button className='btn btn-secondary' onClick={handleClose}>
                Cancel
              </button>
              <button
                className='btn btn-success'
                onClick={handleSubmit}
                disabled={fineAmount > 0 && !finePaid}
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Pagination = ({ totalPages, currentPage, setPage, type }) => (
    <nav className='mt-3'>
      <ul className='pagination justify-content-center flex-wrap'>
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button
            className='page-link'
            onClick={() => setPage(type, currentPage - 1)}
          >
            Previous
          </button>
        </li>
        <li className="mx-2"></li> {/* Added gap */}
        {[...Array(totalPages)].map((_, i) => (
          <li
            key={i}
            className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
          >
            <button className='page-link' onClick={() => setPage(type, i + 1)}>
              {i + 1}
            </button>
          </li>
        ))}
          <li className="mx-2"></li> {/* Added gap */}
        <li
          className={`page-item ${
            currentPage === totalPages ? 'disabled' : ''
          }`}
        >
          <button
            className='page-link'
            onClick={() => setPage(type, currentPage + 1)}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );

  const handlePageChange = (type, page) =>
    setCurrentPage((prev) => ({ ...prev, [type]: page }));

  return (
    <div className='container-fluid px-2 px-md-4 my-4'>
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h1 className='animate__animated animate__fadeInDown'>
          Library Management System
        </h1>
        {/* <button className='btn btn-outline-danger' onClick={handleLogout}>
          Logout
        </button> */}
      </div>
      <ul className="nav nav-tabs mb-4 justify-content-center animate__animated animate__fadeIn">
  {['books', 'borrowed', 'returned'].map((tab) => (
    <li className="nav-item" key={tab}>
      <button
        className={`nav-link ${activeTab === tab ? 'active' : ''}`}
        onClick={() => setActiveTab(tab)}
        style={{
          backgroundColor: activeTab === tab ? '#1a0218' : '#f8f9fa',
          color: activeTab === tab ? 'white' : 'black',
          borderColor: '#01080f',
          margin: '5px 10px', // Ensures spacing between buttons
          padding: '8px 15px', // Adjusts button padding for better spacing
          display: 'inline-block', // Prevents collapsing on small screens
        }}
      >
        {tab.charAt(0).toUpperCase() + tab.slice(1)}
      </button>
    </li>
  ))}
</ul>


      {activeTab === 'books' && (
        <div className='animate__animated animate__fadeIn'>
          <div className='row mb-4 align-items-center'>
            <div className='col-12 col-md-8 mb-3 mb-md-0'>
              <div className='d-flex flex-column flex-md-row gap-2'>
                <input
                  type='text'
                  className='form-control'
                  placeholder='Search by title or author'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className='form-select'
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ maxWidth: '200px' }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className='col-12 col-md-4 text-md-end'>
              <button
                className='btn btn-primary w-100 w-md-auto'
                onClick={() => {
                  setBookToEdit(null);
                  setEditMode(false);
                  setShowAddBookModal(true);
                }}
              >
                Add New Book
              </button>
            </div>
          </div>
          {error && (
            <div className='alert alert-danger animate__animated animate__shakeX'>
              {error}
            </div>
          )}
          {filteredBooks.length === 0 ? (
            <p className='text-muted text-center'>No books found.</p>
          ) : (
            <div className='row'>
              {paginateBooks().map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          )}
          <Pagination
            totalPages={totalBookPages}
            currentPage={currentPage.books}
            setPage={handlePageChange}
            type='books'
          />
        </div>
      )}

      {activeTab === 'borrowed' && (
        <div className='animate__animated animate__fadeIn'>
          <div className='row mb-3'>
            <div className='col text-end'>
              <button className='btn btn-info' onClick={fetchBorrowedBooks}>
                Refresh
              </button>
            </div>
          </div>
          {error && (
            <div className='alert alert-danger animate__animated animate__shakeX'>
              {error}
            </div>
          )}
          {borrowedBooks.length === 0 ? (
            <p className='text-muted text-center'>No borrowed books.</p>
          ) : (
            <>
              <div className='table-responsive'>
                <table className='table table-bordered table-hover table-sm'>
                  <thead className='table-dark'>
                    <tr>
                      <th>Book Name</th>
                      <th>Author</th>
                      <th>Category</th>
                      <th>Name</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Borrow Date</th>
                      <th>Fine (₹)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginateBorrowed.map((borrow) => {
                      const fine = calculateFine(borrow.Borrowers.borrowDate);
                      return (
                        <tr key={borrow._id}>
                          <td>{borrow.book?.name || 'N/A'}</td>
                          <td>{borrow.book?.author || 'N/A'}</td>
                          <td>{borrow.book?.category || 'N/A'}</td>
                          <td>{borrow.Borrowers?.name || 'N/A'}</td>
                          <td>{borrow.Borrowers?.class || 'N/A'}</td>
                          <td>{borrow.Borrowers?.section || 'N/A'}</td>
                          <td>
                            {borrow.Borrowers?.borrowDate
                              ? new Date(
                                  borrow.Borrowers.borrowDate
                                ).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td>{fine > 0 ? fine : '0'}</td>
                          <td>
                            <button
                              className='btn btn-success btn-sm w-100'
                              onClick={() => {
                                setSelectedBorrow(borrow);
                                setShowReturnModal(true);
                              }}
                            >
                              Return
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                totalPages={totalBorrowedPages}
                currentPage={currentPage.borrowed}
                setPage={handlePageChange}
                type='borrowed'
              />
            </>
          )}
        </div>
      )}

      {activeTab === 'returned' && (
        <div className='animate__animated animate__fadeIn'>
          {error && (
            <div className='alert alert-danger animate__animated animate__shakeX'>
              {error}
            </div>
          )}
          {returnedBooks.length === 0 ? (
            <p className='text-muted text-center'>No returned books.</p>
          ) : (
            <>
              <div className='table-responsive'>
                <table className='table table-bordered table-hover table-sm'>
                  <thead className='table-success'>
                    <tr>
                      <th>Book Name</th>
                      <th>Author</th>
                      <th>Category</th>
                      <th>Name</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Borrow Date</th>
                      <th>Return Date</th>
                      <th>Fine (₹)</th>
                      <th>Fine Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginateReturned.map((returnData) => (
                      <tr key={returnData._id}>
                        <td>{returnData.book?.name || 'N/A'}</td>
                        <td>{returnData.book?.author || 'N/A'}</td>
                        <td>{returnData.book?.category || 'N/A'}</td>
                        <td>{returnData.Borrowers?.name || 'N/A'}</td>
                        <td>{returnData.Borrowers?.class || 'N/A'}</td>
                        <td>{returnData.Borrowers?.section || 'N/A'}</td>
                        <td>
                          {returnData.Borrowers?.borrowDate
                            ? new Date(
                                returnData.Borrowers.borrowDate
                              ).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td>
                          {returnData.Borrowers?.returnDate
                            ? new Date(
                                returnData.Borrowers.returnDate
                              ).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td>{returnData.fineAmount || 0}</td>
                        <td>{returnData.finePaid ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                totalPages={totalReturnedPages}
                currentPage={currentPage.returned}
                setPage={handlePageChange}
                type='returned'
              />
            </>
          )}
        </div>
      )}

      <AddBookModal
        show={showAddBookModal}
        handleClose={() => {
          setShowAddBookModal(false);
          setBookToEdit(null);
          setEditMode(false);
          setError(null);
        }}
      />
      <ReturnConfirmationModal
        show={showReturnModal}
        handleClose={() => {
          setShowReturnModal(false);
          setSelectedBorrow(null);
          setError(null);
        }}
        borrow={selectedBorrow}
      />
    </div>
  );
}
