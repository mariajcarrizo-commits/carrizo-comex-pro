'use client'

import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { usePathname, useRouter } from 'next/navigation'

// Cierre de sesión por inactividad.
// Escucha también toques y scroll para que en el celular no se corte la sesión mientras el usuario lee.
const TIEMPO_LIMITE = 30 * 60 * 1000 // 30 minutos

const EVENTOS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll', 'wheel'] as const

export default function AutoLogout() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/login' || pathname === '/') return

    let timer: ReturnType<typeof setTimeout>
    let ultimaActividad = Date.now()

    const cerrarSesion = async () => {
      await supabase.auth.signOut()
      router.push('/login')
    }

    const reiniciarTimer = () => {
      ultimaActividad = Date.now()
      clearTimeout(timer)
      timer = setTimeout(cerrarSesion, TIEMPO_LIMITE)
    }

    // Al volver a la pestaña (ej. el celular estuvo bloqueado), revisamos el tiempo real transcurrido.
    const alVolver = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - ultimaActividad >= TIEMPO_LIMITE) cerrarSesion()
      else reiniciarTimer()
    }

    EVENTOS.forEach(ev => window.addEventListener(ev, reiniciarTimer, { passive: true }))
    document.addEventListener('visibilitychange', alVolver)
    reiniciarTimer()

    return () => {
      EVENTOS.forEach(ev => window.removeEventListener(ev, reiniciarTimer))
      document.removeEventListener('visibilitychange', alVolver)
      clearTimeout(timer)
    }
  }, [router, pathname])

  return null
}
