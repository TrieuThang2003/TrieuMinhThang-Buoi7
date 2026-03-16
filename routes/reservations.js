var express = require("express");
var router = express.Router();
let { checkLogin } = require('../utils/authHandler.js')
let reservationModel = require('../schemas/reservations')
let cartModel = require('../schemas/cart')
let productModel = require('../schemas/products')
let inventoryModel = require('../schemas/inventories')
let mongoose = require("mongoose");

// GET all reservations of current user
router.get('/', checkLogin, async function (req, res, next) {
    try {
        let userId = req.userId;
        let reservations = await reservationModel.find({ user: userId });
        res.send(reservations);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// GET one reservation by id of current user
router.get('/:id', checkLogin, async function (req, res, next) {
    try {
        let userId = req.userId;
        let reservationId = req.params.id;
        let reservation = await reservationModel.findOne({ _id: reservationId, user: userId });
        if (!reservation) {
            return res.status(404).send({ message: "Reservation not found" });
        }
        res.send(reservation);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// POST reserveACart - reserve all items in user's cart
router.post('/reserveACart', checkLogin, async function (req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        let userId = req.userId;
        let cart = await cartModel.findOne({ user: userId }).session(session);

        if (!cart || cart.items.length === 0) {
            throw new Error("Cart is empty");
        }

        let totalAmount = 0;
        let reservationItems = [];

        for (let item of cart.items) {
            let product = await productModel.findById(item.product).session(session);
            if (!product) throw new Error(`Product not found: ${item.product}`);

            let inventory = await inventoryModel.findOne({ product: item.product }).session(session);
            if (!inventory) throw new Error(`Inventory not found for product: ${product.title}`);

            if (inventory.stock < item.quantity) {
                throw new Error(`Not enough stock for product: ${product.title}`);
            }

            inventory.stock -= item.quantity;
            inventory.reserved += item.quantity;
            await inventory.save({ session });

            let subtotal = product.price * item.quantity;
            totalAmount += subtotal;
            reservationItems.push({
                product: item.product,
                quantity: item.quantity,
                price: product.price,
                subtotal: subtotal
            });
        }

        let existingReservation = await reservationModel.findOne({ user: userId, status: "actived" }).session(session);
        if (existingReservation) {
            // Hoàn trả inventory của reservation cũ
            for (let item of existingReservation.items) {
                let inventory = await inventoryModel.findOne({ product: item.product }).session(session);
                if (inventory) {
                    inventory.stock += item.quantity;
                    inventory.reserved -= item.quantity;
                    await inventory.save({ session });
                }
            }
            existingReservation.items = reservationItems;
            existingReservation.totalAmount = totalAmount;
            existingReservation.ExpiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await existingReservation.save({ session });
            await session.commitTransaction();
            session.endSession();
            return res.send(existingReservation);
        }

        let newReservation = new reservationModel({
            user: userId,
            items: reservationItems,
            totalAmount: totalAmount,
            status: "actived",
            ExpiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        await newReservation.save({ session });
        await session.commitTransaction();
        session.endSession();
        res.send(newReservation);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).send({ message: err.message });
    }
});

// POST reserveItems - reserve from a list of {productId, quantity}
router.post('/reserveItems', checkLogin, async function (req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        let userId = req.userId;
        let { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error("items array is required");
        }

        let totalAmount = 0;
        let reservationItems = [];

        for (let item of items) {
            let { productId, quantity } = item;
            if (!productId || !quantity || quantity < 1) {
                throw new Error("Each item must have productId and quantity >= 1");
            }

            let product = await productModel.findById(productId).session(session);
            if (!product) throw new Error(`Product not found: ${productId}`);

            let inventory = await inventoryModel.findOne({ product: productId }).session(session);
            if (!inventory) throw new Error(`Inventory not found for product: ${product.title}`);

            if (inventory.stock < quantity) {
                throw new Error(`Not enough stock for product: ${product.title}`);
            }

            inventory.stock -= quantity;
            inventory.reserved += quantity;
            await inventory.save({ session });

            let subtotal = product.price * quantity;
            totalAmount += subtotal;
            reservationItems.push({
                product: productId,
                quantity: quantity,
                price: product.price,
                subtotal: subtotal
            });
        }

        let existingReservation = await reservationModel.findOne({ user: userId, status: "actived" }).session(session);
        if (existingReservation) {
            for (let item of existingReservation.items) {
                let inventory = await inventoryModel.findOne({ product: item.product }).session(session);
                if (inventory) {
                    inventory.stock += item.quantity;
                    inventory.reserved -= item.quantity;
                    await inventory.save({ session });
                }
            }
            existingReservation.items = reservationItems;
            existingReservation.totalAmount = totalAmount;
            existingReservation.ExpiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await existingReservation.save({ session });
            await session.commitTransaction();
            session.endSession();
            return res.send(existingReservation);
        }

        let newReservation = new reservationModel({
            user: userId,
            items: reservationItems,
            totalAmount: totalAmount,
            status: "actived",
            ExpiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        await newReservation.save({ session });
        await session.commitTransaction();
        session.endSession();
        res.send(newReservation);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).send({ message: err.message });
    }
});

// POST cancelReserve/:id - cancel a reservation (trong transaction)
router.post('/cancelReserve/:id', checkLogin, async function (req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        let userId = req.userId;
        let reservationId = req.params.id;

        let reservation = await reservationModel.findOne({ _id: reservationId, user: userId }).session(session);
        if (!reservation) throw new Error("Reservation not found");
        if (reservation.status !== "actived") throw new Error("Only actived reservation can be cancelled");

        // Hoàn trả inventory
        for (let item of reservation.items) {
            let inventory = await inventoryModel.findOne({ product: item.product }).session(session);
            if (inventory) {
                inventory.stock += item.quantity;
                inventory.reserved -= item.quantity;
                await inventory.save({ session });
            }
        }

        reservation.status = "cancelled";
        await reservation.save({ session });

        await session.commitTransaction();
        session.endSession();
        res.send(reservation);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;
