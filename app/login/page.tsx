'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [exitoMsg, setExitoMsg] = useState('')
  const [esRegistro, setEsRegistro] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: any) => {
    e.preventDefault()
    setCargando(true)
    setErrorMsg('')
    setExitoMsg('')

    if (esRegistro) {
      // 📝 MODO CREAR CUENTA
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message === 'User already registered' ? 'Este correo ya tiene una cuenta.' : 'Error al crear la cuenta. Intentá con una contraseña más segura.')
      } else {
        setExitoMsg('¡Cuenta creada con éxito! Iniciando sesión...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      }
    } else {
      // 🔐 MODO INICIAR SESIÓN
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg('Correo o contraseña incorrectos.')
      } else {
        // El Dashboard se encarga de separar clientes de despachantes y revisar pagos
        router.push('/dashboard')
      }
    }
    setCargando(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Luces de fondo estilo premium */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 md:p-10 relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-slate-900 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-purple-900/50 border-4 border-slate-800 overflow-hidden">
            <img src="/logo.jpg" alt="Logo Carrizo" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">CARRIZO <span className="text-purple-600 font-medium">Comex</span></h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Plataforma de Gestión Aduanera</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-bold border border-red-200">
              {errorMsg}
            </div>
          )}
          {exitoMsg && (
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm text-center font-bold border border-emerald-200">
              {exitoMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Profesional</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@empresa.com" 
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none transition-all"
              required
            />
            {esRegistro && <p className="text-xs text-slate-500 mt-1">Mínimo 6 caracteres.</p>}
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg mt-4 disabled:opacity-70 flex justify-center items-center"
          >
            {cargando ? <span className="animate-spin text-xl mr-2">⚙️</span> : null}
            {cargando ? 'Procesando...' : (esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </button>
        </form>

        {/* BOTÓN PARA CAMBIAR ENTRE LOGIN Y REGISTRO */}
        <div className="mt-6 text-center">
          <button 
            type="button" 
            onClick={() => { setEsRegistro(!esRegistro); setErrorMsg(''); setExitoMsg(''); }}
            className="text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors"
          >
            {esRegistro ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate'}
          </button>
        </div>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-400 font-medium">Sistema exclusivo para personal y clientes autorizados.</p>
          <p className="text-xs text-slate-400 font-medium mt-1">© {new Date().getFullYear()} CARRIZO COMEX V1.0</p>
        </div>
      </div>
    </div>
  )
}