# 🏟️ Stadium Booking System — Backend

A production-quality REST API backend for a Stadium Booking System built with Node.js, Express.js, MongoDB, and Mongoose.

---

## 🛠️ Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (via Mongoose ODM)
* **Security & Utilities:** Helmet, CORS, Express-Rate-Limit, Morgan, Dotenv, Bcryptjs, JSON Web Tokens (JWT)

---

## 📁 Architecture Overview

```
backend/
├── config/
│   └── db.js
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
├── validators/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file from `.env.example`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/stadium_booking
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
```

### 3. Run the Server
* **Development Mode (Auto-restart on change):**
  ```bash
  npm run dev
  ```
* **Production Mode:**
  ```bash
  npm start
  ```

---

## 🧪 Testing Module 1

### Test API Endpoint:
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/test`
* **Response:**
  ```json
  {
    "success": true,
    "message": "Stadium Booking API is working"
  }
  ```
