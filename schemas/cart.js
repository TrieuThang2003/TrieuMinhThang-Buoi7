let mongoose = require('mongoose');
let itemCartSchema = mongoose.Schema({
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'product',
    },
    quantity: {
        type: Number,
        min: 1,
        default: 1
    }
}, {
    _id: false
})
let cartSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'user',
        unique: true,
        require: true
    },
    items: {
        type: [itemCartSchema],
        default: []
    }
})

module.exports = new mongoose.model('cart', cartSchema)