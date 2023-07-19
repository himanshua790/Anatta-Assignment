// Configure commandline arguments
const { program } = require("commander");
const { fetchProducts, fetchDataFromProducts } = require("./utils");
program.option("-d, --debug", "output extra debugging"); // debug commandline arguments
program.requiredOption("-n, --name [letters...]", "Query string"); // Name as mandatory argument
program.option("-f, --first <number>", "Number of entities to fetch", 5); // Total number of records to fetch, 5 is default
program.parse(process.argv);

const options = program.opts();
if (options.debug) console.log(options);

async function main() {
  try {
    const products = await fetchProducts(
      options?.name?.join(""),
      Number(options?.first)
    );
    const extractedInfo = fetchDataFromProducts(products);
    const output = extractedInfo
      ?.map(
        (info) => `${info?.title} - Variant ${info?.variant} - $${info?.price}`
      )
      .join("\n");
    console.log(output, "\n\n\n", extractedInfo?.length);
  } catch (error) {
    console.log(error);
  }
}

main();
