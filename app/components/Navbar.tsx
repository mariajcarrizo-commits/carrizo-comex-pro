'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const [email, setEmail] = useState<string | null>(null)
  const [cargandoUsuario, setCargandoUsuario] = useState(true) // 👈 NUEVO
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
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
         <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 bg-white">
           <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
         </div>
         <span className="text-lg font-bold text-white">CARRIZO <span className="text-purple-500">Comex</span></span>
      </div>

      <div className="hidden md:flex gap-6 items-center">
        {cargandoUsuario ? ( // 👈 MIENTRAS PIENSA
           <span className="text-sm font-medium text-slate-500 animate-pulse">Verificando credenciales...</span>
        ) : esAdmin ? ( // 👈 SI SOS VOS
          <>
            <Link href="/operaciones" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/operaciones/nueva" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Operaciones</Link>
            <Link href="/calculadora" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Calculadora</Link>
          </>
        ) : ( // 👈 SI ES EL CLIENTE
          <span className="text-sm font-bold text-purple-400 bg-purple-900/30 px-3 py-1 rounded-full border border-purple-800/50">
            Vista de Cliente
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
         <div className="hidden md:block text-right">
           <div className="text-sm font-bold text-white">{cargandoUsuario ? '...' : (esAdmin ? 'Majo Carrizo' : 'Cliente')}</div>
           <div className="text-xs text-slate-400">{email || '...'}</div>
         </div>
         <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${cargandoUsuario ? 'bg-slate-800' : (esAdmin ? 'bg-purple-600' : 'bg-slate-700')}`}>
            {cargandoUsuario ? '⏳' : (esAdmin ? 'MC' : 'CL')}
         </div>
         
         <button 
           onClick={handleLogout} 
           className="text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-900/20 px-3 py-2 rounded-lg transition-all ml-2 flex items-center gap-1" 
           title="Cerrar sesión segura"
         >
           Cerrar Sesión
         </button>
      </div>
    </nav>
  )
}