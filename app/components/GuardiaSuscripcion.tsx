'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase' // 👈 ACÁ ESTÁ EL ARREGLO (../../)
import { usePathname, useRouter } from 'next/navigation'

export default function GuardiaSuscripcion({ children }: { children: React.ReactNode }) {
  // Ahora el estado inicial es "cargando", nadie entra hasta que se verifique.
  const [estado, setEstado] = useState<'cargando' | 'bloqueado' | 'permitido'>('cargando')
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const checkSuscripcion = async () => {
      // Si está en el login, lo dejamos en paz
      if (pathname === '/login') {
        setEstado('permitido')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      // Si no hay usuario logueado, lo pateamos al login
      if (!user) {
        router.push('/login')
        return
      }

      // Buscamos su perfil y su fecha de pago
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol_usuario, vencimiento_suscripcion')
        .eq('email', user.email)
        .single()

      // Si es un Despachante (admin), revisamos el reloj
      if (perfil && perfil.rol_usuario !== 'cliente') {
        const hoy = new Date()
        const vencimiento = perfil.vencimiento_suscripcion ? new Date(perfil.vencimiento_suscripcion) : null
        
        if (!vencimiento || hoy > vencimiento) {
          setEstado('bloqueado') // ¡NO PAGÓ!
        } else {
          setEstado('permitido') // ¡PAGÓ!
        }
      } else {
        // Si es Importador (cliente), entra gratis
        setEstado('permitido')
      }
    }

    checkSuscripcion()
  }, [pathname, router])

  // 1. MIENTRAS PIENSA: Mostramos pantalla de carga, NO mostramos el menú
  if (estado === 'cargando') {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center">
        <div className="animate-spin text-4xl">⚙️</div>
      </div>
    )
  }

  // 2. SI NO PAGÓ: Mostramos la pantalla roja, NO mostramos el menú
  if (estado === 'bloqueado') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
        
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg text-center relative z-10 border border-slate-100">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm border border-red-100">💳</div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Acceso Restringido</h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            Tu ciclo de facturación mensual ha finalizado o tu cuenta es nueva. Para utilizar <strong>CARRIZO Comex</strong>, por favor habilitá tu plan.
          </p>
          <button onClick={() => window.open('https://wa.me/TUNUMERODEWHATSAPP', '_blank')} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all w-full mb-4">
            Contactar a Administración
          </button>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }} className="text-purple-600 font-bold hover:text-purple-800 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  // 3. SI ESTÁ TODO OK: Le dibujamos la plataforma con el menú arriba
  return <>{children}</>
}