require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// ACTUAL FRONTEND
// ============================================================
const frontendPath = path.join(__dirname, '../frontend');

app.use(express.static(frontendPath));

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/rooms',        require('./routes/rooms'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/events',       require('./routes/events'));
app.use('/api/invoices',     require('./routes/invoices'));
app.use('/api/feedback',     require('./routes/feedback'));
app.use('/api/customer',     require('./routes/customer-dashboard'));
app.use('/api/reports',      require('./routes/reports'));

// ============================================================
// ROOT → ACTUAL FRONTEND
// ============================================================
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ============================================================
// 404 HANDLER
// ============================================================
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found.'
    });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        error: 'Internal server error.'
    });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log(`\n🏨 Grand Horizon Hotel Server running on http://localhost:${PORT}`);
    console.log(`   Frontend → http://localhost:${PORT}`);
    console.log(`   API      → http://localhost:${PORT}/api\n`);
});