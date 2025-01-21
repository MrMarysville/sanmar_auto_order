import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { GET_ORDERS, CREATE_ORDER, DELETE_ORDER } from '@/graphql/queries'
import { ApolloTest } from '@/components/ApolloTest'
import ChatWidget from '@/components/ChatWidget'
// Temporarily remove ScrollArea until we can install it
// import { ScrollArea } from '../components/ui/scroll-area'

interface OrderNode {
  id: string
  createdAt: string
  status: string
  customerDueAt: string
  tags: string[]
  lineItemGroups: {
    edges: Array<{
      node: {
        id: string
        name: string
        lineItems: {
          edges: Array<{
            node: {
              id: string
              name: string
              sku: string
              quantity: number
              price: number
            }
          }>
        }
      }
    }>
  }
}

interface OrdersData {
  orders: {
    edges: Array<{
      node: OrderNode
    }>
    pageInfo: {
      hasNextPage: boolean
      endCursor: string
    }
  }
}

function App() {
  const [error, setError] = useState<string | null>(null)

  const { loading, data, refetch } = useQuery<OrdersData>(GET_ORDERS, {
    variables: { first: 10 },
    onError: (error) => setError(error.message)
  })

  const [createOrder] = useMutation(CREATE_ORDER, {
    onCompleted: () => refetch(),
    onError: (error) => setError(error.message)
  })

  const [deleteOrder] = useMutation(DELETE_ORDER, {
    onCompleted: () => refetch(),
    onError: (error) => setError(error.message)
  })

  const handleCreateOrder = async () => {
    try {
      await createOrder({
        variables: {
          input: {
            status: 'pending',
            customerDueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Due in 7 days
            tags: ['auto-created']
          }
        }
      })
    } catch (err) {
      // Error is handled by onError callback
    }
  }

  const handleDeleteOrder = async (id: string) => {
    try {
      await deleteOrder({
        variables: { id }
      })
    } catch (err) {
      // Error is handled by onError callback
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const orders = data?.orders.edges.map(edge => edge.node) || []

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">SanMar Auto Order</h1>
          <Button onClick={handleCreateOrder}>Create New Order</Button>
        </div>
      </header>

      {/* Connection Test */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <ApolloTest />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-auto h-[calc(100vh-200px)]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Order #{order.id}</CardTitle>
                      <CardDescription>
                        Created: {new Date(order.createdAt).toLocaleDateString()}
                        <br />
                        Due: {new Date(order.customerDueAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Status</span>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Items</span>
                      <span>
                        {order.lineItemGroups.edges.reduce(
                          (total, group) => total + group.node.lineItems.edges.length,
                          0
                        )}
                      </span>
                    </div>
                    {order.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {order.tags.map(tag => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    <Button variant="outline" className="w-full mt-4">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  )
}

export default App
