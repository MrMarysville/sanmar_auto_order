import { useQuery, gql } from '@apollo/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const TEST_QUERY = gql`
  query TestConnection {
    account {
      id
      companyName
      companyEmail
    }
  }
`

interface TestData {
  account: {
    id: string
    companyName: string
    companyEmail: string
  }
}

export function ApolloTest() {
  const { loading, error, data } = useQuery<TestData>(TEST_QUERY)

  if (loading) {
    return <div>Testing connection...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Connection Error</AlertTitle>
        <AlertDescription>
          {error.message}
          <br />
          <small className="block mt-2 text-xs">
            Please check your environment variables and API credentials.
          </small>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="default">
      <AlertTitle>Connected Successfully</AlertTitle>
      <AlertDescription>
        Connected to: {data?.account.companyName}
        <br />
        Account Email: {data?.account.companyEmail}
      </AlertDescription>
    </Alert>
  )
} 