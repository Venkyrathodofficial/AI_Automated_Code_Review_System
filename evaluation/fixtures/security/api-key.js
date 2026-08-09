const API_KEY = "sk_test_mocked_stripe_key_12345";
const github_token = "ghp_mocked_github_token_12345";

function connectToStripe() {
  const stripe = require('stripe')(API_KEY);
  return stripe;
}
