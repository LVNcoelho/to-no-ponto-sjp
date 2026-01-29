'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [veiculos, setVeiculos] = useState<any[]>([])

  useEffect(() => {
    const fetchVeiculos = async () => {
      const { data } = await supabase.from('veiculos').select('*').order('ordem', { ascending: true })
      setVeiculos(data || [])
    }
    fetchVeiculos()
  }, [])

  return (
    <main className="p-4 bg-gray-100 min-h-screen font-sans">
      <h1 className="text-2xl font-black text-center text-orange-600 mb-6 uppercase">Tô no Ponto SJP</h1>
      <div className="max-w-md mx-auto space-y-4">
        {veiculos.map((carro) => (
          <div key={carro.id} className="bg-white p-5 rounded-2xl shadow-sm border-l-8 border-orange-500">
            <h2 className="text-xl font-bold text-gray-800 uppercase leading-none">{carro.motorista_nome}</h2>
            <p className="text-[10px] text-gray-400 mb-4 font-bold uppercase mt-1">{carro.carro_info}</p>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((v) => (
                <button 
                  key={v}
                  className={`h-14 rounded-xl text-xl font-black shadow-sm ${carro[`vaga_${v}_ocupada`] ? 'bg-gray-200 text-gray-400' : 'bg-orange-500 text-white active:scale-95'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}