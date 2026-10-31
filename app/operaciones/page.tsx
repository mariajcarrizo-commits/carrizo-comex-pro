'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { calcularImportacion, calcularExportacion, calcularHonorarios, formatUsd, formatPct, numeroSeguro } from '../../lib/tributos'

export default function OperacionesDashboard() {
  const [operaciones, setOperaciones] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  const cargarOperaciones = async () => {
    setCargando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const emailUsuario = user?.email

    if (!emailUsuario) {
      console.error("No hay usuario logueado")
      window.location.href = '/login'
      return
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol_usuario')
      .eq('email', emailUsuario)
      .single()

    if (perfil?.rol_usuario === 'cliente') {
      window.location.href = '/dashboard'
      return
    }

    const { data, error } = await supabase
      .from('operaciones')
      .select('*')
      .eq('email_creador', emailUsuario)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error al cargar operaciones:", error)
    } else {
      setOperaciones(data || [])
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarOperaciones()
  }, [])

  const eliminarOperacion = async (id: string) => {
    if (window.confirm('¿Estás segura de eliminar esta operación?')) {
      const { error } = await supabase.from('operaciones').delete().eq('id', id)
      if (error) alert('No se pudo eliminar la operación: ' + error.message)
      cargarOperaciones()
    }
  }

  const calcularAlerta = (fechaVencimiento: string | null) => {
    if (!fechaVencimiento) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); 
    const vencimiento = new Date(fechaVencimiento);
    const diferenciaMs = vencimiento.getTime() - hoy.getTime();
    const diasFaltantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

    if (diasFaltantes < 0) {
        return <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200 mt-2">🚨 VENCIDO (Hace {Math.abs(diasFaltantes)} días)</span>;
    } else if (diasFaltantes === 0) {
        return <span className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm mt-2">🔥 VENCE HOY</span>;
    } else if (diasFaltantes <= 3) {
        return <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full border border-orange-200 mt-2">⏳ Urgente: Faltan {diasFaltantes} días</span>;
    } else if (diasFaltantes <= 7) {
        return <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-full border border-yellow-200 mt-2">⚠️ Atención: Faltan {diasFaltantes} días</span>;
    } else {
        return <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 mt-2">📅 Vence en {diasFaltantes} días</span>;
    }
  }

  const generarPDF = (op: any) => {
    const doc = new jsPDF();
    const shortId = op.id.toString().substring(0, 8);

    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text('CARRIZO', 14, 20);
    doc.setTextColor(147, 51, 234);
    doc.text('Comex', 45, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Especialistas en Comercio Exterior', 14, 26);

    doc.setDrawColor(220, 220, 220);
    doc.line(14, 30, 196, 30);

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(`Resumen de Operación de ${op.tipo}`, 14, 42);

    const fobReal = numeroSeguro(op.fob);
    const montoMuestra = (op.es_muestra === 'Si' && op.muestra_tipo_valor === 'Con Valor') ? numeroSeguro(op.muestra_monto) : 0;
    // Si es muestra con valor y no se cargó FOB, el valor declarado de la muestra es la base. No se suman (evita doble conteo).
    const valorBase = fobReal > 0 ? fobReal : montoMuestra;
    const esImpo = op.tipo !== 'Exportación';
    const derechosInformados = op.derechos_pct !== null && op.derechos_pct !== undefined && op.derechos_pct !== '';
    const derechosPct = derechosInformados ? numeroSeguro(op.derechos_pct) : 0;

    autoTable(doc, {
      startY: 48,
      theme: 'grid',
      headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' },
      body: [
        ['Cliente / Razón Social', op.cliente || '-'],
        ['CUIT', op.cuit || 'No especificado'],
        ['Origen / Destino', op.pais || 'No especificado'],
        ['Mercadería', op.producto || '-'],
        ['Posición NCM / SIM', op.posicion_ncm || '-'],
        ['¿Es Muestra?', op.es_muestra === 'Si' ? `Sí (${op.muestra_tipo_valor})` : 'No'],
        ['Valor FOB Declarado', formatUsd(fobReal)],
        ...(montoMuestra > 0 ? [['Valor Declarado de la Muestra', formatUsd(montoMuestra)]] : []),
        ['Peso (Neto / Bruto)', `${numeroSeguro(op.peso_neto)} kg / ${numeroSeguro(op.peso_bruto)} kg`]
      ],
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    if (valorBase > 0) {
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('Estimación de Costos y Tributos (Referencial)', 14, currentY);

      const honorarios = calcularHonorarios(op.honorarios, op.tipo_honorario, valorBase);
      const notas: string[] = [];
      let tablaBody: any[] = [];

      if (!esImpo) {
        const r = calcularExportacion({ fob: valorBase, derechosPct, gastos: numeroSeguro(op.gastos_logisticos), honorarios });
        if (!derechosInformados) notas.push('Alícuota de derechos de exportación no informada: editá la operación para cargarla.');
        tablaBody = [
          ['Valor FOB', formatUsd(r.fob)],
          [`Derechos de Exportación (${derechosInformados ? formatPct(derechosPct) : 'no informado'})`, formatUsd(r.derechos)],
          ['Gastos de Terminal y Logística', formatUsd(r.gastos)],
          ['Honorarios Profesionales Despachante', honorarios > 0 ? formatUsd(honorarios) : 'A convenir'],
          ['', ''],
          ['TOTAL ESTIMADO A PAGAR', formatUsd(r.total)],
        ];
      } else {
        // Flete + seguro: campo nuevo; si no existe, se usa el viejo "gastos logísticos" (operaciones anteriores).
        const fleteSeguro = op.flete_seguro !== null && op.flete_seguro !== undefined
          ? numeroSeguro(op.flete_seguro)
          : numeroSeguro(op.gastos_logisticos);
        if (fleteSeguro === 0) notas.push('Flete y seguro no informados: el Valor en Aduana puede estar subestimado.');
        if (!derechosInformados) notas.push('Alícuota de derechos de importación no informada: editá la operación para cargarla.');
        const ivaPct = op.iva_pct !== null && op.iva_pct !== undefined ? numeroSeguro(op.iva_pct) : 21;
        const r = calcularImportacion({ fob: valorBase, flete: fleteSeguro, seguro: 0, derechosPct, ivaPct, honorarios });
        if (r.topeAplicado) notas.push('Tasa de Estadística con tope del Decreto 1140/2024.');
        tablaBody = [
          ['Valor FOB', formatUsd(valorBase)],
          ['Flete Internacional y Seguro', formatUsd(fleteSeguro)],
          ['Valor en Aduana (CIF)', formatUsd(r.cif)],
          [`Derechos de Importación (${derechosInformados ? formatPct(derechosPct) : 'no informado'})`, formatUsd(r.derechos)],
          [`Tasa de Estadística (3%${r.topeAplicado ? ', con tope' : ''})`, formatUsd(r.tasaEstadistica)],
          [`IVA (${formatPct(ivaPct)})`, formatUsd(r.iva)],
          [`Percepción IVA (${formatPct(r.percepcionIvaPct)})`, formatUsd(r.percepcionIva)],
          [`Percepciones Ganancias (${formatPct(r.gananciasPct)}) + IIBB (${formatPct(r.iibbPct)})`, formatUsd(r.percepcionGanancias + r.percepcionIibb)],
          ['Fondos a depositar en Aduana', formatUsd(r.fondosADepositar)],
          ['Honorarios Profesionales Despachante', honorarios > 0 ? formatUsd(honorarios) : 'A convenir'],
          ['', ''],
          ['TOTAL ESTIMADO DE DESEMBOLSO', formatUsd(r.desembolsoTotal)],
          ['Costo real (sin IVA ni percepciones recuperables)', formatUsd(r.costoReal)],
        ];
      }

      autoTable(doc, {
        startY: currentY + 5,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [71, 85, 105] },
          1: { halign: 'right', textColor: [15, 23, 42] }
        },
        body: tablaBody,
        didParseCell: function(data) {
          const contenidoFila = String((data.row.raw as any)[0]);
          if (contenidoFila.includes('TOTAL ESTIMADO')) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 245, 249];
          }
          if (contenidoFila.startsWith('Costo real')) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [22, 101, 52];
          }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const lineas = [
        ...notas.map(n => `* ${n}`),
        '*Valores estimativos. La liquidación tributaria oficial se realiza en el Sistema Informático Malvina (SIM).',
      ];
      lineas.forEach((l, i) => doc.text(l, 14, currentY + i * 4));
      currentY += lineas.length * 4 + 10;
    }

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Estado de Documentación Logística:', 14, currentY);

    const getEstadoData = (estado: boolean): any => {
      if (estado) {
        return { content: 'Presentado', styles: { textColor: [22, 101, 52] } }; 
      } else {
        return { content: 'Pendiente', styles: { textColor: [146, 64, 14] } }; 
      }
    };

    autoTable(doc, {
      startY: currentY + 5,
      theme: 'grid',
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      head: [['Documento Requerido', 'Estado Actual']],
      body: [
        ['Constancia AFIP/ARCA', getEstadoData(op.docs_afip)],
        ['Alta Sistema Malvina', getEstadoData(op.docs_malvina)],
        ['Factura Comercial (USD)', getEstadoData(op.docs_factura)],
        ['Packing List', getEstadoData(op.docs_packing)],
        ['Certificado de Origen', getEstadoData(op.docs_origen)],
        ['Certificaciones Técnicas', getEstadoData(op.docs_tecnicas)],
        ['Doc. Transporte (B/L, AWB, CRT)', getEstadoData(op.docs_transporte)],
      ],
    });

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, 14, pageHeight - 15);
    doc.text(`Proforma ID: ${shortId}`, 14, pageHeight - 10);

    doc.save(`Resumen_${String(op.cliente || 'operacion').replace(/[^\w\-]+/g, '_')}_${shortId}.pdf`);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Panel Operativo</h1>
            <p className="text-slate-600 font-medium">Gestión de despachos y proformas</p>
          </div>
          <Link href="/operaciones/nueva" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2">
            <span>+</span> Nueva Operación
          </Link>
        </div>

        {cargando ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : operaciones.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No hay operaciones activas</h3>
            <p className="text-slate-500 mb-6">Comenzá creando tu primer despacho en el sistema.</p>
            <Link href="/operaciones/nueva" className="text-purple-600 font-bold hover:underline">Crear mi primera operación →</Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-4 font-bold text-sm">Fecha</th>
                    <th className="p-4 font-bold text-sm">Cliente</th>
                    <th className="p-4 font-bold text-sm">Operación</th>
                    <th className="p-4 font-bold text-sm">Mercadería</th>
                    <th className="p-4 font-bold text-sm">Estado y Alertas</th>
                    <th className="p-4 font-bold text-sm text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {operaciones.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-700 bg-slate-100 inline-block px-3 py-1 rounded-lg">
                          {new Date(op.created_at).toLocaleDateString('es-AR')}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-purple-700 text-base">{op.cliente}</div>
                        <div className="text-xs text-slate-500 mt-1">CUIT: {op.cuit}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${op.tipo === 'Importación' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {op.tipo}
                        </span>
                        <div className="text-xs font-bold text-slate-600 mt-2">{op.pais}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-900 text-sm line-clamp-2" title={op.producto}>
                          {op.producto}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 font-mono bg-slate-100 px-2 py-1 rounded inline-block">NCM: {op.posicion_ncm}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-start">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            op.estado === 'Aprobada / Oficializada' || op.estado === 'Finalizado' ? 'bg-green-100 text-green-800 border border-green-200' : 
                            op.estado === 'Con Observaciones' ? 'bg-red-100 text-red-800 border border-red-200' : 
                            op.estado === 'En Curso' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                            'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}>
                            {op.estado === 'Aprobada / Oficializada' ? '✅ ' : 
                             op.estado === 'Con Observaciones' ? '🚨 ' : 
                             op.estado === 'En Curso' ? '🔵 ' : '🟡 '}
                            {op.estado}
                          </span>
                          {calcularAlerta(op.fecha_vencimiento)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => generarPDF(op)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Descargar Proforma PDF">📄</button>
                          <Link href={`/operaciones/editar/${op.id}`} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all flex items-center justify-center" title="Editar Operación">✏️</Link>
                          <button onClick={() => eliminarOperacion(op.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">🗑️</button>
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