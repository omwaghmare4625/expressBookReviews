const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }
  if (isValid(username)) {
    return res.status(404).json({ message: "User already exists" });
  }
  users.push({ username: username, password: password });

  return res.status(200).json({ message: "User successfully registered" });
});

// Get the book list available in the shop
public_users.get('/books-store', function (req, res) {
  return res.status(200).json(books);
});

// Get the book list available in the shop using async-await with Axios
public_users.get('/books', async function (req, res) {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const response = await axios.get(`${baseUrl}/books-store`);
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch book list" });
  }
});

// Internal route for ISBN lookup data source
public_users.get('/isbn-store/:isbn', function (req, res) {
  const isbn = req.params.isbn;

  if (books[isbn]) {
    return res.status(200).json(books[isbn]);
  }

  return res.status(404).json({ message: "Book not found" });
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  const isbn = req.params.isbn;

  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const response = await axios.get(`${baseUrl}/isbn-store/${isbn}`);
    return res.status(200).json(response.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: "Book not found" });
    }

    return res.status(500).json({ message: "Unable to fetch book by ISBN" });
  }
 });
  
// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  const author = req.params.author;
  let filteredBooks = [];
  let bookKeys = Object.keys(books);

  bookKeys.forEach(key => {
    if (books[key].author === author) {
      filteredBooks.push(books[key]);
    }
  });

  return res.status(200).json(filteredBooks);
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  const title = req.params.title;
  let filteredBooks = [];
  let bookKeys = Object.keys(books);

  bookKeys.forEach(key => {
    if (books[key].title === title) {
      filteredBooks.push(books[key]);
    }
  });

  return res.status(200).json(filteredBooks);
});

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;

  if (books[isbn]) {
    return res.status(200).json(books[isbn].reviews);
  } else {
    return res.status(404).json({ message: "Book not found" });
  }
});

module.exports.general = public_users;
