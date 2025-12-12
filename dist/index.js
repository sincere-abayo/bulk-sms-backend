"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const migrations_1 = require("./database/migrations");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
// Middleware
app.use((0, cors_1.default)({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
// Routes
app.get('/', (req, res) => {
    res.send('Bulk SMS App Backend API');
});
app.use('/api/auth', auth_1.default);
// Initialize database and start server
const startServer = async () => {
    try {
        await (0, migrations_1.createTables)();
        await (0, migrations_1.runMigrations)();
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
