# IT Service Management & Analytics Platform

A full-stack enterprise-style **IT Service Management (ITSM) and analytics platform** designed to manage IT tickets, users, assignments, resolutions, conversations, activity history, and service performance metrics.

The application combines a modern React frontend with a RESTful Node.js/Express backend, MongoDB data storage, JWT authentication, role-based authorization, and production deployment through Vercel and Render.

## Live Application

**Frontend:** Deployed with Vercel
**Backend API:** Deployed with Render
**Database:** MongoDB Atlas

> Production URLs are intentionally not hard-coded into this README so deployment environments can be changed without modifying the documentation.

---

## Project Overview

Traditional ticketing systems often focus primarily on creating and closing support tickets. This project was designed as a more complete ITSM platform that reflects real-world IT support workflows.

The system allows organizations to:

* Create and manage IT incidents and service requests
* Assign tickets to support personnel
* Track ticket priority, category, and status
* Record resolution information
* Reopen previously resolved tickets
* Maintain ticket activity history
* Add internal notes and public comments
* Maintain ticket conversations
* Manage users, departments, roles, and account status
* Track user activity
* Provide dashboard analytics and service-performance metrics
* Secure application access through authentication and role-based authorization

The project was built with a focus on **software development, application support, IT operations, data management, and analytics**.

---

# Key Features

## 🎫 Ticket Management

The platform provides a complete ticket lifecycle including:

* Ticket creation
* Ticket search
* Status filtering
* Priority filtering
* Category filtering
* Ticket assignment
* Ticket editing
* Resolution information
* Ticket reopening
* Ticket activity tracking

### Ticket statuses

* Open
* In Progress
* Resolved
* Closed
* Reopen

### Ticket priorities

* Low
* Medium
* High
* Critical

### Ticket categories

* Hardware
* Software
* Network
* Access
* Other

---

## 👥 User Management

Administrators and authorized personnel can manage application users.

User management includes:

* Create users
* Edit users
* Assign roles
* Assign departments
* Activate/deactivate accounts
* Reactivate accounts
* View user activity history

Supported roles include:

* Administrator
* IT Support Agent
* Manager
* Requester

Supported departments include:

* IT
* Management
* HR
* Finance
* Operations
* Other

---

## 🔐 Authentication & Security

The application implements authentication and authorization controls suitable for an enterprise-style ITSM application.

### Authentication

* JWT-based authentication
* Protected API routes
* Bearer token authorization
* Active-account validation
* Token expiration
* Secure password verification using bcrypt
* Password change functionality
* Forced password change for newly created users

### Authorization

Role-based middleware restricts access to sensitive operations.

For example:

* Administrators can manage users
* Managers have controlled user-management access
* IT Support Agents can access appropriate support functionality
* Requesters have more limited access

The backend validates permissions independently rather than relying solely on frontend UI restrictions.

---

# Ticket Conversation & Activity History

The platform maintains a history of important ticket actions.

Examples include:

* Ticket created
* Ticket updated
* Ticket assigned
* Status changed
* Priority changed
* Category changed
* Ticket reopened
* Internal note added

Tickets can also contain:

* Public comments
* Internal notes
* Conversation history

This provides a more realistic representation of how support teams document and communicate around incidents.

---

# Resolution Management

Resolved tickets can contain resolution information such as:

* Resolution summary
* Resolved by
* Resolution timestamp

This allows support teams to document not only that an incident was resolved, but also **how it was resolved and who resolved it**.

---

# Analytics Dashboard

The platform includes an ITSM analytics dashboard designed to provide a high-level view of service desk performance.

Example metrics include:

* Total tickets
* Resolved tickets
* Open tickets
* Average resolution time
* SLA compliance
* Top issue categories

The analytics functionality demonstrates how operational ticket data can be transformed into useful management information.

---

# System Architecture

```text
                         ┌──────────────────────┐
                         │       User           │
                         │  Desktop / Mobile    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   React Frontend     │
                         │      Vite            │
                         └──────────┬───────────┘
                                    │
                              REST API Requests
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Node.js + Express   │
                         │     REST API         │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
              Authentication    Business Logic   Validation
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       Mongoose       │
                         │        ODM           │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   MongoDB Atlas      │
                         │      Database        │
                         └──────────────────────┘
```

---

# Technology Stack

## Frontend

* React
* Vite
* JavaScript (ES6+)
* JSX
* CSS
* Responsive UI design
* REST API integration

## Backend

* Node.js
* Express.js
* RESTful API architecture
* CommonJS modules
* Middleware-based architecture

## Database

* MongoDB
* MongoDB Atlas
* Mongoose

## Authentication & Security

* JSON Web Tokens (JWT)
* bcryptjs
* Role-based authorization
* Protected API routes
* Environment-based secrets

## Development & Deployment

* Git
* GitHub
* Vercel
* Render
* MongoDB Atlas
* npm
* Nodemon

---

# Project Structure

```text
IT-SERVICE-MANAGEMENT-SYSTEM/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TicketDetails.jsx
│   │   │   └── Users.jsx
│   │   │
│   │   ├── config/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── Login.jsx
│   │   ├── ChangePassword.jsx
│   │   └── App.css
│   │
│   ├── package.json
│   └── .env.example
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── roleMiddleware.js
│   │   │   └── errorMiddleware.js
│   │   │
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── UserActivity.js
│   │   │   ├── Ticket.js
│   │   │   ├── TicketActivity.js
│   │   │   └── TicketComment.js
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── usersRoutes.js
│   │   │   ├── ticketRoutes.js
│   │   │   └── dashboardRoutes.js
│   │   │
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

# Database Models

The application uses MongoDB with Mongoose models representing the major ITSM entities.

### User

Stores:

* Name
* Email
* Password hash
* Role
* Department
* Active status
* Password-change status
* Timestamps

### Ticket

Stores:

* Title
* Description
* Status
* Priority
* Category
* Requester
* Created by
* Assigned user
* Resolution summary
* Resolved by
* Resolution timestamp
* Timestamps

### TicketActivity

Stores the history of ticket-related actions.

### TicketComment

Stores public ticket conversation messages and their authors.

### UserActivity

Stores important actions performed on user accounts.

---

# API Overview

The backend exposes RESTful API endpoints organized by resource.

## Authentication

```text
POST /api/auth/login
PATCH /api/auth/change-password
```

## Tickets

```text
GET    /api/tickets
GET    /api/tickets/:id
POST   /api/tickets
PUT    /api/tickets/:id
GET    /api/tickets/:id/activity
```

Additional ticket endpoints support assignment, resolution, reopening, comments, internal notes, and related workflow functionality.

## Users

```text
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
PATCH  /api/users/:id/deactivate
PATCH  /api/users/:id/reactivate
GET    /api/users/:id/activity
```

## Dashboard

```text
GET /api/dashboard
```

## Health Check

```text
GET /api/health
```

The health endpoint is used to verify that the backend API is running correctly.

---

# Running the Project Locally

## Prerequisites

Install:

* Node.js
* npm
* MongoDB or access to MongoDB Atlas
* Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/Hhaard/it-service-management-platform.git
cd it-service-management-platform
```

---

# 2. Configure the Backend

Navigate to the server:

```bash
cd server
npm install
```

Create a `.env` file based on `.env.example`.

Example:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_long_random_secret

CLIENT_URL=http://localhost:5173
```

### Important

Never commit your real `.env` file or production credentials to GitHub.

---

# 3. Start the Backend

From the `server` directory:

```bash
npm run dev
```

The API should run on:

```text
http://localhost:5000
```

Test the health endpoint:

```text
http://localhost:5000/api/health
```

---

# 4. Configure the Frontend

Open another terminal.

Navigate to the client:

```bash
cd client
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

---

# 5. Start the Frontend

```bash
npm run dev
```

Vite will provide the local development URL.

Open that URL in your browser.

---

# Environment Variables

## Backend

| Variable      | Description                     |
| ------------- | ------------------------------- |
| `PORT`        | Port used by the Express server |
| `MONGODB_URI` | MongoDB connection string       |
| `JWT_SECRET`  | Secret used to sign JWT tokens  |
| `CLIENT_URL`  | Allowed frontend origin(s)      |

## Frontend

| Variable       | Description                 |
| -------------- | --------------------------- |
| `VITE_API_URL` | Base URL of the backend API |

Environment files containing secrets are excluded from version control.

---

# Production Deployment

The application is deployed using separate services for the frontend, backend, and database.

```text
GitHub
  │
  ├──────────────► Vercel
  │                 │
  │                 ▼
  │            React Frontend
  │
  └──────────────► Render
                    │
                    ▼
              Express Backend
                    │
                    ▼
              MongoDB Atlas
```

## Frontend

The React/Vite frontend is deployed through Vercel.

Production configuration uses:

```env
VITE_API_URL=<production-backend-api>
```

## Backend

The Node.js/Express API is deployed through Render.

Production environment variables are configured directly in the hosting platform rather than committed to GitHub.

## Database

Production data is stored in MongoDB Atlas.

---

# Security Considerations

Several security practices were implemented during development:

* Passwords are never stored as plaintext.
* Passwords are hashed using bcrypt.
* JWT tokens expire after a defined period.
* Protected endpoints require authentication.
* Role-based authorization is enforced on the backend.
* Deactivated accounts cannot authenticate.
* Sensitive environment variables are excluded from Git.
* Duplicate records are handled through database constraints.
* Invalid MongoDB IDs are handled by centralized error middleware.
* Invalid JSON requests are handled by centralized error middleware.
* Production frontend origins are restricted through CORS configuration.
* Password-change functionality prevents reuse of the current password.

---

# Development Challenges

Some of the development challenges addressed during the project included:

### Authentication and Authorization

Designed protected API routes and role-based middleware so that authorization is enforced at the backend rather than only through the frontend.

### Production Database Migration

Configured MongoDB Atlas as the production database while maintaining a separate local development environment.

### Environment Configuration

Separated development and production API configuration using environment variables.

### Deployment Configuration

Connected:

```text
GitHub → Vercel
GitHub → Render
Render → MongoDB Atlas
Vercel → Render API
```

and configured CORS and production environment variables accordingly.

### Error Handling

Implemented centralized API error handling for common errors including:

* Invalid resource IDs
* Validation failures
* Duplicate records
* Invalid JSON
* Unauthorized requests
* Forbidden requests
* Unexpected server errors

---

# Skills Demonstrated

This project demonstrates practical experience in:

1. **Full-Stack Web Development**
   Building and connecting a React frontend with a Node.js/Express REST API and MongoDB database.

2. **REST API Development**
   Designing resource-based API routes, request validation, middleware, authentication, and error handling.

3. **Authentication & Security**
   Implementing JWT authentication, bcrypt password hashing, protected routes, role-based authorization, and account management.

4. **Database Design & Data Management**
   Designing Mongoose schemas and relationships for users, tickets, activities, comments, assignments, and resolution data.

5. **IT Service Management & Analytics**
   Translating real-world IT support workflows into software features and using ticket data to provide operational analytics.

6. **Production Deployment & DevOps**
   Deploying a full-stack application using GitHub, Vercel, Render, and MongoDB Atlas while managing environment variables and production configuration.

---

# Future Improvements

Potential future enhancements include:

* Improved mobile-first responsive design
* Advanced SLA monitoring and automated escalation
* Email notifications
* File attachments
* Knowledge base integration
* Advanced reporting and export functionality
* More detailed service-performance analytics
* Automated ticket categorization
* AI-assisted ticket classification
* AI-generated resolution suggestions
* Predictive incident analysis
* Advanced search and filtering

---

# Project Goals

The primary goal of this project was to build more than a basic CRUD ticketing application.

The project was designed to demonstrate how software can support real-world IT operations by combining:

```text
IT Support
     +
Application Development
     +
Database Management
     +
Authentication & Security
     +
Analytics
     +
Cloud Deployment
```

This makes the project applicable to roles involving **software development, application support, IT support, technical analysis, and data/operations analytics**.

---

# Author

**Haard Patel**

Bachelor of Science (Honours) in Computer Science
University of Saskatchewan

Regina, Saskatchewan, Canada

---

## License

This project is intended primarily as a portfolio and educational project.
