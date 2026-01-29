import { supabase } from '@/lib/supabase'

export default async function Page() {
  // Busca os motoristas no banco de dados
  const { data: motoristas } = await supabase
    .from('motoristas')
    .select('*')
    .order('id', { ascending: true });

  return (
    <main className="container">
      <h1>Tô no Ponto <span style={{ color: '#ea580c' }}>SJP</span></h1>
      
      <div className="grid">
        {motoristas?.map((m) => (
          <div key={m.id} className="motorista-card">
            <div className="card-header">
              <h2>{m.nome}</h2>
              <span className="badge">Vaga: {m.vaga}</span>
            </div>

            <div className="botoes-vaga">
              {[1, 2, 3, 4].map((num) => (
                <button 
                  key={num}
                  className={`btn-vaga ${m.vaga === num ? 'active' : ''}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .badge { background: #fff7ed; color: #ea580c; padding: 4px 12px; rounded: 20px; font-weight: bold; font-size: 14px; border: 1px solid #ffedd5; }
        .motorista-card h2 { margin: 0; color: #1f2937; }
        .botoes-vaga { display: flex; gap: 10px; }
        /* Os estilos motorista-card e btn-vaga vêm do seu globals.css */
      `}</style>
    </main>
  )
}
