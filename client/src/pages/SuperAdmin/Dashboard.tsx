import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Shield, Building2, CheckCircle, XCircle, CreditCard, Search } from 'lucide-react';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    plan: string;
    isActive: boolean;
    createdAt: string;
}

const SuperAdminDashboard = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const res = await api.get('/admin/tenants');
            setTenants(res.data);
        } catch (err) {
            console.error('Failed to fetch tenants', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'approve' | 'toggle-status', value?: any) => {
        try {
            if (action === 'approve') {
                await api.patch(`/admin/tenants/${id}/approve`);
            } else if (action === 'toggle-status') {
                await api.patch(`/admin/tenants/${id}/status`, { isActive: value });
            }
            fetchTenants();
        } catch (err) {
            alert('Erro ao processar ação');
        }
    };

    const handlePlanChange = async (id: string, plan: string) => {
        try {
            await api.patch(`/admin/tenants/${id}/plan`, { plan });
            fetchTenants();
        } catch (err) {
            alert('Erro ao mudar plano');
        }
    };

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(filter.toLowerCase()) ||
        t.slug.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <div className="p-8 text-white">Carregando painel mestre...</div>;

    return (
        <div className="min-h-screen bg-gray-900 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-blue-500 mb-1">
                            <Shield size={20} />
                            <span className="text-sm font-bold uppercase tracking-wider">Painel Master Admin</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white">Gestão de Empresas</h1>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar empresa ou slug..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                        />
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    {filteredTenants.map((tenant) => (
                        <div key={tenant.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-gray-600 shadow-lg">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${tenant.isActive ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{tenant.name}</h3>
                                    <p className="text-gray-400 text-sm flex items-center gap-2">
                                        Slug: <span className="text-blue-400">/{tenant.slug}</span>
                                        <span className="text-gray-600">•</span>
                                        Desde: {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2 bg-gray-900/50 p-1.5 rounded-lg border border-gray-700">
                                    <CreditCard size={16} className="text-gray-400 ml-2" />
                                    <select
                                        value={tenant.plan}
                                        onChange={(e) => handlePlanChange(tenant.id, e.target.value)}
                                        className="bg-transparent text-sm font-bold text-white focus:outline-none pr-4"
                                    >
                                        <option value="free" className="bg-gray-800">Free</option>
                                        <option value="pro" className="bg-gray-800">Pro</option>
                                        <option value="enterprise" className="bg-gray-800">Enterprise</option>
                                    </select>
                                </div>

                                {!tenant.isActive ? (
                                    <button
                                        onClick={() => handleAction(tenant.id, 'approve')}
                                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold transition-colors shadow-lg shadow-green-900/20"
                                    >
                                        <CheckCircle size={18} />
                                        Aprovar Acesso
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleAction(tenant.id, 'toggle-status', false)}
                                        className="flex items-center gap-2 bg-gray-700 hover:bg-red-900/50 hover:text-red-500 text-gray-300 px-4 py-2 rounded-xl font-bold transition-all"
                                    >
                                        <XCircle size={18} />
                                        Bloquear
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {filteredTenants.length === 0 && (
                        <div className="text-center py-12 bg-gray-800/50 border border-dashed border-gray-700 rounded-2xl">
                            <p className="text-gray-500">Nenhuma empresa encontrada com este filtro.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
