'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PainelCompleto() {
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
    const canal = supabase.channel('realtime').on('postgres_changes', { event: '*', schema: 'public' }, carregarDados).subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [])

  const confirmarReserva = async (e: any) => {
    e.preventDefault()
    await supabase.from('reservas').insert([{
      motorista_id: selecionado.id,
      vaga_numero: selecionado.vaga,
      nome_passageiro: e.target.nome.value,
      endereco: e.target.endereco.value,
      status: 'Pendente'
    }])
    alert("Reserva enviada! Aguarde a confirmação do motorista.")
    setSelecionado(null)
  }

  const aceitarReserva = async (res: any) => {
    await supabase.from('reservas').update({ status: 'Aceito' }).eq('id', res.id)
    const colunaVaga = `vaga_${res.vaga_numero}_status`
    await supabase.from('motoristas').update({ [colunaVaga]: 'Ocupado' }).eq('id', res.motorista_id)
  }

  const iniciarViagem = async (mId: number) => {
    if (!confirm("Iniciar viagem e limpar todas as vagas?")) return
    await supabase.from('motoristas').update({ vaga_1_status: 'Livre', vaga_2_status: 'Livre', vaga_3_status: 'Livre', vaga_4_status: 'Livre' }).eq('id', mId)
    await supabase.from('reservas').update({ status: 'Concluido' }).eq('motorista_id', mId)
  }

  return (
    <main style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button onClick={() => setView('passageiro')} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', background: view === 'passageiro' ? '#ea580c' : '#ccc', color: 'white', fontWeight: 'bold' }}>MODO PASSAGEIRO</button>
        <button onClick={() => setView('motorista')} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', background: view === 'motorista' ? '#ea580c' : '#ccc', color: 'white', fontWeight: 'bold' }}>MODO MOTORISTA</button>
      </div>

      <h1 style={{ textAlign: 'center' }}>Carros no Ponto <span style={{ color: '#ea580c' }}>SJP</span></h1>

      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {view === 'passageiro' ? (
          motoristas.map(m => (
            <div key={m.id} style={{ background: 'white', padding: '20px', borderRadius: '15px', marginBottom: '15px', borderTop: '6px solid #ea580c' }}>
              <h3>{m.nome} (ID: {m.id})</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4].map(n => {
                  const ocupada = m[`vaga_${n}_status`] === 'Ocupado'
                  return (
                    <button key={n} disabled={ocupada} onClick={() => setSelecionado({ id: m.id, vaga: n, nome: m.nome })}
                      style={{ flex: 1, padding: '15px 0', borderRadius: '10px', border: 'none', background: ocupada ? '#eee' : '#ea580c', color: ocupada ? '#aaa' : 'white', fontWeight: 'bold' }}>
                      {n} <span style={{ fontSize: '10px', display: 'block' }}>{ocupada ? 'CHEIO' : 'VAGA'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <div>
            <h2 style={{ textAlign: 'center' }}>Painel de Controle</h2>
            {motoristas.map(m => (
              <div key={m.id} style={{ background: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>{m.nome}</h3>
                <button onClick={() => iniciarViagem(m.id)} style={{ width: '100%', padding: '10px', background: 'black', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', marginBottom: '15px' }}>🚀 INICIAR VIAGEM / LIMPAR VAGAS</button>
                
                {/* LISTA DE PASSAGEIROS AGUARDANDO */}
                {reservas.filter(r => r.motorista_id === m.id && r.status !== 'Concluido').map(res => (
                  <div key={res.id} style={{ padding: '10px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '10px', background: res.status === 'Pendente' ? '#fff7ed' : '#f0fdf4' }}>
                    <p style={{ margin: 0 }}><strong>Vaga {res.vaga_numero}:</strong> {res.nome_passageiro}</p>
                    <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>📍 {res.endereco}</p>
                    {res.status === 'Pendente' && (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => aceitarReserva(res)} style={{ flex: 1, padding: '8px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' }}>ACEITAR</button>
                        <button onClick={() => {
                          const idDestino = prompt("ID do Motorista Destino:")
                          if (idDestino) supabase.from('reservas').update({ motorista_id: idDestino }).eq('id', res.id)
                        }} style={{ flex: 1, padding: '8px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' }}>TRANSFERIR</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE RESERVA */}
      {selecionado && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <form onSubmit={confirmarReserva} style={{ background: 'white', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '400px' }}>
            <h3>Reservar com {selecionado.nome} (Vaga {selecionado.vaga})</h3>
            <input name="nome" placeholder="Seu Nome" required style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <input name="endereco" placeholder="Onde você está?" required style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <button type="submit" style={{ width: '100%', padding: '15px', background: '#ea580c', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 'bold' }}>CONFIRMAR</button>
            <button type="button" onClick={() => setSelecionado(null)} style={{ width: '100%', background: 'none', border: 'none', marginTop: '10px', color: '#666' }}>Cancelar</button>
          </form>
        </div>
      )}
    </main>
  )
}
