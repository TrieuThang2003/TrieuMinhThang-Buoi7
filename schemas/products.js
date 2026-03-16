let mongoose = require('mongoose');
let productSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        default: ""
    }, price: {
        type: Number,
        default: 0
    }, category: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        default: 'https://niteair.co.uk/wp-content/uploads/2023/08/default-product-image.png'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})
module.exports = mongoose.model('product', productSchema);