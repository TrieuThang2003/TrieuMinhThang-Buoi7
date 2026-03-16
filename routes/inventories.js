var express = require('express');
var router = express.Router();
let inventoryModel = require('../schemas/inventories')

router.get('/', async function (req, res, next) {
    let inventories = await inventoryModel.find({
    }).populate({
        path: 'product',
        select: 'title price'
    })
    res.send(inventories)
})
router.post('/increase-stock', async function (req, res, next) {
    let { product, quantity } = req.body;
    let getProduct = await inventoryModel.findOne({
        product: product
    })
    console.log(getProduct);
    if (getProduct) {
        getProduct.stock += quantity;
        await getProduct.save()
        res.send(getProduct)
    } else {
        res.status(404).send({
            message: "Product not found"
        })
    }

})
router.post('/decrease-stock', async function (req, res, next) {
    let { product, quantity } = req.body;
    let getProduct = await inventoryModel.findOne({
        product: product
    })
    if (getProduct) {
        if (getProduct.stock >= quantity) {
            getProduct.stock -= quantity;
            await getProduct.save()
            res.send(getProduct)
        } else {
            res.status(404).send({
                message: "Product khong du so luong"
            })
        }
    } else {
        res.status(404).send({
            message: "Product not found"
        })
    }

})
module.exports = router;