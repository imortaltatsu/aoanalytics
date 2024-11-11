// App.jsx
import React, { useState, useCallback, useMemo } from 'react'
import { connect, message, results ,createDataItemSigner } from '@permaweb/aoconnect'
import Papa from 'papaparse'
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, ComposedChart, Legend
} from 'recharts';
import { mean, deviation, extent, bin } from 'd3-array';

const DataTable = ({ data, xAxes, yAxis, isTableExpanded, setIsTableExpanded }) => {
  if (!data || data.length === 0) return null
  
  const headers = Object.keys(data[0])
  const displayData = isTableExpanded ? data : data.slice(0, 5)
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setIsTableExpanded(!isTableExpanded)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200 transition-colors"
        >
          {isTableExpanded ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
              Show Less ({data.length} total rows)
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              Show All ({data.length} rows)
            </>
          )}
        </button>
      </div>

      <div className={`transition-all duration-300 overflow-hidden ${
        isTableExpanded ? 'max-h-[800px]' : 'max-h-[300px]'
      }`}>
        <div className="w-full overflow-x-auto rounded-lg shadow">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-700 text-gray-300 sticky top-0">
              <tr>
                {headers.map((header) => (
                  <th 
                    key={header} 
                    className={`px-6 py-3 ${
                      xAxes.includes(header)
                        ? 'bg-blue-600' 
                        : header === yAxis 
                        ? 'bg-green-600' 
                        : ''
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className="border-b bg-gray-800 border-gray-700 hover:bg-gray-700"
                >
                  {headers.map((header) => (
                    <td 
                      key={header} 
                      className={`px-6 py-4 font-medium whitespace-nowrap ${
                        xAxes.includes(header)
                          ? 'text-blue-400' 
                          : header === yAxis 
                          ? 'text-green-400' 
                          : ''
                      }`}
                    >
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const AnalyticsSection = ({ data, xAxes, yAxis }) => {
  if (!data || !yAxis || xAxes.length === 0) return null;

  // Calculate probability distribution
  const yValues = data.map(d => Number(d[yAxis])).filter(n => !isNaN(n));
  const [min, max] = extent(yValues);
  const binGenerator = bin().domain([min, max]).thresholds(20);
  const bins = binGenerator(yValues);
  
  const distributionData = bins.map(bin => ({
    value: (bin.x0 + bin.x1) / 2,
    count: bin.length
  }));

  // Calculate correlations
  const correlationData = [];
  const headers = Object.keys(data[0]);
  
  headers.forEach(header1 => {
    headers.forEach(header2 => {
      const values1 = data.map(d => Number(d[header1])).filter(n => !isNaN(n));
      const values2 = data.map(d => Number(d[header2])).filter(n => !isNaN(n));
      
      if (values1.length === values2.length) {
        const correlation = calculateCorrelation(values1, values2);
        correlationData.push({
          x: header1,
          y: header2,
          correlation: correlation
        });
      }
    });
  });

  return (
    <div className="mt-8 space-y-8">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Probability Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={distributionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="value" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Correlation Heatmap</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr>
                <th></th>
                {headers.map(header => (
                  <th key={header} className="px-4 py-2">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {headers.map(row => (
                <tr key={row}>
                  <td className="font-medium px-4 py-2">{row}</td>
                  {headers.map(col => {
                    const correlation = correlationData.find(
                      d => d.x === row && d.y === col
                    )?.correlation || 0;
                    
                    return (
                      <td 
                        key={col}
                        style={{
                          backgroundColor: `rgba(66, 153, 225, ${Math.abs(correlation)})`
                        }}
                        className="px-4 py-2 text-center"
                      >
                        {correlation.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Add correlation calculation helper
const calculateCorrelation = (x, y) => {
  const n = x.length;
  const xMean = mean(x);
  const yMean = mean(y);
  
  const numerator = x.reduce((sum, xi, i) => {
    return sum + (xi - xMean) * (y[i] - yMean);
  }, 0);
  
  const denominator = Math.sqrt(
    x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0) *
    y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
  );
  
  return numerator / denominator;
};

const RegressionAnalysis = ({ data, xAxes, yAxis }) => {
  const [model, setModel] = useState('linear')
  const [alpha, setAlpha] = useState(0.1)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  // Update message sending with correct parameter structure
  const handleCompute = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.arweaveWallet) {
        throw new Error('Arweave wallet not found');
      }

      // Format data as simple CSV structure
      const csvData = {
        X: data.map(row => xAxes.map(col => Number(row[col]))),
        y: data.map(row => Number(row[yAxis]))
      };

      const signer = createDataItemSigner(window.arweaveWallet);
      const msgId = await message({
        process: "KtPCqIgtM1ijjHU4OCrgeK8PMBAR0BrU3ltaeDCUJAc",
        data: JSON.stringify(csvData),
        tags: [
          { name: "model_alpha", value: `${model}_${alpha}` }
        ],
        signer: createDataItemSigner(window.arweaveWallet)
      });

      console.log('Message sent with ID:', msgId);
      const response = await results(msgId);
      if (response.error) {
        throw new Error(response.error);
      }

      setResults(response);

    } catch (err) {
      console.error('Computation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mt-8">
      <h3 className="text-lg font-medium text-white mb-4">Regression Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Regression Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600"
          >
            <option value="linear">Linear Regression</option>
            <option value="ridge">Ridge Regression</option>
            <option value="lasso">Lasso Regression</option>
          </select>
        </div>

        {(model === 'ridge' || model === 'lasso') && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Alpha (Regularization)
            </label>
            <input
              type="number"
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
              min="0"
              step="0.1"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600"
            />
          </div>
        )}
      </div>

      <button
        onClick={handleCompute}
        disabled={loading || !xAxes.length || !yAxis}
        className={`
          px-4 py-2 rounded-lg font-medium
          ${loading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}
          text-white transition-colors
        `}
      >
        {loading ? 'Computing...' : 'Run Regression'}
      </button>

      {results && (
        <div className="mt-4">
          <h4 className="text-white font-medium mb-2">Results:</h4>
          <pre className="bg-gray-900/50 p-4 rounded-lg overflow-auto text-sm text-gray-300">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

// Add graph type enum
const GraphTypes = {
  SCATTER: 'scatter',
  DISTRIBUTION: 'distribution',
  CORRELATION: 'correlation',
};

// Add missing component definitions before ExploratoryAnalysis
const DistributionChart = ({ data, column }) => {
  const values = data.map(d => Number(d[column])).filter(n => !isNaN(n));
  const [min, max] = extent(values);
  const binGenerator = bin().domain([min, max]).thresholds(20);
  const bins = binGenerator(values);
  
  const chartData = bins.map(bin => ({
    value: (bin.x0 + bin.x1) / 2,
    count: bin.length
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="value" stroke="#999" />
        <YAxis stroke="#999" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
          labelStyle={{ color: '#fff' }}
        />
        <Bar dataKey="count" fill="#60a5fa" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const BoxPlot = ({ data, column }) => {
  const values = data.map(d => Number(d[column])).filter(n => !isNaN(n));
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const median = sorted[Math.floor(sorted.length * 0.5)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const boxData = [{
    q1, median, q3, min, max
  }];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={boxData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis type="number" />
        <YAxis dataKey="median" type="category" />
        <Tooltip />
        <Bar dataKey="min" fill="#8884d8" />
        <Bar dataKey="q1" fill="#82ca9d" />
        <Bar dataKey="median" fill="#ffc658" />
        <Bar dataKey="q3" fill="#82ca9d" />
        <Bar dataKey="max" fill="#8884d8" />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

const CorrelationHeatmap = ({ data }) => {
  const headers = Object.keys(data[0]);
  const correlations = [];

  headers.forEach(header1 => {
    headers.forEach(header2 => {
      const values1 = data.map(d => Number(d[header1])).filter(n => !isNaN(n));
      const values2 = data.map(d => Number(d[header2])).filter(n => !isNaN(n));

      if (values1.length && values2.length) {
        const xMean = mean(values1);
        const yMean = mean(values2);
        
        const numerator = values1.reduce((sum, x, i) => 
          sum + (x - xMean) * (values2[i] - yMean), 0);
        
        const denominator = Math.sqrt(
          values1.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) *
          values2.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0)
        );

        correlations.push({
          x: header1,
          y: header2,
          correlation: numerator / denominator
        });
      }
    });
  });

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-sm text-gray-300">
        <thead>
          <tr>
            <th></th>
            {headers.map(header => (
              <th key={header} className="px-4 py-2">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {headers.map(row => (
            <tr key={row}>
              <td className="font-medium px-4 py-2">{row}</td>
              {headers.map(col => {
                const corr = correlations.find(
                  d => d.x === row && d.y === col
                )?.correlation || 0;
                
                return (
                  <td 
                    key={col}
                    style={{
                      backgroundColor: `rgba(96, 165, 250, ${Math.abs(corr)})`
                    }}
                    className="px-4 py-2 text-center"
                  >
                    {corr.toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Add EDA component
const ExploratoryAnalysis = ({ data, xAxes, yAxis }) => {
  const [selectedGraph, setSelectedGraph] = useState(GraphTypes.SCATTER);

  // Prepare scatter plot data
  const scatterData = useMemo(() => {
    if (!data || !xAxes.length || !yAxis) return [];
    
    return xAxes.map(xAxis => ({
      name: xAxis,
      data: data
        .map(row => ({
          x: Number(row[xAxis]),
          y: Number(row[yAxis])
        }))
        .filter(point => !isNaN(point.x) && !isNaN(point.y))
    }));
  }, [data, xAxes, yAxis]);

  // Add this color array for consistent colors
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-white">Exploratory Data Analysis</h3>
        <select
          value={selectedGraph}
          onChange={(e) => setSelectedGraph(e.target.value)}
          className="bg-gray-700 text-white rounded-lg px-4 py-2 text-sm border border-gray-600"
        >
          <option value={GraphTypes.SCATTER}>Scatter Plot</option>
          <option value={GraphTypes.DISTRIBUTION}>Distribution Plot</option>
          <option value={GraphTypes.CORRELATION}>Correlation Heatmap</option>

        </select>
      </div>

      <div className="h-[400px]">
        {selectedGraph === GraphTypes.SCATTER && scatterData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart 
              margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.5} />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="X" 
                stroke="#999"
                label={{ value: ' ', position: 'bottom', fill: '#999', dy: 20 }}
                tick={{ fill: '#999' }}
                axisLine={{ stroke: '#666' }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name={yAxis} 
                stroke="#999"
                label={{ value: yAxis, angle: -90, position: 'left', fill: '#999', dx: -20 }}
                tick={{ fill: '#999' }}
                axisLine={{ stroke: '#666' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
              />
              {scatterData.map((series, index) => (
                <Scatter
                  key={series.name}
                  name={series.name}
                  data={series.data}
                  fill={COLORS[index % COLORS.length]}
                  shape="circle"
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        )}

        {selectedGraph === GraphTypes.DISTRIBUTION && (
          <DistributionChart data={data} column={yAxis} />
        )}

        {selectedGraph === GraphTypes.CORRELATION && (
          <CorrelationHeatmap data={data} />
        )}

        {selectedGraph === GraphTypes.BOX && (
          <BoxPlot data={data} column={yAxis} />
        )}
      </div>
    </div>
  );
};

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [walletAddress, setWalletAddress] = useState('')
  const [csvData, setCsvData] = useState(null)
  const [messageResult, setMessageResult] = useState(null)
  const [processId, setProcessId] = useState('')
  const [xAxes, setXAxes] = useState([])
  const [yAxis, setYAxis] = useState('')
  const [isTableExpanded, setIsTableExpanded] = useState(false)

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

  const MultiAxisSelector = ({ columns, xAxes, yAxis, setXAxes, setYAxis }) => {
    const handleXAxisChange = (e) => {
      const options = e.target.options;
      const selectedValues = [];
      for (let i = 0; i < options.length; i++) {
        if (options[i].selected) {
          selectedValues.push(options[i].value);
        }
      }
      setXAxes(selectedValues);
    };

    return (
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            X Axes (Multiple)
          </label>
          <select
            multiple
            value={xAxes}
            onChange={handleXAxisChange}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 min-h-[120px]"
          >
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Y Axis
          </label>
          <select
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600"
          >
            <option value="">Select column</option>
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Streamlined Header */}
      <nav className="sticky top-0 z-50 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">AO Analytics</h1>
          <div className="flex items-center gap-3">
            {isConnected && (
              <span className="text-gray-400 font-mono text-sm px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            )}
            <button
              onClick={handleConnect}
              disabled={loading}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-200 ease-in-out
                ${isConnected 
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
                ${loading ? 'opacity-50 cursor-wait' : ''}
              `}
            >
              {loading ? 'Connecting...' : isConnected ? 'Connected' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* File Upload */}
        {!csvData ? (
          <div className="max-w-md mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:border-gray-500 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-400"><span className="font-medium">Upload CSV</span> or drag and drop</p>
                </div>
                <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Analysis Controls */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MultiAxisSelector
                  columns={Object.keys(csvData[0])}
                  xAxes={xAxes}
                  yAxis={yAxis}
                  setXAxes={setXAxes}
                  setYAxis={setYAxis}
                />
                <div>
              </div>
            
            {yAxis && (
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-6">
                {/*<OutlierDetection data={csvData} column={yAxis} onCleanData={setCsvData} />*/}
                <RegressionAnalysis data={csvData} xAxes={xAxes} yAxis={yAxis} />
              </div>
            )}
              </div>
            </div>
            {/* Data Table */}
            <DataTable 
              data={csvData}
              xAxes={xAxes}
              yAxis={yAxis}
              isTableExpanded={isTableExpanded}
              setIsTableExpanded={setIsTableExpanded}
            />

            {/* EDA Section */}
            {yAxis && xAxes.length > 0 && (
              <ExploratoryAnalysis
                data={csvData}
                xAxes={xAxes}
                yAxis={yAxis}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App