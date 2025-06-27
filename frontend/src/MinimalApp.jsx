import React from 'react'

function MinimalApp() {
  const [count, setCount] = React.useState(0)

  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center', 
      background: '#f0f0f0', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ color: '#1976d2', marginBottom: '20px' }}>
        🚀 HighPay Minimal Test
      </h1>
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>
        React is working! No external dependencies.
      </p>
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <p>Counter: <strong>{count}</strong></p>
        <button 
          onClick={() => setCount(count + 1)}
          style={{
            background: '#1976d2',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Increment
        </button>
        <button 
          onClick={() => setCount(0)}
          style={{
            background: '#dc004e',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
      </div>
      <div style={{ fontSize: '14px', color: '#666' }}>
        <p>✅ React hooks working</p>
        <p>✅ Event handling working</p>
        <p>✅ State management working</p>
        <p>📅 {new Date().toLocaleString()}</p>
      </div>
    </div>
  )
}

export default MinimalApp
