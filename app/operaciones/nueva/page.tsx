'use client'

import { useState, useEffect } from 'react'
import { ncmComunes } from '@/lib/ncmData'
import { supabase } from '../../../lib/supabase'

// ✨ BASE DE DATOS DE PRUEBA DE CUITs
const padronCuitPrueba: { [key: string]: string } = {
  "30123456789": "MAJOSHKA S.A.",
  "20987654321": "CARRIZO COMEX Freelance",
  "33555666778": "GLOBAL LOGISTICS ARG SRL",
};

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
  const [analisisIA, setAnalisisIA] = useState('');
  const [paso, setPaso] = useState(1)
  const [planUsuario, setPlanUsuario] = useState('freelance')
  
  const [formData, setFormData] = useState({
    tipo: '',
    clienteNombre: '',
    clienteCuit: '',
    emailCliente: '', 
    productoDescripcion: '',
    
    // ✨ VARIABLES DE MUESTRA ACTUALIZADAS
    esMuestra: 'No',
    muestraTipoValor: 'Sin Valor',
    muestraMonto: '', // 👈 NUEVO: Para guardar los USD de la muestra
    
    pais: '',
    ncm: '',
    esPeligroso: 'No',
    fobEstimado: '',
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

  const [busquedaNcm, setBusquedaNcm] = useState('')
  const [mostrarSelectorNcm, setMostrarSelectorNcm] = useState(false)
  const [iaCargando, setIaCargando] = useState(false)
  const [cuitCargando, setCuitCargando] = useState(false); 

  useEffect(() => {
    const obtenerPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const { data } = await supabase
          .from('perfiles')
          .select('plan_suscripcion')
          .eq('email', user.email)
          .single()
        
        if (data && data.plan_suscripcion) {
          setPlanUsuario(data.plan_suscripcion)
        }
      }
    }
    obtenerPlan()
  }, [])

  useEffect(() => {
    const limpiarCuit = formData.clienteCuit.replace(/-/g, '').trim();
    if (limpiarCuit.length === 11) {
      setCuitCargando(true);
      setTimeout(() => {
        const razonSocialEncontrada = padronCuitPrueba[limpiarCuit];
        if (razonSocialEncontrada) {
          setFormData(prev => ({ ...prev, clienteNombre: razonSocialEncontrada }));
        } else {
          setFormData(prev => ({ ...prev, clienteNombre: '' }));
        }
        setCuitCargando(false);
      }, 1000);
    }
  }, [formData.clienteCuit]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    
    // 🧠 Lógica inteligente: Si dice que NO es muestra, reseteamos todo lo demás.
    if (name === 'esMuestra' && value === 'No') {
      setFormData(prev => ({ ...prev, esMuestra: value, muestraTipoValor: 'Sin Valor', muestraMonto: '' }));
    } 
    // Si cambia a "Sin Valor", borramos el monto que haya escrito antes
    else if (name === 'muestraTipoValor' && value === 'Sin Valor') {
      setFormData(prev => ({ ...prev, muestraTipoValor: value, muestraMonto: '' }));
    } 
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }

  const handleDocChange = (docName: string) => {
    setFormData({
      ...formData,
      docs: { ...formData.docs, [docName]: !formData.docs[docName as keyof typeof formData.docs] }
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
    setIaCargando(true);
    setAnalisisIA(''); 
    try {
      const res = await fetch('/api/clasificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          descripcion: formData.productoDescripcion,
          tipo: formData.tipo 
        })
      });
      const data = await res.json();
      
      setAnalisisIA(data.sugerencia); 
      const ncmExtraida = data.sugerencia.match(/\b\d{4}\.\d{2}\.\d{2}\b/);
      if (ncmExtraida) {
        setFormData({ ...formData, ncm: ncmExtraida[0] });
      }
    } catch (error) {
      setAnalisisIA("Error de conexión con la IA.");
    }
    setIaCargando(false);
  }

  const guardarOperacion = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const emailCreador = user?.email || 'desconocido'

    const nuevaOperacion = {
      tipo: formData.tipo,
      cliente: formData.clienteNombre,
      cuit: formData.clienteCuit,
      email_cliente: formData.emailCliente.toLowerCase(),
      email_creador: emailCreador, 
      producto: formData.productoDescripcion,
      
      // ✨ GUARDAMOS TODA LA INFO DE LA MUESTRA
      es_muestra: formData.esMuestra,
      muestra_tipo_valor: formData.esMuestra === 'Si' ? formData.muestraTipoValor : null,
      muestra_monto: formData.esMuestra === 'Si' && formData.muestraTipoValor === 'Con Valor' ? parseFloat(formData.muestraMonto) || 0 : 0,

      pais: formData.pais,
      posicion_ncm: formData.ncm,
      es_peligroso: formData.esPeligroso,
      fob: parseFloat(formData.fobEstimado) || 0,
      estado: 'Pendiente',
      fecha_vencimiento: formData.fechaVencimiento ? formData.fechaVencimiento : null,
      domicilio: formData.domicilio,
      cbu: formData.cbu,
      honorarios: parseFloat(formData.honorarios) || 0,
      tipo_honorario: formData.tipo_honorario,
      gastos_logisticos: parseFloat(formData.gastos_logisticos) || 0,
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    CUIT
                    {cuitCargando && <span className="text-xs animate-spin">⚙️</span>}
                  </label>
                  <input type="text" name="clienteCuit" value={formData.clienteCuit} onChange={handleChange} placeholder="Ej: 30123456789" className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-purple-600 outline-none" />
                  <p className="text-xs text-slate-500 mt-1">Ingresá 11 dígitos para autocompletar.</p>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre / Razón Social</label>
                  <input type="text" name="clienteNombre" value={formData.clienteNombre} onChange={handleChange} placeholder="Se completará solo..." className={`w-full px-4 py-3 border border-slate-300 rounded-lg font-medium outline-none ${formData.clienteNombre ? 'text-green-900 bg-green-50 border-green-200 font-bold' : 'text-slate-900'}`} />
                </div>
                
                <div className="md:col-span-2 pt-2">
                  <label className="block text-sm font-bold text-purple-700 mb-2 flex items-center gap-2">
                    📧 Email del Cliente
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">Para acceso al Portal</span>
                  </label>
                  <input type="email" name="emailCliente" value={formData.emailCliente} onChange={handleChange} placeholder="majoshka@empresa.com" className="w-full px-4 py-3 border border-purple-200 bg-purple-50 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none placeholder-purple-300" />
                  <p className="text-xs text-slate-500 mt-1 italic">Con este correo tu cliente podrá iniciar sesión en su propio panel.</p>
                </div>
              </div>
            </div>
          )}

          {paso === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Producto, Riesgo y Costos</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Descripción</label>
                  <textarea name="productoDescripcion" value={formData.productoDescripcion} onChange={handleChange} placeholder="Ej: Aditivos químicos industriales..." rows={2} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none" />
                </div>

                {/* ✨ SECCIÓN MUESTRAS SUPER MEJORADA */}
                <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-purple-950 font-extrabold text-sm flex items-center gap-2">
                      <span className="text-xl">🎁</span> ¿La mercadería es una Muestra?
                    </label>
                    <div className="flex gap-4">
                      {['No', 'Si'].map(opcion => (
                        <label key={opcion} className={`flex items-center gap-2 font-bold px-4 py-2 rounded-full border cursor-pointer transition-all ${formData.esMuestra === opcion ? 'bg-purple-600 text-white border-purple-700 shadow-md' : 'bg-white text-purple-700 border-purple-200 hover:border-purple-300'}`}>
                          <input type="radio" name="esMuestra" value={opcion} checked={formData.esMuestra === opcion} onChange={handleChange} className="hidden"/> {opcion}
                        </label>
                      ))}
                    </div>
                  </div>

                  {formData.esMuestra === 'Si' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-3 border-t border-purple-100 flex flex-col gap-3">
                      
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-purple-800 font-bold text-sm italic">De ser muestra, especificar valor:</label>
                        <div className="flex gap-3">
                          {['Sin Valor', 'Con Valor'].map(valorOp => (
                            <label key={valorOp} className={`flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${formData.muestraTipoValor === valorOp ? 'bg-purple-100 text-purple-900 border-purple-300' : 'bg-white/50 text-purple-600 border-purple-100 hover:border-purple-200'}`}>
                              <input type="radio" name="muestraTipoValor" value={valorOp} checked={formData.muestraTipoValor === valorOp} onChange={handleChange} className="accent-purple-600"/> {valorOp}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* ✨ EL NUEVO CAMPO DE MONTO */}
                      {formData.muestraTipoValor === 'Con Valor' && (
                        <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-2">
                          <label className="text-xs font-bold text-purple-800">Monto Declarado (USD):</label>
                          <input 
                            type="number" 
                            name="muestraMonto" 
                            value={formData.muestraMonto} 
                            onChange={handleChange} 
                            placeholder="Ej: 50.00" 
                            className="w-32 px-3 py-1.5 text-sm border border-purple-200 rounded-md focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-800 bg-white"
                          />
                        </div>
                      )}

                    </div>
                  )}
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
                  <div className="md:col-span-1">
                     <label className="block text-sm font-bold text-red-600 mb-2 flex items-center gap-1">
                       <span title="Alerta de Vencimiento">🚨 Vencimiento</span>
                     </label>
                     <input type="date" name="fechaVencimiento" value={formData.fechaVencimiento} onChange={handleChange} className="w-full px-4 py-3 border border-red-300 bg-red-50 rounded-lg text-red-900 font-bold focus:ring-2 focus:ring-red-600 outline-none" />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-3">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Honorarios del Despachante</label>
                  <div className="flex gap-2">
                    <select name="tipo_honorario" value={formData.tipo_honorario} onChange={handleChange} className="w-1/3 px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-purple-600 outline-none bg-slate-50">
                      <option value="fijo">Monto Fijo (USD)</option>
                      <option value="porcentaje">Porcentaje FOB (%)</option>
                    </select>
                    <input type="number" name="honorarios" value={formData.honorarios} onChange={handleChange} placeholder={formData.tipo_honorario === 'fijo' ? "Ej: 350" : "Ej: 1.5"} className="w-2/3 px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 outline-none" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Si lo dejás en 0, se calculará automáticamente.</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 text-3xl opacity-20 rotate-12">⚠️</div>
                    <div className="flex items-center justify-between relative z-10 gap-4">
                      <label className="text-orange-950 font-bold text-sm flex items-center gap-2">¿Es carga peligrosa (IMO)?</label>
                      <div className="flex gap-4">
                          <label className="flex items-center gap-2 font-bold text-orange-800 text-sm"><input type="radio" name="esPeligroso" value="Si" checked={formData.esPeligroso === 'Si'} onChange={handleChange} className="accent-orange-600"/> Sí</label>
                          <label className="flex items-center gap-2 font-bold text-orange-800 text-sm"><input type="radio" name="esPeligroso" value="No" checked={formData.esPeligroso === 'No'} onChange={handleChange} className="accent-orange-600"/> No</label>
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
                
                {planUsuario === 'freelance' ? (
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center shadow-inner">
                    <div className="text-4xl mb-4">🔒</div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">IA Exclusiva para Planes Pro/Premium</h3>
                    <p className="text-sm text-slate-600 mb-5 max-w-md mx-auto"> Ahorrá horas de búsqueda. Nuestro Agente Inteligente sugiere la NCM exacta al instante.</p>
                    <button disabled className="bg-slate-200 text-slate-500 font-bold py-3 px-6 rounded-lg cursor-not-allowed w-full md:w-auto"> Agente IA Bloqueado </button>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-100 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-200 rounded-full blur-[40px] opacity-50"></div>
                    <h3 className="text-sm font-extrabold text-purple-900 mb-2 flex items-center gap-2"> ✨ Agente Aduanero Senior (IA) </h3>
                    <p className="text-xs text-purple-700 mb-4 font-medium relative z-10"> Analizando: <span className="italic">"{formData.productoDescripcion || 'Sin descripción'}"</span> </p>
                    <button type="button" onClick={sugerirNcmConIA} disabled={iaCargando || !formData.productoDescripcion} className="w-full relative z-10 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition-all shadow-md">
                      {iaCargando ? <><span className="animate-spin text-xl">⚙️</span> Procesando...</> : <>Generar Análisis y Sugerir NCM</>}
                    </button>
                    {analisisIA && (
                      <div className="mt-4 relative z-10 bg-white/90 backdrop-blur-sm border border-purple-200 rounded-lg p-5 text-sm text-slate-800 whitespace-pre-line leading-relaxed shadow-inner">
                        {analisisIA.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*)/g).map((parte, index) => {
                          if (parte.startsWith('***')) {
                            return <span key={index} className="font-extrabold italic text-purple-900">{parte.slice(3, -3)}</span>;
                          }
                          if (parte.startsWith('**')) {
                            return <span key={index} className="font-bold text-slate-900">{parte.slice(2, -2)}</span>;
                          }
                          return <span key={index}>{parte}</span>;
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Posición NCM Confirmada</label>
                  <div className="flex gap-2">
                    <input type="text" name="ncm" value={formData.ncm} onChange={handleChange} placeholder="Ej: 9004.10.00" className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-bold outline-none focus:ring-2 focus:ring-purple-500" />
                    <button type="button" onClick={() => setMostrarSelectorNcm(!mostrarSelectorNcm)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold border border-slate-200 hover:bg-slate-200"> 🔍 </button>
                  </div>
                
                  {mostrarSelectorNcm && (
                    <div className="mt-4 border border-slate-300 rounded-lg p-3 bg-slate-50">
                      <input type="text" value={busquedaNcm} onChange={(e) => setBusquedaNcm(e.target.value)} placeholder="Buscar o verificar..." className="w-full px-3 py-2 border rounded mb-2 text-slate-900 font-medium" />
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
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 gap-4 grid grid-cols-1 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Domicilio Fiscal / Operativo</label>
                      <input type="text" name="domicilio" value={formData.domicilio} onChange={handleChange} placeholder="Ej: Av. Belgrano 123, CABA" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">CBU (Para reintegros)</label>
                      <input type="text" name="cbu" value={formData.cbu} onChange={handleChange} placeholder="22 dígitos" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900" />
                    </div>
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
                      { id: 'transporte', label: 'Carta Porte / CRT' },
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

          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            {paso > 1 ? (
              <button onClick={anteriorPaso} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800">← Atrás</button>
            ) : <div></div>}

            {paso < 5 ? (
              <button onClick={siguientePaso} disabled={(paso === 1 && !formData.tipo)} className="px-8 py-3 bg-slate-900 text-white rounded-lg font-bold disabled:opacity-50">
                Siguiente →
              </button>
            ) : (
              <button onClick={guardarOperacion} disabled={!formData.ncm} className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold disabled:opacity-50">
                ✓ Finalizar Operación
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}