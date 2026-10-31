'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../../lib/supabase'
import { numeroSeguro } from '../../../../lib/tributos'

const CAMPOS_NUMERICOS = ['fob', 'peso_neto', 'peso_bruto', 'honorarios', 'gastos_logisticos', 'flete_seguro', 'derechos_pct', 'iva_pct'] as const

export default function EditarOperacion() {
  const params = useParams()
  const router = useRouter()
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [tipo, setTipo] = useState('Importación')
  const [noEncontrada, setNoEncontrada] = useState(false)

  // 1. MEMORIA CENTRAL PERFECTAMENTE ORDENADA
  const [formData, setFormData] = useState({
    cliente: '',
    estado: 'Pendiente',
    fecha_vencimiento: '',
    fob: 0,
    posicion_ncm: '',
    peso_neto: 0,
    peso_bruto: 0,
    honorarios: 0,
    tipo_honorario: 'fijo',
    gastos_logisticos: 0 as number | string,
    flete_seguro: '' as number | string,
    derechos_pct: '' as number | string,
    iva_pct: 21 as number | string,
    docs_afip: false,
    docs_malvina: false,
    docs_factura: false,
    docs_packing: false,
    docs_origen: false,
    docs_tecnicas: false,
    docs_transporte: false
  })

  // 2. BUSCADOR DE DATOS EN LA NUBE
  useEffect(() => {
    const cargarOperacion = async () => {
      if (!params.id) return;
      
      const { data, error } = await supabase
        .from('operaciones')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        setNoEncontrada(true)
      }
      if (data) {
        setTipo(data.tipo || 'Importación')
        setFormData({
          cliente: data.cliente || '',
          estado: data.estado || 'Pendiente',
          fecha_vencimiento: data.fecha_vencimiento || '',
          fob: data.fob || 0,
          posicion_ncm: data.posicion_ncm || '',
          peso_neto: data.peso_neto || 0,
          peso_bruto: data.peso_bruto || 0,
          honorarios: data.honorarios || 0,
          tipo_honorario: data.tipo_honorario || 'fijo',
          gastos_logisticos: data.gastos_logisticos || 0,
          flete_seguro: data.flete_seguro ?? (data.tipo !== 'Exportación' && data.gastos_logisticos ? data.gastos_logisticos : ''),
          derechos_pct: data.derechos_pct ?? '',
          iva_pct: data.iva_pct ?? 21,
          docs_afip: data.docs_afip || false,
          docs_malvina: data.docs_malvina || false,
          docs_factura: data.docs_factura || false,
          docs_packing: data.docs_packing || false,
          docs_origen: data.docs_origen || false,
          docs_tecnicas: data.docs_tecnicas || false,
          docs_transporte: data.docs_transporte || false
        })
      }
      setCargando(false)
    }
    cargarOperacion()
  }, [params.id])

  // 3. FUNCIONES QUE MANEJAN LOS CLICS Y TEXTOS
  const handleChange = (e: any) => {
    const { name, value, type } = e.target
    setFormData({ ...formData, [name]: type === 'number' ? String(value).replace('-', '') : value })
  }

  const handleDocChange = (docName: string) => {
    setFormData({ ...formData, [docName]: !(formData as any)[docName] })
  }

  const guardarCambios = async () => {
    setGuardando(true)
    // Los inputs devuelven texto: convertimos a número (sin negativos) antes de guardar.
    const payload: any = { ...formData, fecha_vencimiento: formData.fecha_vencimiento || null }
    CAMPOS_NUMERICOS.forEach((campo) => {
      const v = (formData as any)[campo]
      payload[campo] = v === '' || v === null ? null : numeroSeguro(v)
    })
    if (payload.fob === null) payload.fob = 0
    const { error } = await supabase
      .from('operaciones')
      .update(payload)
      .eq('id', params.id)

    if (error) {
      alert('Error al actualizar: ' + error.message)
      setGuardando(false)
    } else {
      router.push('/operaciones')
    }
  }

  if (cargando) return <div className="p-8 text-center text-slate-500 font-bold mt-20">Cargando operación...</div>
  if (noEncontrada) return (
    <div className="p-8 text-center mt-20">
      <p className="text-slate-700 font-bold mb-4">No encontramos esta operación o no tenés permiso para editarla.</p>
      <Link href="/operaciones" className="text-purple-600 font-bold hover:underline">← Volver a Operaciones</Link>
    </div>
  )

  // 4. EL DISEÑO VISUAL (HTML)
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Editar Operación</h1>
            <p className="text-slate-600 font-medium">Actualizando datos de: <span className="font-bold text-purple-600">{formData.cliente}</span></p>
          </div>
          <Link href="/operaciones" className="text-slate-500 hover:text-slate-800 font-bold">
            ✕ Cancelar
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 md:p-8 space-y-8">
          
          {/* SECCIÓN 1: ESTADO GLOBAL */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-800 mb-3 uppercase tracking-wider">Estado de la Operación</h3>
            <select 
              name="estado" 
              value={formData.estado || 'Pendiente'} 
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-bold bg-white focus:ring-2 focus:ring-purple-600 outline-none"
            >
              <option value="Pendiente">🟡 Pendiente</option>
              <option value="En Curso">🔵 En Curso</option>
              <option value="Aprobada / Oficializada">🟢 Aprobada / Oficializada</option>
              <option value="Con Observaciones">🔴 Con Observaciones</option>
            </select>
          </div>

          {/* SECCIÓN 2: DATOS OPERATIVOS CLAVE */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-4 uppercase tracking-wider">Datos Logísticos y Comerciales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Valor FOB (USD)</label>
                <input type="number" min="0" step="0.01" name="fob" value={formData.fob} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Posición NCM</label>
                <input type="text" name="posicion_ncm" value={formData.posicion_ncm} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Peso Neto (kg)</label>
                <input type="number" name="peso_neto" value={formData.peso_neto} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Peso Bruto (kg)</label>
                <input type="number" name="peso_bruto" value={formData.peso_bruto} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none" />
              </div>

              {/* HONORARIOS */}
              <div className="col-span-1 md:col-span-2 mt-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Honorarios del Despachante</label>
                <div className="flex gap-2">
                  <select
                    name="tipo_honorario"
                    value={formData.tipo_honorario}
                    onChange={handleChange}
                    className="w-1/3 px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-purple-600 outline-none bg-slate-50"
                  >
                    <option value="fijo">Monto Fijo (USD)</option>
                    <option value="porcentaje">Porcentaje FOB (%)</option>
                  </select>
                  <input
                    type="number"
                    name="honorarios"
                    value={formData.honorarios}
                    onChange={handleChange}
                    placeholder={formData.tipo_honorario === 'fijo' ? "Ej: 350" : "Ej: 1.5"}
                    className="w-2/3 px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>
              </div>

              {/* DATOS TRIBUTARIOS */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">{tipo === 'Exportación' ? 'Derechos de Exportación (%)' : 'Derechos de Importación (%)'}</label>
                <input type="number" min="0" max="100" step="0.1" name="derechos_pct" value={formData.derechos_pct} onChange={handleChange} placeholder="Ej: 16" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none" />
              </div>
              {tipo !== 'Exportación' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Alícuota IVA</label>
                    <select name="iva_pct" value={String(formData.iva_pct)} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium bg-white focus:ring-2 focus:ring-purple-600 outline-none">
                      <option value="21">General (21%)</option>
                      <option value="10.5">Reducida (10,5%)</option>
                      <option value="0">Exento (0%)</option>
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Flete Internacional + Seguro (USD)</label>
                    <input type="number" min="0" step="0.01" name="flete_seguro" value={formData.flete_seguro} onChange={handleChange} placeholder="Ej: 1200" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none" />
                    <p className="text-xs text-slate-500 mt-1">Se suma al FOB para obtener el Valor en Aduana (CIF).</p>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Gastos de Terminal y Logística (USD)</label>
                  <input type="number" min="0" step="0.01" name="gastos_logisticos" value={formData.gastos_logisticos} onChange={handleChange} placeholder="Ej: 300" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none" />
                </div>
              )}

            </div>
          </div>

          {/* SECCIÓN 3: CHECKLIST RÁPIDO */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-3 uppercase tracking-wider">Actualizar Documentación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'docs_afip', label: 'Constancia AFIP/ARCA' },
                { id: 'docs_malvina', label: 'Alta Sistema Malvina' },
                { id: 'docs_factura', label: 'Factura Comercial' },
                { id: 'docs_packing', label: 'Packing List' },
                { id: 'docs_origen', label: 'Certificado de Origen' },
                { id: 'docs_tecnicas', label: 'Certificaciones Técnicas' },
                { id: 'docs_transporte', label: 'Doc. Transporte (B/L, AWB, CRT)' },
              ].map((doc) => (
                <label key={doc.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${(formData as any)[doc.id] ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${(formData as any)[doc.id] ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                      {(formData as any)[doc.id] && <span className="text-white text-xs">✓</span>}
                  </div>
                  <input type="checkbox" className="hidden" checked={(formData as any)[doc.id] || false} onChange={() => handleDocChange(doc.id)} />
                  <span className={`text-sm font-bold ${(formData as any)[doc.id] ? 'text-green-800' : 'text-slate-700'}`}>{doc.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button 
            onClick={guardarCambios} 
            disabled={guardando}
            className="w-full py-4 bg-purple-600 text-white rounded-lg font-bold text-lg hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg mt-8"
          >
            {guardando ? 'Guardando cambios...' : '💾 Guardar Cambios'}
          </button>

        </div>
      </div>
    </div>
  )
}