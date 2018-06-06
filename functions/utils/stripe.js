const functions = require("firebase-functions");
const logging = require("@google-cloud/logging")();
const stripe = require("stripe")(functions.config().stripe.token);
const currency = "GBP";

exports.createStripeCustomer = user => {
  return stripe.customers.create({
    email: user.email
  });
};

exports.createStripeSource = (customer, params) =>
  stripe.customers.createSource(customer, { source });

exports.createStripeCharge = (charge, idempotency_key) =>
  stripe.charges.create(charge, { idempotency_key });