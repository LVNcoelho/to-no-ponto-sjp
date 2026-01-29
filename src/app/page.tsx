import { supabase } from '@/lib/supabase'

export default async function Page() {
  const { data: motoristas } = await supabase
    .from('motoristas')
    .select('*')
    .order('id', { ascending: true });

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-black">Tô no Ponto SJP</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {motoristas?.map((m) => (
          <div key={m.id} className="bg-white p-6 rounded-xl shadow-lg border-l-8 border-orange-500">
            <h2 className="text-xl font-bold text-gray-800">{m.nome}</h2>
            <p className="text-gray-500 mb-4">Vaga Atual: {m.vaga}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button key={num} className={`px-4 py-2 rounded-md font-bold ${m.vaga === num ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {num}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}