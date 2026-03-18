'use client'

import { useState } from 'react'
import { ncmComunes } from '@/lib/ncmData'
import { supabase } from '../../../lib/supabase'

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

export default function NuevaOperacion() {
  const [paso, setPaso] = useState(1)
  
  const [formData, setFormData] = useState({
    tipo: '',
    clienteNombre: '',
    clienteCuit: '',
    productoDescripcion: '',
    pais: '',
    ncm: '',
    esPeligroso: 'No',
    fobEstimado: '',
    fechaVencimiento: '', // 👈 NUEVO: El estado de la fecha
    domicilio: '',
    cbu: '',
    pesoNeto: '',
    pesoBruto: '',
    docs: {
      afip: false,
      malvina: false,
      factura: false,
      packing: false,
      origen: false,
      tecnicas: false,
      transporte: false
    }
  })

  const [busquedaNcm, setBusquedaNcm] = useState('')
  const [mostrarSelectorNcm, setMostrarSelectorNcm] = useState(false)
  const [iaCargando, setIaCargando] = useState(false)

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleDocChange = (docName: string) => {
    setFormData({
      ...formData,
      docs: {
        ...formData.docs,
        [docName]: !formData.docs[docName as keyof typeof formData.docs]
      }
    })
  }

  const seleccionarNcm = (codigo: string, descripcion: string) => {
    setFormData({ ...formData, ncm: codigo })
    setBusquedaNcm('')
    setMostrarSelectorNcm(false)
  }

  const ncmFiltrados = ncmComunes.filter(item => 
    item.codigo.includes(busquedaNcm.toUpperCase()) ||
    item.descripcion.toLowerCase().includes(busquedaNcm.toLowerCase())
  )

  const siguientePaso = () => { if (paso < 5) setPaso(paso + 1) }
  const anteriorPaso = () => { if (paso > 1) setPaso(paso - 1) }

  const sugerirNcmConIA = async () => {
    setIaCargando(true)

    try {
      const respuesta = await fetch('/api/clasificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: formData.productoDescripcion })
      })

      if (!respuesta.ok) throw new Error('Fallo en la conexión con la IA')

      const data = await respuesta.json()
      const sugerenciaIA = data.sugerencia || ''
      
      const partes = sugerenciaIA.split(' - ')
      const codigoSugerido = partes[0] || sugerenciaIA

      setFormData({ ...formData, ncm: codigoSugerido })
      setBusquedaNcm(`✨ IA Sugiere: ${sugerenciaIA}`)
      setMostrarSelectorNcm(true)
      
    } catch (error) {
      console.error("Error en la IA:", error)
      alert("Hubo un cortocircuito al contactar a la IA. Revisá tu conexión.")
    } finally {
      setIaCargando(false)
    }
  }

  const guardarOperacion = async () => {
    const nuevaOperacion = {
      tipo: formData.tipo,
      cliente: formData.clienteNombre,
      cuit: formData.clienteCuit,
      producto: formData.productoDescripcion,
      pais: formData.pais,
      posicion_ncm: formData.ncm,
      es_peligroso: formData.esPeligroso,
      fob: parseFloat(formData.fobEstimado) || 0,
      estado: 'Pendiente',
      fecha_vencimiento: formData.fechaVencimiento ? formData.fechaVencimiento : null, // 👈 NUEVO: Mandamos la fecha a Supabase
      domicilio: formData.domicilio,
      cbu: formData.cbu,
      peso_neto: parseFloat(formData.pesoNeto) || 0,
      peso_bruto: parseFloat(formData.pesoBruto) || 0,
      docs_afip: formData.docs.afip,
      docs_malvina: formData.docs.malvina,
      docs_factura: formData.docs.factura,
      docs_packing: formData.docs.packing,
      docs_origen: formData.docs.origen,
      docs_tecnicas: formData.docs.tecnicas,
      docs_transporte: formData.docs.transporte
    }

    const { error } = await supabase.from('operaciones').insert([nuevaOperacion])

    if (error) {
      alert("Hubo un error al guardar en la nube: " + error.message)
    } else {
      window.location.href = '/operaciones'
    }
  }

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
                <button onClick={() => setFormData({...formData, tipo: 'Importación'})} className={`p-6 rounded-lg border-2 transition-all text-left group ${formData.tipo === 'Importación' ? 'border-purple-600 bg-purple-50' : 'border-slate-200 hover:border-slate-400'}`}>
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📦</div>
                  <div className="font-bold text-xl text-slate-900">Importación</div>
                  <div className="text-slate-600 font-medium mt-1 text-sm">Ingreso de mercadería al país.</div>
                </button>
                <button onClick={() => setFormData({...formData, tipo: 'Exportación'})} className={`p-6 rounded-lg border-2 transition-all text-left group ${formData.tipo === 'Exportación' ? 'border-purple-600 bg-purple-50' : 'border-slate-200 hover:border-slate-400'}`}>
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre / Razón Social</label>
                  <input type="text" name="clienteNombre" value={formData.clienteNombre} onChange={handleChange} placeholder="Ej: PAVECO S.A." className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">CUIT</label>
                  <input type="text" name="clienteCuit" value={formData.clienteCuit} onChange={handleChange} placeholder="Ej: 30-12345678-9" className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none" />
                </div>
              </div>
            </div>
          )}

          {paso === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Producto, Riesgo y Tiempos</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Descripción</label>
                  <textarea name="productoDescripcion" value={formData.productoDescripcion} onChange={handleChange} placeholder="Ej: Aditivos químicos industriales..." rows={2} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Origen / Destino</label>
                    <select name="pais" value={formData.pais} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium bg-white">
                      <option value="">Seleccionar país...</option>
                      {paisesMundo.map((pais) => ( <option key={pais} value={pais}>{pais}</option> ))}
                    </select>
                  </div>
                  <div className="md:col-span-1">
                     <label className="block text-sm font-bold text-slate-700 mb-2">Valor FOB (USD)</label>
                     <input type="number" name="fobEstimado" value={formData.fobEstimado} onChange={handleChange} placeholder="0.00" className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium" />
                  </div>
                  {/* 👇 NUEVO CAMPO DE VENCIMIENTO 👇 */}
                  <div className="md:col-span-1">
                     <label className="block text-sm font-bold text-red-600 mb-2 flex items-center gap-1">
                       <span title="Alerta de Vencimiento">🚨 Vencimiento</span>
                     </label>
                     <input type="date" name="fechaVencimiento" value={formData.fechaVencimiento} onChange={handleChange} className="w-full px-4 py-3 border border-red-300 bg-red-50 rounded-lg text-red-900 font-bold focus:ring-2 focus:ring-red-600 outline-none" />
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                      <label className="text-slate-800 font-bold text-sm">¿Es carga peligrosa (IMO)?</label>
                      <div className="flex gap-4">
                          <label className="flex items-center gap-2 font-bold text-slate-700 text-sm"><input type="radio" name="esPeligroso" value="Si" checked={formData.esPeligroso === 'Si'} onChange={handleChange} className="accent-orange-600"/> Sí</label>
                          <label className="flex items-center gap-2 font-bold text-slate-700 text-sm"><input type="radio" name="esPeligroso" value="No" checked={formData.esPeligroso === 'No'} onChange={handleChange} className="accent-orange-600"/> No</label>
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
                
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-100 shadow-sm relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-200 rounded-full blur-[40px] opacity-50"></div>
                  
                  <h3 className="text-sm font-extrabold text-purple-900 mb-2 flex items-center gap-2">
                    ✨ Asistente de Clasificación IA
                  </h3>
                  <p className="text-xs text-purple-700 mb-4 font-medium">
                    Analizando: <span className="italic">"{formData.productoDescripcion || 'Sin descripción'}"</span>
                  </p>
                  
                  <button
                    type="button"
                    onClick={sugerirNcmConIA}
                    disabled={iaCargando || !formData.productoDescripcion}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {iaCargando ? (
                      <><span className="animate-spin text-xl">⚙️</span> Procesando variables...</>
                    ) : (
                      <>Sugerir Posición NCM</>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Posición NCM Confirmada</label>
                  <div className="flex gap-2">
                    <input type="text" name="ncm" value={formData.ncm} onChange={handleChange} placeholder="Ej: 3824.99" className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-bold" />
                    <button type="button" onClick={() => setMostrarSelectorNcm(!mostrarSelectorNcm)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold border border-slate-200 hover:bg-slate-200">
                      🔍
                    </button>
                  </div>

                  {mostrarSelectorNcm && (
                    <div className="mt-4 border border-slate-300 rounded-lg p-3 bg-slate-50">
                      <input type="text" value={busquedaNcm} onChange={(e) => setBusquedaNcm(e.target.value)} placeholder="Buscar o verificar sugerencia..." className="w-full px-3 py-2 border rounded mb-2 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-purple-400" />
                      <div className="max-h-40 overflow-y-auto">
                        {ncmFiltrados.map((item) => (
                            <button key={item.codigo} type="button" onClick={() => seleccionarNcm(item.codigo, item.descripcion)} className="w-full text-left p-2 hover:bg-white text-sm border-b border-slate-100 text-slate-800">
                              <span className="font-bold">{item.codigo}</span> - {item.descripcion.substring(0,35)}...
                            </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {paso === 5 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Documentación y Logística</h2>
              
              <div className="space-y-6">
                
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-800 mb-4 uppercase tracking-wider">Datos Operativos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Domicilio Fiscal / Operativo</label>
                      <input type="text" name="domicilio" value={formData.domicilio} onChange={handleChange} placeholder="Ej: Av. Belgrano 123, CABA" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-purple-600 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">CBU (Para reintegros)</label>
                      <input type="text" name="cbu" value={formData.cbu} onChange={handleChange} placeholder="22 dígitos" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-purple-600 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Peso Neto (kg)</label>
                      <input type="number" name="pesoNeto" value={formData.pesoNeto} onChange={handleChange} placeholder="0.00" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-purple-600 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Peso Bruto (kg)</label>
                      <input type="number" name="pesoBruto" value={formData.pesoBruto} onChange={handleChange} placeholder="0.00" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-purple-600 outline-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 mb-3 uppercase tracking-wider">Checklist Documental</h3>
                  <p className="text-xs text-slate-500 mb-4">Marcá los documentos que el cliente ya te entregó o gestionaste.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { id: 'afip', label: 'Constancia AFIP/ARCA' },
                      { id: 'malvina', label: 'Alta Sistema Malvina' },
                      { id: 'factura', label: 'Factura Comercial (USD)' },
                      { id: 'packing', label: 'Packing List' },
                      { id: 'origen', label: 'Certificado de Origen' },
                      { id: 'tecnicas', label: 'Certificaciones Técnicas' },
                      { id: 'transporte', label: 'Carta Porte / CRT' },
                    ].map((doc) => (
                      <label key={doc.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.docs[doc.id as keyof typeof formData.docs] ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${formData.docs[doc.id as keyof typeof formData.docs] ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                           {formData.docs[doc.id as keyof typeof formData.docs] && <span className="text-white text-xs">✓</span>}
                        </div>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={formData.docs[doc.id as keyof typeof formData.docs]}
                          onChange={() => handleDocChange(doc.id)} 
                        />
                        <span className={`text-sm font-bold ${formData.docs[doc.id as keyof typeof formData.docs] ? 'text-green-800' : 'text-slate-700'}`}>
                          {doc.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            {paso > 1 ? (
              <button onClick={anteriorPaso} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800">← Atrás</button>
            ) : <div></div>}

            {paso < 5 ? (
              <button onClick={siguientePaso} disabled={(paso === 1 && !formData.tipo)} className="px-8 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 shadow-lg">
                Siguiente →
              </button>
            ) : (
              <button onClick={guardarOperacion} disabled={!formData.ncm} className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 shadow-lg">
                ✓ Finalizar Operación
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}