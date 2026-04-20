import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'

function HomePage() { return <div>HomePage</div> }
function PromptDetailPage() { return <div>PromptDetailPage</div> }
function UploadPage() { return <div>UploadPage</div> }
function PromptFormPage() { return <div>PromptFormPage</div> }
function MyPage() { return <div>MyPage</div> }
function LoginPage() { return <div>LoginPage</div> }
function CallbackPage() { return <div>CallbackPage</div> }

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/prompts/:id" element={<PromptDetailPage />} />
        <Route
          path="/upload"
          element={
            <PrivateRoute>
              <UploadPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/edit/:id"
          element={
            <PrivateRoute>
              <PromptFormPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/mypage"
          element={
            <PrivateRoute>
              <MyPage />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<CallbackPage />} />
      </Routes>
    </BrowserRouter>
  )
}
