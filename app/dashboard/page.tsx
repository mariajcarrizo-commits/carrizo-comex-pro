'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [rolUsuario, setRolUsuario] = useState('admin')
  const [emailUser, setEmailUser] = useState('')
  const [nombreEmpresa, setNombreEmpresa] = useState('Operador Independiente')
  const [operacionesCliente, setOperacionesCliente] = useState<any[]>([])

  const [metricas, setMetricas] = useState({
    total: 0, fobTotal: 0, pendientes: 0, importaciones: 0, exportaciones: 0
  })
  const [operacionesRecientes, setOperacionesRecientes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [suscripcionVencida, setSuscripcionVencida] = useState(false)

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
         window.location.href = '/login'
         return
      }
      setEmailUser(user.email)

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol_usuario, empresa, vencimiento_suscripcion')
        .eq('email', user.email)
        .single()

      const rol = perfil?.rol_usuario || 'admin'
      setRolUsuario(rol)
      if (perfil?.empresa) {
        setNombreEmpresa(perfil.empresa)
      }

      // ⏱️ LÓGICA DE VENCIMIENTO
      if (perfil?.vencimiento_suscripcion) {
        const hoy = new Date()
        const vencimiento = new Date(perfil.vencimiento_suscripcion)
        if (hoy > vencimiento) {
          setSuscripcionVencida(true)
          setCargando(false)
          return // Cortamos la carga acá
        }
      }

      let query = supabase.from('operaciones').select('*').order('created_at', { ascending: false })

      if (rol === 'cliente') {
         query = query.eq('email_cliente', user.email)
      } else {
         query = query.eq('email_creador', user.email)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error cargando el dashboard:', error)
      } else if (data) {
        if (rol === 'cliente') {
            setOperacionesCliente(data)
        } else {
            const fobSum = data.reduce((acc, op) => acc + (Number(op.fob) || 0), 0)
            const pend = data.filter(op => op.estado === 'Pendiente').length
            const impos = data.filter(op => op.tipo === 'Importación').length
            const expos = data.filter(op => op.tipo === 'Exportación').length

            setMetricas({
              total: data.length, fobTotal: fobSum, pendientes: pend,
              importaciones: impos, exportaciones: expos
            })
            setOperacionesRecientes(data.slice(0, 5))
        }
      }
      setCargando(false)
    }

    cargarDatos()
  }, [])

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (suscripcionVencida) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg text-center border border-slate-200">
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">💳</div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Suscripción Vencida</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Tu ciclo de facturación mensual ha finalizado. Para seguir utilizando la Inteligencia Artificial y gestionar tus operaciones en <strong>CARRIZO Comex</strong>, por favor renová tu plan.
          </p>
          <button onClick={() => window.open('https://wa.me/5491166478496', '_blank')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all w-full mb-4">
            Contactar a Administración
          </button>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }} className="text-slate-500 font-bold hover:text-slate-700">
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {rolUsuario === 'cliente' ? (
         <div className="max-w-5xl mx-auto">
           <div className="bg-gradient-to-r from-slate-900 to-purple-900 rounded-2xl p-8 mb-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                 <h1 className="text-3xl font-extrabold mb-1">Portal de Seguimiento</h1>
                 <p className="text-purple-200">Bienvenido/a, <span className="font-bold text-white">{emailUser}</span></p>
              </div>
              <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                 <span className="text-sm text-purple-200">Operador:</span> <span className="font-bold">{nombreEmpresa}</span>
              </div>
           </div>

           {operacionesCliente.length === 0 ? (
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                 <div className="text-6xl mb-4">📦</div>
                 <h3 className="text-xl font-bold text-slate-800 mb-2">No tenés operaciones activas</h3>
                 <p className="text-slate-500">Cuando tu operador asigne una carga, aparecerá aquí.</p>
               </div>
           ) : (
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50">
                     <h3 className="text-lg font-bold text-slate-800">Tus Cargas en Curso</h3>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                       <thead>
                         <tr className="bg-white text-slate-500 text-sm border-b border-slate-200">
                           <th className="p-4 font-bold uppercase tracking-wider">Ref / Fecha</th>
                           <th className="p-4 font-bold uppercase tracking-wider">Mercadería</th>
                           <th className="p-4 font-bold uppercase tracking-wider text-right">Estado Actual</th>
                         </tr>
                       </thead>
                       <tbody>
                         {operacionesCliente.map((op) => (
                            <tr key={op.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                 <div className="font-bold text-slate-900">#OP-{op.id.substring(0,6).toUpperCase()}</div>
                                 <div className="text-xs text-slate-500 mt-1">{new Date(op.created_at).toLocaleDateString('es-AR')}</div>
                              </td>
                              <td className="p-4">
                                  <span className={`inline-block mb-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${op.tipo === 'Importación' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                    {op.tipo} ({op.pais})
                                  </span>
                                  <div className="font-medium text-slate-800">{op.producto}</div>
                              </td>
                              <td className="p-4 text-right">
                                  <span className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-sm">
                                    {op.estado}
                                  </span>
                              </td>
                            </tr>
                         ))}
                       </tbody>
                     </table>
                  </div>
               </div>
           )}
         </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard Analítico</h1>
              <p className="text-slate-600">Resumen general de tu operatoria en tiempo real</p>
            </div>
            <Link href="/operaciones/nueva" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
              <span>+</span> Nueva Operación
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-purple-500 hover:shadow-md transition-all">
              <p className="text-sm font-bold text-slate-500 mb-1">Total Operaciones</p>
              <div className="flex items-end gap-2">
                <h2 className="text-4xl font-extrabold text-slate-900">{metricas.total}</h2>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500 hover:shadow-md transition-all">
              <p className="text-sm font-bold text-slate-500 mb-1">Volumen FOB Declarado</p>
              <div className="flex items-end gap-2">
                <h2 className="text-2xl font-extrabold text-slate-900">
                  U$S {metricas.fobTotal.toLocaleString('es-AR')}
                </h2>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-orange-500 hover:shadow-md transition-all">
              <p className="text-sm font-bold text-slate-500 mb-1">Despachos Pendientes</p>
              <div className="flex items-end gap-2">
                <h2 className="text-4xl font-extrabold text-slate-900">{metricas.pendientes}</h2>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-green-500 hover:shadow-md transition-all">
              <p className="text-sm font-bold text-slate-500 mb-1">Distribución</p>
              <div className="flex flex-col mt-1">
                <div className="flex justify-between text-sm font-bold text-slate-700">
                  <span>Impos: {metricas.importaciones}</span>
                  <span>Expos: {metricas.exportaciones}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden flex">
                  <div className="h-full bg-blue-500" style={{ width: `${metricas.total > 0 ? (metricas.importaciones / metricas.total) * 100 : 50}%` }}></div>
                  <div className="h-full bg-emerald-500" style={{ width: `${metricas.total > 0 ? (metricas.exportaciones / metricas.total) * 100 : 50}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Actividad Reciente</h3>
              <Link href="/operaciones" className="text-sm font-bold text-purple-600 hover:text-purple-800">Ver panel completo →</Link>
            </div>
            {operacionesRecientes.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Aún no hay operaciones registradas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-sm">
                      <th className="p-4 font-bold">Cliente</th>
                      <th className="p-4 font-bold">Operación</th>
                      <th className="p-4 font-bold">FOB</th>
                      <th className="p-4 font-bold">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operacionesRecientes.map((op) => (
                      <tr key={op.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-900">{op.cliente}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${op.tipo === 'Importación' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {op.tipo}
                          </span>
                        </td>
                        <td className="p-4 text-slate-700 font-mono text-sm">U$S {Number(op.fob).toLocaleString('es-AR')}</td>
                        <td className="p-4">
                          <span className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 w-fit">
                            {op.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}