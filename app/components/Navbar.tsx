'use client'

import Image from 'next/image'

export default function Navbar() {
  return (
    <nav className="bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* --- NIVEL 1: LOGO Y PERFIL (Móvil) --- */}
          <div className="flex justify-between items-center w-full md:w-auto">
            {/* LOGO */}
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-700">
                  <Image 
                      src="/logo.jpg" 
                      alt="Logo Carrizo" 
                      fill 
                      className="object-cover"
                  />
              </div>
              <span className="text-xl font-bold tracking-wide text-white">
                CARRIZO <span className="text-purple-400 font-light">Comex</span>
              </span>
            </div>

            {/* PERFIL (Visible solo en Móvil aquí a la derecha) */}
            <div className="md:hidden flex items-center gap-2">
                <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold border-2 border-slate-800">
                    MC
                </div>
            </div>
          </div>
          
          {/* --- NIVEL 2: ENLACES (Scrollable en Móvil) --- */}
          <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="flex md:ml-8 gap-2 min-w-max">
              <a href="/dashboard" className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all whitespace-nowrap">
                Dashboard
              </a>
              <a href="/operaciones" className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all whitespace-nowrap">
                Operaciones
              </a>
              <a href="/nomenclador" className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all whitespace-nowrap">
                Nomenclador
              </a>
              <a href="/calculadora" className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all whitespace-nowrap">
                Calculadora
              </a>
            </div>
          </div>
          
          {/* --- NIVEL 3: PERFIL (Solo Desktop) --- */}
          <div className="hidden md:flex items-center gap-4">
             <div className="text-right">
                <p className="text-sm font-bold text-white">Majo Carrizo</p>
                <p className="text-xs text-slate-400">Despachante Principal</p>
             </div>
             <div className="h-9 w-9 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold border-2 border-slate-800 shadow-lg">
                MC
             </div>
          </div>

        </div>
      </div>
    </nav>
  );
}