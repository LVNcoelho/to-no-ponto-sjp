import { supabase } from '@/lib/supabase'

export default async function Page() {
  const { data: motoristas } = await supabase
    .from('motoristas')
    .select('*')
    .order('id', { ascending: true });

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center mb-10 text-gray-900 tracking-tight">
          Tô no Ponto <span className="text-orange-600">SJP</span>
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {motoristas?.map((m) => (
            <div key={m.id} className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-orange-500 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{m.nome}</h2>
                  <p className="text-sm font-medium text-orange-600 uppercase tracking-wider">Vaga Atual: {m.vaga}</p>
                </div>
                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                  Ativo
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                {[1, 2, 3, 4].map((num) => (
                  <button 
                    key={num}
                    className={`flex-1 py-3 rounded-xl font-black text-lg transition-all ${
                      m.vaga === num 
                        ? 'bg-orange-600 text-white scale-105 shadow-orange-200 shadow-lg' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
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
