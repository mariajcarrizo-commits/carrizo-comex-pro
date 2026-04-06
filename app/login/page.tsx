'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError(null)

    try {
      // Ingreso con Email y Contraseña
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        router.push('/dashboard') // Si entra bien, va al panel
      }
    } catch (error: any) {
      setError(error.message === 'Invalid login credentials' ? 'Usuario o contraseña incorrectos.' : error.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-8 text-center">
          <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg mb-4 overflow-hidden">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">CARRIZO Comex</h2>
          <p className="text-purple-200 text-sm mt-1">Portal de Acceso Exclusivo</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold border border-red-100 mb-6 text-center">
              {error}
            </div>
          )}
          
          <div className="mb-5">
            <label className="block text-sm font-bold text-slate-700 mb-2">Correo Electrónico</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-slate-900 font-medium transition-all" placeholder="ejemplo@estudio.com" />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-slate-900 font-medium transition-all" placeholder="••••••••" />
          </div>

          <button type="submit" disabled={cargando} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-md flex justify-center items-center">
            {cargando ? <span className="animate-spin text-xl">⚙️</span> : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}