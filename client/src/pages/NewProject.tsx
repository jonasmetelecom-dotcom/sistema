import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MapPin } from 'lucide-react';

const schema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    city: z.string().optional(),
    latitude: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().optional()),
    longitude: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().optional()),
});

type FormData = z.infer<typeof schema>;

// ... (schema remains)

const NewProject = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema)
    });

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocalização não é suportada pelo seu navegador.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setValue('latitude', position.coords.latitude);
                setValue('longitude', position.coords.longitude);
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Não foi possível obter sua localização. Verifique as permissões do GPS.');
            }
        );
    };


    const onSubmit = async (data: FormData) => {
        try {
            await api.post('/projects', data);
            navigate('/projects');
        } catch (error: any) {
            console.error('Error creating project:', error);
            const status = error.response?.status;
            const data = error.response?.data;
            const msg = data?.message || error.message || 'Erro desconhecido';
            alert(`Falha (${status}): ${JSON.stringify(msg, null, 2)}`);
        }
    };

    return (
        <div className="h-full bg-gray-900 text-white p-6 overflow-auto">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => navigate('/projects')}
                    className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Voltar para Projetos
                </button>

                <div className="bg-gray-800 rounded-xl border border-gray-700 p-8">
                    <h1 className="text-2xl font-bold mb-6">Novo Projeto</h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Projeto *</label>
                            <input
                                {...register('name')}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Ex: FTTH Centro, Expansão Bairro Novo..."
                            />
                            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Cidade</label>
                            <input
                                {...register('city')}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Ex: São Paulo, Rio de Janeiro..."
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-300">Coordenadas Iniciais</label>
                                <button
                                    type="button"
                                    onClick={handleGetLocation}
                                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-400/10 px-2 py-1 rounded"
                                >
                                    <MapPin size={12} />
                                    Usar minha Localização (GPS)
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 ml-1">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        {...register('latitude')}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="-23.5505"
                                    />
                                    {errors.latitude && <p className="text-red-400 text-sm mt-1">{errors.latitude.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 ml-1">Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        {...register('longitude')}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="-46.6333"
                                    />
                                    {errors.longitude && <p className="text-red-400 text-sm mt-1">{errors.longitude.message}</p>}
                                </div>
                            </div>
                        </div>


                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={20} />
                                {isSubmitting ? 'Salvando...' : 'Salvar Projeto'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewProject;
