'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Navbar() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* LOGO Y PERFIL (Móvil) */}
          <div className="flex justify-between items-center w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-700 bg-white">
                  <Image src="/logo.jpg" alt="Logo Carrizo" fill className="object-cover" />
              </div>
              <span className="text-xl font-bold tracking-wide text-white">
                CARRIZO <span className="text-purple-400 font-light">Comex</span>
              </span>
            </div>
            
            <div className="md:hidden flex items-center gap-3">
                <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold border-2 border-slate-800">
                    MC
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                </button>
            </div>
          </div>
          
          {/* ENLACES RESPONSIVOS */}
          <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="flex md:ml-8 gap-2 min-w-max">
              <Link href="/dashboard" className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all">Dashboard</Link>
              <Link href="/operaciones" className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all">Operaciones</Link>
              <Link href="/calculadora" className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all">Calculadora</Link>
            </div>
          </div>
          
          {/* PERFIL (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
             <div className="text-right">
                <p className="text-sm font-bold text-white">Majo Carrizo</p>
                {/* BOTÓN CERRAR SESIÓN DEBAJO DEL NOMBRE */}
                <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center justify-end w-full mt-0.5 gap-1">
                   <span>Cerrar sesión</span>
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                   </svg>
                </button>
             </div>
             <div className="h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold border-2 border-slate-700 shadow-lg ml-2">
                MC
             </div>
          </div>

        </div>
      </div>
    </nav>
  );
}