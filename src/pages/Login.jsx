import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full max-w-sm text-center">
        <div className="text-4xl mb-3">🎓</div>
        <h1 className="text-xl font-semibold text-gray-800 mb-1">TNT English</h1>
        <p className="text-sm text-gray-400 mb-8">Hệ thống quản lý trung tâm</p>

        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
          Đăng nhập bằng Google
        </button>

        <p className="text-xs text-gray-400 mt-6">
          Chỉ tài khoản được cấp quyền mới có thể đăng nhập
        </p>
      </div>
    </div>
  )
}