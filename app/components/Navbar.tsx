'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('Cargando...')
  const [iniciales, setIniciales] = useState('')
  
  // ✨ NUEVO: Estado para saber si el menú del celu está abierto o cerrado
  const [menuAbierto, setMenuAbierto] = useState(false) 

  useEffect(() => {
    const cargarUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setEmail(user.email)
        
        const { data } = await supabase
          .from('perfiles')
          .select('nombre_completo')
          .eq('email', user.email)
          .single()
        
        if (data?.nombre_completo) {
          setNombreCompleto(data.nombre_completo)
          const partesNombre = data.nombre_completo.split(' ')
          if (partesNombre.length > 1) {
            setIniciales((partesNombre[0][0] + partesNombre[1][0]).toUpperCase())
          } else {
            setIniciales(data.nombre_completo.substring(0, 2).toUpperCase())
          }
        } else {
           const nombreEmail = user.email.split('@')[0]
           setNombreCompleto(nombreEmail)
           setIniciales(nombreEmail.substring(0, 2).toUpperCase())
        }
      }
    }
    cargarUsuario()
  }, [pathname])

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (pathname === '/login') return null

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* LOGO */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold overflow-hidden">
               <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
            <span className="font-extrabold text-xl tracking-tight">CARRIZO <span className="text-purple-400 font-medium">Comex</span></span>
          </div>

          {/* BOTÓN MENÚ HAMBURGUESA (SOLO CELULAR) */}
          <div className="flex items-center md:hidden">
            <button onClick={() => setMenuAbierto(!menuAbierto)} className="text-slate-300 hover:text-white focus:outline-none text-2xl px-2">
              {menuAbierto ? '✖' : '☰'}
            </button>
          </div>

          {/* MENÚ CENTRAL (SOLO PC) */}
          <div className="hidden md:flex space-x-8">
            <Link href="/dashboard" className={`text-sm font-bold transition-colors ${pathname === '/dashboard' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Dashboard</Link>
            <Link href="/operaciones" className={`text-sm font-bold transition-colors ${pathname?.includes('/operaciones') ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Operaciones</Link>
            <Link href="/calculadora" className={`text-sm font-bold transition-colors ${pathname === '/calculadora' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Calculadora</Link>
            <Link href="/equipo" className={`text-sm font-bold transition-colors ${pathname === '/equipo' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Mi Equipo</Link>
          </div>

          {/* PERFIL Y CERRAR SESIÓN (SOLO PC) */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-bold text-white">{nombreCompleto}</div>
              <div className="text-xs text-slate-400">{email}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold shadow-lg text-white">
              {iniciales || '👤'}
            </div>
            <button onClick={handleCerrarSesion} className="text-sm font-bold text-slate-400 hover:text-white ml-2 transition-colors">
              Cerrar Sesión
            </button>
          </div>

        </div>
      </div>

      {/* MENÚ DESPLEGABLE (SOLO CELULAR) */}
      {menuAbierto && (
        <div className="md:hidden bg-slate-800 border-b border-slate-700 p-4 absolute w-full shadow-2xl">
          <div className="flex flex-col space-y-5">
            <Link onClick={() => setMenuAbierto(false)} href="/dashboard" className={`text-lg font-bold flex items-center gap-2 ${pathname === '/dashboard' ? 'text-purple-400' : 'text-white'}`}>📊 Dashboard</Link>
            <Link onClick={() => setMenuAbierto(false)} href="/operaciones" className={`text-lg font-bold flex items-center gap-2 ${pathname?.includes('/operaciones') ? 'text-purple-400' : 'text-white'}`}>📦 Operaciones</Link>
            <Link onClick={() => setMenuAbierto(false)} href="/calculadora" className={`text-lg font-bold flex items-center gap-2 ${pathname === '/calculadora' ? 'text-purple-400' : 'text-white'}`}>🧮 Calculadora</Link>
            <Link onClick={() => setMenuAbierto(false)} href="/equipo" className={`text-lg font-bold flex items-center gap-2 ${pathname === '/equipo' ? 'text-purple-400' : 'text-white'}`}>👥 Mi Equipo</Link>
            
            <div className="pt-4 mt-2 border-t border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-inner">
                        {iniciales || '👤'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-200">{nombreCompleto}</span>
                        <span className="text-xs text-slate-400 truncate w-32">{email}</span>
                    </div>
                </div>
                <button onClick={handleCerrarSesion} className="text-sm font-bold text-red-400 hover:text-red-300 border border-red-400/30 px-3 py-1.5 rounded-lg">
                  Salir
                </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}