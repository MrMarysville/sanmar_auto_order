import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';

dotenv.config();

const client = new GraphQLClient(process.env.PRINTAVO_API_URL, {
    headers: {
        Authorization: `Bearer ${process.env.PRINTAVO_ACCESS_TOKEN}`,
    },
});

const clientPromise = Promise.resolve(client);

/**
 * Executes a GraphQL query or mutation
 * @param {string} query GraphQL query or mutation string
 * @param {Object} variables Query variables
 * @returns {Promise<Object>} GraphQL response data
 */
async function executeGraphQL(query, variables = {}) {
  try {
    const data = await client.request(query, variables);
    return data;
  } catch (error) {
    console.error('GraphQL Error:', error);
    throw error;
  }
}

export { clientPromise, executeGraphQL };
export default client;
