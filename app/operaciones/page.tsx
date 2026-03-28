'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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
      await supabase.from('operaciones').delete().eq('id', id)
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

    // 🧠 MOTOR INTELIGENTE: Definir el Valor Base
    const fobReal = Number(op.fob) || 0;
    const montoMuestra = Number(op.muestra_monto) || 0;
    
    // Si el FOB es 0 pero la muestra tiene valor, usamos el valor de la muestra
    const valorBase = fobReal > 0 ? fobReal : montoMuestra;

    autoTable(doc, {
      startY: 48,
      theme: 'grid',
      headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' },
      body: [
        ['Cliente / Razón Social', op.cliente],
        ['CUIT', op.cuit || 'No especificado'],
        ['Mercadería', op.producto],
        ['Posición NCM', op.posicion_ncm],
        // ✨ LÍNEA MÁGICA DE MUESTRA EN EL PDF
        ['¿Es Muestra?', op.es_muestra === 'Si' ? `Sí (${op.muestra_tipo_valor}${montoMuestra > 0 ? ` - USD ${montoMuestra}` : ''})` : 'No'],
        ['Valor FOB / Base Declarado', `USD ${valorBase.toLocaleString('en-US', {minimumFractionDigits: 2})}`],
        ['Peso (Neto / Bruto)', `${op.peso_neto || 0} kg / ${op.peso_bruto || 0} kg`]
      ],
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    if (valorBase > 0) {
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('Estimación de Costos y Tributos (Referencial)', 14, currentY);

      let honorariosCalculados = 0;
      if (op.honorarios > 0) {
        if (op.tipo_honorario === 'porcentaje') {
           honorariosCalculados = valorBase * (op.honorarios / 100);
        } else {
           honorariosCalculados = Number(op.honorarios);
        }
      } else {
        honorariosCalculados = Math.max(valorBase * 0.01, 250); 
      }

      let tablaBody = [];
      
      if (op.tipo === 'Exportación') {
        const derechosExpo = valorBase * 0.045;
        const gastosTerminal = op.gastos_logisticos > 0 ? Number(op.gastos_logisticos) : 300; 
        const totalCostosExpo = derechosExpo + honorariosCalculados + gastosTerminal;
        const reintegro = valorBase * 0.03;

        tablaBody = [
          ['Valor Base Declarado', `USD ${valorBase.toLocaleString('en-US', {minimumFractionDigits: 2})}`],
          ['Derechos de Exportación (Est. 4.5%)', `USD ${derechosExpo.toLocaleString('en-US', {minimumFractionDigits: 2})}`],
          ['Gastos de Terminal y Logística', `USD ${gastosTerminal.toLocaleString('en-US', {minimumFractionDigits: 2})}`],
          ['Honorarios Profesionales Despachante', `USD ${honorariosCalculados.toLocaleString('en-US', {minimumFractionDigits: 2})}`],
          ['', ''], 
          ['TOTAL ESTIMADO A PAGAR', `USD ${totalCostosExpo.toLocaleString('en-US', {minimumFractionDigits: 2})}`],
          ['Beneficio: Reintegros de Expo (Est. 3%)', `+ USD ${reintegro.toLocaleString('en-US', {minimumFractionDigits: 2})}`]
        ];
      } else {
        const seguroFlete = op.gastos_logisticos > 0 ? Number(op.gastos_logisticos) : (valorBase * 0.05);
        const cif = valorBase + seguroFlete;
        const derechos = cif * 0.16; 
        const tasaEst = cif * 0.03; 
        const baseIva = cif + derechos + tasaEst;
        const iva = baseIva * 0.21;
        const ivaAdic = baseIva * 0.20;
        const ganancias = baseIva * 0.06;
        const iibb = baseIva * 0.025;
        const totalTributos = derechos + tasaEst + iva + ivaAdic + ganancias + iibb;
        const totalOperacion = cif + totalTributos + honorariosCalculados;

        tablaBody = [
          ['Valor Base de la Mercadería', `USD ${valorBase.toLocaleString('en-US', {minimumFractionDigits: 2})}`],
          ['Flete Internacional y Seguro', `USD ${seguroFlete.toLocaleString('en-US', {minimumFractionDigits: 2})}`],
          ['Base Imponible (Valor en Aduana / CIF)', `USD ${cif.toLocaleString('en-US', {minimumFractionDigits: 2})}`],
          ['Derechos (Est. 16%) + Tasa Est. (3%)', `USD ${(derechos + tasaEst).toLocaleString('en-US', {minimumFractionDigits: 2})}`],
          ['IVA (21%) + IVA Adicional (20%)', `USD ${(iva + ivaAdic).toLocaleString('en-US', {minimumFractionDigits: 2})}`],
          ['Anticipo Ganancias (6%) + IIBB (2.5%)', `USD ${(ganancias + iibb).toLocaleString('en-US', {minimumFractionDigits: 2})}`],
          ['Total Tributos Aduaneros (Aprox.)', `USD ${totalTributos.toLocaleString('en-US', {minimumFractionDigits: 2})}`],
          ['Honorarios Profesionales Despachante', `USD ${honorariosCalculados.toLocaleString('en-US', {minimumFractionDigits: 2})}`],
          ['', ''], 
          ['TOTAL ESTIMADO DE LA OPERACIÓN', `USD ${totalOperacion.toLocaleString('en-US', {minimumFractionDigits: 2})}`]
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
          const indexTotal = op.tipo === 'Exportación' ? 5 : 9;
          const indexReintegro = 6;
          if (data.row.index === indexTotal) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 245, 249];
          }
          if (op.tipo === 'Exportación' && data.row.index === indexReintegro) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [22, 101, 52]; 
          }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
      
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('*Nota: Los valores expresados son estimaciones referenciales basadas en alícuotas generales.', 14, currentY);
      doc.text('La liquidación tributaria exacta se realizará mediante el Sistema Informático Malvina (SIM).', 14, currentY + 4);
      currentY += 15;
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
        ['Carta Porte / CRT', getEstadoData(op.docs_transporte)],
      ],
    });

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, 14, pageHeight - 15);
    doc.text(`Proforma ID: ${shortId}`, 14, pageHeight - 10);

    doc.save(`Resumen_${op.cliente}_${shortId}.pdf`);
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          op.tipo === 'Importación' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
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