"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = void 0;
const auth_1 = require("../utils/auth");
const authenticateUser = (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const userId = (0, auth_1.verifyToken)(token);
        if (!userId) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.userId = userId;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
};
exports.authenticateUser = authenticateUser;
