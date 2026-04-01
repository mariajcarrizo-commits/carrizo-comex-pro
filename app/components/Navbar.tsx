'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('Cargando...')
  const [iniciales, setIniciales] = useState('')

  useEffect(() => {
    const cargarUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setEmail(user.email)
        
        // Buscamos el nombre real en la base de datos
        const { data } = await supabase
          .from('perfiles')
          .select('nombre_completo')
          .eq('email', user.email)
          .single()
        
        if (data?.nombre_completo) {
          setNombreCompleto(data.nombre_completo)
          
          // Calculamos las iniciales (Ej: Juan Perez -> JP)
          const partesNombre = data.nombre_completo.split(' ')
          if (partesNombre.length > 1) {
            setIniciales((partesNombre[0][0] + partesNombre[1][0]).toUpperCase())
          } else {
            setIniciales(data.nombre_completo.substring(0, 2).toUpperCase())
          }
        } else {
           // Si por algún motivo no tiene nombre, mostramos la primera parte del email
           const nombreEmail = user.email.split('@')[0]
           setNombreCompleto(nombreEmail)
           setIniciales(nombreEmail.substring(0, 2).toUpperCase())
        }
      }
    }
    cargarUsuario()
  }, [pathname]) // Se vuelve a ejecutar si cambia de página por seguridad

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Ocultamos la barra si estamos en la pantalla de Login
  if (pathname === '/login') return null

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* LOGO */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold overflow-hidden">
               <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
            <span className="font-extrabold text-xl tracking-tight">CARRIZO <span className="text-purple-400 font-medium">Comex</span></span>
          </div>

          {/* MENÚ CENTRAL */}
          <div className="hidden md:flex space-x-8">
            <Link href="/dashboard" className={`text-sm font-bold transition-colors ${pathname === '/dashboard' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Dashboard</Link>
            <Link href="/operaciones" className={`text-sm font-bold transition-colors ${pathname?.includes('/operaciones') ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Operaciones</Link>
            <Link href="/calculadora" className={`text-sm font-bold transition-colors ${pathname === '/calculadora' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Calculadora</Link>
          </div>

          {/* PERFIL Y CERRAR SESIÓN */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
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
    </nav>
  )
}