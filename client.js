// client.js
const axios = require('axios');

const API_BASE = 'http://localhost:3000';

// Task 10: Get all books – Using async callback function – 2 Points
// We'll write an async function that accepts a node-style callback (err, data)
async function getAllBooks(callback) {
  try {
    const resp = await axios.get(`${API_BASE}/books`);
    // node callback style: first argument error (null if OK), second argument the result
    callback(null, resp.data);
  } catch (err) {
    callback(err);
  }
}

// Task 11: Search by ISBN – Using Promises – 2 Points
function searchByISBN(isbn) {
  // returns a Promise
  return axios.get(`${API_BASE}/books/isbn/${encodeURIComponent(isbn)}`)
    .then(resp => resp.data);
}

// Task 12: Search by Author – 2 Points
// Use async/await
async function searchByAuthor(author) {
  const resp = await axios.get(`${API_BASE}/books/author/${encodeURIComponent(author)}`);
  return resp.data;
}

// Task 13: Search by Title - 2 Points
// We'll use Promises (then/catch)
function searchByTitle(title) {
  return axios.get(`${API_BASE}/books/title/${encodeURIComponent(title)}`)
    .then(resp => resp.data);
}

// Example usage / test run
async function runExamples() {
  console.log('--- Task 10: getAllBooks (async callback) ---');
  await new Promise(resolve => {
    getAllBooks((err, data) => {
      if (err) {
        console.error('Error getting all books:', err.message || err);
      } else {
        console.log('All books:', data);
      }
      resolve();
    });
  });

  console.log('\n--- Task 11: searchByISBN (Promise) ---');
  searchByISBN('9780143127741')
    .then(book => console.log('Book by ISBN:', book))
    .catch(err => console.error('Error:', err.response ? err.response.data : err.message));

  // Wait a moment so previous promise logs before next calls
  await new Promise(r => setTimeout(r, 200));

  console.log('\n--- Task 12: searchByAuthor (async/await) ---');
  try {
    const byAuthor = await searchByAuthor('Andy Weir');
    console.log('Books by Andy Weir:', byAuthor);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }

  console.log('\n--- Task 13: searchByTitle (Promise) ---');
  searchByTitle('martian')
    .then(results => console.log('Books matching "martian":', results))
    .catch(err => console.error('Error:', err.response ? err.response.data : err.message));
}

// Auto-run examples when executed directly
if (require.main === module) {
  runExamples();
}

// export functions for use in tests or other modules
module.exports = {
  getAllBooks,
  searchByISBN,
  searchByAuthor,
  searchByTitle
};
