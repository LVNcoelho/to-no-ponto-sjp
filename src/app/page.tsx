'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AppPontoCompleto() {
  const [view, setView] = useState<'passageiro' | 'motorista'>('passageiro')
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [reservas, setReservas] = useState<any[]>([])
  const [selecionado, setSelecionado] = useState<any>(null)

  const carregarDados = async () => {
    const { data: m } = await supabase.from('motoristas').select('*').eq('esta_no_ponto', true).order('id')
    const { data: r } = await supabase.from('reservas').select('*').neq('status', 'Concluido')
    if (m) setMotoristas(m)
    if (r) setReservas(r)
  }

  useEffect(() => {
    carregarDados()
    const canal = supabase.channel('db_changes').on('postgres_changes', { event: '*', schema: 'public' }, carregarDados).subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [])

  const confirmarReserva = async (e: any) => {
    e.preventDefault()
    const { id, vaga } = selecionado
    // 1. Cria a reserva
    await supabase.from('reservas').insert([{
      motorista_id: id,
      vaga_numero: vaga,
      nome_passageiro: e.target.nome.value,
      endereco: e.target.endereco.value,
      status: 'Pendente'
    }])
    // 2. Atualiza o status da vaga no motorista
    const colunaVaga = `vaga_${vaga}_status`
    await supabase.from('motoristas').update({ [colunaVaga]: 'Ocupado' }).eq('id', id)
    
    alert("Aguarde, o motorista confirmará sua busca em instantes.")
    setSelecionado(null)
  }

  const transferirCorrida = async (reserva: any) => {
    const outroMotId = prompt("Digite o ID do motorista que vai assumir:")
    if (!outroMotId) return

    // 1. Libera a vaga no motorista antigo
    await supabase.from('motoristas').update({ [`vaga_${reserva.vaga_numero}_status`]: 'Livre' }).eq('id', reserva.motorista_id)
    // 2. Transfere a reserva
    await supabase.from('reservas').update({ motorista_id: outroMotId }).eq('id', reserva.id)
    // 3. Ocupa a vaga no novo motorista (vaga 1 por padrão na transferência ou lógica similar)
    await supabase.from('motoristas').update({ [`vaga_${reserva.vaga_numero}_status`]: 'Ocupado' }).eq('id', outroMotId)
    
    alert("Transferência realizada!")
  }

  return (
    <main style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
         <button onClick={() => setView('passageiro')} style={{ padding: '10px', background: view === 'passageiro' ? '#ea580c' : '#ccc', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>PASSAGEIRO</button>
         <button onClick={() => setView('motorista')} style={{ marginLeft: '10px', padding: '10px', background: view === 'motorista' ? '#ea580c' : '#ccc', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>MOTORISTA</button>
      </div>

      <h1 style={{ textAlign: 'center' }}>Carros no Ponto <span style={{ color: '#ea580c' }}>SJP</span></h1>

      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {view === 'passageiro' ? (
          motoristas.map(m => (
            <div key={m.id} style={{ background: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderTop: '6px solid #ea580c' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <img src={m.foto_url || 'https://via.placeholder.com/50'} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h2 style={{ margin: 0 }}>{m.nome}</h2>
                  <p style={{ margin: 0, color: '#666' }}>{m.veiculo} - {m.placa}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                {[1, 2, 3, 4].map(n => {
                  const estaOcupada = m[`vaga_${n}_status`] === 'Ocupado'
                  return (
                    <button key={n} disabled={estaOcupada} onClick={() => setSelecionado({ id: m.id, vaga: n, nome: m.nome })}
                      style={{ flex: 1, padding: '15px', borderRadius: '10px', border: 'none', fontSize: '18px', fontWeight: 'bold', backgroundColor: estaOcupada ? '#ccc' : '#ea580c', color: 'white', cursor: estaOcupada ? 'not-allowed' : 'pointer' }}>
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <div>
            <h2 style={{ color: '#ea580c' }}>Cockpit do Motorista</h2>
            {reservas.filter(r => r.status !== 'Concluido').map(res => (
              <div key={res.id} style={{ background: 'white', padding: '15px', borderRadius: '10px', marginBottom: '10px', borderLeft: '5px solid #2563eb' }}>
                <p><strong>Vaga {res.vaga_numero}:</strong> {res.nome_passageiro}</p>
                <p><small>{res.endereco}</small></p>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => supabase.from('reservas').update({ status: 'Aceito' }).eq('id', res.id)} style={{ flex: 1, background: '#16a34a', color: 'white', border: 'none', padding: '8px', borderRadius: '5px' }}>ACEITAR</button>
                  <button onClick={() => transferirCorrida(res)} style={{ flex: 1, background: '#2563eb', color: 'white', border: 'none', padding: '8px', borderRadius: '5px' }}>TRANSFERIR</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selecionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={confirmarReserva} style={{ background: 'white', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '400px' }}>
            <h3>Reservar Vaga {selecionado.vaga}</h3>
            <p>Motorista: {selecionado.nome}</p>
            <input name="nome" placeholder="Seu Nome" required style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <input name="endereco" placeholder="Endereço de Busca" required style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <button type="submit" style={{ width: '100%', padding: '15px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>CONFIRMAR</button>
            <button type="button" onClick={() => setSelecionado(null)} style={{ width: '100%', background: 'none', border: 'none', marginTop: '10px', color: '#666' }}>Voltar</button>
          </form>
        </div>
      )}
    </main>
  )
}
