'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AppPontoSJP() {
  const [view, setView] = useState<'passageiro' | 'motorista'>('passageiro')
  const [motoristas, setMotoristas] = useState<any[]>([])
  const [reservas, setReservas] = useState<any[]>([])
  const [selecionado, setSelecionado] = useState<any>(null)
  const [reservaConfirmada, setReservaConfirmada] = useState<string | null>(null)

  const carregarDados = async () => {
    const { data: m } = await supabase.from('motoristas').select('*').order('id')
    const { data: r } = await supabase.from('reservas').select('*').neq('status', 'Concluido')
    if (m) setMotoristas(m)
    if (r) setReservas(r)
  }

  useEffect(() => {
    carregarDados()
    // REALTIME: Escuta qualquer mudança e atualiza a tela na hora!
    const canal = supabase.channel('ponto')
      .on('postgres_changes', { event: '*', schema: 'public' }, carregarDados)
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [])

  const confirmarReserva = async (e: any) => {
    e.preventDefault()
    const { error } = await supabase.from('reservas').insert([{
      motorista_id: selecionado.id,
      vaga_numero: selecionado.vaga,
      nome_passageiro: e.target.nome.value,
      endereco: e.target.endereco.value,
      status: 'Pendente'
    }])
    if (!error) {
      setReservaConfirmada(`Vaga ${selecionado.vaga} reservada com ${selecionado.nome}! Aguarde confirmação no painel.`);
      setSelecionado(null);
    }
  }

  const aceitarReserva = async (res: any) => {
    await supabase.from('reservas').update({ status: 'Aceito' }).eq('id', res.id)
    const colunaVaga = `vaga_${res.vaga_numero}_status`
    await supabase.from('motoristas').update({ [colunaVaga]: 'Ocupado' }).eq('id', res.motorista_id)
  }

  const iniciarViagem = async (mId: number) => {
    if (!confirm("Limpar carro para nova viagem?")) return
    await supabase.from('motoristas').update({ vaga_1_status: 'Livre', vaga_2_status: 'Livre', vaga_3_status: 'Livre', vaga_4_status: 'Livre' }).eq('id', mId)
    await supabase.from('reservas').update({ status: 'Concluido' }).eq('motorista_id', mId)
  }

  // SEGURANÇA: Proteção simples para aba motorista
  const entrarModoMotorista = () => {
    const senha = prompt("Digite a senha de acesso:")
    if (senha === "123") setView('motorista')
    else alert("Senha incorreta!")
  }

  return (
    <main style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#111827' }}>Tô no Ponto <span style={{ color: '#ea580c' }}>SJP</span></h1>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button onClick={() => setView('passageiro')} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', background: view === 'passageiro' ? '#ea580c' : '#ccc', color: 'white', fontWeight: 'bold' }}>PASSAGEIRO</button>
        <button onClick={entrarModoMotorista} style={{ marginLeft: '10px', padding: '10px 20px', borderRadius: '20px', border: 'none', background: view === 'motorista' ? '#ea580c' : '#ccc', color: 'white', fontWeight: 'bold' }}>MOTORISTA</button>
      </div>

      {reservaConfirmada && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '15px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #16a34a' }}>
          ✅ {reservaConfirmada}
          <button onClick={() => setReservaConfirmada(null)} style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>✖</button>
        </div>
      )}

      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {view === 'passageiro' ? (
          motoristas.map(m => (
            <div key={m.id} style={{ background: 'white', padding: '20px', borderRadius: '20px', marginBottom: '15px', borderTop: '8px solid #ea580c' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{m.nome}</h3>
                <span style={{ fontSize: '12px', background: '#f3f4f6', padding: '4px 8px', borderRadius: '8px' }}>🕒 Saída: {m.horario_saida}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                {[1, 2, 3, 4].map(n => {
                  const ocupada = m[`vaga_${n}_status`] === 'Ocupado'
                  return (
                    <button key={n} disabled={ocupada} onClick={() => setSelecionado({ id: m.id, vaga: n, nome: m.nome })}
                      style={{ flex: 1, padding: '15px 0', borderRadius: '10px', border: 'none', background: ocupada ? '#9ca3af' : '#22c55e', color: 'white', fontWeight: 'bold' }}>
                      {ocupada ? 'CHEIO' : n}
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
              <div key={m.id} style={{ background: 'white', padding: '20px', borderRadius: '20px', marginBottom: '20px' }}>
                <h3>{m.nome}</h3>
                <button onClick={() => iniciarViagem(m.id)} style={{ width: '100%', padding: '12px', background: 'black', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 'bold', marginBottom: '15px' }}>🚀 INICIAR VIAGEM / LIMPAR</button>
                {reservas.filter(r => r.motorista_id === m.id).map(res => (
                  <div key={res.id} style={{ padding: '15px', border: '1px solid #fed7aa', borderRadius: '12px', marginBottom: '10px', background: res.status === 'Aceito' ? '#f0fdf4' : '#fff7ed' }}>
                    <p><strong>Vaga {res.vaga_numero}:</strong> {res.nome_passageiro}</p>
                    <p style={{ fontSize: '13px' }}>📍 {res.endereco}</p>
                    {res.status === 'Pendente' && (
                      <button onClick={() => aceitarReserva(res)} style={{ width: '100%', padding: '10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>ACEITAR</button>
                    )}
                    {res.status === 'Aceito' && <div style={{ color: '#16a34a', fontWeight: 'bold', textAlign: 'center' }}>✓ Vaga Confirmada</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {selecionado && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 }}>
          <form onSubmit={confirmarReserva} style={{ background: 'white', padding: '30px', borderRadius: '25px', width: '100%', maxWidth: '400px' }}>
            <h3>Reservar Vaga {selecionado.vaga} com {selecionado.nome}</h3>
            <input name="nome" placeholder="Seu Nome" required style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #ddd' }} />
            <input name="endereco" placeholder="Endereço de Busca" required style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #ddd' }} />
            <button type="submit" style={{ width: '100%', padding: '15px', background: '#ea580c', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold' }}>CONFIRMAR RESERVA</button>
            <button type="button" onClick={() => setSelecionado(null)} style={{ width: '100%', background: 'none', border: 'none', marginTop: '15px', color: '#666' }}>Voltar</button>
          </form>
        </div>
      )}
    </main>
  )
}
