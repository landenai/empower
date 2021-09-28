require('dotenv').config();
const Sentry = require('@sentry/node');

// Knex is the database query builder used in the GCP docs, which
// is why we are using it here. See docs:
// https://cloud.google.com/sql/docs/postgres/connect-app-engine-standard#node.js
const knex = openDBConnection();
const sleepTime = 0.2;

const getProducts = async function() {
  let results = [];
  try {
    // Retrieve Products
    let transaction = Sentry.getCurrentHub()
      .getScope()
      .getTransaction();
    let span = transaction.startChild({ op: 'getproducts', description: 'db.query'});
    const productsQuery = `SELECT *, pg_sleep(${sleepTime}) FROM products`;
    const subspan = span.startChild({op: 'fetch products', description: productsQuery});
    const products = await knex.raw(productsQuery)
      .catch((err) => {
        console.log("There was an error", err);
        throw err;
      })
    Sentry.setTag("totalProducts", products.rows.length);
    span.setData("Products", products.rows);
    subspan.finish();
    span.finish();

    // Retrieve Reviews
    span = transaction.startChild({ op: 'getproducts.reviews', description: 'db.query'});
    let formattedProducts = [];
    for(product of products.rows) {
      const reviewsQuery = `SELECT *, pg_sleep(0.25) FROM reviews WHERE productId = ${product.id}`;
      const subspan = span.startChild({op: 'fetch review', description: reviewsQuery});
      const retrievedReviews = await knex.raw(reviewsQuery);
      let productWithReviews = product;
      productWithReviews['reviews'] = retrievedReviews.rows;
      formattedProducts.push(productWithReviews);
      subspan.setData("Reviews", retrievedReviews.rows);
      subspan.finish();
    }
    span.setData("Products With Reviews", formattedProducts);
    span.finish();
    transaction.finish();
    return formattedProducts;
  } catch(error) {
    Sentry.captureException(error);
    throw error;
  }
}

const getJoinedProducts = async function() {
  let transaction = Sentry.startTransaction({ name: 'get joined products' });
  let span = transaction.startChild({ op: 'getjoinedproducts', description: 'db.query' });

  // Retrieve Products
  const products = await knex.raw(`SELECT * FROM products`)
      .catch((err) => {
        console.log("There was an error", err);
        throw err;
      })
  Sentry.setTag("totalProducts", products.rows.length);
  span.setData("Products", products.rows)
  span.finish();
  transaction.finish();

  // Retrieve Reviews
  transaction = Sentry.startTransaction({ name: 'get joined product reviews'});
  span = transaction.startChild({ op: 'getjoinedproducts.reviews', description: 'db.query' });
  let formattedProducts = [];
  for(product of products.rows) {
    const retrievedReviews = await knex.raw(
      "SELECT reviews.id, products.id AS productid, reviews.rating, reviews.customerId, reviews.description, reviews.created FROM reviews INNER JOIN products ON reviews.productId = products.id"
    );
    span.setData("reviews", retrievedReviews.rows);
    let productWithReviews = product;
    productWithReviews['reviews'] = retrievedReviews.rows;
    formattedProducts.push(productWithReviews);
  }
  span.setData("results", formattedProducts);
  span.finish();
  transaction.finish();
  return formattedProducts;
}

const getInventory = async function(cart) {
  console.log("> getting inventory");
  const quantities = cart['quantities'];
  console.log("> quantities", quantities);
  let productIds = [];
  for(productId in quantities) {
    productIds.push(productId)
  }
  productIds = formatArray(productIds);
  console.log("> productIds", productIds);
  try {
    let transaction = Sentry.startTransaction({ name: 'get inventory' });
    let span = transaction.startChild({ op: 'get_inventory', description: 'db.query' });
    const inventory = await knex.raw(
      `SELECT * FROM inventory WHERE productId in ${productIds}`
    )
    span.setData("inventory", inventory.rows);
    return inventory.rows
  } catch(error) {
    Sentry.captureException(error);
    throw err;
  }
}

function formatArray(ids) {
  let numbers = "";
  for(id of ids) {
    numbers += (id + ",");
  }
  const output = "(" + numbers.substring(0, numbers.length - 1) + ")";
  return output;
}

function openDBConnection() {
  const transaction = Sentry.startTransaction({ name: 'open db connection' });
  const span = transaction.startChild({ op: 'getproducts', description: 'db.connect'})
  const db = require('knex')({
    client: 'pg',
    connection: {
      user: process.env.USERNAME,
      password: process.env.PASSWORD,
      database: process.env.DATABASE,
      host: process.env.CLOUD_SQL_CONNECTION_IP
    }
  });
  span.finish();
  transaction.finish();
  return db;
}

module.exports = { getProducts, getJoinedProducts, getInventory }