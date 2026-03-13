'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
// Importamos la llave maestra
import { supabase } from '../../lib/supabase'

export default function Operaciones() {
  const [operaciones, setOperaciones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  // Esta función va a buscar los datos a Supabase apenas entrás a la página
  useEffect(() => {
    const cargarOperaciones = async () => {
      const { data, error } = await supabase
        .from('operaciones')
        .select('*')
        .order('created_at', { ascending: false }) // Las más nuevas primero

      if (error) {
        console.error('Error cargando operaciones:', error)
      } else {
        setOperaciones(data || [])
      }
      setCargando(false)
    }

    cargarOperaciones()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Operaciones</h1>
            <p className="text-slate-600">Gestión de despachos activos</p>
          </div>
          <Link href="/operaciones/nueva" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md">
            + Nueva Operación
          </Link>
        </div>

        {cargando ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : operaciones.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No hay operaciones todavía</h3>
            <p className="text-slate-500 mb-6">Comenzá creando tu primer despacho en el sistema.</p>
            <Link href="/operaciones/nueva" className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-bold transition-all">
              Crear Operación
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                    <th className="p-4 font-bold text-sm">Fecha</th>
                    <th className="p-4 font-bold text-sm">Cliente</th>
                    <th className="p-4 font-bold text-sm">Tipo</th>
                    <th className="p-4 font-bold text-sm">Mercadería</th>
                    <th className="p-4 font-bold text-sm">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {operaciones.map((op) => (
                    <tr key={op.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm text-slate-600">
                        {/* Formateamos la fecha al estilo argentino */}
                        {new Date(op.created_at).toLocaleDateString('es-AR')}
                      </td>
                      <td className="p-4 font-bold text-slate-900">{op.cliente}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          op.tipo === 'Importación' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {op.tipo}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 truncate max-w-xs">{op.producto}</td>
                      <td className="p-4">
                         <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                           {op.estado || 'Pendiente'}
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
    </div>
  )
}