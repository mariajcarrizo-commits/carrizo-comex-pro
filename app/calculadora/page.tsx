'use client'

import { useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Estilo de fuente monoespaciada tipo calculadora
const calculatorMono = { fontFamily: '"Roboto Mono", "Courier New", monospace' };

export default function CalculadoraTributos() {
  const [inputs, setInputs] = useState({
    fob: 0,
    flete: 0,
    seguro: 0,
    arancel_pct: 16, 
    iva_pct: 21,    
    honorarios: 0,
  })

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  }

  const calcData = () => {
    const cif = inputs.fob + inputs.flete + inputs.seguro;
    const derechos = cif * (inputs.arancel_pct / 100);
    const tasa_est = cif * 0.03; 
    const base_afip = cif + derechos + tasa_est;

    const tributo_iva = base_afip * (inputs.iva_pct / 100);
    const perc_iva_20 = base_afip * 0.20; 
    const perc_gan_6 = base_afip * 0.06;  
    const perc_iibb_2_5 = base_afip * 0.025; 

    const total_tributos = derechos + tasa_est + tributo_iva + perc_iva_20 + perc_gan_6 + perc_iibb_2_5;
    const honorarios = inputs.honorarios;
    const costo_total_estimado = inputs.fob + inputs.flete + inputs.seguro + total_tributos + honorarios;

    return {
      cif, derechos, tasa_est, base_afip, tributo_iva, perc_iva_20, perc_gan_6, perc_iibb_2_5, total_tributos, costo_total_estimado,
    };
  }

  const data = calcData();
  const formatUsd = (value: number) => `U$S ${value.toFixed(2)}`;

  const descargarPDF = () => {
    const doc = new jsPDF();
    const docWidth = doc.internal.pageSize.getWidth();
    
    // Encabezado
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text('Presupuesto de Operación', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, 14, 28);
    doc.text('Estimación rápida de costos aduaneros y tributarios (Valores en USD)', 14, 34);

    doc.setDrawColor(220, 220, 220);
    doc.line(14, 38, 196, 38);

    // Tabla 1: Valores Declarados
    autoTable(doc, {
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      bodyStyles: { textColor: [71, 85, 105] },
      head: [['Valores de la Mercadería', 'Monto Declarado']],
      body: [
        ['Valor FOB', formatUsd(inputs.fob)],
        ['Flete Internacional', formatUsd(inputs.flete)],
        ['Seguro', formatUsd(inputs.seguro)],
        [{ content: 'Base Imponible (CIF)', styles: { fontStyle: 'bold', textColor: [30, 41, 59] } }, { content: formatUsd(data.cif), styles: { fontStyle: 'bold', textColor: [30, 41, 59] } }]
      ],
    });

    // Tabla 2: Liquidación de Tributos
    const alturaActual = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Liquidación de Tributos (Aduana + AFIP)', 14, alturaActual);

    autoTable(doc, {
      startY: alturaActual + 5,
      theme: 'striped',
      headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { textColor: [71, 85, 105] },
      head: [['Concepto', 'Alícuota', 'Importe']],
      body: [
        ['Derechos de Importación', `${inputs.arancel_pct}%`, formatUsd(data.derechos)],
        ['Tasa de Estadística', '3%', formatUsd(data.tasa_est)],
        ['IVA', `${inputs.iva_pct}%`, formatUsd(data.tributo_iva)],
        ['Percepción IVA', '20%', formatUsd(data.perc_iva_20)],
        ['Anticipo Ganancias', '6%', formatUsd(data.perc_gan_6)],
        ['Percepción Ingresos Brutos', '2.5%', formatUsd(data.perc_iibb_2_5)],
        [{ content: 'Total Tributos y Tasas', colSpan: 2, styles: { fontStyle: 'bold', textColor: [220, 38, 38] } }, { content: formatUsd(data.total_tributos), styles: { fontStyle: 'bold', textColor: [220, 38, 38] } }]
      ],
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`Honorarios Profesionales: ${formatUsd(inputs.honorarios)}`, 14, finalY);

    doc.setFillColor(241, 245, 249);
    doc.rect(14, finalY + 5, 182, 25, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('COSTO TOTAL ESTIMADO:', 18, finalY + 13);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('(Mercadería + Tributos + Honorarios)', 18, finalY + 18);

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); 
    doc.text(formatUsd(data.costo_total_estimado), 190, finalY + 20, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('* Los valores expresados son estimativos y sujetos a verificación aduanera y tipo de cambio oficial del día de oficialización.', 14, finalY + 35);

    doc.save(`Cotizacion_Impo_${new Date().getTime()}.pdf`);
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0D1B2A] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Calculadora de Tributos</h1>
            <p className="text-[#3A3E46] font-medium text-sm md:text-base">Estimación rápida de costos de nacionalización (Valores en USD)</p>
          </div>
          {/* BOTÓN DESKTOP (Solo visible en PC) */}
          <button 
            onClick={descargarPDF}
            className="hidden md:flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
          >
            📄 Descargar Presupuesto
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          
          {/* --- PANEL IZQUIERDO --- */}
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-lg border border-[#E9EEF4]">
            <h2 className="text-xl md:text-2xl font-bold text-[#6D28D9] mb-6 md:mb-8">Valores de la Mercadería</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#4B5563] mb-2">Valor FOB (USD)</label>
                <input type="number" name="fob" placeholder="0.00" onChange={handleInputChange} className="w-full px-5 py-3 border border-[#D1D5DB] rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] outline-none transition bg-white" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#4B5563] mb-2">Flete (USD)</label>
                <input type="number" name="flete" placeholder="0.00" onChange={handleInputChange} className="w-full px-5 py-3 border border-[#D1D5DB] rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] outline-none transition bg-white" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#4B5563] mb-2">Seguro (USD)</label>
                <input type="number" name="seguro" placeholder="0.00" onChange={handleInputChange} className="w-full px-5 py-3 border border-[#D1D5DB] rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] outline-none transition bg-white" />
              </div>

              <div className="border-t border-[#E5E7EB] pt-6 mt-6">
                <label className="block text-sm font-semibold text-[#4B5563] mb-2">Derechos de Impo (Arancel %)</label>
                <input type="number" name="arancel_pct" value={inputs.arancel_pct} onChange={handleInputChange} className="w-full px-5 py-3 border border-[#D1D5DB] rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] outline-none transition bg-white" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#4B5563] mb-2">Tasa IVA (%)</label>
                <select name="iva_pct" value={inputs.iva_pct} onChange={handleInputChange} className="w-full px-5 py-3 border border-[#D1D5DB] rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] outline-none transition bg-white">
                  <option value="21">General (21%)</option>
                  <option value="10.5">Reducido (10.5%)</option>
                  <option value="0">Exento (0%)</option>
                </select>
              </div>

              <div className="border-t border-[#E5E7EB] pt-6 mt-6">
                <label className="block text-sm font-semibold text-[#6D28D9] mb-2">Honorarios Despachante (USD)</label>
                <input type="number" name="honorarios" placeholder="0.00" onChange={handleInputChange} className="w-full px-5 py-3 border border-[#D1D5DB] rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] outline-none transition bg-white" />
              </div>

            </div>
          </div>

          {/* --- PANEL DERECHO --- */}
          <div className="bg-[#121A30] p-6 md:p-10 rounded-3xl text-white shadow-xl space-y-6 relative overflow-hidden flex flex-col justify-between h-full">
            <div>
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#7C3AED] rounded-full blur-[120px] opacity-25 -mr-40 -mt-40"></div>
              
              <h2 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 relative z-10">Resumen de Liquidación</h2>
              
              <div className="relative z-10 space-y-4 md:space-y-5">
                <div className="flex justify-between items-center text-[#E1E7EF]">
                  <span className="text-sm md:text-lg font-medium">Base Imponible (CIF):</span>
                  <span className="text-base md:text-xl font-semibold" style={calculatorMono}>{formatUsd(data.cif)}</span>
                </div>

                <div className="flex justify-between items-center text-[#A78BFA]">
                  <span className="text-sm md:text-lg font-medium">Derechos de Impo ({inputs.arancel_pct}%):</span>
                  <span className="text-base md:text-xl font-semibold" style={calculatorMono}>{formatUsd(data.derechos)}</span>
                </div>

                <div className="flex justify-between items-center text-[#A78BFA]">
                  <span className="text-sm md:text-lg font-medium">Tasa de Estadística (3%):</span>
                  <span className="text-base md:text-xl font-semibold" style={calculatorMono}>{formatUsd(data.tasa_est)}</span>
                </div>

                <div className="flex justify-between items-center text-[#E1E7EF] pt-2 border-t border-[#2A344C]">
                  <span className="text-sm md:text-lg font-medium">IVA ({inputs.iva_pct}%):</span>
                  <span className="text-base md:text-xl font-semibold" style={calculatorMono}>{formatUsd(data.tributo_iva)}</span>
                </div>

                <div className="flex justify-between items-center text-[#A78BFA]">
                  <span className="text-sm md:text-lg font-medium">Percepción IVA (20%):</span>
                  <span className="text-base md:text-xl font-semibold" style={calculatorMono}>{formatUsd(data.perc_iva_20)}</span>
                </div>

                <div className="flex justify-between items-center text-[#A78BFA]">
                  <span className="text-sm md:text-lg font-medium">Anticipo Ganancias (6%):</span>
                  <span className="text-base md:text-xl font-semibold" style={calculatorMono}>{formatUsd(data.perc_gan_6)}</span>
                </div>

                <div className="flex justify-between items-center text-[#A78BFA] pb-4 border-b border-[#2A344C]">
                  <span className="text-sm md:text-lg font-medium">Percepción IIBB (2.5%):</span>
                  <span className="text-base md:text-xl font-semibold" style={calculatorMono}>{formatUsd(data.perc_iibb_2_5)}</span>
                </div>

                <div className="flex justify-between items-center text-[#F87171] font-bold text-lg md:text-xl pt-2">
                  <span className="text-sm md:text-lg">TOTAL IMPUESTOS:</span>
                  <span style={calculatorMono}>{formatUsd(data.total_tributos)}</span>
                </div>

                <div className="flex justify-between items-center text-[#E1E7EF] pt-2 border-t border-[#2A344C]">
                  <span className="text-sm md:text-lg font-medium">Honorarios Despachante:</span>
                  <span className="text-base md:text-xl font-semibold" style={calculatorMono}>{formatUsd(inputs.honorarios)}</span>
                </div>

                <div className="bg-[#121A30] border border-[#7C3AED]/40 p-5 md:p-6 rounded-2xl mt-8 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#10B981] rounded-full blur-[60px] opacity-20 -mr-20 -mt-20"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center text-white relative z-10 gap-2 sm:gap-0">
                    <span className="font-bold text-lg md:text-xl text-[#94A3B8] sm:text-white">Costo Total Estimado:</span>
                    <span className="font-extrabold text-3xl md:text-4xl text-[#10B981] break-words" style={calculatorMono}>
                      {formatUsd(data.costo_total_estimado)}
                    </span>
                  </div>
                  
                  <p className="text-xs md:text-sm text-[#94A3B8] mt-3 sm:mt-2 text-left sm:text-right relative z-10">Mercadería + Tributos + Honorarios</p>
                </div>
              </div>
            </div>

            {/* 👇 BOTÓN MÓVIL (Solo visible en celular, lógicamente abajo del total) 👇 */}
            <button 
              onClick={descargarPDF}
              className="md:hidden w-full mt-8 flex justify-center items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-bold py-4 px-6 rounded-xl shadow-xl border border-[#059669] transition-all"
            >
              📄 Descargar Presupuesto PDF
            </button>

          </div>

        </div>
      </div>
    </div>
  )
}