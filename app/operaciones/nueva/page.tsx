'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { numeroSeguro } from '../../../lib/tributos'

const paisesMundo = [
  "Alemania", "Angola", "Arabia Saudita", "Argelia", "Argentina", "Australia", "Austria",
  "Bélgica", "Bolivia", "Brasil", "Bulgaria", "Canadá", "Chile", "China", "Colombia",
  "Corea del Sur", "Costa Rica", "Croacia", "Cuba", "Dinamarca", "Ecuador", "Egipto",
  "El Salvador", "Emiratos Árabes Unidos", "España", "Estados Unidos", "Filipinas",
  "Finlandia", "Francia", "Grecia", "Guatemala", "Honduras", "Hong Kong", "India",
  "Indonesia", "Irlanda", "Israel", "Italia", "Japón", "Kenia", "Malasia", "Marruecos",
  "México", "Nicaragua", "Nigeria", "Noruega", "Nueva Zelanda", "Países Bajos",
  "Pakistán", "Panamá", "Paraguay", "Perú", "Polonia", "Portugal", "Reino Unido",
  "República Checa", "República Dominicana", "Rusia", "Singapur", "Sudáfrica",
  "Suecia", "Suiza", "Tailandia", "Taiwán", "Turquía", "Ucrania", "Uruguay",
  "Venezuela", "Vietnam", "Otro"
].sort()

// Validación del dígito verificador del CUIT (módulo 11).
function cuitValido(cuit: string) {
  const limpio = cuit.replace(/\D/g, '')
  if (limpio.length !== 11) return false
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const suma = pesos.reduce((acc, p, i) => acc + p * Number(limpio[i]), 0)
  let verificador = 11 - (suma % 11)
  if (verificador === 11) verificador = 0
  if (verificador === 10) verificador = 9
  return verificador === Number(limpio[10])
}

const emailValido = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())

type Candidato = { ncm: string; descripcion: string; confianza: 'alta' | 'media' | 'baja'; justificacion: string; sufijo_sim: string | null }
type AnalisisIA = {
  candidatos: Candidato[]
  intervenciones: { organismo: string; detalle: string }[]
  tributacion: string
  datos_faltantes: string[]
  aviso: string
}

const estiloConfianza: Record<string, string> = {
  alta: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  media: 'bg-amber-100 text-amber-800 border-amber-200',
  baja: 'bg-red-100 text-red-800 border-red-200',
}

export default function NuevaOperacion() {
  const [paso, setPaso] = useState(1)
  const [errorPaso, setErrorPaso] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [formData, setFormData] = useState({
    tipo: '',
    clienteNombre: '',
    clienteCuit: '',
    emailCliente: '',
    productoDescripcion: '',
    esMuestra: 'No',
    muestraTipoValor: 'Sin Valor',
    muestraMonto: '',
    origen: '',
    destino: '',
    ncm: '',
    esPeligroso: 'No',
    fobEstimado: '',
    fleteSeguro: '',
    derechosPct: '',
    ivaPct: '21',
    fechaVencimiento: '',
    domicilio: '',
    cbu: '',
    pesoNeto: '',
    pesoBruto: '',
    honorarios: '',
    tipo_honorario: 'fijo',
    gastos_logisticos: '',
    docs: {
      afip: false, malvina: false, factura: false, packing: false,
      origen: false, tecnicas: false, transporte: false
    }
  })

  const [analisisIA, setAnalisisIA] = useState<AnalisisIA | null>(null)
  const [errorIA, setErrorIA] = useState('')
  const [iaCargando, setIaCargando] = useState(false)

  const esExpo = formData.tipo === 'Exportación'

  const handleChange = (e: any) => {
    const { name, value, type } = e.target
    const valor = type === 'number' ? String(value).replace('-', '') : value
    setErrorPaso('')
    if (name === 'esMuestra' && valor === 'No') {
      setFormData(prev => ({ ...prev, esMuestra: valor, muestraTipoValor: 'Sin Valor', muestraMonto: '' }))
    } else if (name === 'muestraTipoValor' && valor === 'Sin Valor') {
      setFormData(prev => ({ ...prev, muestraTipoValor: valor, muestraMonto: '' }))
    } else {
      setFormData(prev => ({ ...prev, [name]: valor }))
    }
  }

  const handleDocChange = (docName: string) => {
    setFormData(prev => ({
      ...prev,
      docs: { ...prev.docs, [docName]: !prev.docs[docName as keyof typeof prev.docs] }
    }))
  }

  // Validación de cada paso antes de avanzar.
  const validarPaso = (n: number): string => {
    if (n === 1 && !formData.tipo) return 'Elegí si es una importación o una exportación.'
    if (n === 2) {
      if (!formData.clienteNombre.trim()) return 'Completá el nombre o razón social del cliente.'
      if (formData.clienteCuit && !cuitValido(formData.clienteCuit)) return 'El CUIT no es válido (revisá los 11 dígitos).'
      if (formData.emailCliente && !emailValido(formData.emailCliente)) return 'El email del cliente no es válido.'
    }
    if (n === 3) {
      if (formData.productoDescripcion.trim().length < 3) return 'Describí la mercadería.'
      const fob = numeroSeguro(formData.fobEstimado)
      const muestra = numeroSeguro(formData.muestraMonto)
      if (fob <= 0 && !(formData.esMuestra === 'Si' && (formData.muestraTipoValor === 'Sin Valor' || muestra > 0))) {
        return 'Ingresá el valor FOB (mayor a 0).'
      }
      if (formData.derechosPct !== '' && numeroSeguro(formData.derechosPct) > 100) return 'La alícuota de derechos no puede superar el 100%.'
      if (formData.tipo_honorario === 'porcentaje' && numeroSeguro(formData.honorarios) > 100) return 'El porcentaje de honorarios no puede superar el 100%.'
    }
    if (n === 4 && formData.ncm.trim().length < 8) return 'Confirmá la posición arancelaria.'
    if (n === 5) {
      if (numeroSeguro(formData.pesoBruto) > 0 && numeroSeguro(formData.pesoNeto) > numeroSeguro(formData.pesoBruto)) {
        return 'El peso neto no puede ser mayor que el peso bruto.'
      }
      if (esExpo && formData.cbu && formData.cbu.replace(/\D/g, '').length !== 22) return 'El CBU debe tener 22 dígitos.'
    }
    return ''
  }

  const siguientePaso = () => {
    const error = validarPaso(paso)
    if (error) { setErrorPaso(error); return }
    setErrorPaso('')
    if (paso < 5) setPaso(paso + 1)
  }
  const anteriorPaso = () => { setErrorPaso(''); if (paso > 1) setPaso(paso - 1) }

  const sugerirNcmConIA = async () => {
    setIaCargando(true)
    setErrorIA('')
    setAnalisisIA(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/clasificar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ descripcion: formData.productoDescripcion, tipo: formData.tipo })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorIA(data?.error || 'Hubo un error al consultar al Agente IA. Intentá de nuevo.')
      } else {
        setAnalisisIA(data)
      }
    } catch (error) {
      console.error(error)
      setErrorIA('Hubo un error al consultar al Agente IA. Revisá tu conexión e intentá de nuevo.')
    } finally {
      setIaCargando(false)
    }
  }

  const usarCandidato = (c: Candidato) => {
    setFormData(prev => ({ ...prev, ncm: c.sufijo_sim ? `${c.ncm}.${c.sufijo_sim}` : c.ncm }))
    setErrorPaso('')
  }

  const guardarOperacion = async () => {
    const error = validarPaso(5)
    if (error) { setErrorPaso(error); return }
    if (guardando) return
    setGuardando(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      window.location.href = '/login'
      return
    }
    const emailCreador = user.email.toLowerCase()
    const inicio = new Date(Date.now() - 60_000).toISOString()

    const rutaCompleta = `${formData.origen || 'No ind.'} ➔ ${formData.destino || 'No ind.'}`

    const nuevaOperacion = {
      tipo: formData.tipo,
      cliente: formData.clienteNombre.trim(),
      cuit: formData.clienteCuit.replace(/\D/g, ''),
      email_cliente: formData.emailCliente.trim().toLowerCase(),
      email_creador: emailCreador,
      producto: formData.productoDescripcion.trim(),
      es_muestra: formData.esMuestra,
      muestra_tipo_valor: formData.esMuestra === 'Si' ? formData.muestraTipoValor : null,
      muestra_monto: formData.esMuestra === 'Si' && formData.muestraTipoValor === 'Con Valor' ? numeroSeguro(formData.muestraMonto) : 0,
      pais: rutaCompleta,
      posicion_ncm: formData.ncm.trim(),
      es_peligroso: formData.esPeligroso,
      fob: numeroSeguro(formData.fobEstimado),
      flete_seguro: esExpo || formData.fleteSeguro === '' ? null : numeroSeguro(formData.fleteSeguro),
      derechos_pct: formData.derechosPct === '' ? null : numeroSeguro(formData.derechosPct),
      iva_pct: esExpo ? null : numeroSeguro(formData.ivaPct),
      estado: 'Pendiente',
      fecha_vencimiento: formData.fechaVencimiento ? formData.fechaVencimiento : null,
      domicilio: formData.domicilio,
      cbu: esExpo ? formData.cbu.replace(/\D/g, '') : '',
      honorarios: numeroSeguro(formData.honorarios),
      tipo_honorario: formData.tipo_honorario,
      gastos_logisticos: esExpo ? numeroSeguro(formData.gastos_logisticos) : 0,
      peso_neto: numeroSeguro(formData.pesoNeto),
      peso_bruto: numeroSeguro(formData.pesoBruto),
      docs_afip: formData.docs.afip,
      docs_malvina: formData.docs.malvina,
      docs_factura: formData.docs.factura,
      docs_packing: formData.docs.packing,
      docs_origen: formData.docs.origen,
      docs_tecnicas: formData.docs.tecnicas,
      docs_transporte: formData.docs.transporte
    }

    const { error: errorInsert } = await supabase.from('operaciones').insert([nuevaOperacion])

    if (!errorInsert) {
      window.location.href = '/operaciones'
      return
    }

    // Safari/celulares a veces informan "Load failed" aunque el insert haya llegado.
    // En vez de asumir que se guardó, lo verificamos en la base.
    if (errorInsert.message.includes('Load failed') || errorInsert.message.includes('Failed to fetch')) {
      const { data: verificacion } = await supabase
        .from('operaciones')
        .select('id')
        .eq('email_creador', emailCreador)
        .eq('producto', nuevaOperacion.producto)
        .eq('cliente', nuevaOperacion.cliente)
        .gte('created_at', inicio)
        .limit(1)
      if (verificacion && verificacion.length > 0) {
        window.location.href = '/operaciones'
        return
      }
      setErrorPaso('No pudimos confirmar que la operación se haya guardado. Revisá tu conexión y volvé a intentar.')
    } else {
      setErrorPaso('Hubo un error al guardar: ' + errorInsert.message)
    }
    setGuardando(false)
  }

  const inputBase = 'w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none'

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Nueva Operación</h1>
          <p className="text-slate-600 font-medium">Completá los datos paso a paso</p>
        </div>

        <div className="flex justify-between mb-8 px-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num} className="flex items-center flex-1 last:flex-none">
              <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-bold border-2 text-sm md:text-base ${
                paso >= num ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-300'
              }`}>
                {num}
              </div>
              {num < 5 && (
                <div className={`flex-1 h-1 mx-1 md:mx-2 ${paso > num ? 'bg-slate-900' : 'bg-slate-300'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-slate-200">

          {paso === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Tipo de Operación</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button type="button" onClick={() => { setFormData({ ...formData, tipo: 'Importación' }); setErrorPaso('') }} className={`p-6 rounded-lg border-2 transition-all text-left group ${formData.tipo === 'Importación' ? 'border-purple-600 bg-purple-50' : 'border-slate-200 hover:border-slate-400'}`}>
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📦</div>
                  <div className="font-bold text-xl text-slate-900">Importación</div>
                  <div className="text-slate-600 font-medium mt-1 text-sm">Ingreso de mercadería al país.</div>
                </button>
                <button type="button" onClick={() => { setFormData({ ...formData, tipo: 'Exportación' }); setErrorPaso('') }} className={`p-6 rounded-lg border-2 transition-all text-left group ${formData.tipo === 'Exportación' ? 'border-purple-600 bg-purple-50' : 'border-slate-200 hover:border-slate-400'}`}>
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🚢</div>
                  <div className="font-bold text-xl text-slate-900">Exportación</div>
                  <div className="text-slate-600 font-medium mt-1 text-sm">Salida de mercadería al exterior.</div>
                </button>
              </div>
            </div>
          )}

          {paso === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Datos del Cliente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">CUIT</label>
                  <input type="text" inputMode="numeric" name="clienteCuit" value={formData.clienteCuit} onChange={handleChange} placeholder="Ej: 30-12345678-9" className={`${inputBase} font-bold`} />
                  {formData.clienteCuit.replace(/\D/g, '').length === 11 && (
                    cuitValido(formData.clienteCuit)
                      ? <p className="text-xs text-emerald-700 mt-1 font-bold">✓ CUIT válido</p>
                      : <p className="text-xs text-red-600 mt-1 font-bold">El dígito verificador no coincide.</p>
                  )}
                  {formData.clienteCuit.replace(/\D/g, '').length !== 11 && <p className="text-xs text-slate-500 mt-1">11 dígitos, con o sin guiones.</p>}
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre / Razón Social *</label>
                  <input type="text" name="clienteNombre" value={formData.clienteNombre} onChange={handleChange} placeholder="Ej: Importadora del Sur S.A." className={`${inputBase} font-bold placeholder:font-medium placeholder:text-slate-400`} />
                </div>

                <div className="md:col-span-2 pt-2">
                  <label className="block text-sm font-bold text-purple-700 mb-2 flex items-center gap-2">
                    📧 Email del Cliente
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">Para acceso al Portal</span>
                  </label>
                  <input type="email" name="emailCliente" value={formData.emailCliente} onChange={handleChange} placeholder="cliente@empresa.com" className="w-full px-4 py-3 border border-purple-200 bg-purple-50 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none placeholder-purple-300" />
                  <p className="text-xs text-slate-500 mt-1 italic">Si tu cliente se registra con este correo, va a ver el estado de sus operaciones en su propio portal (solo lectura).</p>
                </div>
              </div>
            </div>
          )}

          {paso === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Producto, Riesgo y Costos</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Descripción de la mercadería *</label>
                  <textarea name="productoDescripcion" value={formData.productoDescripcion} onChange={handleChange} maxLength={1500} placeholder="Cuanto más detalle, mejor clasifica la IA: material, uso, composición, potencia..." rows={3} className={inputBase} />
                </div>

                <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-purple-950 font-extrabold text-sm flex items-center gap-2">
                      <span className="text-xl">🎁</span> ¿La mercadería es una Muestra?
                    </label>
                    <div className="flex gap-4">
                      {['No', 'Si'].map(opcion => (
                        <label key={opcion} className={`flex items-center gap-2 font-bold px-4 py-2 rounded-full border cursor-pointer transition-all ${formData.esMuestra === opcion ? 'bg-purple-600 text-white border-purple-700 shadow-md' : 'bg-white text-purple-700 border-purple-200 hover:border-purple-300'}`}>
                          <input type="radio" name="esMuestra" value={opcion} checked={formData.esMuestra === opcion} onChange={handleChange} className="hidden" /> {opcion === 'Si' ? 'Sí' : 'No'}
                        </label>
                      ))}
                    </div>
                  </div>

                  {formData.esMuestra === 'Si' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-3 border-t border-purple-100 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-purple-800 font-bold text-sm italic">Valor de la muestra:</label>
                        <div className="flex gap-3">
                          {['Sin Valor', 'Con Valor'].map(valorOp => (
                            <label key={valorOp} className={`flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${formData.muestraTipoValor === valorOp ? 'bg-purple-100 text-purple-900 border-purple-300' : 'bg-white/50 text-purple-600 border-purple-100 hover:border-purple-200'}`}>
                              <input type="radio" name="muestraTipoValor" value={valorOp} checked={formData.muestraTipoValor === valorOp} onChange={handleChange} className="accent-purple-600" /> {valorOp}
                            </label>
                          ))}
                        </div>
                      </div>

                      {formData.muestraTipoValor === 'Con Valor' && (
                        <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-2">
                          <label className="text-xs font-bold text-purple-800">Monto Declarado (USD):</label>
                          <input type="number" min="0" step="0.01" name="muestraMonto" value={formData.muestraMonto} onChange={handleChange} placeholder="Ej: 50.00" className="w-32 px-3 py-1.5 text-sm border border-purple-200 rounded-md focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-800 bg-white" />
                        </div>
                      )}
                      <p className="text-xs text-purple-700">Si no cargás FOB, el monto declarado de la muestra se usa como base del cálculo.</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">País de Origen</label>
                    <select name="origen" value={formData.origen} onChange={handleChange} className={`${inputBase} bg-white`}>
                      <option value="">Seleccionar...</option>
                      {paisesMundo.map((pais) => (<option key={pais} value={pais}>{pais}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">País de Destino</label>
                    <select name="destino" value={formData.destino} onChange={handleChange} className={`${inputBase} bg-white`}>
                      <option value="">Seleccionar...</option>
                      {paisesMundo.map((pais) => (<option key={pais} value={pais}>{pais}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Valor FOB (USD) *</label>
                    <input type="number" inputMode="decimal" min="0" step="0.01" name="fobEstimado" value={formData.fobEstimado} onChange={handleChange} placeholder="0.00" className={inputBase} />
                  </div>
                  {!esExpo ? (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Flete + Seguro (USD)</label>
                      <input type="number" inputMode="decimal" min="0" step="0.01" name="fleteSeguro" value={formData.fleteSeguro} onChange={handleChange} placeholder="Para calcular el CIF" className={inputBase} />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Gastos de Terminal / Logística (USD)</label>
                      <input type="number" inputMode="decimal" min="0" step="0.01" name="gastos_logisticos" value={formData.gastos_logisticos} onChange={handleChange} placeholder="Ej: 300" className={inputBase} />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">{esExpo ? 'Derechos de Exportación (%)' : 'Derechos de Importación (%)'}</label>
                    <input type="number" inputMode="decimal" min="0" max="100" step="0.1" name="derechosPct" value={formData.derechosPct} onChange={handleChange} placeholder={esExpo ? 'Ej: 0' : 'Ej: 16'} className={inputBase} />
                    <p className="text-xs text-slate-500 mt-1">Según la posición arancelaria. Podés completarlo después.</p>
                  </div>
                  {!esExpo ? (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Alícuota IVA</label>
                      <select name="ivaPct" value={formData.ivaPct} onChange={handleChange} className={`${inputBase} bg-white`}>
                        <option value="21">General (21%)</option>
                        <option value="10.5">Reducida (10,5%)</option>
                        <option value="0">Exento (0%)</option>
                      </select>
                    </div>
                  ) : <div className="hidden md:block" />}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-red-600 mb-2 flex items-center gap-1">
                      <span title="Alerta de Vencimiento">🚨 Vencimiento</span>
                    </label>
                    <input type="date" name="fechaVencimiento" value={formData.fechaVencimiento} onChange={handleChange} className="w-full px-4 py-3 border border-red-300 bg-red-50 rounded-lg text-red-900 font-bold focus:ring-2 focus:ring-red-600 outline-none" />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Honorarios del Despachante</label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <select name="tipo_honorario" value={formData.tipo_honorario} onChange={handleChange} className="w-full sm:w-1/3 px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-purple-600 outline-none bg-slate-50">
                      <option value="fijo">Monto Fijo (USD)</option>
                      <option value="porcentaje">Porcentaje FOB (%)</option>
                    </select>
                    <input type="number" inputMode="decimal" min="0" step="0.01" name="honorarios" value={formData.honorarios} onChange={handleChange} placeholder={formData.tipo_honorario === 'fijo' ? 'Ej: 350' : 'Ej: 1.5'} className={`${inputBase} sm:w-2/3`} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Si lo dejás vacío, la proforma muestra los honorarios como “a convenir”.</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 text-3xl opacity-20 rotate-12">⚠️</div>
                  <div className="flex items-center justify-between relative z-10 gap-4">
                    <label className="text-orange-950 font-bold text-sm flex items-center gap-2">¿Es carga peligrosa (IMO)?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 font-bold text-orange-800 text-sm"><input type="radio" name="esPeligroso" value="Si" checked={formData.esPeligroso === 'Si'} onChange={handleChange} className="accent-orange-600" /> Sí</label>
                      <label className="flex items-center gap-2 font-bold text-orange-800 text-sm"><input type="radio" name="esPeligroso" value="No" checked={formData.esPeligroso === 'No'} onChange={handleChange} className="accent-orange-600" /> No</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {paso === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Clasificación Arancelaria</h2>
              <div className="space-y-6">

                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 md:p-8 rounded-xl border border-purple-100 shadow-sm relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-200 rounded-full blur-[40px] opacity-50 pointer-events-none"></div>
                  <h3 className="text-sm font-extrabold text-purple-900 mb-2 flex items-center gap-2"> ✨ Agente Aduanero (IA) </h3>
                  <p className="text-sm text-purple-700 mb-4 font-medium relative z-10"> Analizando: <span className="italic font-bold">"{formData.productoDescripcion || 'Sin descripción'}"</span> </p>

                  <button type="button" onClick={sugerirNcmConIA} disabled={iaCargando || !formData.productoDescripcion} className="w-full relative z-10 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-4 rounded-xl disabled:opacity-50 transition-all shadow-md text-lg">
                    {iaCargando ? <><span className="animate-spin text-xl inline-block">⚙️</span> Analizando mercadería...</> : <>Sugerir posición arancelaria</>}
                  </button>

                  {errorIA && (
                    <div className="mt-4 relative z-10 bg-red-50 border border-red-200 text-red-800 text-sm font-bold rounded-lg p-4">{errorIA}</div>
                  )}

                  {analisisIA && (
                    <div className="mt-6 relative z-10 space-y-4">
                      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-purple-900 mb-3">📦 Posiciones candidatas</p>
                        <div className="space-y-3">
                          {analisisIA.candidatos.map((c, i) => {
                            const codigo = c.sufijo_sim ? `${c.ncm}.${c.sufijo_sim}` : c.ncm
                            const seleccionado = formData.ncm === codigo
                            return (
                              <div key={i} className={`rounded-lg border p-4 ${seleccionado ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}>
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                  <span className="font-mono font-extrabold text-lg text-slate-900">{c.ncm}</span>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${estiloConfianza[c.confianza]}`}>Confianza {c.confianza}</span>
                                </div>
                                <p className="text-sm font-bold text-slate-800">{c.descripcion}</p>
                                <p className="text-sm text-slate-600 mt-1">{c.justificacion}</p>
                                <p className="text-xs text-slate-500 mt-2">
                                  Sufijo SIM: {c.sufijo_sim ? <span className="font-mono font-bold">{c.sufijo_sim}</span> : 'a determinar en Malvina'}
                                </p>
                                <button type="button" onClick={() => usarCandidato(c)} className={`mt-3 text-sm font-bold px-4 py-2 rounded-lg transition-all ${seleccionado ? 'bg-purple-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-700'}`}>
                                  {seleccionado ? '✓ Seleccionada' : 'Usar esta posición'}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-orange-900 mb-2">🚨 Terceros organismos e intervenciones</p>
                        {analisisIA.intervenciones.length === 0 ? (
                          <p className="text-sm text-orange-900">Sin intervenciones previas habituales detectadas.</p>
                        ) : (
                          <ul className="space-y-1">
                            {analisisIA.intervenciones.map((it, i) => (
                              <li key={i} className="text-sm text-orange-900"><span className="font-bold">{it.organismo}:</span> {it.detalle}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {analisisIA.tributacion && (
                        <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-4">
                          <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 mb-2">💰 Tributación</p>
                          <p className="text-sm text-emerald-900 whitespace-pre-line">{analisisIA.tributacion}</p>
                        </div>
                      )}

                      {analisisIA.datos_faltantes.length > 0 && (
                        <div className="bg-slate-50 border-l-4 border-slate-400 rounded-lg p-4">
                          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">🔍 Para clasificar con más certeza, falta saber</p>
                          <ul className="list-disc pl-5 space-y-1">
                            {analisisIA.datos_faltantes.map((d, i) => <li key={i} className="text-sm text-slate-700">{d}</li>)}
                          </ul>
                        </div>
                      )}

                      <p className="text-xs text-blue-900 bg-blue-50 border border-blue-200 rounded-lg p-3 font-medium">⚖️ {analisisIA.aviso}</p>
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Posición arancelaria confirmada *</label>
                  <input type="text" name="ncm" value={formData.ncm} onChange={handleChange} placeholder="Ej: 9004.10.00 o 9004.10.00.000 A" className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-bold outline-none focus:ring-2 focus:ring-purple-500 text-lg tracking-wider" />
                  <p className="text-xs text-slate-500 mt-2">Elegí una posición sugerida o escribila manualmente. Verificá el sufijo SIM en Malvina antes de oficializar.</p>
                </div>
              </div>
            </div>
          )}

          {paso === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Documentación y Logística</h2>
              <div className="space-y-6">

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 gap-4 grid grid-cols-1 md:grid-cols-2">
                  <div className="md:col-span-2 border-b border-slate-200 pb-4 mb-2">
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-3">Datos de la Carga</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Peso Neto (Kg)</label>
                        <input type="number" inputMode="decimal" min="0" name="pesoNeto" value={formData.pesoNeto} onChange={handleChange} placeholder="Ej: 1500" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Peso Bruto (Kg)</label>
                        <input type="number" inputMode="decimal" min="0" name="pesoBruto" value={formData.pesoBruto} onChange={handleChange} placeholder="Ej: 1550" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Domicilio Fiscal / Operativo</label>
                    <input type="text" name="domicilio" value={formData.domicilio} onChange={handleChange} placeholder="Ej: Av. Belgrano 123, CABA" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900" />
                  </div>

                  {esExpo ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">CBU (para reintegros de exportación)</label>
                      <input type="text" inputMode="numeric" name="cbu" value={formData.cbu} onChange={handleChange} placeholder="22 dígitos" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900" />
                    </div>
                  ) : (
                    <div className="opacity-60 pointer-events-none">
                      <label className="block text-xs font-bold text-slate-400 mb-1">CBU</label>
                      <input type="text" disabled placeholder="No aplica para Importación" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-400 bg-slate-50" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 mb-3 uppercase tracking-wider">Checklist Documental</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { id: 'afip', label: 'Constancia AFIP/ARCA' },
                      { id: 'malvina', label: 'Alta Sistema Malvina' },
                      { id: 'factura', label: 'Factura Comercial (USD)' },
                      { id: 'packing', label: 'Packing List' },
                      { id: 'origen', label: 'Certificado de Origen' },
                      { id: 'tecnicas', label: 'Certificaciones Técnicas' },
                      { id: 'transporte', label: 'Doc. Transporte (B/L, AWB, CRT)' },
                    ].map((doc) => (
                      <label key={doc.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.docs[doc.id as keyof typeof formData.docs] ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${formData.docs[doc.id as keyof typeof formData.docs] ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                          {formData.docs[doc.id as keyof typeof formData.docs] && <span className="text-white text-xs">✓</span>}
                        </div>
                        <input type="checkbox" className="hidden" checked={formData.docs[doc.id as keyof typeof formData.docs]} onChange={() => handleDocChange(doc.id)} />
                        <span className={`text-sm font-bold ${formData.docs[doc.id as keyof typeof formData.docs] ? 'text-green-800' : 'text-slate-700'}`}> {doc.label} </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {errorPaso && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-800 text-sm font-bold rounded-lg p-3" role="alert">{errorPaso}</div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            {paso > 1 ? (
              <button type="button" onClick={anteriorPaso} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800">← Atrás</button>
            ) : <div></div>}

            {paso < 5 ? (
              <button type="button" onClick={siguientePaso} className="px-8 py-3 bg-slate-900 text-white rounded-lg font-bold">
                Siguiente →
              </button>
            ) : (
              <button type="button" onClick={guardarOperacion} disabled={guardando} className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold disabled:opacity-50">
                {guardando ? 'Guardando...' : '✓ Finalizar Operación'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
