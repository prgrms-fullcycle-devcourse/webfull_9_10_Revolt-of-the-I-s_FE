import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// 리액트 쿼리 엔진 생성
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  
  <QueryClientProvider client={queryClient}>
    {/* Provider로 App 전체를 감싸서 전원을 공급합니다. */}
    <App />
  </QueryClientProvider>
)