'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(false)
  const [cargando, setCargando] = useState(true) // 👈 NUEVO: Estado de espera

  useEffect(() => {
    const chequearSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUsuarioLogueado(!!session)
      setCargando(false) // 👈 Terminó de pensar
    }
    chequearSesion()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUsuarioLogueado(!!session)
      setCargando(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const rutaPrincipal = usuarioLogueado ? "/operaciones" : "/login"
  const rutaCalculadora = usuarioLogueado ? "/calculadora" : "/login"

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-purple-200">
      
      {/* BARRA DE NAVEGACIÓN PÚBLICA */}
      <nav className="absolute top-0 w-full z-50 px-6 py-6 md:px-12 flex justify-between items-center bg-white/50 backdrop-blur-md border-b border-slate-100/20">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">CARRIZO <span className="text-purple-600 font-medium">Comex</span></span>
        </div>
        
        {/* 🧠 EL BOTÓN AHORA ES INTELIGENTE Y PACIENTE */}
        <Link 
          href={rutaPrincipal} 
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-full transition-all shadow-md text-sm whitespace-nowrap"
        >
          {cargando ? 'Cargando...' : (usuarioLogueado ? 'Ir al Dashboard →' : 'Ingresar al Sistema →')}
        </Link>
      </nav>

{/* ... EL RESTO DEL CÓDIGO SIGUE EXACTAMENTE IGUAL HACIA ABAJO ... */}

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // 🛣️ RUTAS INTELIGENTES: Si está logueado pasa, si no, a la fila del Login.
  const rutaPrincipal = usuarioLogueado ? "/operaciones" : "/login"
  const rutaCalculadora = usuarioLogueado ? "/calculadora" : "/login"

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-purple-200">
      
      {/* BARRA DE NAVEGACIÓN PÚBLICA PULIDA ✨ */}
      <nav className="absolute top-0 w-full z-50 px-6 py-6 md:px-12 flex justify-between items-center bg-white/50 backdrop-blur-md border-b border-slate-100/20">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">CARRIZO <span className="text-purple-600 font-medium">Comex</span></span>
        </div>
        
        {/* EL BOTÓN ÚNICO INTELIGENTE */}
        <Link 
          href={rutaPrincipal} 
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-full transition-all shadow-md text-sm whitespace-nowrap"
        >
          {usuarioLogueado ? 'Ir al Dashboard →' : 'Ingresar al Sistema →'}
        </Link>
      </nav>

      {/* SECCIÓN PRINCIPAL (HERO) */}
      <main className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-emerald-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold mb-8 uppercase tracking-wider border border-purple-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Plataforma 100% Operativa
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
            El Asistente Inteligente para <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              Despachantes de Aduana
            </span>
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Calculá tributos en segundos, clasificá mercadería con Inteligencia Artificial y gestioná todos tus despachos desde una única plataforma en la nube.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href={rutaPrincipal} 
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-purple-600/30 transition-all text-lg flex items-center justify-center gap-2"
            >
              🚀 Comenzar ahora
            </Link>
            <Link 
              href={rutaCalculadora} 
              className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold py-4 px-8 rounded-full shadow-sm transition-all text-lg flex items-center justify-center gap-2"
            >
              🧮 Probar Calculadora
            </Link>
          </div>
        </div>
      </main>

      {/* SECCIÓN DE CARACTERÍSTICAS (BENEFICIOS) */}
      <section className="bg-white py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🤖</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Clasificación con IA</h3>
              <p className="text-slate-600 font-medium">Olvidate de buscar en nomencladores eternos. Nuestra IA analiza la descripción del producto y te sugiere la posición NCM exacta al instante.</p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🧮</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Motor Tributario</h3>
              <p className="text-slate-600 font-medium">Calculadora de alta precisión. Estimá bases CIF, Derechos, IVA, Ganancias e IIBB, y exportá presupuestos en PDF con tu marca.</p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🚦</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Alertas Proactivas</h3>
              <p className="text-slate-600 font-medium">Un panel de control inteligente que vigila tus fechas de vencimiento y te notifica con colores cuando un despacho requiere atención urgente.</p>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <span className="text-xl font-extrabold text-white tracking-tight">CARRIZO <span className="text-purple-400 font-medium">Comex</span></span>
          </div>
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} Plataforma desarrollada para profesionales del Comercio Exterior.</p>
        </div>
      </footer>

    </div>
  )
}