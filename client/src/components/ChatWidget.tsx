import React, { useState, useRef, FormEvent } from 'react'

// Sample interface for chat messages
interface Message {
  role: 'user' | 'assistant'
  content: string
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Toggles the chat widget open/closed
  const toggleChat = () => setIsOpen(!isOpen)

  // Sends a text message to the AI assistant
  const sendMessage = async (message: string) => {
    if (!message.trim()) return

    // Append user message to local chat
    setMessages(prev => [...prev, { role: 'user', content: message }])
    setUserInput('')
    setIsLoading(true)

    try {
      // Send message and conversation history to AI assistant
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userMessage: message,
          // Send last 10 messages for context
          conversationHistory: messages.slice(-10)
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to get response from AI assistant')
      }
      
      const data = await response.json()

      // Append assistant reply
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])

      // If user triggered "create a quote for me (printavo)", handle required steps here
      // This is just an example of detecting that special command
      if (message.toLowerCase().includes('create a quote for me (printavo)')) {
        // Prompt the user for further info if needed
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content:
              'Sure! Could you provide the customer contact email, product details, and any specific due date?'
          }
        ])
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error: ' + (error.message || 'Failed to get response')
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Uploads file to backend for OCR processing and data parsing
  const handleFileChange = async () => {
    if (!fileInputRef.current?.files?.length) return
    setIsLoading(true)

    const formData = new FormData()
    formData.append('file', fileInputRef.current.files[0])

    try {
      // Send file to your backend, which should handle OCR
      const response = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData
      })
      if (!response.ok) {
        throw new Error('Unable to parse document.')
      }
      const data = await response.json()

      // Show the AI assistant's interpretation in the chat
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `File processed! Here's a summary from OCR:\n${data.rawText}`
        }
      ])
      // If data extraction includes some parsed info, you could also
      // automatically feed it into the conversation or store for later usage
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + error.message }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await sendMessage(userInput)
  }

  return (
    <>
      {/* Floating chat icon/button */}
      <div
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1000
        }}
      >
        {!isOpen && (
          <button
            onClick={toggleChat}
            className="rounded-full bg-blue-600 text-white p-4 shadow-md hover:bg-blue-700 transition-colors"
          >
            Chat
          </button>
        )}
      </div>

      {/* Chat interface overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '350px',
            height: '500px',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1100
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: '#f5f5f5',
              padding: '0.5rem',
              borderBottom: '1px solid #ccc',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <h2 style={{ margin: 0 }}>Chat with AI</h2>
            <button onClick={toggleChat} style={{ background: 'none', border: 'none' }}>
              ✕
            </button>
          </div>

          {/* Messages list */}
          <div
            style={{
              flex: 1,
              padding: '0.5rem',
              overflowY: 'auto'
            }}
          >
            {messages.map((m, idx) => (
              <div key={idx} style={{ marginBottom: '1rem' }}>
                <strong>{m.role === 'user' ? 'You' : 'AI'}:</strong>
                <div>{m.content}</div>
              </div>
            ))}
            {isLoading && <div>Thinking...</div>}
          </div>

          {/* File upload */}
          <div style={{ padding: '0.5rem', borderTop: '1px solid #ccc' }}>
            <label
              style={{
                display: 'inline-block',
                marginBottom: '0.5rem',
                cursor: 'pointer',
                color: 'blue',
                textDecoration: 'underline'
              }}
            >
              Upload file for OCR
              <input
                type="file"
                accept=".pdf,image/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Message input */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', borderTop: '1px solid #ccc' }}>
            <input
              type="text"
              placeholder="Type your message..."
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#3182CE',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1rem',
                cursor: 'pointer'
              }}
              disabled={isLoading}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default ChatWidget 