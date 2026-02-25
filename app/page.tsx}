'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  const handleLogin = (e: any) => {
    e.preventDefault()
    setCargando(true)
    
    // Simulación de conexión a base de datos (Supabase)
    setTimeout(() => {
      // Si el login es exitoso, te manda al Dashboard
      router.push('/dashboard')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      {/* Círculos decorativos de fondo para darle toque Tech */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-purple-600 rounded-full blur-[100px] opacity-20 -ml-20 -mt-20"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600 rounded-full blur-[100px] opacity-20 -mr-20 -mb-20"></div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-slate-50 mb-4 shadow-md bg-white">
              {/* Aquí va a aparecer tu logo de la carpeta public */}
              <Image src="/logo.jpg" alt="Logo Carrizo" fill className="object-cover" />
          </div>
          <h1 className="text-3xl font-bold tracking-wide text-slate-900 text-center">
            CARRIZO <span className="text-purple-600 font-light">Comex</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm text-center">Plataforma de Gestión Aduanera</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Profesional</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-600 outline-none transition-all"
              placeholder="majo@carrizocomex.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-600 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className="w-full bg-slate-900 text-white py-3.5 rounded-lg font-bold hover:bg-purple-700 transition-all shadow-lg flex justify-center items-center disabled:opacity-70"
          >
            {cargando ? 'Autenticando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400 font-medium">
          <p>Sistema exclusivo para personal autorizado.</p>
          <p className="mt-1">© 2026 CARRIZO COMEX V1.0</p>
        </div>
      </div>
    </div>
  )
}