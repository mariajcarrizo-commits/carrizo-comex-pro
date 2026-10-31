'use client'

import { useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  calcularImportacion,
  formatUsd,
  formatPct,
  numeroSeguro,
  PERCEPCION_GANANCIAS_DEFAULT,
  PERCEPCION_IIBB_DEFAULT,
  TASA_ESTADISTICA_PCT,
} from '../../lib/tributos'

const calculatorMono = { fontFamily: '"Roboto Mono", "Courier New", monospace' }

const inputClass =
  'w-full px-5 py-3 border border-[#D1D5DB] rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] outline-none transition bg-white'

export default function CalculadoraTributos() {
  // Los campos se guardan como texto para que el usuario pueda borrar y tipear libremente.
  const [inputs, setInputs] = useState({
    fob: '',
    flete: '',
    seguro: '',
    derechosPct: '16',
    ivaPct: '21',
    gananciasPct: String(PERCEPCION_GANANCIAS_DEFAULT),
    iibbPct: String(PERCEPCION_IIBB_DEFAULT),
    honorarios: '',
  })
  const [opciones, setOpciones] = useState({
    tasaEstadisticaExenta: false,
    certificadoExclusionIva: false,
    certificadoExclusionGanancias: false,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    // No se aceptan negativos: se descarta el signo menos.
    setInputs(prev => ({ ...prev, [name]: value.replace('-', '') }))
  }

  const toggle = (name: keyof typeof opciones) => setOpciones(prev => ({ ...prev, [name]: !prev[name] }))

  const data = calcularImportacion({
    fob: numeroSeguro(inputs.fob),
    flete: numeroSeguro(inputs.flete),
    seguro: numeroSeguro(inputs.seguro),
    derechosPct: numeroSeguro(inputs.derechosPct),
    ivaPct: numeroSeguro(inputs.ivaPct),
    gananciasPct: numeroSeguro(inputs.gananciasPct),
    iibbPct: numeroSeguro(inputs.iibbPct),
    honorarios: numeroSeguro(inputs.honorarios),
    ...opciones,
  })

  const sinDatos = data.cif === 0

  const descargarPDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(22)
    doc.setTextColor(30, 41, 59)
    doc.text('Presupuesto de Operación', 14, 20)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, 14, 28)
    doc.text('Estimación de costos de nacionalización (valores en USD)', 14, 34)

    doc.setDrawColor(220, 220, 220)
    doc.line(14, 38, 196, 38)

    autoTable(doc, {
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      bodyStyles: { textColor: [71, 85, 105] },
      head: [['Valores de la Mercadería', 'Monto']],
      body: [
        ['Valor FOB', formatUsd(numeroSeguro(inputs.fob))],
        ['Flete Internacional', formatUsd(numeroSeguro(inputs.flete))],
        ['Seguro', formatUsd(numeroSeguro(inputs.seguro))],
        [{ content: 'Valor en Aduana (CIF)', styles: { fontStyle: 'bold', textColor: [30, 41, 59] } }, { content: formatUsd(data.cif), styles: { fontStyle: 'bold', textColor: [30, 41, 59] } }],
      ],
    })

    let y = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(14)
    doc.setTextColor(30, 41, 59)
    doc.text('Liquidación estimada de tributos', 14, y)

    autoTable(doc, {
      startY: y + 5,
      theme: 'striped',
      headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { textColor: [71, 85, 105] },
      head: [['Concepto', 'Alícuota', 'Importe', 'Naturaleza']],
      body: [
        ['Derechos de Importación', formatPct(numeroSeguro(inputs.derechosPct)), formatUsd(data.derechos), 'Costo'],
        ['Tasa de Estadística', opciones.tasaEstadisticaExenta ? 'Exenta' : `${TASA_ESTADISTICA_PCT}%${data.topeAplicado ? ' (con tope)' : ''}`, formatUsd(data.tasaEstadistica), 'Costo'],
        ['IVA', formatPct(numeroSeguro(inputs.ivaPct)), formatUsd(data.iva), 'Crédito fiscal'],
        ['Percepción IVA', formatPct(data.percepcionIvaPct), formatUsd(data.percepcionIva), 'Pago a cuenta'],
        ['Percepción Ganancias', formatPct(data.gananciasPct), formatUsd(data.percepcionGanancias), 'Pago a cuenta'],
        ['Percepción Ingresos Brutos', formatPct(data.iibbPct), formatUsd(data.percepcionIibb), 'Pago a cuenta'],
        [{ content: 'Fondos a depositar en Aduana', colSpan: 2, styles: { fontStyle: 'bold', textColor: [30, 41, 59] } }, { content: formatUsd(data.fondosADepositar), styles: { fontStyle: 'bold', textColor: [30, 41, 59] } }, ''],
      ],
    })

    y = (doc as any).lastAutoTable.finalY + 8
    autoTable(doc, {
      startY: y,
      theme: 'plain',
      styles: { fontSize: 11 },
      columnStyles: { 0: { fontStyle: 'bold', textColor: [30, 41, 59] }, 1: { halign: 'right', fontStyle: 'bold' } },
      body: [
        ['Honorarios profesionales', formatUsd(data.honorarios)],
        ['Desembolso total de caja (mercadería + depósitos + honorarios)', formatUsd(data.desembolsoTotal)],
        ['Costo real de nacionalización (sin IVA ni percepciones recuperables)', formatUsd(data.costoReal)],
      ],
    })

    y = (doc as any).lastAutoTable.finalY + 8
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    const notas = [
      '* Valores estimativos, sujetos a verificación aduanera y al tipo de cambio del día de oficialización. La liquidación oficial es la del SIM (Malvina).',
      '* Tasa de Estadística con topes del Decreto 1140/2024. Base de IVA y percepciones: CIF + Derechos + Tasa de Estadística.',
      '* "Costo real" supone un Responsable Inscripto que computa el IVA como crédito fiscal y las percepciones como pagos a cuenta.',
    ]
    notas.forEach((n, i) => doc.text(doc.splitTextToSize(n, 182), 14, y + i * 8))

    doc.save(`Presupuesto_Impo_${new Date().getTime()}.pdf`)
  }

  const Fila = ({ label, valor, color = 'text-[#A78BFA]', nota }: { label: string; valor: number; color?: string; nota?: string }) => (
    <div className={`flex justify-between items-start gap-3 ${color}`}>
      <span className="text-sm md:text-base font-medium">
        {label}
        {nota && <span className="block text-xs text-[#94A3B8] font-normal">{nota}</span>}
      </span>
      <span className="text-sm md:text-lg font-semibold whitespace-nowrap" style={calculatorMono}>{formatUsd(valor)}</span>
    </div>
  )

  const Toggle = ({ name, label, ayuda }: { name: keyof typeof opciones; label: string; ayuda: string }) => (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <input type="checkbox" checked={opciones[name]} onChange={() => toggle(name)} className="mt-1 w-4 h-4 accent-[#7C3AED]" />
      <span>
        <span className="block text-sm font-semibold text-[#374151]">{label}</span>
        <span className="block text-xs text-[#6B7280]">{ayuda}</span>
      </span>
    </label>
  )

  return (
    <div className="min-h-screen bg-[#F5F7F9] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0D1B2A] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Calculadora de Tributos</h1>
            <p className="text-[#3A3E46] font-medium text-sm md:text-base">Estimación de costos de nacionalización (valores en USD)</p>
          </div>
          <button
            onClick={descargarPDF}
            disabled={sinDatos}
            className="hidden md:flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
          >
            📄 Descargar Presupuesto
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          {/* --- PANEL IZQUIERDO --- */}
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-lg border border-[#E9EEF4]">
            <h2 className="text-xl md:text-2xl font-bold text-[#6D28D9] mb-6 md:mb-8">Valores de la Mercadería</h2>

            <div className="space-y-6">
              {([
                ['fob', 'Valor FOB (USD)'],
                ['flete', 'Flete Internacional (USD)'],
                ['seguro', 'Seguro (USD)'],
              ] as const).map(([name, label]) => (
                <div key={name}>
                  <label className="block text-sm font-semibold text-[#4B5563] mb-2">{label}</label>
                  <input type="number" inputMode="decimal" min="0" step="0.01" name={name} value={inputs[name]} placeholder="0,00" onChange={handleInputChange} className={inputClass} />
                </div>
              ))}

              <div className="border-t border-[#E5E7EB] pt-6 mt-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#4B5563] mb-2">Derechos de Importación (%)</label>
                  <input type="number" inputMode="decimal" min="0" max="100" step="0.1" name="derechosPct" value={inputs.derechosPct} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#4B5563] mb-2">Alícuota IVA</label>
                  <select name="ivaPct" value={inputs.ivaPct} onChange={handleInputChange} className={inputClass}>
                    <option value="21">General (21%)</option>
                    <option value="10.5">Reducida (10,5%)</option>
                    <option value="0">Exento (0%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#4B5563] mb-2">Percepción Ganancias (%)</label>
                  <input type="number" inputMode="decimal" min="0" step="0.1" name="gananciasPct" value={inputs.gananciasPct} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#4B5563] mb-2">Percepción IIBB (%)</label>
                  <input type="number" inputMode="decimal" min="0" step="0.1" name="iibbPct" value={inputs.iibbPct} onChange={handleInputChange} className={inputClass} />
                </div>
              </div>

              <div className="bg-[#F8F7FF] border border-[#EDE9FE] rounded-2xl p-4 space-y-3">
                <Toggle name="tasaEstadisticaExenta" label="Tasa de Estadística exenta" ayuda="Ej.: origen con acuerdo preferencial. Verificar caso por caso." />
                <Toggle name="certificadoExclusionIva" label="Certificado de exclusión de percepción de IVA" ayuda="El importador está excluido del régimen de percepción de IVA." />
                <Toggle name="certificadoExclusionGanancias" label="Certificado de exclusión de percepción de Ganancias" ayuda="El importador está excluido del régimen de percepción de Ganancias." />
              </div>

              <div className="border-t border-[#E5E7EB] pt-6 mt-6">
                <label className="block text-sm font-semibold text-[#6D28D9] mb-2">Honorarios Despachante (USD)</label>
                <input type="number" inputMode="decimal" min="0" step="0.01" name="honorarios" value={inputs.honorarios} placeholder="0,00" onChange={handleInputChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* --- PANEL DERECHO --- */}
          <div className="bg-[#121A30] p-6 md:p-10 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#7C3AED] rounded-full blur-[120px] opacity-25 -mr-40 -mt-40 pointer-events-none"></div>

            <div className="relative z-10 space-y-4">
              <h2 className="text-xl md:text-2xl font-bold mb-4">Resumen de Liquidación</h2>

              <Fila label="Valor en Aduana (CIF)" valor={data.cif} color="text-[#E1E7EF]" />

              <div className="pt-3 border-t border-[#2A344C] space-y-3">
                <p className="text-xs uppercase tracking-wider text-[#94A3B8] font-bold">Tributos (costo)</p>
                <Fila label={`Derechos de Importación (${formatPct(numeroSeguro(inputs.derechosPct))})`} valor={data.derechos} />
                <Fila
                  label={opciones.tasaEstadisticaExenta ? 'Tasa de Estadística (exenta)' : `Tasa de Estadística (${TASA_ESTADISTICA_PCT}%)`}
                  valor={data.tasaEstadistica}
                  nota={data.topeAplicado ? `Tope Dto. 1140/2024 aplicado (sin tope: ${formatUsd(data.tasaEstadisticaSinTope)})` : undefined}
                />
              </div>

              <div className="pt-3 border-t border-[#2A344C] space-y-3">
                <p className="text-xs uppercase tracking-wider text-[#94A3B8] font-bold">IVA y percepciones (recuperables)</p>
                <Fila label={`IVA (${formatPct(numeroSeguro(inputs.ivaPct))})`} valor={data.iva} color="text-[#E1E7EF]" />
                <Fila label={`Percepción IVA (${formatPct(data.percepcionIvaPct)})`} valor={data.percepcionIva} />
                <Fila label={`Percepción Ganancias (${formatPct(data.gananciasPct)})`} valor={data.percepcionGanancias} />
                <Fila label={`Percepción IIBB (${formatPct(data.iibbPct)})`} valor={data.percepcionIibb} />
              </div>

              <div className="flex justify-between items-center text-[#F87171] font-bold pt-3 border-t border-[#2A344C]">
                <span className="text-sm md:text-lg">Fondos a depositar en Aduana</span>
                <span className="text-base md:text-xl whitespace-nowrap" style={calculatorMono}>{formatUsd(data.fondosADepositar)}</span>
              </div>

              <Fila label="Honorarios Despachante" valor={data.honorarios} color="text-[#E1E7EF]" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                <div className="border border-[#7C3AED]/40 p-4 rounded-2xl">
                  <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-wider">Desembolso total</p>
                  <p className="font-extrabold text-2xl text-white break-words mt-1" style={calculatorMono}>{formatUsd(data.desembolsoTotal)}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">Mercadería + depósitos + honorarios</p>
                </div>
                <div className="border border-[#10B981]/50 p-4 rounded-2xl bg-[#10B981]/5">
                  <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-wider">Costo real</p>
                  <p className="font-extrabold text-2xl text-[#10B981] break-words mt-1" style={calculatorMono}>{formatUsd(data.costoReal)}</p>
                  <p className="text-xs text-[#94A3B8] mt-1">Sin IVA ni percepciones (Resp. Inscripto)</p>
                </div>
              </div>

              <p className="text-xs text-[#64748B] pt-2">
                Estimación referencial. La liquidación oficial es la del SIM (Malvina). Tasa de Estadística con topes del Decreto 1140/2024.
              </p>
            </div>

            <button
              onClick={descargarPDF}
              disabled={sinDatos}
              className="md:hidden w-full mt-8 flex justify-center items-center gap-2 bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 text-white font-bold py-4 px-6 rounded-xl shadow-xl border border-[#059669] transition-all relative z-10"
            >
              📄 Descargar Presupuesto PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
