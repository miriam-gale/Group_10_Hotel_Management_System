# Grand Horizon Hotel Management System

A full-stack Hotel Reservation and Event Management System developed using HTML, CSS, JavaScript, Node.js, Express, and MariaDB/MySQL.

## Project Structure

```text
Group_10_Hotel_Management_System/
│
├── frontend/                 # Finalized frontend interfaces
│   ├── css/
│   ├── js/
│   ├── pages/
│   └── index.html
│
├── client/                   # Customer portal
│   ├── css/
│   ├── js/
│   └── index.html
│
├── manager/                  # Staff/Manager portal
│   ├── css/
│   ├── js/
│   └── index.html
│
├── server/                   # Node.js/Express backend
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   └── index.js
│
├── database/                 # Database scripts
│   ├── hotel_db_ddl.sql
│   ├── hotel_db_dml.sql
│   └── hotel_db_queries.sql
│
├── package.json
├── package-lock.json
├── .env.example
└── .gitignore

Technologies Used
HTML5
CSS3
JavaScript
Node.js
Express.js
MariaDB/MySQL
JWT Authentication
bcrypt
REST API
User Roles

The system supports:

Customer
Administrator
Event Staff
Finance/Billing Staff

The staff roles are handled through the manager portal and role-based authentication.

Requirements

Before running the system, install:

Node.js
npm
MariaDB/MySQL
Git
Installation
1. Clone the repository

Use the finalized branch:

git clone -b miriam-frontend https://github.com/miriam-gale/Group_10_Hotel_Management_System.git

Then:

cd Group_10_Hotel_Management_System
2. Install Node dependencies
npm install
3. Set up the database

Create/import the database using the SQL files in the database folder.

Run:

database/hotel_db_ddl.sql

first, followed by:

database/hotel_db_dml.sql

The DDL creates the database structure and the DML populates it with data.

hotel_db_queries.sql contains additional queries used for database operations/testing.

4. Configure environment variables

Create a .env file in the project root based on .env.example.

Example:

PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=grand_horizon_hotel
JWT_SECRET=your_secret_key
MANAGER_USER=manager
MANAGER_PASS=manager123

Use your own local database credentials.

Do not commit the .env file to GitHub.

5. Start the application
npm start

The server will run on:

http://localhost:3000

Open:

http://localhost:3000

to access the application.

Backend API

The backend provides API routes for:

/api/auth
/api/rooms
/api/reservations
/api/events
/api/invoices
/api/feedback
/api/reports
Database

The application uses the grand_horizon_hotel database.

The database contains the tables and relationships required for:

Customers
Staff
Rooms
Room categories
Reservations
Events
Halls
Invoices
Payments
Feedback
Reports
Development

To start the application:

npm start

For development with automatic server restart:

npm run dev
Important Git Instructions

The miriam-frontend branch contains the current integrated version of the project.

Team members should clone/use:

git clone -b miriam-frontend https://github.com/miriam-gale/Group_10_Hotel_Management_System.git

Do not merge the old peter-frontend branch into miriam-frontend unless the team agrees on specific changes that need to be transferred.

Notes

Each team member should create their own .env file using .env.example.

Do not upload passwords, database credentials, or other secrets to GitHub.
