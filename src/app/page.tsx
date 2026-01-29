'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AppPontoFinal() {
  const [view, setView] = useState<'passageiro' | 'motorista'>('passageiro')
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [reservas, setReservas] = useState<any[]>([])
  const [selecionado, setSelecionado] = useState<any>(null)

  const carregarDados = async () => {
    const { data: m } = await supabase.from('motoristas').select('*').order('id')
    const { data: r } = await supabase.from('reservas').select('*').eq('status', 'Pendente')
    if (m) setMotoristas(m)
    if (r) setReservas(r)
  }

  useEffect(() => {
    carregarDados()
    const canal = supabase.channel('ponto_realtime').on('postgres_changes', { event: '*', schema: 'public' }, carregarDados).subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [])

  const confirmarReserva = async (e: any) => {
    e.preventDefault()
    const { id, vaga } = selecionado
    
    // 1. Cria a reserva pendente
    await supabase.from('reservas').insert([{
      motorista_id: id,
      vaga_numero: vaga,
      nome_passageiro: e.target.nome.value,
      endereco: e.target.endereco.value,
      status: 'Pendente'
    }])

    alert("Aguarde, o motorista confirmará sua busca em instantes.")
    setSelecionado(null)
  }

  const aceitarReserva = async (res: any) => {
    // 1. Muda status da reserva para Aceito
    await supabase.from('reservas').update({ status: 'Aceito' }).eq('id', res.id)
    
    // 2. Ocupa a vaga no carro do motorista no banco de dados
    const colunaVaga = `vaga_${res.vaga_numero}_status`
    await supabase.from('motoristas').update({ [colunaVaga]: 'Ocupado' }).eq('id', res.motorista_id)
    
    alert("Vaga ocupada e passageiro aceito!")
  }

  const transferirCorrida = async (res: any) => {
    const outroMotId = prompt("Digite o ID do motorista destino:")
    if (!outroMotId) return

    // Transfere a reserva para o novo motorista
    await supabase.from('reservas').update({ motorista_id: outroMotId }).eq('id', res.id)
    alert("Transferido com sucesso!")
  }

  return (
    <main style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
         <button onClick={() => setView('passageiro')} style={{ padding: '12px 20px', background: view === 'passageiro' ? '#ea580c' : '#d1d5db', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}>MODO PASSAGEIRO</button>
         <button onClick={() => setView('motorista')} style={{ padding: '12px 20px', background: view === 'motorista' ? '#ea580c' : '#d1d5db', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}>MODO MOTORISTA</button>
      </div>

      <h1 style={{ textAlign: 'center', color: '#111827', fontSize: '28px' }}>Carros no Ponto <span style={{ color: '#ea580c' }}>SJP</span></h1>

      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {view === 'passageiro' ? (
          motoristas.map(m => (
            <div key={m.id} style={{ background: 'white', padding: '20px', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderTop: '8px solid #ea580c' }}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🚗</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px' }}>{m.nome}</h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{m.veiculo} • {m.placa}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4].map(n => {
                  const estaOcupada = m[`vaga_${n}_status`] === 'Ocupado'
                  return (
                    <button 
                      key={n} 
                      disabled={estaOcupada} 
                      onClick={() => setSelecionado({ id: m.id, vaga: n, nome: m.nome })}
                      style={{ 
                        flex: 1, padding: '15px 0', borderRadius: '12px', border: 'none', fontSize: '18px', fontWeight: 'bold',
                        backgroundColor: estaOcupada ? '#e5e7eb' : '#ea580c', 
                        color: estaOcupada ? '#9ca3af' : 'white',
                        cursor: estaOcupada ? 'not-allowed' : 'pointer',
                        transition: '0.2s'
                      }}>
                      {n}
                      <span style={{ fontSize: '9px', display: 'block', textTransform: 'uppercase' }}>{estaOcupada ? 'Cheio' : 'Vaga'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <div>
            <h2 style={{ textAlign: 'center', color: '#1f2937' }}>Painel de Coletas</h2>
            {reservas.map(res => (
              <div key={res.id} style={{ background: 'white', padding: '20px', borderRadius: '15px', marginBottom: '10px', borderLeft: '10px solid #2563eb' }}>
                <p style={{ margin: '0 0 5px 0' }}><strong>Vaga {res.v
