import ReactDOM from 'react-dom/client'
import ErrorBoundary from '@/components/utils/ErrorBoundary'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)