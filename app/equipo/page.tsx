'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function Equipo() {
  const [equipo, setEquipo] = useState<any[]>([])
  const [plan, setPlan] = useState('freelance')
  const [empresa, setEmpresa] = useState('Cargando...')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarEquipo = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscamos a qué empresa pertenece el usuario
      const { data: miPerfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('email', user.email)
        .single()

      if (miPerfil) {
        setPlan(miPerfil.plan_suscripcion?.toLowerCase() || 'freelance')
        setEmpresa(miPerfil.empresa || 'Estudio Independiente')

        // Traemos a todos los empleados de ESA misma empresa
        if (miPerfil.empresa) {
          const { data: miembros } = await supabase
            .from('perfiles')
            .select('*')
            .eq('empresa', miPerfil.empresa)
          
          if (miembros) setEquipo(miembros)
        } else {
          setEquipo([miPerfil]) // Si no tiene empresa, se muestra solo a él mismo
        }
      }
      setCargando(false)
    }

    cargarEquipo()
  }, [])

  // 🧠 MAGIA DE NEGOCIO: Calculamos los límites según el plan
  let limite = 1
  if (plan === 'pro' || plan === 'boutique') limite = 5
  if (plan === 'premium' || plan === 'agencia') limite = 20

  const ocupados = equipo.length
  const disponibles = limite - ocupados
  const porcentaje = (ocupados / limite) * 100

  if (cargando) {
    return <div className="min-h-screen bg-slate-50 flex justify-center items-center"><div className="animate-spin text-4xl">⚙️</div></div>
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* ENCABEZADO */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Gestión de Equipo</h1>
          <p className="text-slate-600">Administrá los accesos de los colaboradores de <strong className="text-purple-700">{empresa}</strong></p>
        </div>

        {/* TARJETA DE LÍMITES Y PLAN */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Plan Actual</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-extrabold text-slate-900 capitalize">{plan === 'freelance' ? 'Freelance (Individual)' : plan}</span>
                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">
                  {ocupados} de {limite} cupos en uso
                </span>
              </div>
            </div>
            
            {/* BOTÓN INVITAR */}
            {disponibles > 0 ? (
              <button onClick={() => alert('En esta fase Beta, contactate con Soporte (Majo Carrizo) para dar de alta a tus nuevos colaboradores.')} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all w-full md:w-auto">
                + Invitar Colaborador
              </button>
            ) : (
              <button disabled className="bg-slate-200 text-slate-500 font-bold py-3 px-6 rounded-xl cursor-not-allowed w-full md:w-auto border border-slate-300">
                Límite de plan alcanzado
              </button>
            )}
          </div>

          {/* BARRA DE PROGRESO */}
          <div className="mt-8">
            <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
              <span>Ocupados: {ocupados}</span>
              <span>Disponibles: {disponibles}</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                className={`h-full transition-all duration-1000 ${porcentaje >= 100 ? 'bg-red-500' : 'bg-purple-600'}`} 
                style={{ width: `${porcentaje}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* LISTA DE USUARIOS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800">Usuarios Activos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white text-slate-500 text-sm border-b border-slate-200">
                  <th className="p-4 font-bold">Nombre Completo</th>
                  <th className="p-4 font-bold">Email</th>
                  <th className="p-4 font-bold">Rol</th>
                  <th className="p-4 font-bold text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {equipo.map((miembro) => (
                  <tr key={miembro.email} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600">
                          {miembro.nombre_completo ? miembro.nombre_completo.substring(0,2).toUpperCase() : '👤'}
                        </div>
                        {miembro.nombre_completo || 'Usuario sin nombre'}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{miembro.email}</td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-200">
                        {miembro.rol_usuario || 'admin'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-emerald-500 font-bold text-sm flex items-center justify-end gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Activo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}