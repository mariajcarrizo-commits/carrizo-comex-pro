'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function PortalCliente() {
  const [operaciones, setOperaciones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [usuarioEmail, setUsuarioEmail] = useState<string | null>(null)

  useEffect(() => {
    const cargarDatosDelCliente = async () => {
      setCargando(true)
      
      // 1. Identificamos quién inició sesión (Ej: paveco@gmail.com)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email) {
        setUsuarioEmail(user.email)
        
        // 2. Buscamos SOLO las operaciones que tengan su email asignado
        const { data, error } = await supabase
          .from('operaciones')
          .select('*')
          .eq('email_cliente', user.email) // 🔒 BARRERA DE SEGURIDAD
          .order('created_at', { ascending: false })

        if (!error && data) {
          setOperaciones(data)
        }
      }
      setCargando(false)
    }

    cargarDatosDelCliente()
  }, [])

  // El mismo motor de alertas, pero solo de lectura
  const calcularAlerta = (fechaVencimiento: string | null) => {
    if (!fechaVencimiento) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); 
    const vencimiento = new Date(fechaVencimiento);
    const diferenciaMs = vencimiento.getTime() - hoy.getTime();
    const diasFaltantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

    if (diasFaltantes < 0) return <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200 mt-2">🚨 Vencido</span>;
    if (diasFaltantes === 0) return <span className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm mt-2">🔥 Vence HOY</span>;
    if (diasFaltantes <= 7) return <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full border border-orange-200 mt-2">⏳ Vence en {diasFaltantes} días</span>;
    return <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 mt-2">📅 En fecha ({diasFaltantes} días)</span>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* ENCABEZADO EXCLUSIVO PARA EL CLIENTE */}
        <div className="bg-slate-900 rounded-3xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full blur-[80px] opacity-30 -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Portal de Seguimiento</h1>
              <p className="text-slate-400">Bienvenido/a, <span className="text-white font-bold">{usuarioEmail || 'Cliente'}</span></p>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20">
              <span className="text-sm font-medium text-slate-300">Operador:</span>
              <span className="ml-2 font-bold text-white">CARRIZO Comex</span>
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : operaciones.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No tenés operaciones activas</h3>
            <p className="text-slate-500">Cuando tu despachante asigne una carga a tu cuenta, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="p-4 font-bold text-sm uppercase tracking-wider">Ref / Fecha</th>
                    <th className="p-4 font-bold text-sm uppercase tracking-wider">Mercadería</th>
                    <th className="p-4 font-bold text-sm uppercase tracking-wider">Estado Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {operaciones.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">#OP-{op.id.toString().substring(0,6).toUpperCase()}</div>
                        <div className="text-xs text-slate-500 mt-1">{new Date(op.created_at).toLocaleDateString('es-AR')}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold mb-2 ${
                          op.tipo === 'Importación' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {op.tipo} ({op.pais})
                        </span>
                        <div className="font-medium text-slate-800">{op.producto}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-start">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                            op.estado === 'Finalizado' ? 'bg-green-100 text-green-800' : 
                            op.estado === 'En Curso' ? 'bg-amber-100 text-amber-800' : 
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {op.estado}
                          </span>
                          {calcularAlerta(op.fecha_vencimiento)}
                        </div>
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