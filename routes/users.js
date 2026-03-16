var express = require("express");
var router = express.Router();
let { postUserValidator, validateResult } = require('../utils/validatorHandler')
let userController = require('../controllers/users')
let cartModel = require('../schemas/cart');
let { checkLogin, checkRole } = require('../utils/authHandler.js')


let userModel = require("../schemas/users");
const { default: mongoose } = require("mongoose");
//- Strong password

router.get("/", checkLogin,
  checkRole("ADMIN", "MODERATOR"), async function (req, res, next) {
    let users = await userModel
      .find({ isDeleted: false })
      .populate({
        'path': 'role',
        'select': "name"
      })
    res.send(users);
  });

router.get("/:id", checkLogin, async function (req, res, next) {
  try {
    let result = await userModel
      .find({ _id: req.params.id, isDeleted: false })
    if (result.length > 0) {
      res.send(result);
    }
    else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.post("/",  postUserValidator, validateResult,
  async function (req, res, next) {
    let session = await mongoose.startSession()
    let transaction = session.startTransaction()
    try {
      let newItem = await userController.CreateAnUser(
        req.body.username,
        req.body.password,
        req.body.email,
        req.body.role,
        session
      )
      let newCart = new cartModel({
        user: newItem._id
      })
      let result = await newCart.save({ session })
      result = await result.populate('user')
      session.commitTransaction();
      session.endSession()
      res.send(result)
    } catch (err) {
      session.abortTransaction()
      session.endSession()
      res.status(400).send({ message: err.message });
    }
  });

router.put("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findById(id);
    for (const key of Object.keys(req.body)) {
      updatedItem[key] = req.body[key];
    }
    await updatedItem.save();

    if (!updatedItem) return res.status(404).send({ message: "id not found" });

    let populated = await userModel
      .findById(updatedItem._id)
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;