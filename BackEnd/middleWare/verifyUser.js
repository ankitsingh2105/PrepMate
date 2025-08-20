const jwt = require('jsonwebtoken');

const JWT_SECRET = 'ankit';

const verifyUserMiddleware = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        // 401 for unauthorised - authentication
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            // 403 for forbidden - authorisation
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }
        req.user = decoded; 
        next();
    });
};

module.exports = verifyUserMiddleware;
