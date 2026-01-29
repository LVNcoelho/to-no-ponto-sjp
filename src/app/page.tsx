'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AppPontoSJP() {
  const [view, setView] = useState<'passageiro' | 'motorista'>('passageiro')
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [reservas, setReservas] = useState<any[]>([])
  const [selecionado, setSelecionado] = useState<any>(null)

  const carregarDados = async () => {
    const { data: m } = await supabase.from('motoristas').select('*').order('id')
    const { data: r } = await supabase.from('reservas').select('*').neq('status', 'Concluido')
    if (m) setMotoristas(m)
    if (r) setReservas(r)
  }

  useEffect(() => {
    carregarDados()
    const canal = supabase.channel('ponto').on('postgres_changes', { event: '*', schema: 'public' }, carregarDados).subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [])

  const confirmarReserva = async (e: any) => {
    e.preventDefault()
    const nome = e.target.nome.value
    const endereco = e.target.endereco.value

    const { error } = await supabase.from('reservas').insert([{
      motorista_id: selecionado.id,
      vaga_numero: selecionado.vaga,
      nome_passageiro: nome,
      endereco: endereco,
      status: 'Pendente'
    }])

    if (!error) {
      alert("Sucesso! Aguarde o motorista.")
      setSelecionado(null)
    } else {
      alert("Erro ao salvar no banco.")
    }
  }

  return (
    <main style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      {/* Botões de Troca de Visão */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button onClick={() => setView('passageiro')} style={{ padding: '10px 20px', borderRadius: '20px', background: view === 'passageiro' ? '#ea580c' : '#ccc', color: 'white', border: 'none', cursor: 'pointer' }}>PASSAGEIRO</button>
        <button onClick={() => setView('motorista')} style={{ marginLeft: '10px', padding: '10px 20px', borderRadius: '20px', background: view === 'motorista' ? '#ea580c' : '#ccc', color: 'white', border: 'none', cursor: 'pointer' }}>MOTORISTA</button>
      </div>

      {view === 'passageiro' ? (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          {motoristas.map(m => (
            <div key={m.id} style={{ background: 'white', padding: '20px', borderRadius: '20px', marginBottom: '15px', borderTop: '8px solid #ea580c' }}>
              <h2 style={{ margin: 0 }}>{m.nome}</h2>
              <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                {[1, 2, 3, 4].map(n => {
                  const ocupada = m[`vaga_${n}_status`] === 'Ocupado'
                  return (
                    <button key={n} disabled={ocupada} onClick={() => setSelecionado({ id: m.id, vaga: n, nome: m.nome })}
                      style={{ flex: 1, padding: '15px 0', borderRadius: '12px', border: 'none', background: ocupada ? '#eee' : '#ea580c', color: ocupada ? '#aaa' : 'white', fontWeight: 'bold' }}>
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* O Painel que já está funcionando */
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center' }}>Painel de Controle</h2>
            {/* ... o código do painel motorista que você já aprovou ... */}
        </div>
      )}

      {/* MODAL DE RESERVA - ONDE O BOTÃO CONFIRMAR FICA */}
      {selecionado && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 999 }}>
          <form onSubmit={confirmarReserva} style={{ background: 'white', padding: '30px', borderRadius: '25px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ margin: 0 }}>Reservar com {selecionado.nome}</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>Você escolheu a Vaga {selecionado.vaga}</p>
            
            <input name="nome" placeholder="Seu Nome" required style={{ width: '100%', padding: '15px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px' }} />
            <input name="endereco" placeholder="Seu Endereço" required style={{ width: '100%', padding: '15px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px' }} />
            
            {/* O BOTÃO QUE TINHA SUMIDO */}
            <button type="submit" style={{ width: '100%', padding: '18px', background: '#ea580c', color: 'white', borderRadius: '15px', border: 'none', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer' }}>
              CONFIRMAR AGORA
            </button>
            
            <button type="button" onClick={() => setSelecionado(null)} style={{ marginTop: '15px', background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}>
              Cancelar e Voltar
            </button>
          </form>
        </div>
      )}
    </main>
  )
}
