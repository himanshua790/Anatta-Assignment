const dotenv = require("dotenv");
dotenv.config();
const axios = require("axios");

async function fetchProducts(query, first) {
  console.log(`\nquery: ${query}, first:${first}\n`);
  const data = JSON.stringify({
    query: `query searchProducts($query: String!, $first: Int) {
      search(query: $query, first: $first, types: PRODUCT) {
        edges {
          node {
            ... on Product {
              id
              title
              variants(first: 1) {
    
                edges {
                  node {
                    title
                    
                    price {
                      amount
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    `,
    variables: { query, first },
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `https://${process.env.SHOP}/api/2023-07/graphql.json`,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": process.env.STOREFRONT_ACCESS_TOKEN,
    },
    data: data,
  };

  const resp = await axios.request(config);
  return resp?.data?.data?.search?.edges?.map((n) => n?.node) || [];
}
function fetchDataFromProducts(products) {
  return products?.map((product) => ({
    title: product?.title,
    variant: product?.variants?.edges?.[0]?.node?.title || {},
    price: Number(product?.variants?.edges?.[0]?.node?.price?.amount) || 0,
  }));
}
module.exports = { fetchProducts, fetchDataFromProducts };
