'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AutoLogout() {
  const router = useRouter()
  const TIEMPO_LIMITE = 5 * 60 * 1000 // 5 minutos en milisegundos

  useEffect(() => {
    let timer: NodeJS.Timeout

    const reiniciarTimer = () => {
      clearTimeout(timer)
      timer = setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/login')
      }, TIEMPO_LIMITE)
    }

    // Escuchamos movimientos
    window.addEventListener('mousemove', reiniciarTimer)
    window.addEventListener('keydown', reiniciarTimer)
    window.addEventListener('click', reiniciarTimer)

    reiniciarTimer() // Iniciamos el timer al cargar

    return () => {
      window.removeEventListener('mousemove', reiniciarTimer)
      window.removeEventListener('keydown', reiniciarTimer)
      window.removeEventListener('click', reiniciarTimer)
      clearTimeout(timer)
    }
  }, [router])

  return null // No dibuja nada, solo vigila
}