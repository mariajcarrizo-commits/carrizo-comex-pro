'use client'

import { useState } from 'react'
import Navbar from '../../components/Navbar'
import { ncmComunes } from '@/lib/ncmData'

// LISTA COMPLETA DE PAÍSES (Se ordena alfabéticamente más abajo)
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
    primerDespacho: 'No',
    fobEstimado: ''
  })

  const [busquedaNcm, setBusquedaNcm] = useState('')
  const [mostrarSelectorNcm, setMostrarSelectorNcm] = useState(false)

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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

  const siguientePaso = () => { if (paso < 4) setPaso(paso + 1) }
  const anteriorPaso = () => { if (paso > 1) setPaso(paso - 1) }

  const guardarOperacion = () => {
    const guardadas = localStorage.getItem('operaciones')
    const operaciones = guardadas ? JSON.parse(guardadas) : []
    
    const riesgo = formData.esPeligroso === 'Si' ? { riesgo: 'ALTO', score: 85, alertas: [{msg: 'Carga Peligrosa'}] } : { riesgo: 'BAJO', score: 10, alertas: [] }

    const nuevaOperacion = {
      id: Date.now(),
      cliente: formData.clienteNombre,
      cuit: formData.clienteCuit,
      tipo: formData.tipo,
      pais: formData.pais,
      producto: formData.productoDescripcion,
      ncm: formData.ncm,
      estado: "Pendiente",
      fecha: new Date().toLocaleDateString(),
      riesgo: riesgo,
      checklist: [{tarea: 'Confirmar Pedido', completado: false, etapa: 'Inicio'}, {tarea: 'Clasificar NCM', completado: true, etapa: 'Inicio'}],
      datosExtra: { esPeligroso: formData.esPeligroso }
    }
    
    operaciones.unshift(nuevaOperacion)
    localStorage.setItem('operaciones', JSON.stringify(operaciones))
    window.location.href = '/operaciones'
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Nueva Operación</h1>
            <p className="text-slate-600 font-medium">Completá los datos paso a paso</p>
          </div>

          {/* INDICADOR DE PASOS */}
          <div className="flex justify-between mb-8 px-2">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-bold border-2 text-sm md:text-base ${
                  paso >= num ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-300'
                }`}>
                  {num}
                </div>
                {num < 4 && (
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
                  <button
                    onClick={() => setFormData({...formData, tipo: 'Importación'})}
                    className={`p-6 rounded-lg border-2 transition-all text-left group ${
                      formData.tipo === 'Importación' ? 'border-purple-600 bg-purple-50' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📦</div>
                    <div className="font-bold text-xl text-slate-900">Importación</div>
                    <div className="text-slate-600 font-medium mt-1 text-sm">Ingreso de mercadería al país.</div>
                  </button>

                  <button
                    onClick={() => setFormData({...formData, tipo: 'Exportación'})}
                    className={`p-6 rounded-lg border-2 transition-all text-left group ${
                      formData.tipo === 'Exportación' ? 'border-purple-600 bg-purple-50' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
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
                    <input type="text" name="clienteNombre" value={formData.clienteNombre} onChange={handleChange}
                      placeholder="Ej: PAVECO S.A."
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">CUIT</label>
                    <input type="text" name="clienteCuit" value={formData.clienteCuit} onChange={handleChange}
                      placeholder="Ej: 30-12345678-9"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none" />
                  </div>
                </div>
              </div>
            )}

            {paso === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Producto y Riesgo</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Descripción</label>
                    <textarea name="productoDescripcion" value={formData.productoDescripcion} onChange={handleChange}
                      placeholder="Ej: Aditivos químicos..." rows={2}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Origen / Destino</label>
                      <select name="pais" value={formData.pais} onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium bg-white">
                        <option value="">Seleccionar país...</option>
                        {/* MAPEO AUTOMÁTICO DE LA LISTA DE PAÍSES */}
                        {paisesMundo.map((pais) => (
                          <option key={pais} value={pais}>{pais}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">Valor FOB (USD)</label>
                       <input type="number" name="fobEstimado" value={formData.fobEstimado} onChange={handleChange}
                         placeholder="0.00"
                         className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium" />
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
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Clasificación</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Posición NCM</label>
                    <div className="flex gap-2">
                      <input type="text" name="ncm" value={formData.ncm} onChange={handleChange} placeholder="Ej: 3824.99"
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-bold" />
                      <button type="button" onClick={() => setMostrarSelectorNcm(!mostrarSelectorNcm)}
                        className="px-4 bg-purple-100 text-purple-700 rounded-lg font-bold border border-purple-200">
                        🔍
                      </button>
                    </div>

                    {mostrarSelectorNcm && (
                      <div className="mt-4 border border-slate-300 rounded-lg p-3 bg-slate-50">
                        <input type="text" value={busquedaNcm} onChange={(e) => setBusquedaNcm(e.target.value)}
                          placeholder="Buscar..." className="w-full px-3 py-2 border rounded mb-2 text-slate-900" />
                        <div className="max-h-40 overflow-y-auto">
                          {ncmFiltrados.map((item) => (
                              <button key={item.codigo} type="button" onClick={() => seleccionarNcm(item.codigo, item.descripcion)}
                                className="w-full text-left p-2 hover:bg-white text-sm border-b border-slate-100 text-slate-800">
                                <span className="font-bold">{item.codigo}</span> - {item.descripcion.substring(0,30)}...
                              </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 p-4 bg-slate-100 rounded-lg border border-slate-200 text-sm text-slate-700 space-y-2">
                    <p><strong className="text-slate-900">Cliente:</strong> {formData.clienteNombre}</p>
                    <p><strong className="text-slate-900">Operación:</strong> {formData.tipo}</p>
                    <p><strong className="text-slate-900">Producto:</strong> {formData.productoDescripcion}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
              {paso > 1 ? (
                <button onClick={anteriorPaso} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800">← Atrás</button>
              ) : <div></div>}

              {paso < 4 ? (
                <button onClick={siguientePaso} disabled={(paso === 1 && !formData.tipo)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 shadow-lg">
                  Siguiente →
                </button>
              ) : (
                <button onClick={guardarOperacion} disabled={!formData.ncm}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 shadow-lg">
                  ✓ Finalizar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}