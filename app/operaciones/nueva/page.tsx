'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '../../components/Navbar'
import ncmDatabase from '@/lib/ncmData'

export default function NuevaOperacion() {
  const [cliente, setCliente] = useState('')
  const [tipo, setTipo] = useState('Importación')
  const [pais, setPais] = useState('Argentina')
  const [fob, setFob] = useState('')
  const [flete, setFlete] = useState('')
  const [seguro, setSeguro] = useState('')
  const [posicionNcm, setPosicionNcm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ncmInfo, setNcmInfo] = useState<null | { descripcion: string, DIE: string, tasa_estadistica: string }>(null)
  const [baseImponible, setBaseImponible] = useState<number>(0)
  const router = useRouter()

  const paises = [
    "Argentina", "Brasil", "Paraguay", "Uruguay", "Bolivia", 
    "Afganistán", "Albania", "Alemania "Andorra", "Angola", "Antigua y Barbuda", "Arabia Saudita", "Argelia", "Armenia", "Australia", "Austria", "Azerbaiyán", "Bahamas", "Bangladés", "Barbados", "Baréin", "Bélgica", "Belice", "Benín", "Bielorrusia", "Birmania", "Bosnia y Herzegovina", "Botsuana", "Brunéi", "Bulgaria", "Burkina Faso", "Burundi", "Bután", "Cabo Verde", "Camboya", "Camerún", "Canadá", "Catar", "Chad", "Chile", "China", "Chipre", "Ciudad del Vaticano", "Colombia", "Comoras", "Corea del Norte", "Corea del Sur", "Costa de Marfil", "Costa Rica", "Croacia", "Cuba", "Dinamarca", "Dominica", "Ecuador", "Egipto", "El Salvador", "Emiratos Árabes Unidos", "Eritrea", "Eslovaquia", "Eslovenia", "España", "Estados Unidos", "Estonia", "Etiopía", "Filipinas", "Finlandia", "Fiyi", "Francia", "Gabón", "Gambia", "Georgia", "Ghana", "Granada", "Grecia", "Guatemala", "Guyana", "Guinea", "Guinea-Bisáu", "Guinea Ecuatorial", "Haití", "Honduras", "Hungría", "India", "Indonesia", "Irak", "Irán", "Irlanda", "Islandia", "Islas Marshall", "Israel", "Italia", "Jamaica", "Japón", "Jordania", "Kazajistán", "Kenia", "Kirguistán", "Kiribati", "Kuwait", "Laos", "Lesoto", "Letonia", "Líbano", "Liberia", "Libia", "Liechtenstein", "Lituania", "Luxemburgo", "Macedonia del Norte", "Madagascar", "Malasia", "Malaui", "Maldivas", "Malí", "Malta", "Marruecos", "Mauricio", "Mauritania", "México", "Micronesia", "Moldavia", "Mónaco", "Mongolia", "Montenegro", "Mozambique", "Namibia", "Nauru", "Nepal", "Nicaragua", "Níger", "Nigeria", "Noruega", "Nueva Zelanda", "Omán", "Países Bajos", "Pakistán", "Palaos", "Panamá", "Papúa Nueva Guinea", "Perú", "Polonia", "Portugal", "Reino Unido", "República Centroafricana", "República Checa", "República del Congo", "República Democrática del Congo", "República Dominicana", "Ruanda", "Rumania", "Rusia", "Samoa", "San Cristóbal y Nieves", "San Marino", "San Vicente y las Granadinas", "Santa Lucía", "Santo Tomé y Príncipe", "Senegal", "Serbia", "Seychelles", "Sierra Leona", "Singapur", "Siria", "Somaliandia", "Sudáfrica", "Sudán", "Sudán del Sur", "Suecia", "Suiza", "Surinam", "Tailandia", "Tanzania", "Tayikistán", "Timor Oriental", "Togo", "Tonga", "Trinidad y Tobago", "Túnez", "Turkmenistán", "Turquía", "Tuvalu", "Ucrania", "Uganda", "Uzbekistán", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Yibuti", "Zambia", "Zimbabue"
  ]

  useEffect(() => {
    const cleanPos = posicionNcm.replace(/\D/g, '')
    let found = null
    if (cleanPos.length) {
      found = ncmDatabase.find(
        (ncm: any) =>
          ncm.posicion.replace(/\D/g, '') === cleanPos
      )
    }
    if (found) {
      setNcmInfo({
        descripcion: found.descripcion,
        DIE: found.DIE || found.die || '-',
        tasa_estadistica: found.tasa_estadistica != null ? String(found.tasa_estadistica) : '-'
      })
    } else {
      setNcmInfo(null)
    }
  }, [posicionNcm])

  useEffect(() => {
    const fobNum = parseFloat(fob) || 0
    const fleteNum = parseFloat(flete) || 0
    const seguroNum = parseFloat(seguro) || 0
 seImponible(fobNum + fleteNum + seguroNum)
  }, [fob, flete, seguro])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('operaciones').insert({
      cliente, tipo, pais,
      fob: parseFloat(fob) || 0,
      flete: parseFloat(flete) || 0,
      seguro: parseFloat(seguro) || 0,
      posicion_ncm: posicionNcm,
      estado: 'Pendiente'
    })
    if (!error) router.push('/operaciones')
    else alert('Error al guardar')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar />
      <div className="max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Nueva Operación</h1>
        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
             <label className="block text-sm text-slate-400 mb-1">Cliente</label>
              <input type="text" value={cliente} onChange={e => setCliente(e.target.value)} required className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Nombre/Empresa"/>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
                <option>Importación</option>
                <option>Exportación</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">País de Origen/Destino</label>
            <select value={pais} onChange={e => setPais(e.target.value)} className="w-full p-3 bg-slate-900 border bordslate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
              {paises.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">FOB (USD)</label>
              <input type="number" value={fob} onChange={e => setFob(e.target.value)} required className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg outline-none"/>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Flete</label>
              <input type="number" value={flete} onChange={e => setFlete(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg outline-none"/>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Seguro</label>
              <input type="number" value={seguro} onChange={e => setSeguro(e.target.value)} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg outline-none"/>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Posición NCM</label>
            <input
              type="text"
              value={posicionNcm}
              onChange={e => setPosicionNcm(e.target.value)}
              required
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg outline-none"
              placeholder="0000.00.00"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
            />
            {ncmInfo && (
              <div className="mt-3 flex flex-col gap-2">
                <span className="inline-block bg-purple-700/30 text-purple-200 px-4 py-2 rounded-full text-sm font-semibold">
                  <strong>Descripción:</strong> {ncmInfo.descripcion}
                </span>
                <div className="flex flex-wrap gap-2">
                  <sp className="inline-block bg-purple-600/30 text-purple-200 px-3 py-1 rounded-lg text-xs font-bold">
                    DIE: {ncmInfo.DIE}
                  </span>
                  <span className="inline-block bg-purple-600/30 text-purple-200 px-3 py-1 rounded-lg text-xs font-bold">
                    Tasa Estadística: {ncmInfo.tasa_estadistica}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-slate-400">Base Imponible Estimada (FOB + Flete + Seguro):</label>
            <div className="mt-1 text-lg font-bold text-purple-400 bg-slate-900 rounded-lg px-3 py-2 inline-block border border-purple-700 shadow-sm">
              {baseImponible.toLocaleString('es-AR', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2
              })}
            </div>
          </div>

          <button disabled={loading} className="w-full py-4 bg-grdient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-purple-500/20">
            {loading ? 'Procesando...' : 'Confirmar y Guardar en Supabase'}
          </button>
        </form>
      </div>
    </div>
  )
}
