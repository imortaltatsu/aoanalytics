// src/App.jsx
import React, { useState } from 'react'
import {connect, message, results} from '@permaweb/aoconnect'
import './App.css'

function App() {
  const [wallet, setWallet] = useState(null)
  const [walletAddress, setWalletAddress] = useState(null)
  const [loading, setLoading] = useState(false)

  const connectWallet = async () => {
    try {
      setLoading(true)
      const connection = await connect()
      setWallet(connection)
      
      // Log wallet address
      console.log('Connected Wallet Address:', connection.address)
      setWalletAddress(connection.address)
      
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      setWalletAddress(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">AO Analytics</h1>
          <button
            onClick={connectWallet}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium ${
              wallet 
                ? 'bg-green-500 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Connecting...
              </span>
            ) : wallet ? (
              'Connected'
            ) : (
              'Connect Wallet'
            )}
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {walletAddress && (
          <p className="text-sm text-gray-600">
            Connected Address: {walletAddress}
          </p>
        )}
        {wallet ? (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Wallet Connected</h2>
            <p className="text-gray-600">Ready to interact with AO</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome to AO Analytics</h2>
            <p className="text-gray-600">Please connect your wallet to continue</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App