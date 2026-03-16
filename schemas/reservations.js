let mongoose = require('mongoose');

let ItemOfReservation = mongoose.Schema({
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'product',
    },
    quantity: {
        type: Number,
        min: 1,
        default: 1
    },
    price: {
        type: Number,
        min: 1
    },
    subtotal: {
        type: Number,
        min: 1
    }
}, {
    _id: false
})
let reservationSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'user',
        unique: true,
        require: true
    },
    items: {
        type: [ItemOfReservation],
        default: []
    },
    totalAmount: {
        type: Number,
        min: 0
    },
    status: {
        type: String,
        enum: ["actived", "expired", "cancelled", "paid"],
        default: "actived"
    },
    ExpiredAt: {
        type: Date
    }
}, {
    timestamps: true
})
module.exports = new mongoose.model('reservation',reservationSchema)