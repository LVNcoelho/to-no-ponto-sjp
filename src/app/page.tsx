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

  // CORREÇÃO: Função Confirmar agora grava e fecha o modal
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
      alert("Reserva enviada! Aguarde o motorista.")
      setSelecionado(null) // Fecha o formulário
    } else {
      alert("Erro ao reservar. Tente novamente.")
    }
  }

  const aceitarReserva = async (res: any) => {
    await supabase.from('reservas').update({ status: 'Aceito' }).eq('id', res.id)
    const colunaVaga = `vaga_${res.vaga_numero}_status`
    await supabase.from('motoristas').update({ [colunaVaga]: 'Ocupado' }).eq('id', res.motorista_id)
  }

  const iniciarViagem = async (mId: number) => {
    if (!confirm("Deseja limpar as vagas deste carro?")) return
    await supabase.from('motoristas').update({ vaga_1_status: 'Livre', vaga_2_status: 'Livre', vaga_3_status: 'Livre', vaga_4_status: 'Livre' }).eq('id', mId)
    await supabase.from('reservas').update({ status: 'Concluido' }).eq('motorista_id', mId)
  }

  const transferirCorrida = async (res: any) => {
    const idDestino = prompt("ID do Motorista Destino (ex: 1, 2, 3):")
    if (idDestino) {
      await supabase.from('reservas').update({ motorista_id: idDestino }).eq('id', res.id)
      alert("Corrida transferida!")
    }
  }

  return (
    <main style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button onClick={() => setView('passageiro')} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', background: view === 'passageiro' ? '#ea580c' : '#ccc', color: 'white', fontWeight: 'bold' }}>PASSAGEIRO</button>
        <button onClick={() => setView('motorista')} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', background: view === 'motorista' ? '#ea580c' : '#ccc', color: 'white', fontWeight: 'bold' }}>MOTORISTA</button>
      </div>

      <h1 style={{ textAlign: 'center', fontWeight: '800' }}>Carros no Ponto <span style={{ color: '#ea580c' }}>SJP</span></h1>

      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {view === 'passageiro' ? (
          motoristas.map(m => (
            <div key={m.id} style={{ background: 'white', padding: '20px', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: '8px solid #ea580c' }}>
              <h2 style={{ margin: '0 0 15px 0' }}>{m.nome} (ID: {m.id})</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4].map(n => {
                  const ocupada = m[`vaga_${n}_status`] === 'Ocupado'
                  return (
                    <button key={n} disabled={ocupada} onClick={() => setSelecionado({ id: m.id, vaga: n, nome: m.nome })}
                      style={{ flex: 1, padding: '15px 0', borderRadius: '12px', border: 'none', background: ocupada ? '#eee' : '#ea580c', color: ocupada ? '#aaa' : 'white', fontWeight: 'bold' }}>
                      {n} <span style={{ fontSize: '1
