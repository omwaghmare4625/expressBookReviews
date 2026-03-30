const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  return users.some(user => user.username === username);
};

const authenticatedUser = (username, password) => {
  return users.some(user => user.username === username && user.password === password);
};

//only registered users can login
regd_users.post("/login", (req, res) => {

  const username = req.body.username;
  const password = req.body.password;

  // Check if fields missing
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  // Check if valid user
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid login. Check username and password" });
  }

  // Generate JWT token from customer credentials and store in session
  const token = jwt.sign({ username, password }, "secretKey", { expiresIn: "1h" });
  req.session.authorization = {
    accessToken: token,
  };

  return res.status(200).json({ message: "User successfully logged in" });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {

  const isbn = req.params.isbn;

  // review comes from query
  const review = req.query.review;

  if (!review) {
    return res.status(400).json({ message: "Review query is required" });
  }

  const accessToken = req.session && req.session.authorization && req.session.authorization.accessToken;

  if (!accessToken) {
    return res.status(401).json({ message: "User not logged in" });
  }

  let username;
  try {
    const decoded = jwt.verify(accessToken, "secretKey");
    username = decoded.username;
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  if (!username) {
    return res.status(401).json({ message: "Invalid session user" });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (!books[isbn].reviews || typeof books[isbn].reviews !== "object") {
    books[isbn].reviews = {};
  }

  // Add or update review
  books[isbn].reviews[username] = review;

  return res.status(200).json({ message: "Review added/updated successfully" });
});

// Delete a book review by logged-in user
regd_users.delete("/auth/review/:isbn", (req, res) => {

  const isbn = req.params.isbn;
  const accessToken = req.session && req.session.authorization && req.session.authorization.accessToken;

  if (!accessToken) {
    return res.status(401).json({ message: "User not logged in" });
  }

  let username;
  try {
    const decoded = jwt.verify(accessToken, "secretKey");
    username = decoded.username;
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  if (!username) {
    return res.status(401).json({ message: "Invalid session user" });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (!books[isbn].reviews || typeof books[isbn].reviews !== "object") {
    return res.status(404).json({ message: "No reviews found for this book" });
  }

  if (!books[isbn].reviews[username]) {
    return res.status(404).json({ message: "No review found for this user" });
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({ message: "Review deleted successfully" });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
