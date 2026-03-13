'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [metricas, setMetricas] = useState({
    total: 0,
    fobTotal: 0,
    pendientes: 0,
    importaciones: 0,
    exportaciones: 0
  })
  const [operacionesRecientes, setOperacionesRecientes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      // Traemos todas las operaciones de la bóveda
      const { data, error } = await supabase
        .from('operaciones')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error cargando el dashboard:', error)
      } else if (data) {
        // La matemática mágica para los gráficos
        const fobSum = data.reduce((acc, op) => acc + (Number(op.fob) || 0), 0)
        const pend = data.filter(op => op.estado === 'Pendiente').length
        const impos = data.filter(op => op.tipo === 'Importación').length
        const expos = data.filter(op => op.tipo === 'Exportación').length

        setMetricas({
          total: data.length,
          fobTotal: fobSum,
          pendientes: pend,
          importaciones: impos,
          exportaciones: expos
        })

        // Guardamos solo las últimas 5 para la tablita de actividad reciente
        setOperacionesRecientes(data.slice(0, 5))
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600">Resumen general de tu operatoria en tiempo real</p>
          </div>
          <Link href="/operaciones/nueva" className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-md text-center">
            + Nueva Operación
          </Link>
        </div>

        {/* TARJETAS DE MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-purple-500 hover:shadow-md transition-all">
            <p className="text-sm font-bold text-slate-500 mb-1">Total Operaciones</p>
            <div className="flex items-end gap-2">
              <h2 className="text-4xl font-extrabold text-slate-900">{metricas.total}</h2>
              <span className="text-sm text-green-500 font-bold mb-1">+100%</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500 hover:shadow-md transition-all">
            <p className="text-sm font-bold text-slate-500 mb-1">Volumen FOB Declarado</p>
            <div className="flex items-end gap-2">
              <h2 className="text-3xl font-extrabold text-slate-900">
                U$S {metricas.fobTotal.toLocaleString('es-AR')}
              </h2>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-orange-500 hover:shadow-md transition-all">
            <p className="text-sm font-bold text-slate-500 mb-1">Despachos Pendientes</p>
            <div className="flex items-end gap-2">
              <h2 className="text-4xl font-extrabold text-slate-900">{metricas.pendientes}</h2>
              <span className="text-sm text-orange-500 font-bold mb-1">En curso</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-green-500 hover:shadow-md transition-all">
            <p className="text-sm font-bold text-slate-500 mb-1">Distribución</p>
            <div className="flex flex-col mt-1">
              <div className="flex justify-between text-sm font-bold text-slate-700">
                <span>Impos: {metricas.importaciones}</span>
                <span>Expos: {metricas.exportaciones}</span>
              </div>
              {/* Barrita de progreso visual */}
              <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden flex">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${metricas.total > 0 ? (metricas.importaciones / metricas.total) * 100 : 50}%` }}
                ></div>
                <div 
                  className="h-full bg-orange-500" 
                  style={{ width: `${metricas.total > 0 ? (metricas.exportaciones / metricas.total) * 100 : 50}%` }}
                ></div>
              </div>
            </div>
          </div>

        </div>

        {/* ACTIVIDAD RECIENTE */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Actividad Reciente</h3>
            <Link href="/operaciones" className="text-sm font-bold text-purple-600 hover:text-purple-800">Ver todas →</Link>
          </div>
          
          {operacionesRecientes.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Aún no hay operaciones registradas para mostrar.
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
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          op.tipo === 'Importación' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {op.tipo}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 font-mono text-sm">U$S {Number(op.fob).toLocaleString('es-AR')}</td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 text-xs font-bold text-orange-600">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
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
    </div>
  )
}