'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NuevaOperacion() {
  const [cliente, setCliente] = useState('');
  const [fob, setFob] = useState('');
  const [flete, setFlete] = useState('');
  const [seguro, setSeguro] = useState('');
  const [posicionNcm, setPosicionNcm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const { error } = await supabase.from('operaciones').insert({
      cliente,
      fob: parseFloat(fob) || 0,
      flete: parseFloat(flete) || 0,
      seguro: parseFloat(seguro) || 0,
      posicion_ncm: posicionNcm
    });
    setLoading(false);
    if (error) {
      setErrorMsg('Ocurrió un error al guardar la operación.');
      return;
    }
    router.push('/dashboard');
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-white mb-4">Nueva Operación</h1>
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl shadow p-6 w-full space-y-5">
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Cliente</label>
          <input
            type="text"
            value={cliente}
            onChange={e => setCliente(e.target.value)}
            required
            className="w-full p-2 rounded bg-slate-900 text-white border border-slate-700 focus:outline-none focus:ring focus:ring-purple-400"
            placeholder="Nombre del cliente"
          />
        </div>
        <div>
          <label className="block text-slate-400 mb-1 font-medium">FOB (USD)</label>
          <input
            type="number"
            value={fob}
            min={0}
            onChange={e => setFob(e.target.value)}
            required
            className="w-full p-2 rounded bg-slate-900 text-white border border-slate-700 focus:outline-none focus:ring focus:ring-purple-400"
            placeholder="Valor FOB"
          />
        </div>
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Flete (USD)</label>
          <input
            type="number"
            value={flete}
            min={0}
            onChange={e => setFlete(e.target.value)}
            required
            className="w-full p-2 rounded bg-slate-900 text-white border border-slate-700 focus:outline-none focus:ring focus:ring-purple-400"
            placeholder="Valor Flete"
          />
        </div>
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Seguro (USD)</label>
          <input
            type="number"
            value={seguro}
            min={0}
            onChange={e => setSeguro(e.target.value)}
            required
            className="w-full p-2 rounded bg-slate-900 text-white border border-slate-700 focus:outline-none focus:ring focus:ring-purple-400"
            placeholder="Valor Seguro"
          />
        </div>
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Posición NCM</label>
          <input
            type="text"
            value={posicionNcm}
            onChange={e => setPosicionNcm(e.target.value)}
            required
            className="w-full p-2 rounded bg-slate-900 text-white border border-slate-700 focus:outline-none focus:ring focus:ring-purple-400"
            placeholder="Ej: 8517.12.00"
          />
        </div>
        {errorMsg && (
          <div className="text-red-400 text-sm py-2">{errorMsg}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 transition-colors text-white px-6 py-2 rounded font-bold w-full mt-2 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Operación'}
        </button>
      </form>
    </div>
  );
}