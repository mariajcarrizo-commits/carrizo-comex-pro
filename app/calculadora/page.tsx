'use client'

import { useState } from 'react'
import Navbar from '../components/Navbar'

export default function Calculadora() {
  const [valores, setValores] = useState({
    fob: '',
    flete: '',
    seguro: '',
    arancelPorcentaje: '16',
    tasaEstPorcentaje: '3',
    ivaPorcentaje: '21',
  })

  // Cálculos matemáticos en tiempo real
  const fob = parseFloat(valores.fob) || 0
  const flete = parseFloat(valores.flete) || 0
  const seguro = parseFloat(valores.seguro) || 0
  
  const baseCif = fob + flete + seguro
  
  const derechos = baseCif * (parseFloat(valores.arancelPorcentaje) / 100)
  const tasaEst = baseCif * (parseFloat(valores.tasaEstPorcentaje) / 100)
  
  const baseIva = baseCif + derechos + tasaEst
  const iva = baseIva * (parseFloat(valores.ivaPorcentaje) / 100)
  
  const totalTributos = derechos + tasaEst + iva

  const handleChange = (e: any) => {
    setValores({ ...valores, [e.target.name]: e.target.value })
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Calculadora de Tributos</h1>
            <p className="text-slate-600 font-medium">Estimación rápida de costos de nacionalización (Valores en USD)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* PANEL DE INGRESO DE DATOS */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Valores de la Mercadería</h2>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Valor FOB (USD)</label>
                  <input type="number" name="fob" value={valores.fob} onChange={handleChange} placeholder="0.00" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Flete (USD)</label>
                    <input type="number" name="flete" value={valores.flete} onChange={handleChange} placeholder="0.00" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Seguro (USD)</label>
                    <input type="number" name="seguro" value={valores.seguro} onChange={handleChange} placeholder="0.00" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Alícuotas (%)</h2>
              <div className="grid grid-cols-3 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Arancel (D.I.)</label>
                    <input type="number" name="arancelPorcentaje" value={valores.arancelPorcentaje} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tasa Est.</label>
                    <input type="number" name="tasaEstPorcentaje" value={valores.tasaEstPorcentaje} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">IVA</label>
                    <input type="number" name="ivaPorcentaje" value={valores.ivaPorcentaje} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
              </div>
            </div>

            {/* PANEL DE RESULTADOS */}
            <div className="bg-slate-900 rounded-xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden">
               {/* Decoración de fondo */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full blur-[80px] opacity-20 -mr-20 -mt-20"></div>
              
              <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-700 pb-2 relative z-10">Resumen de Liquidación</h2>
              
              <div className="space-y-4 relative z-10 text-sm md:text-base">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Base Imponible (CIF):</span>
                  <span className="font-mono font-bold">U$S {baseCif.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-slate-300">
                  <span>Derechos de Impo ({valores.arancelPorcentaje}%):</span>
                  <span className="font-mono font-bold text-purple-300">U$S {derechos.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-slate-300">
                  <span>Tasa de Estadística ({valores.tasaEstPorcentaje}%):</span>
                  <span className="font-mono text-purple-300">U$S {tasaEst.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Base IVA:</span>
                  <span className="font-mono text-slate-400">U$S {baseIva.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-slate-300">
                  <span>IVA ({valores.ivaPorcentaje}%):</span>
                  <span className="font-mono text-purple-300">U$S {iva.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700 relative z-10">
                <div className="flex justify-between items-end">
                  <span className="text-lg text-slate-300 font-bold">Total Tributos:</span>
                  <span className="text-4xl font-bold text-green-400 font-mono">
                    U$S {totalTributos.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 text-right mt-2">* Valores referenciales. No incluye anticipos, IIBB ni honorarios.</p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  )
}