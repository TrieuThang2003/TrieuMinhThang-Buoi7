var express = require('express');
var router = express.Router();
let { checkLogin, checkRole } = require('../utils/authHandler.js')
let cartModel = require('../schemas/cart')

router.get('/', checkLogin, async function (req, res, next) {
    let userId = req.userId;
    let currentCart = await cartModel.findOne({
        user: userId
    });
    res.send(currentCart.items)
})
router.post('/add-items', checkLogin, async function (req, res, next) {
    let userId = req.userId;
    let { product, quantity } = req.body;
    let currentCart = await cartModel.findOne({
        user: userId
    });
    let index = currentCart.items.findIndex(
        function (e) {
            return e.product == product;
        }
    )
    if (index < 0) {
        currentCart.items.push({
            product: product,
            quantity: quantity
        });
    } else {
        currentCart.items[index].quantity += quantity
    }
    await currentCart.save()
    res.send(currentCart)
})
router.post('/decrease-items', checkLogin, async function (req, res, next) {
    let userId = req.userId;
    let { product, quantity } = req.body;
    let currentCart = await cartModel.findOne({
        user: userId
    });
    let index = currentCart.items.findIndex(
        function (e) {
            return e.product == product;
        }
    )
    if (index < 0) {

    } else {
        if (currentCart.items[index].quantity > quantity) {
            currentCart.items[index].quantity -= quantity
        } else {
            if (currentCart.items[index].quantity == quantity) {
                currentCart.items.splice(index, 1)
            }
        }
    }
    await currentCart.save()
    res.send(currentCart)
})

module.exports = router;