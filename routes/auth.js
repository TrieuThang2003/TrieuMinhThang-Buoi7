var express = require('express');
var router = express.Router();
let userController = require('../controllers/users');
let jwt = require('jsonwebtoken')
let bcrypt = require('bcrypt')
let { checkLogin } = require('../utils/authHandler.js')
let { changePasswordValidator, validateResult, resetPasswordValidator } = require('../utils/validatorHandler')
let crypto = require('crypto')
let mailHandler = require('../utils/sendMailHandler')

/* GET home page. */
//localhost:3000
router.post('/register', async function (req, res, next) {
    let newUser = await userController.CreateAnUser(
        req.body.username,
        req.body.password,
        req.body.email,
        "69a5462f086d74c9e772b804"
    )
    res.send({
        message: "dang ki thanh cong"
    })
});
router.post('/login', async function (req, res, next) {
    let result = await userController.QueryByUserNameAndPassword(
        req.body.username, req.body.password
    )
    if (result) {
        let token = jwt.sign({
            id: result.id
        }, 'secret', {
            expiresIn: '1h'
        })
        res.cookie("token", token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true
        });
        res.send(token)
    } else {
        res.status(404).send({ message: "sai THONG TIN DANG NHAP" })
    }

});
router.get('/me', checkLogin, async function (req, res, next) {
    console.log(req.userId);
    let getUser = await userController.FindUserById(req.userId);
    res.send(getUser);
})
router.post('/logout', checkLogin, function (req, res, next) {
    res.cookie('token', null, {
        maxAge: 0,
        httpOnly: true
    })
    res.send("da logout ")
})
router.post('/changepassword', checkLogin, changePasswordValidator, validateResult, async function (req, res, next) {
    let { oldpassword, newpassword } = req.body;
    let user = await userController.FindUserById(req.userId);
    console.log(user);
    if (bcrypt.compareSync(oldpassword, user.password)) {
        user.password = newpassword;
        await user.save();
        res.send("password da duoc thay doi")
    } else {
        res.status(404).send("old password sai")
    }

})
router.post('/forgotpassword', async function (req, res, next) {
    let email = req.body.email;
    let user = await userController.FindUserByEmail(email);
    if (!user) {
        res.status(404).send({
            message: "email khong ton tai"
        })
        return;
    }
    user.forgotpasswordToken = crypto.randomBytes(21).toString('hex');
    user.forgotpasswordTokenExp = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    let URL = 'http://localhost:3000/api/v1/auth/resetpassword/'+ user.forgotpasswordToken;
    mailHandler.sendMail(user.email,URL);
    res.send("check mail")
})
router.post('/resetpassword/:token',resetPasswordValidator,validateResult, async function (req, res, next) {
    let password = req.body.password;
    let token =req.params.token;
    let user = await userController.FindUserByToken(token);
    if(!user){
        res.status(404).send("token reset password sai");
        return;
    }
    user.password = password;
    user.forgotpasswordToken = null;
    user.forgotpasswordTokenExp = null;
    await user.save()
    res.send("update password thanh cong")

})






module.exports = router;
