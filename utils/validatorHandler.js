let { body, validationResult } = require('express-validator')
let util = require('util')
let options = {
    password: {
        minLength: 8,
        minLowercase: 1,
        minSymbols: 1,
        minUppercase: 1,
        minNumbers: 1
    }
}

module.exports = {
    postUserValidator: [
        body("email").isEmail().withMessage("email khong dung dinh dang"),
        body("password").isStrongPassword(options.password).withMessage(
            util.format("password dai it nhat %d, co it nhat %d so,%d chu viet hoa, %d chu viet thuong va %d ki tu",
                options.password.minLength,
                options.password.minNumbers,
                options.password.minUppercase,
                options.password.minLowercase,
                options.password.minSymbols,
            ))
    ],
    changePasswordValidator: [
        body('oldpassword').notEmpty().withMessage("oldpassword khong duoc null"),
        body('newpassword').notEmpty().withMessage("newpassword khong duoc null").bail()
            .isStrongPassword(options.password).withMessage(
                util.format("password dai it nhat %d, co it nhat %d so,%d chu viet hoa, %d chu viet thuong va %d ki tu",
                    options.password.minLength,
                    options.password.minNumbers,
                    options.password.minUppercase,
                    options.password.minLowercase,
                    options.password.minSymbols,
                ))
        //,body('url').optional().isURL().withMessage("url phai dung dinh dang")
    ]
    ,
    resetPasswordValidator: [
        body('password').notEmpty().withMessage("newpassword khong duoc null").bail()
            .isStrongPassword(options.password).withMessage(
                util.format("password dai it nhat %d, co it nhat %d so,%d chu viet hoa, %d chu viet thuong va %d ki tu",
                    options.password.minLength,
                    options.password.minNumbers,
                    options.password.minUppercase,
                    options.password.minLowercase,
                    options.password.minSymbols,
                ))
        //,body('url').optional().isURL().withMessage("url phai dung dinh dang")
    ],
    validateResult: function (req, res, next) {
        let result = validationResult(req);
        if (result.errors.length > 0) {
            res.send(result.errors.map(
                function (e) {
                    return {
                        field: e.path,
                        message: e.msg
                    }
                }
            ));
        } else {
            next()
        }
    }
}