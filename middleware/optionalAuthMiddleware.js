
const jwt = require("jsonwebtoken");

function optionalAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        req.user = null;
        return next();
    }

    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Invalid authorization header!"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET_KEY
        );

        req.user = decoded;
        return next();
    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired token!"
        });
    }
}

module.exports = optionalAuthMiddleware;
