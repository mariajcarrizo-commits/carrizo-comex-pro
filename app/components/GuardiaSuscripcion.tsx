'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { usePathname } from 'next/navigation'

export default function GuardiaSuscripcion({ children }: { children: React.ReactNode }) {
  const [suscripcionVencida, setSuscripcionVencida] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const checkSuscripcion = async () => {
      // No bloqueamos la página de login
      if (pathname === '/login') return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol_usuario, vencimiento_suscripcion')
        .eq('email', user.email)
        .single()

      if (perfil && perfil.rol_usuario !== 'cliente') {
        const hoy = new Date()
        const vencimiento = perfil.vencimiento_suscripcion ? new Date(perfil.vencimiento_suscripcion) : null
        
        // Si no tiene fecha o si ya pasó la fecha, lo bloqueamos
        if (!vencimiento || hoy > vencimiento) {
          setSuscripcionVencida(true)
        } else {
          setSuscripcionVencida(false) // Por si acaba de pagar y recarga
        }
      }
    }

    checkSuscripcion()
  }, [pathname]) // Esto hace que revise el pago CADA VEZ que cambia de página

  // Si está vencido y no está en la página de login, mostramos la pantalla de bloqueo TOTAL
  if (suscripcionVencida && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Luces premium de fondo */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
        
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg text-center relative z-10 border border-slate-100">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm border border-red-100">💳</div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Acceso Restringido</h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            Tu ciclo de facturación mensual ha finalizado o tu cuenta es nueva. Para utilizar <strong>CARRIZO Comex</strong>, por favor habilitá tu plan.
          </p>
          <button onClick={() => window.open('https://wa.me/5491166478496', '_blank')} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all w-full mb-4">
            Contactar a Administración
          </button>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }} className="text-purple-600 font-bold hover:text-purple-800 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  // Si pagó (o si es Importador), lo dejamos ver la plataforma normal
  return <>{children}</>
}