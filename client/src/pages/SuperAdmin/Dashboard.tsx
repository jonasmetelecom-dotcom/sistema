import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Shield, Building2, CheckCircle, XCircle, CreditCard, Search, Calendar, Plus, User, Mail, Lock } from 'lucide-react';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    plan: string;
    isActive: boolean;
    subscriptionEndsAt: string | null;
    createdAt: string;
}

const SuperAdminDashboard = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        name: '',
        email: '',
        password: ''
    });

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

    const handleDateChange = async (id: string, date: string) => {
        try {
            await api.patch(`/admin/tenants/${id}/plan`, { expiresAt: date });
            fetchTenants();
        } catch (err) {
            alert('Erro ao atualizar validade');
        }
    };

    const handleCreateManual = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/tenants/manual', formData);
            setIsModalOpen(false);
            setFormData({ companyName: '', name: '', email: '', password: '' });
            fetchTenants();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erro ao criar empresa');
        }
    };

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(filter.toLowerCase()) ||
        t.slug.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return <div className="p-8 text-white text-center">Carregando painel mestre...</div>;

    return (
        <div className="min-h-screen bg-gray-900 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-purple-500 mb-1">
                            <Shield size={20} />
                            <span className="text-sm font-bold uppercase tracking-wider text-purple-400">Painel Master Admin</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white">Gestão de Empresas</h1>
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar empresa ou slug..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-full md:w-64"
                            />
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-900/20"
                        >
                            <Plus size={20} />
                            Nova Empresa
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    {filteredTenants.map((tenant) => (
                        <div key={tenant.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all hover:border-gray-600 shadow-lg">
                            <div className="flex items-start gap-4 flex-1">
                                <div className={`p-3 rounded-xl ${tenant.isActive ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                    <Building2 size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white mb-1">{tenant.name}</h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <p className="text-gray-400 text-sm flex items-center gap-2">
                                            Slug: <span className="text-purple-400">/{tenant.slug}</span>
                                        </p>
                                        <span className="hidden md:inline text-gray-600">•</span>
                                        <p className="text-gray-400 text-sm">
                                            Desde: {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>

                                    {/* Exibição da Validade */}
                                    <div className="mt-3 flex items-center gap-2 text-xs">
                                        <Calendar size={14} className={tenant.plan === 'free' ? 'text-gray-500' : 'text-purple-400'} />
                                        <span className="text-gray-400">Validade:</span>
                                        {tenant.plan === 'free' ? (
                                            <span className="text-gray-500 font-medium italic">Indeterminado (Free)</span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="date"
                                                    defaultValue={tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => handleDateChange(tenant.id, e.target.value)}
                                                    className="bg-gray-900 border border-gray-700 rounded-md px-2 py-0.5 text-xs text-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                />
                                                {tenant.subscriptionEndsAt && new Date(tenant.subscriptionEndsAt) < new Date() && (
                                                    <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold">EXPIRADO</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 border-t lg:border-t-0 border-gray-700 pt-4 lg:pt-0">
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

            {/* Modal de Criação Manual */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-800 border border-gray-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus className="text-purple-500" />
                                Nova Empresa
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateManual} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Empresa</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Nome da Empresa"
                                        value={formData.companyName}
                                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Administrador</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ex: Carlos Silva"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">E-mail de Acesso</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        required
                                        type="email"
                                        placeholder="email@empresa.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha Inicial</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/30"
                                >
                                    Criar Empresa Agora
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
