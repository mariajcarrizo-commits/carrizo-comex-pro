'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { usePathname, useRouter } from 'next/navigation'

export default function GuardiaSuscripcion({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<'cargando' | 'permitido'>('cargando')
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const checkAcceso = async () => {
      // 1. Rutas públicas (Login y Portada) dejamos pasar directo
      if (pathname === '/login' || pathname === '/') {
        setEstado('permitido')
        return
      }

      // 2. Verificamos que el usuario esté autenticado (que se haya registrado)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Si no está logueado o registrado, lo mandamos al login
        router.push('/login')
        return
      }

      // 3. ¡VÍA LIBRE! Como queremos que prueben todo, le damos acceso directo.
      // Acá eliminamos el chequeo de la tabla "perfiles" que bloqueaba por pago.
      setEstado('permitido')
    }

    checkAcceso()
  }, [pathname, router])

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center">
        <div className="animate-spin text-4xl">⚙️</div>
      </div>
    )
  }

  // Si está permitido (está logueado), le mostramos el dashboard y la app
  return <>{children}</>
}