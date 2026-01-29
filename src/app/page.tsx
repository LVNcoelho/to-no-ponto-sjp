'use client' // Ativa a interatividade (clique)

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Page() {
  const [motoristas, setMotoristas] = useState<any[]>([])

  // Função para buscar os dados
  const buscarDados = async () => {
    const { data } = await supabase
      .from('motoristas')
      .select('*')
      .order('id', { ascending: true })
    if (data) setMotoristas(data)
  }

  useEffect(() => {
    buscarDados()
  }, [])

  // Função mágica que altera a vaga no banco!
  const mudarVaga = async (id: number, novaVaga: number) => {
    const { error } = await supabase
      .from('motoristas')
      .update({ vaga: novaVaga })
      .eq('id', id)

    if (!error) {
      // Atualiza a tela na hora
      setMotoristas(prev => prev.map(m => m.id === id ? { ...m, vaga: novaVaga } : m))
    }
  }

  return (
    <main style={{ fontFamily: 'sans-serif', backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 'bold', marginBottom: '30px', color: '#111827' }}>
          Tô no Ponto <span style={{ color: '#ea580c' }}>SJP</span>
        </h1>
        
        <div style={{ display: 'grid', gap: '20px' }}>
          {motoristas.map((m) => (
            <div key={m.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderTop: '6px solid #ea580c' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', color: '#1f2937' }}>{m.nome}</h2>
                <span style={{ backgroundColor: '#fff7ed', color: '#ea580c', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #ffedd5' }}>
                  Vaga: {m.vaga}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {[1, 2, 3, 4].map((num) => (
                  <button 
                    key={num}
                    onClick={() => mudarVaga(m.id, num)} // Aqui o clique acontece!
                    style={{
                      flex: 1,
                      padding: '12px 0',
                      borderRadius: '10px',
                      border: 'none',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      backgroundColor: m.vaga === num ? '#ea580c' : '#f3f4f6',
                      color: m.vaga === num ? 'white' : '#9ca3af',
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
