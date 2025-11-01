// server.js
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_a_strong_secret';

// ----- In-memory "database" -----
let users = [
  // sample precreated user (username: alice, password: password123)
  // password is hashed below in init
];

let books = [
  {
    isbn: '9780143127741',
    title: 'The Martian',
    author: 'Andy Weir',
    reviews: {
      // username: "review text"
      // example: 'alice': 'Great read'
    }
  },
  {
    isbn: '9780553386790',
    title: 'A Game of Thrones',
    author: 'George R. R. Martin',
    reviews: {}
  },
  {
    isbn: '9780061120084',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    reviews: {}
  },
  {
    isbn: '9780307277671',
    title: 'Kafka on the Shore',
    author: 'Haruki Murakami',
    reviews: {}
  }
];

// create sample user 'alice' hashed password
(async function initSampleUser(){
  const pwHash = await bcrypt.hash('password123', 10);
  users.push({ username: 'alice', passwordHash: pwHash });
})();

// ----- Helper Functions -----
function findBookByISBN(isbn) {
  return books.find(b => b.isbn === isbn);
}

function findBooksByAuthor(author) {
  return books.filter(b => b.author.toLowerCase() === author.toLowerCase());
}

function findBooksByTitle(title) {
  const search = title.toLowerCase();
  return books.filter(b => b.title.toLowerCase().includes(search));
}

// ----- Auth middleware -----
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalid or expired' });
    req.user = user; // { username }
    next();
  });
}

// ----- Public endpoints (General users) -----
// Task 1: Get the book list available in the shop.
app.get('/books', (req, res) => {
  // return basic book info (without revealing reviews mapping unless needed)
  const listing = books.map(b => ({ isbn: b.isbn, title: b.title, author: b.author }));
  res.json(listing);
});

// Task 2: Get the books based on ISBN.
app.get('/books/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const book = findBookByISBN(isbn);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

// Task 3: Get all books by Author.
app.get('/books/author/:author', (req, res) => {
  const author = req.params.author;
  const found = findBooksByAuthor(author);
  res.json(found.map(b => ({ isbn: b.isbn, title: b.title, author: b.author })));
});

// Task 4: Get all books based on Title (supports partial match)
app.get('/books/title/:title', (req, res) => {
  const title = req.params.title;
  const found = findBooksByTitle(title);
  res.json(found.map(b => ({ isbn: b.isbn, title: b.title, author: b.author })));
});

// Task 5: Get book Review.
// returns all reviews for a book (username + review text)
app.get('/books/:isbn/review', (req, res) => {
  const isbn = req.params.isbn;
  const book = findBookByISBN(isbn);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  // convert reviews object to array
  const reviews = Object.entries(book.reviews).map(([username, review]) => ({ username, review }));
  res.json({ isbn: book.isbn, title: book.title, reviews });
});

// ----- Auth endpoints -----
// Task 6: Register New user
app.post('/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  if (users.some(u => u.username === username)) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  users.push({ username, passwordHash });
  res.status(201).json({ message: 'User registered' });
});

// Task 7: Login as a Registered user
app.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  // sign token (short expiry for demo)
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// ----- Registered Users -----
// Task 8: Add/Modify a book review. - 2 Points
app.post('/books/:isbn/review', authenticateToken, (req, res) => {
  const isbn = req.params.isbn;
  const { review } = req.body || {};
  if (!review) return res.status(400).json({ error: 'review text required' });

  const book = findBookByISBN(isbn);
  if (!book) return res.status(404).json({ error: 'Book not found' });

  // add or update review for this user
  book.reviews[req.user.username] = review;
  res.json({ message: 'Review added/updated', isbn: book.isbn, reviewer: req.user.username });
});

// Task 9: Delete book review added by that particular user
app.delete('/books/:isbn/review', authenticateToken, (req, res) => {
  const isbn = req.params.isbn;
  const book = findBookByISBN(isbn);
  if (!book) return res.status(404).json({ error: 'Book not found' });

  if (!(req.user.username in book.reviews)) {
    return res.status(404).json({ error: 'No review by this user to delete' });
  }
  delete book.reviews[req.user.username];
  res.json({ message: 'Review deleted', isbn: book.isbn, reviewer: req.user.username });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// start server
app.listen(PORT, () => {
  console.log(`Bookshop API listening at http://localhost:${PORT}`);
  console.log('Sample user created: username=alice password=password123');
});
