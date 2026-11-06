'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

export type Hito = {
  id: string
  operacion_id: string
  codigo: string
  nombre: string
  orden: number
  estado: 'pendiente' | 'hecho' | 'omitido'
  fecha_prevista: string | null
  fecha_real: string | null
  nota: string | null
  visible_cliente: boolean
}

type Props = {
  operacionId: string
  /** true para el despachante; false para el cliente (solo lectura) */
  editable?: boolean
  producto?: string
  telefonoInicial?: string | null
  /** Se llama cuando cambia algo, para refrescar resúmenes afuera */
  onCambio?: () => void
}

function hoyISO() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function fecha(f: string | null) {
  if (!f) return ''
  const [y, m, d] = f.split('-')
  return `${d}/${m}/${y}`
}

// Solo dígitos; si no trae el código de país, se asume Argentina (54).
function telefonoParaWhatsapp(tel: string) {
  let t = tel.replace(/\D/g, '').replace(/^00/, '')
  if (!t) return ''
  if (t.startsWith('0')) t = t.slice(1)
  if (!t.startsWith('54')) t = '54' + t
  return t
}

export default function Seguimiento({ operacionId, editable = false, producto, telefonoInicial, onCambio }: Props) {
  const [hitos, setHitos] = useState<Hito[]>([])
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState('')
  const [detalle, setDetalle] = useState<string | null>(null)
  const [telefono, setTelefono] = useState(telefonoInicial || '')
  const [email, setEmail] = useState('')

  const cargar = useCallback(async () => {
    const { data, error } = await supabase
      .from('hitos_operacion')
      .select('id, operacion_id, codigo, nombre, orden, estado, fecha_prevista, fecha_real, nota, visible_cliente')
      .eq('operacion_id', operacionId)
      .order('orden', { ascending: true })
    if (error) setAviso('No pudimos cargar el seguimiento. Probá de nuevo.')
    else setHitos((data as Hito[]) || [])
    setCargando(false)
  }, [operacionId])

  useEffect(() => {
    cargar()
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ''))
  }, [cargar])

  const hechos = hitos.filter(h => h.estado === 'hecho').length
  const aplican = hitos.filter(h => h.estado !== 'omitido').length
  const porcentaje = aplican > 0 ? Math.round((hechos / aplican) * 100) : 0
  const proximo = useMemo(() => hitos.find(h => h.estado === 'pendiente'), [hitos])

  const actualizar = async (h: Hito, cambios: Partial<Hito>) => {
    setAviso('')
    const anterior = hitos
    setHitos(hitos.map(x => (x.id === h.id ? { ...x, ...cambios } : x)))
    const { error } = await supabase
      .from('hitos_operacion')
      .update({ ...cambios, actualizado_por: email || null, updated_at: new Date().toISOString() })
      .eq('id', h.id)
    if (error) {
      setHitos(anterior)
      setAviso('No se pudo guardar el cambio. Probá de nuevo.')
    } else {
      onCambio?.()
    }
  }

  const marcarHecho = (h: Hito) => actualizar(h, { estado: 'hecho', fecha_real: hoyISO() })
  const deshacer = (h: Hito) => actualizar(h, { estado: 'pendiente', fecha_real: null })

  const guardarTelefono = async () => {
    const limpio = telefono.trim()
    const { error } = await supabase.from('operaciones').update({ telefono_cliente: limpio || null }).eq('id', operacionId)
    if (error) setAviso('No se pudo guardar el WhatsApp del cliente.')
    else setAviso('')
  }

  const enlaceWhatsapp = (h: Hito) => {
    const numero = telefonoParaWhatsapp(telefono)
    if (!numero) return ''
    const siguiente = hitos.find(x => x.orden > h.orden && x.estado === 'pendiente')
    const ref = `#OP-${operacionId.substring(0, 6).toUpperCase()}`
    const texto =
      `Hola! Te aviso novedades de tu operación${producto ? ` (${producto})` : ''} ${ref}: ` +
      `"${h.nombre}" ya está listo. ` +
      (siguiente ? `El próximo paso es: ${siguiente.nombre}. ` : 'Con esto la operación quedó completa. ') +
      `Podés ver el detalle en ${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`
    return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
  }

  if (cargando) {
    return <div className="p-4 text-sm text-slate-500">Cargando seguimiento…</div>
  }

  if (hitos.length === 0) {
    return <div className="p-4 text-sm text-slate-500">Esta operación todavía no tiene pasos de seguimiento.</div>
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-1">
            <h4 className="font-bold text-slate-800">Seguimiento de la operación</h4>
            <span className="text-sm font-bold text-slate-600">{hechos} de {aplican} pasos</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all" style={{ width: `${porcentaje}%` }} />
          </div>
          <p className="text-sm text-slate-600 mt-2">
            {proximo ? <>Próximo paso: <span className="font-bold text-purple-700">{proximo.nombre}</span></> : <span className="font-bold text-emerald-700">✅ Todos los pasos completos</span>}
          </p>
        </div>

        {editable && (
          <div className="md:w-72">
            <label className="block text-xs font-bold text-slate-500 mb-1">WhatsApp del cliente (con código de área)</label>
            <input
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              onBlur={guardarTelefono}
              placeholder="Ej: +54 9 11 5555 5555"
              inputMode="tel"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
            />
          </div>
        )}
      </div>

      {aviso && <div className="mb-3 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2">{aviso}</div>}

      <ol className="space-y-2">
        {hitos.map(h => {
          const esProximo = proximo?.id === h.id
          const linkWsp = editable && h.estado === 'hecho' ? enlaceWhatsapp(h) : ''
          return (
            <li key={h.id} className={`rounded-xl border px-3 py-3 ${h.estado === 'hecho' ? 'bg-emerald-50 border-emerald-200' : esProximo ? 'bg-purple-50 border-purple-300' : h.estado === 'omitido' ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <span className={`flex-none w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${h.estado === 'hecho' ? 'bg-emerald-500 text-white' : esProximo ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {h.estado === 'hecho' ? '✓' : h.estado === 'omitido' ? '–' : h.orden}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm ${h.estado === 'omitido' ? 'line-through text-slate-500' : 'text-slate-800'}`}>{h.nombre}</div>
                  <div className="text-xs text-slate-500">
                    {h.estado === 'hecho' && h.fecha_real ? `Hecho el ${fecha(h.fecha_real)}` : h.fecha_prevista ? `Previsto: ${fecha(h.fecha_prevista)}` : h.estado === 'omitido' ? 'No aplica' : 'Pendiente'}
                    {h.nota ? ` · ${h.nota}` : ''}
                  </div>
                </div>

                {editable && (
                  <div className="flex items-center gap-2 flex-none">
                    {h.estado === 'pendiente' && (
                      <button onClick={() => marcarHecho(h)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg">Hecho</button>
                    )}
                    {h.estado === 'hecho' && (
                      <>
                        {linkWsp ? (
                          <a href={linkWsp} target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-lg" title="Abre WhatsApp con el mensaje armado">Avisar por WhatsApp</a>
                        ) : (
                          <span className="text-xs text-slate-400 hidden md:inline">Cargá el WhatsApp para avisar</span>
                        )}
                        <button onClick={() => deshacer(h)} className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-2">Deshacer</button>
                      </>
                    )}
                    {h.estado === 'omitido' && (
                      <button onClick={() => deshacer(h)} className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-2">Reactivar</button>
                    )}
                    <button onClick={() => setDetalle(detalle === h.id ? null : h.id)} className="text-slate-400 hover:text-slate-700 px-2 py-2" aria-label="Más opciones" title="Fecha prevista, nota y visibilidad">⋯</button>
                  </div>
                )}
              </div>

              {editable && detalle === h.id && (
                <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="text-xs font-bold text-slate-500">
                    Fecha prevista
                    <input type="date" value={h.fecha_prevista || ''} onChange={e => actualizar(h, { fecha_prevista: e.target.value || null })} className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white text-slate-900" />
                  </label>
                  <label className="text-xs font-bold text-slate-500">
                    Nota
                    <input defaultValue={h.nota || ''} onBlur={e => { if ((e.target.value || null) !== h.nota) actualizar(h, { nota: e.target.value.trim() || null }) }} placeholder="Ej: falta factura firmada" className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white text-slate-900" />
                  </label>
                  <div className="flex flex-col gap-2 text-xs font-bold text-slate-500">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={h.visible_cliente} onChange={e => actualizar(h, { visible_cliente: e.target.checked })} />
                      Visible para el cliente
                    </label>
                    {h.estado !== 'omitido' && (
                      <button onClick={() => actualizar(h, { estado: 'omitido', fecha_real: null })} className="text-left text-slate-500 hover:text-red-600">Este paso no aplica</button>
                    )}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
