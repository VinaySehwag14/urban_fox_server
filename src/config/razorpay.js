const Razorpay = require('razorpay');
const config = require('./index');

let razorpayInstance;

if (config.razorpay.key_id && config.razorpay.key_secret) {
    razorpayInstance = new Razorpay({
        key_id: config.razorpay.key_id,
        key_secret: config.razorpay.key_secret,
    });
} else {
    // console.warn("Razorpay keys not found in configuration.");
}

module.exports = razorpayInstance;
