// App.jsx
import React, { useState, useCallback } from 'react'
import { connect, message, results } from '@permaweb/aoconnect'
import Papa from 'papaparse'

const DataTable = ({ data }) => {
  if (!data || data.length === 0) return null
  
  const headers = Object.keys(data[0])
  
  return (
    <div className="w-full overflow-x-auto rounded-lg shadow">
      <table className="w-full text-sm text-left text-gray-300">
        <thead className="text-xs uppercase bg-gray-700 text-gray-300">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="px-6 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className="border-b bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              {headers.map((header, colIndex) => (
                <td key={colIndex} className="px-6 py-4 font-medium whitespace-nowrap">
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [walletAddress, setWalletAddress] = useState('')
  const [csvData, setCsvData] = useState(null)
  const [messageResult, setMessageResult] = useState(null)
  const [processId, setProcessId] = useState('')

  const handleConnect = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      if (typeof window.arweaveWallet === 'undefined') {
        throw new Error('Please install ArConnect first')
      }
      await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH'])
      const address = await window.arweaveWallet.getActiveAddress()
      setWalletAddress(address)
      setIsConnected(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          console.log('Parsed CSV:', results.data)
          setCsvData(results.data)
        },
        header: true,
        skipEmptyLines: true
      })
    }
  }

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

  const clearData = () => {
    setCsvData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Navigation Header */}
      <nav className="bg-gray-800/50 backdrop-blur-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">AO Analytics</h1>
          
          <div className="flex items-center gap-4">
            {isConnected && (
              <span className="text-gray-300 font-mono text-sm hidden md:block">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            )}
            <button
              onClick={handleConnect}
              disabled={loading}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm
                ${isConnected 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'}
                ${loading ? 'opacity-50 cursor-wait' : ''}
                text-white transition-colors
              `}
            >
              {loading ? 'Connecting...' : isConnected ? 'Connected' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </nav>

      {/* File Upload Section */}
      <div className="max-w-7xl mx-auto p-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200 mb-6">
            {error}
          </div>
        )}
        
        <div className="flex flex-col items-center justify-center space-y-6">
          {!csvData ? (
            <div className="w-full max-w-md p-6 bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:border-gray-500">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">CSV files only</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".csv" 
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          ) : (
            <div className="w-full">
              <div className="flex justify-end mb-4">
                <button
                  onClick={clearData}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Clear Data
                </button>
              </div>
              <DataTable data={csvData} />
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default App