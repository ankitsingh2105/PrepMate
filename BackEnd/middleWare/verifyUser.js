const jwt = require('jsonwebtoken');

const JWT_SECRET = 'ankit';

const verifyUserMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    console.log("cookie shit :: " , token);

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }

        req.user = decoded; 
        next();
    });
};

module.exports = verifyUserMiddleware;
