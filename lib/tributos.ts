// Motor tributario único de CARRIZO Comex.
// Lo usan la Calculadora y el PDF de Operaciones, para que la misma operación
// dé siempre los mismos números.
//
// Supuestos (referenciales, la liquidación oficial es la del SIM / Malvina):
// - Base imponible aduanera = Valor en Aduana (CIF) = FOB + Flete + Seguro.
// - Tasa de Estadística 3% sobre el CIF, con topes del Decreto 1140/2024
//   (vigente hasta el 31/12/2027).
// - Base del IVA y de las percepciones = CIF + Derechos + Tasa de Estadística.
// - Percepción de IVA (RG 2937): 20% si la alícuota es 21%, 10% si es 10,5%,
//   0% si la mercadería está exenta o hay certificado de exclusión.
// - IVA, percepciones de IVA, Ganancias e IIBB son pagos a cuenta / crédito
//   fiscal para un Responsable Inscripto: se depositan, pero no son costo.

export const TASA_ESTADISTICA_PCT = 3

// Decreto 1140/2024: tope de la Tasa de Estadística según la base imponible.
export const TOPES_TASA_ESTADISTICA = [
  { hasta: 10_000, tope: 180 },
  { hasta: 100_000, tope: 3_000 },
  { hasta: 1_000_000, tope: 30_000 },
  { hasta: Infinity, tope: 150_000 },
]

export const PERCEPCION_GANANCIAS_DEFAULT = 6
export const PERCEPCION_IIBB_DEFAULT = 2.5

/** Convierte cualquier entrada en un número finito y no negativo. */
export function numeroSeguro(valor: unknown): number {
  const n = typeof valor === 'number' ? valor : parseFloat(String(valor ?? '').replace(',', '.'))
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}

function redondear(n: number) {
  return Math.round(n * 100) / 100
}

export function topeTasaEstadistica(baseCif: number): number {
  const tramo = TOPES_TASA_ESTADISTICA.find(t => baseCif < t.hasta) ?? TOPES_TASA_ESTADISTICA[TOPES_TASA_ESTADISTICA.length - 1]
  return tramo.tope
}

export function percepcionIvaPct(ivaPct: number): number {
  if (ivaPct >= 21) return 20
  if (ivaPct > 0) return 10
  return 0
}

export type EntradaImportacion = {
  fob: number
  flete: number
  seguro: number
  derechosPct: number
  ivaPct: number // 21 | 10.5 | 0
  honorarios: number
  tasaEstadisticaExenta?: boolean // ej. origen con acuerdo preferencial
  certificadoExclusionIva?: boolean
  certificadoExclusionGanancias?: boolean
  gananciasPct?: number
  iibbPct?: number
}

export type ResultadoImportacion = {
  cif: number
  derechos: number
  tasaEstadistica: number
  tasaEstadisticaSinTope: number
  topeAplicado: boolean
  baseIva: number
  iva: number
  percepcionIvaPct: number
  percepcionIva: number
  gananciasPct: number
  percepcionGanancias: number
  iibbPct: number
  percepcionIibb: number
  honorarios: number
  /** Derechos + Tasa de Estadística (tributos que son costo). */
  tributosCosto: number
  /** IVA + percepciones (pagos a cuenta / crédito fiscal). */
  pagosACuenta: number
  /** Todo lo que se deposita en Aduana. */
  fondosADepositar: number
  /** CIF + derechos + tasa + honorarios (costo real para un Responsable Inscripto). */
  costoReal: number
  /** CIF + todo lo depositado + honorarios (desembolso total de caja). */
  desembolsoTotal: number
}

export function calcularImportacion(e: EntradaImportacion): ResultadoImportacion {
  const fob = numeroSeguro(e.fob)
  const flete = numeroSeguro(e.flete)
  const seguro = numeroSeguro(e.seguro)
  const derechosPct = Math.min(numeroSeguro(e.derechosPct), 100)
  const ivaPct = numeroSeguro(e.ivaPct)
  const honorarios = numeroSeguro(e.honorarios)
  const gananciasPct = e.gananciasPct === undefined ? PERCEPCION_GANANCIAS_DEFAULT : numeroSeguro(e.gananciasPct)
  const iibbPct = e.iibbPct === undefined ? PERCEPCION_IIBB_DEFAULT : numeroSeguro(e.iibbPct)

  const cif = fob + flete + seguro
  const derechos = cif * (derechosPct / 100)

  const tasaEstadisticaSinTope = e.tasaEstadisticaExenta ? 0 : cif * (TASA_ESTADISTICA_PCT / 100)
  const tope = topeTasaEstadistica(cif)
  const tasaEstadistica = Math.min(tasaEstadisticaSinTope, tope)
  const topeAplicado = tasaEstadisticaSinTope > tope

  const baseIva = cif + derechos + tasaEstadistica
  const iva = baseIva * (ivaPct / 100)

  const pIvaPct = e.certificadoExclusionIva ? 0 : percepcionIvaPct(ivaPct)
  const percepcionIva = baseIva * (pIvaPct / 100)

  const pGanPct = e.certificadoExclusionGanancias ? 0 : gananciasPct
  const percepcionGanancias = baseIva * (pGanPct / 100)
  const percepcionIibb = baseIva * (iibbPct / 100)

  const tributosCosto = derechos + tasaEstadistica
  const pagosACuenta = iva + percepcionIva + percepcionGanancias + percepcionIibb
  const fondosADepositar = tributosCosto + pagosACuenta

  return {
    cif: redondear(cif),
    derechos: redondear(derechos),
    tasaEstadistica: redondear(tasaEstadistica),
    tasaEstadisticaSinTope: redondear(tasaEstadisticaSinTope),
    topeAplicado,
    baseIva: redondear(baseIva),
    iva: redondear(iva),
    percepcionIvaPct: pIvaPct,
    percepcionIva: redondear(percepcionIva),
    gananciasPct: pGanPct,
    percepcionGanancias: redondear(percepcionGanancias),
    iibbPct,
    percepcionIibb: redondear(percepcionIibb),
    honorarios: redondear(honorarios),
    tributosCosto: redondear(tributosCosto),
    pagosACuenta: redondear(pagosACuenta),
    fondosADepositar: redondear(fondosADepositar),
    costoReal: redondear(cif + tributosCosto + honorarios),
    desembolsoTotal: redondear(cif + fondosADepositar + honorarios),
  }
}

export type EntradaExportacion = {
  fob: number
  derechosPct: number // varía por posición; muchas posiciones industriales tributan 0%
  gastos: number
  honorarios: number
}

export function calcularExportacion(e: EntradaExportacion) {
  const fob = numeroSeguro(e.fob)
  const derechosPct = Math.min(numeroSeguro(e.derechosPct), 100)
  const derechos = fob * (derechosPct / 100)
  const gastos = numeroSeguro(e.gastos)
  const honorarios = numeroSeguro(e.honorarios)
  return {
    fob: redondear(fob),
    derechosPct,
    derechos: redondear(derechos),
    gastos: redondear(gastos),
    honorarios: redondear(honorarios),
    total: redondear(derechos + gastos + honorarios),
  }
}

/** Honorarios según el tipo cargado: monto fijo o % del FOB. Sin mínimos ocultos. */
export function calcularHonorarios(valor: unknown, tipo: string | null | undefined, fob: number) {
  const v = numeroSeguro(valor)
  return tipo === 'porcentaje' ? fob * (Math.min(v, 100) / 100) : v
}

export function formatUsd(valor: number) {
  const n = Number.isFinite(valor) ? valor : 0
  return `U$S ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatPct(valor: number) {
  return `${Number(valor).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`
}
