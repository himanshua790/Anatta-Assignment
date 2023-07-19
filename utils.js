const dotenv = require("dotenv");
dotenv.config();
const axios = require("axios");

async function fetchProducts(query, first) {
  console.log(`\nquery: ${query}, first:${first}\n`);

  const batchSize = 50;
  const batches = createBatches(first, batchSize);
  const output = [];

  const fetchBatch = async (query, first, after = null) => {
    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `https://${process.env.SHOP}/api/2023-07/graphql.json`,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token":
          process.env.STOREFRONT_ACCESS_TOKEN,
      },
    };

    const variables = {
      query,
      first,
      after,
    };

    const data = JSON.stringify({
      query: `query searchProducts($query: String!, $first: Int, $after: String) {
            search(query: $query, first: $first, after: $after, types: PRODUCT) {
              edges {
                cursor
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
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
          `,
      variables,
    });

    try {
      const response = await axios.request({ ...config, data });
      if (response?.status === 200) {
        const searchResults = response?.data?.data?.search;
        if (searchResults) {
          const hasNextPage = searchResults?.pageInfo?.hasNextPage;
          const endCursor = searchResults?.pageInfo?.endCursor;
          return {
            data: searchResults?.edges?.map((n) => n?.node) || [],
            endCursor,
            hasNextPage,
          };
        }
      }
    } catch (error) {
      console.error("Error fetching records:", error.message);
    }
    return [];
  };

  async function fetchAllBatches() {
    let endCursor = null;
    for (const batchSize of batches) {
      const {
        data: result,
        endCursor: rawCursor,
        hasNextPage,
      } = await fetchBatch(query, batchSize, endCursor);
      output.push(...result);
      endCursor = rawCursor;
      if (!hasNextPage) break;
    }
  }

  await fetchAllBatches();

  return output;
}

function fetchDataFromProducts(products) {
  return products?.map((product) => ({
    title: product?.title,
    variant: product?.variants?.edges?.[0]?.node?.title || {},
    price: Number(product?.variants?.edges?.[0]?.node?.price?.amount) || 0,
  }));
}

function createBatches(totalRecordsToFetch, paginationLimit) {
  const batches = [];
  let remainingRecords = totalRecordsToFetch;

  while (remainingRecords > 0) {
    const batchSize = Math.min(remainingRecords, paginationLimit);
    batches.push(batchSize);
    remainingRecords -= batchSize;
  }

  return batches;
}

module.exports = { fetchProducts, fetchDataFromProducts };
