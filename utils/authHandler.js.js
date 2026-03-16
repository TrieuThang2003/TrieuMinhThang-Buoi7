let jwt = require('jsonwebtoken')
let userController = require('../controllers/users')
module.exports = {
    checkLogin: async function (req, res, next) {
        let token
        if (req.cookies.token) {
            token = req.cookies.token
        } else {
            token = req.headers.authorization;
            if (!token || !token.startsWith("Bearer")) {
                res.status(403).send("ban chua dang nhap")
                return;
            }
            token = token.split(' ')[1];
        }
        let result = jwt.verify(token, 'secret');
        if (result && result.exp * 1000 > Date.now()) {
            req.userId = result.id;
            next();
        } else {
            res.status(403).send("ban chua dang nhap")
        }
    },
    checkRole: function (...requiredRole) {
        return async function (req, res, next) {
            let userId = req.userId;
            let user = await userController.FindUserById(userId);
            let currentRole = user.role.name;
            if (requiredRole.includes(currentRole)) {
                next();
            } else {
                res.status(403).send({ message: "ban khong co quyen" });
            }
        }
    }
}