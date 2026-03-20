'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null)
  const [cargandoUsuario, setCargandoUsuario] = useState(true)
  const [menuAbierto, setMenuAbierto] = useState(false) // 👈 NUEVO: Memoria para saber si el menú del celu está abierto
  const pathname = usePathname()

  useEffect(() => {
    const getUsuario = async () => {
      setCargandoUsuario(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email)
      }
      setCargandoUsuario(false)
    }
    getUsuario()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setEmail(session.user.email)
      } else {
        setEmail(null)
      }
      setCargandoUsuario(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/' 
  }

  if (pathname === '/' || pathname === '/login') return null;

  const esAdmin = email === 'mariaj.carrizo@gmail.com' || email === 'majo@carrizocomex.com' || email === 'demo1@carrizocomex.com'

  return (
    // Agregamos relative y z-50 para que el menú desplegable flote por encima del contenido
    <nav className="bg-slate-900 border-b border-slate-800 px-4 md:px-6 py-4 relative z-50">
      <div className="flex justify-between items-center">
        
        {/* LOGO Y MARCA */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 bg-white">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg font-bold text-white">CARRIZO <span className="text-purple-500">Comex</span></span>
        </div>

        {/* MENÚ DE PC (Oculto en celular) */}
        <div className="hidden md:flex gap-6 items-center">
          {cargandoUsuario ? (
            <span className="text-sm font-medium text-slate-500 animate-pulse">Verificando credenciales...</span>
          ) : esAdmin ? (
            <>
              <Link href="/operaciones" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/operaciones/nueva" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Operaciones</Link>
              <Link href="/calculadora" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Calculadora</Link>
            </>
          ) : (
            <span className="text-sm font-bold text-purple-400 bg-purple-900/30 px-3 py-1 rounded-full border border-purple-800/50">
              Vista de Cliente
            </span>
          )}
        </div>

        {/* PERFIL, LOGOUT Y BOTÓN HAMBURGUESA (Celular) */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden md:block text-right">
            <div className="text-sm font-bold text-white">{cargandoUsuario ? '...' : (esAdmin ? 'Majo Carrizo' : 'Cliente')}</div>
            <div className="text-xs text-slate-400">{email || '...'}</div>
          </div>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${cargandoUsuario ? 'bg-slate-800' : (esAdmin ? 'bg-purple-600' : 'bg-slate-700')}`}>
            {cargandoUsuario ? '⏳' : (esAdmin ? 'MC' : 'CL')}
          </div>
          
          {/* Botón de Cerrar Sesión (Visible solo en PC o pantallas grandes para no amontonar en celu) */}
          <button 
            onClick={handleLogout} 
            className="hidden md:flex text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-900/20 px-3 py-2 rounded-lg transition-all items-center gap-1" 
            title="Cerrar sesión segura"
          >
            Cerrar Sesión
          </button>

          {/* EL FAMOSO BOTÓN HAMBURGUESA (Visible solo en celular) */}
          <button 
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="md:hidden text-slate-300 hover:text-white p-2 text-2xl focus:outline-none"
          >
            {menuAbierto ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* 🍔 EL MENÚ DESPLEGABLE PARA CELULARES */}
      {menuAbierto && (
        <div className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-slate-800 px-6 py-6 flex flex-col gap-4 shadow-2xl">
          {cargandoUsuario ? (
            <span className="text-sm font-medium text-slate-500 animate-pulse">Verificando...</span>
          ) : esAdmin ? (
            <>
              <Link href="/operaciones" onClick={() => setMenuAbierto(false)} className="text-base font-bold text-slate-300 hover:text-white border-b border-slate-800 pb-2">📊 Dashboard</Link>
              <Link href="/operaciones/nueva" onClick={() => setMenuAbierto(false)} className="text-base font-bold text-slate-300 hover:text-white border-b border-slate-800 pb-2">📦 Operaciones</Link>
              <Link href="/calculadora" onClick={() => setMenuAbierto(false)} className="text-base font-bold text-slate-300 hover:text-white border-b border-slate-800 pb-2">🧮 Calculadora</Link>
            </>
          ) : (
            <div className="text-center pb-2 border-b border-slate-800">
              <span className="text-sm font-bold text-purple-400 bg-purple-900/30 px-3 py-1 rounded-full border border-purple-800/50">
                Vista de Cliente
              </span>
            </div>
          )}
          
          <div className="pt-2 text-center">
             <div className="text-sm font-bold text-white mb-1">{email}</div>
             <button 
               onClick={handleLogout} 
               className="w-full text-sm font-bold text-red-400 bg-red-900/20 hover:bg-red-900/40 py-3 rounded-lg transition-all" 
             >
               Cerrar Sesión
             </button>
          </div>
        </div>
      )}
    </nav>
  )
}