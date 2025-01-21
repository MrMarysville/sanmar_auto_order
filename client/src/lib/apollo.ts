import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { onError } from '@apollo/client/link/error'

// Validate environment variables
const validateEnvVariables = () => {
  const required = {
    'PRINTAVO_API_URL': import.meta.env.PRINTAVO_API_URL,
    'PRINTAVO_ACCESS_TOKEN': import.meta.env.PRINTAVO_ACCESS_TOKEN,
    'PRINTAVO_EMAIL': import.meta.env.PRINTAVO_EMAIL,
  }

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

// Validate environment variables immediately
validateEnvVariables()

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    })
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`)
  }
})

const httpLink = createHttpLink({
  uri: import.meta.env.PRINTAVO_API_URL,
  headers: {
    'X-Access-Token': import.meta.env.PRINTAVO_ACCESS_TOKEN,
    'X-User-Email': import.meta.env.PRINTAVO_EMAIL,
  }
})

export const apolloClient = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          orders: {
            // Proper pagination merge function
            keyArgs: false,
            merge(existing = { edges: [] }, incoming) {
              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              }
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
}) 