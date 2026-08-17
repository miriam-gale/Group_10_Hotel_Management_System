# Grand Horizon Hotel Management System

A full-stack Hotel Reservation and Event Management System developed using HTML, CSS, JavaScript, Node.js, Express, and MariaDB/MySQL.

## Project Structure

```text
Group_10_Hotel_Management_System/
│
├── frontend/                    # Main integrated application frontend
│   ├── css/                     # Stylesheets
│   ├── js/                      # Frontend JavaScript
│   ├── pages/                   # Application pages
│   └── index.html               # Main entry page
│
├── client/                      # Customer portal
│   ├── css/
│   ├── js/
│   └── index.html
│
├── manager/                     # Staff/manager portal
│   ├── css/
│   ├── js/
│   └── index.html
│
├── server/                      # Node.js/Express backend
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   └── index.js
│
├── Database/                    # Database scripts
│   ├── create_database.sql
│   ├── create_tables.sql
│   ├── insert_data.sql
│   ├── queries.sql
│   ├── views.sql
│   ├── procedures.sql
│   └── triggers.sql
│
├── Documentation/              # Project documentation
├── Screenshots/                # Project screenshots
├── Video/                      # Project demonstration video
├── Application/                # Application source code for submission
│
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md