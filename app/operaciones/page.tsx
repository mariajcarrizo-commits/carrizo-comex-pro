'use client'

import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '@/lib/supabase'

export default function ListaOperaciones() {
  const [operaciones, setOperaciones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOperaciones()
  }, [])

  async function fetchOperaciones() {
    const { data, error } = await supabase
      .from('operaciones')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) setOperaciones(data)
    setLoading(false)
  }

  const handleDelete = async (id: any) => {
    if (confirm('¿Estás segura de eliminar esta operación?')) {
      const { error } = await supabase.from('operaciones').delete().eq('id', id)
      if (!error) setOperaciones(operaciones.filter((op: any) => op.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar />
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Operaciones</h1>
                <p className="text-slate-400">Gestiona tus despachos aduaneros en la nube</p>
            </div>
            <a href="/operaciones/nueva" className="w-full md:w-auto bg-purple-600 text-white px-6 py-3 rounded-lg font-bold text-center shadow-lg hover:bg-purple-700 transition-all">
                + Nueva Operación
            </a>
          </div>

          {loading ? (
            <p className="text-center py-10 text-slate-400">Cargando datos de Supabase...</p>
          ) : operaciones.length === 0 ? (
            <div className="text-center py-12 bg-slate-800 rounded-xl border border-dashed border-slate-700">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-slate-400 font-bold">No hay operaciones guardadas aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {operaciones.map((op: any) => (
                <div key={op.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4 w-full">
                    <div className={`w-2 h-12 rounded-full ${op.tipo === 'Importación' ? 'bg-blue-500' : 'bg-green-500'}`} />
                    <div>
                      <h3 className="font-bold text-lg">{op.cliente}</h3>
                      <p className="text-sm text-slate-400">{op.pais} • {op.tipo} • NCM: {op.posicion_ncm}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <a href={`/operaciones/${op.id}`} className="flex-1 text-center bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded font-bold text-sm transition-colors">
                      Gestionar
                    </a>
                    <button onClick={() => handleDelete(op.id)} className="px-4 py-2 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white font-bold text-sm transition-all">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}