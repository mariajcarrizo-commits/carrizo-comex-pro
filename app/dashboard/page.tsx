'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Operacion {
  id: number;
  cliente: string;
  fob: number;
  estado: string;
}

export default function Dashboard() {
  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchOperaciones = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('operaciones')
        .select('id,cliente,fob,estado');
      if (!error && data) setOperaciones(data);
      setLoading(false);
    };
    fetchOperaciones();
  }, []);

  const totalOperaciones = operaciones.length;
  const totalFob = operaciones.reduce((acc, op) => acc + (op.fob || 0), 0);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    const { error } = await supabase.from('operaciones').delete().eq('id', id);
    if (!error) {
      setOperaciones(ops => ops.filter(op => op.id !== id));
    }
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4 md:px-10">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
        Dashboard
      </h1>
      <p className="text-slate-400 mb-8">Resumen de operaciones aduaneras</p>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mb-10">
        <div className="bg-slate-800 rounded-xl shadow p-6 border-l-4 border-purple-400 flex items-center">
          <div className="flex-1">
            <span className="uppercase text-xs font-bold text-slate-400">Total de Operaciones</span>
            <div className="text-3xl font-extrabold text-white mt-2">{loading ? '...' : totalOperaciones}</div>
          </div>
          <div className="ml-4 bg-purple-400/20 rounded-full h-12 w-12 flex items-center justify-center text-purple-400">
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M4 7c0-1.6569 1.3431-3 3-3h10c1.6569 0 3 1.3431 3 3v10c0 1.6569-1.3431 3-3 3H7c-1.6569 0-3-1.3431-3-3V7z"/>
            </svg>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl shadow p-6 border-l-4 border-purple-400 flex items-center">
          <div className="flex-1">
            <span className="uppercase text-xs font-bold text-slate-400">FOB Acumulado</span>
            <div className="text-3xl font-extrabold text-white mt-2">
              {loading ? '...' : totalFob.toLocaleString('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="ml-4 bg-purple-400/20 rounded-full h-12 w-12 flex items-center justify-center text-purple-400">
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4-1.343 4-3-1.79-3-4-3z"/>
              <path d="M12 2v2"/>
              <path d="M12 20v2"/>
              <path d="M20 12h2"/>
              <path d="M2 12H4"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Tabla de operaciones */}
      <div className="bg-slate-800 rounded-xl shadow overflow-hidden border border-slate-700 max-w-4xl mx-auto">
        <div className="bg-slate-700 px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-white text-sm uppercase tracking-wider">Operaciones</span>
          <span className="text-xs text-purple-400 font-semibold">{totalOperaciones} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
              <tr>
                <th className="p-4 font-bold">Cliente</th>
                <th className="p-4 font-bold">FOB</th>
                <th className="p-4 font-bold">Estado</th>
                <th className="p-4 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">Cargando...</td>
                </tr>
              ) : operaciones.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">No hay operaciones registradas.</td>
                </tr>
              ) : (
                operaciones.map(op => (
                  <tr key={op.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-4 font-medium text-white">{op.cliente}</td>
                    <td className="p-4 text-purple-400 font-mono">
                      {typeof op.fob === 'number'
                        ? op.fob.toLocaleString('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
                        : '-'}
                    </td>
                    <td className="p-4">
                      <span className={
                        `px-3 py-1 rounded-full text-xs font-bold border 
                        ${
                          op.estado === 'Completado'
                            ? 'bg-green-100/10 text-green-400 border-green-400'
                            : op.estado === 'Pendiente'
                            ? 'bg-yellow-100/10 text-yellow-300 border-yellow-300'
                            : 'bg-slate-100/10 text-slate-300 border-slate-600'
                        }`
                      }>
                        {op.estado}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(op.id)}
                        disabled={deletingId === op.id}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg 
                          font-medium text-xs transition 
                          ${
                            deletingId === op.id
                              ? 'bg-red-900/40 text-red-400 cursor-not-allowed'
                              : 'bg-slate-700 hover:bg-red-900/40 text-red-400'
                          }
                        `}
                        title="Eliminar operación"
                      >
                        {/* Trash icon svg */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h10"
                          />
                        </svg>
                        {deletingId === op.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}