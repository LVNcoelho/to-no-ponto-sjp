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
    await supabase.from('reservas').update({ status: 'Aceito' }).eq('id', res.id)
    const colunaVaga = `vaga_${res.vaga_numero}_status`
    await supabase.from('motoristas').update({ [colunaVaga]: 'Ocupado' }).eq('id', res.motorista_id)
    alert("Vaga ocupada e passageiro aceito!")
  }

  // NOVA FUNÇÃO: Limpa o carro e conclui as reservas
  const iniciarViagem = async (motoristaId: number) => {
    if (!confirm("Deseja iniciar a viagem? Isso limpará todas as vagas do seu carro.")) return

    // 1. Volta todas as vagas para 'Livre' no banco
    await supabase.from('motoristas').update({
      vaga_1_status: 'Livre',
      vaga_2_status: 'Livre',
      vaga_3_status: 'Livre',
      vaga_4_status: 'Livre'
    }).eq('id', motoristaId)

    // 2. Marca as reservas como 'Concluido' para sumirem da lista
    await supabase.from('reservas').update({ status: 'Concluido' }).eq('motorista_id', motoristaId).eq('status', 'Aceito')

    alert("Boa viagem! Seu carro já aparece como vazio para os passageiros.")
  }

  const transferirCorrida = async (res: any) => {
    const outroMotId = prompt("Digite o ID do motorista destino:")
    if (!outroMotId) return
    await supabase.from('reservas').update({ motorista_id: outroMotId }).eq('id', res.id)
    alert("Transferido com sucesso!")
  }

  return (
    <main style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
         <button onClick={() => setView('passageiro')} style={{ padding: '12px 20px', background: view === 'passageiro' ? '#ea580c' : '#d1d5db', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}>MODO PASSAGEIRO</button>
         <button onClick={() => setView('motorista')} style={{ padding: '12px 20px', background: view === 'motorista' ? '#ea580c' : '#d1d5db', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer' }}>MODO MOTORISTA</button>
      </div>

      <h1 style={{ textAlign: 'center', color: '#111827' }}>Carros no Ponto <span style={{ color: '#ea580c' }}>SJP</span></h1>

      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {view === 'passageiro' ? (
          motoristas.map(m => (
            <div key={m.id} style={{ background: 'white', padding: '20px', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderTop: '8px solid #ea580c' }}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🚗</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px' }}>{m.nome}</h2>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{m.veiculo} • {m.placa} (ID: {m.id})</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4].map(n => {
                  const estaOcupada = m[`vaga_${n}_status`] === 'Ocupado'
                  return (
                    <button key={n} disabled={estaOcupada} onClick={() => setSelecionado({ id: m.id, vaga: n, nome: m.nome })}
                      style={{ flex: 1, padding: '15px 0', borderRadius: '12px', border: 'none', fontSize: '18px', fontWeight: 'bold', backgroundColor: estaOcupada ? '#e5e7eb' : '#ea580c', color: estaOcupada ? '#9ca3af' : 'white', cursor: estaOcupada ? 'not-allowed' : 'pointer' }}>
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
            <h2 style={{ textAlign: 'center', color: '#1f2937' }}>Painel de Controle</h2>
            
            {/* NOVO: Botão de Iniciar Viagem para cada motorista */}
            {motoristas.map(m => (
              <div key={m.id} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '10px' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>{m.nome}</h3>
                <button onClick={() => iniciarViagem(m.id)} style={{ width: '100%', padding: '12px', background: '#000', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginBottom: '15px' }}>
                  🚀 INICIAR VIAGEM / LIMPAR VAGAS
                </button>

                {reservas.filter(r => r.motorista_id === m.id).map(res => (
                  <div key={res.id} style={{ background: 'white', padding: '15px', borderRadius: '10px', marginBottom: '10px', borderLeft: '10px solid #2563eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <p style={{ margin: 0 }}><strong>Vaga {res.vaga_numero}:</strong> {res.nome_passageiro}</p>
                    <p style={{ margin: '5px 0', fontSize: '13px' }}>📍 {res.endereco}</p>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => aceitarReserva(res)} style={{ flex: 1, padding: '8px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '5px' }}>ACEITAR</button>
                      <button onClick={() => transferirCorrida(res)} style={{ flex: 1, padding: '8px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '5px' }}>TRANSFERIR</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {selecionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 }}>
          <form onSubmit={confirmarReserva} style={{ background: 'white', padding: '30px', borderRadius: '25px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0 }}>Reservar Vaga {selecionado.vaga}</h3>
            <input name="nome" placeholder="Seu Nome" required style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #ddd' }} />
            <input name="endereco" placeholder="Endereço de Busca" required style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #ddd' }} />
            <button type="submit" style={{ width: '100%', padding: '15px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>CONFIRMAR AGORA</button>
            <button type="button" onClick={() => setSelecionado(null)} style={{ width: '100%', background: 'none', border: 'none', marginTop: '15px', color: '#666' }}>Voltar</button>
          </form>
        </div>
      )}
    </main>
  )
}
