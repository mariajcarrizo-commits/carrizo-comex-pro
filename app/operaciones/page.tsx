'use client'

import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'

export default function ListaOperaciones() {
  const [operaciones, setOperaciones] = useState([])

  useEffect(() => {
    const guardadas = JSON.parse(localStorage.getItem('operaciones') || '[]')
    setOperaciones(guardadas)
  }, [])

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Operaciones</h1>
                <p className="text-slate-500">Gestiona tus despachos aduaneros</p>
            </div>
            <a href="/operaciones/nueva" className="w-full md:w-auto bg-slate-900 text-white px-6 py-3 rounded-lg font-bold text-center shadow-lg hover:bg-slate-800">
                + Nueva Operación
            </a>
          </div>

          {/* INDICADORES RÁPIDOS (Resumen) */}
          <div className="grid grid-cols-3 gap-2 mb-6 md:hidden">
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                  <span className="block text-2xl font-bold text-slate-900">{operaciones.length}</span>
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Total</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                  <span className="block text-2xl font-bold text-orange-500">
                    {operaciones.filter((o:any) => o.estado === 'Pendiente').length}
                  </span>
                  <span className="text-[10px] uppercase text-slate-400 font-bold">En Curso</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                  <span className="block text-2xl font-bold text-green-500">
                    {operaciones.filter((o:any) => o.estado === 'Completado').length}
                  </span>
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Listas</span>
              </div>
          </div>

          {operaciones.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-slate-500 font-bold">No hay operaciones aún</p>
            </div>
          ) : (
            <>
                {/* --- VISTA MÓVIL (TARJETAS) --- */}
                {/* Esta sección SOLO se ve en celular (md:hidden) */}
                <div className="grid grid-cols-1 gap-4 md:hidden pb-10">
                    {operaciones.map((op: any) => (
                        <div key={op.id} onClick={() => window.location.href = `/operaciones/${op.id}`} 
                             className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 active:scale-95 transition-transform cursor-pointer relative overflow-hidden">
                            
                            {/* Borde lateral de color según estado */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${op.tipo === 'Importación' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                            
                            <div className="pl-3">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-900 text-lg">{op.cliente}</h3>
                                    <span className="text-xs font-mono text-slate-400">#{op.id.toString().slice(-4)}</span>
                                </div>
                                
                                <div className="flex gap-2 mb-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                        op.tipo === 'Importación' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'
                                    }`}>
                                        {op.tipo}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                                        {op.estado}
                                    </span>
                                </div>

                                <div className="text-sm text-slate-600 mb-1 truncate">📦 {op.producto}</div>
                                <div className="text-sm text-slate-500">🌍 {op.pais}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- VISTA ESCRITORIO (TABLA) --- */}
                {/* Esta sección SOLO se ve en PC (hidden md:block) */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 font-bold">ID</th>
                                <th className="p-4 font-bold">Cliente</th>
                                <th className="p-4 font-bold">Tipo</th>
                                <th className="p-4 font-bold">Producto</th>
                                <th className="p-4 font-bold">Origen</th>
                                <th className="p-4 font-bold">Estado</th>
                                <th className="p-4 font-bold text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {operaciones.map((op: any) => (
                                <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-mono text-slate-400">#{op.id.toString().slice(-4)}</td>
                                    <td className="p-4 font-bold text-slate-900">{op.cliente}</td>
                                    <td className="p-4"><span className="font-bold text-slate-700">{op.tipo}</span></td>
                                    <td className="p-4 text-slate-600 max-w-[200px] truncate">{op.producto}</td>
                                    <td className="p-4 text-slate-600">{op.pais}</td>
                                    <td className="p-4"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">{op.estado}</span></td>
                                    <td className="p-4 text-right">
                                        <a href={`/operaciones/${op.id}`} className="text-purple-600 font-bold hover:underline">Gestionar</a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}