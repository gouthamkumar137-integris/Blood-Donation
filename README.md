# 🩸 BloodConnect

A full-stack blood donation and emergency donor finder platform that helps users register as blood donors and find/request blood during emergencies.

## ✨ Features

* Donor registration with blood group and location
* Search available donors by blood group
* Create emergency blood requests
* View and manage blood requests
* REST API built with Express.js
* SQLite database for persistent storage
* Responsive frontend

## 🛠️ Tech Stack

**Frontend**

* HTML
* CSS
* JavaScript

**Backend**

* Node.js
* Express.js
* REST API

**Database**

* SQLite

## 📁 Project Structure

```text
blood-donation/
├── public/              # Frontend
├── db.js                # SQLite database configuration
├── server.js            # Express server & REST APIs
├── package.json
├── package-lock.json
└── .gitignore
```

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd blood-donation
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the server

```bash
node server.js
```

The application will be available at:

```text
http://localhost:3000
```

> The SQLite database is created locally when the application starts.

## 🔌 API

| Method | Endpoint            | Purpose                |
| ------ | ------------------- | ---------------------- |
| GET    | `/api/donors`       | Get available donors   |
| POST   | `/api/donors`       | Register a donor       |
| GET    | `/api/requests`     | Get blood requests     |
| POST   | `/api/requests`     | Create a blood request |
| PUT    | `/api/requests/:id` | Update request status  |
| DELETE | `/api/requests/:id` | Delete a request       |

## 🎯 Purpose

BloodConnect was built to simplify the process of finding available blood donors and managing emergency blood requests through a centralized web application.

## 📌 Status

**Completed — Academic Project**

## 👨‍💻 Author

**Goutham**
