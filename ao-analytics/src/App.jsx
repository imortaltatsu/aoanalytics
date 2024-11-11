// App.jsx
import React, { useState, useCallback } from 'react'
import { connect, message, results } from '@permaweb/aoconnect'

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [messageResult, setMessageResult] = useState(null)
  const [processId, setProcessId] = useState('')

  const handleConnect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check for ArConnect
      if (typeof window.arweaveWallet === 'undefined') {
        throw new Error('Please install ArConnect first');
      }

      // Request permissions
      await window.arweaveWallet.connect([
        'ACCESS_ADDRESS',
        'SIGN_TRANSACTION',
        'DISPATCH'
      ]);

      // Get address
      const address = await window.arweaveWallet.getActiveAddress();
      console.log('Connected address:', address);
      
      setIsConnected(true);
    } catch (err) {
      setError(err.message);
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (!processId) {
      setError('Process ID is required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const msgId = await message(processId, { 
        action: 'query',
        data: { timestamp: Date.now() }
      })
      const response = await results(msgId)
      setMessageResult(response)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [processId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white">AO Analytics Platform</h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-col space-y-4">
          <button
            onClick={handleConnect}
            disabled={loading || isConnected}
            className={`
              px-6 py-3 rounded-lg font-medium transition-colors
              ${isConnected 
                ? 'bg-green-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'}
              ${loading ? 'opacity-50 cursor-wait' : ''}
              text-white
            `}
          >
            {loading ? 'Connecting...' : isConnected ? 'Connected' : 'Connect Wallet'}
          </button>

          {isConnected && (
            <div className="space-y-4">
              <input
                type="text"
                value={processId}
                onChange={(e) => setProcessId(e.target.value)}
                placeholder="Enter Process ID"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />

              <button
                onClick={handleSendMessage}
                disabled={loading || !processId}
                className={`
                  w-full px-6 py-3 rounded-lg font-medium
                  ${loading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}
                  transition-colors text-white
                `}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          )}
        </div>

        {messageResult && (
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-2">Result:</h3>
            <pre className="text-sm font-mono text-gray-300 overflow-auto">
              {JSON.stringify(messageResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default App