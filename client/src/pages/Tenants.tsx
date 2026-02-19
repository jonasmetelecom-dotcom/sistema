import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, Search, Building2, CheckCircle, XCircle } from 'lucide-react';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    plan: string;
    isActive: boolean;
    createdAt: string;
    subscriptionStatus: string;
    subscriptionEndsAt?: string;
}

const Tenants = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        plan: 'free',
        isActive: true,
        subscriptionStatus: 'active',
        subscriptionEndsAt: ''
    });

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const response = await api.get('/tenants');
            setTenants(response.data);
        } catch (error) {
            console.error('Error fetching tenants:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTenant) {
                // Update
                await api.patch(`/tenants/${editingTenant.id}`, formData);
            } else {
                // Create
                await api.post('/tenants', formData);
            }
            setIsModalOpen(false);
            setEditingTenant(null);
            setFormData({ name: '', slug: '', plan: 'free', isActive: true, subscriptionStatus: 'active', subscriptionEndsAt: '' });
            fetchTenants();
        } catch (error) {
            console.error('Error saving tenant:', error);
            alert('Erro ao salvar empresa.');
        }
    };

    const handleEdit = (tenant: Tenant) => {
        setEditingTenant(tenant);
        setFormData({
            name: tenant.name,
            slug: tenant.slug,
            plan: tenant.plan,
            isActive: tenant.isActive,
            subscriptionStatus: tenant.subscriptionStatus || 'active',
            subscriptionEndsAt: tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt).toISOString().split('T')[0] : ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;
        try {
            await api.delete(`/tenants/${id}`);
            fetchTenants();
        } catch (error) {
            console.error('Error deleting tenant:', error);
            alert('Erro ao excluir empresa. Verifique se não há usuários ou projetos vinculados.');
        }
    };

    const openNewTenantModal = () => {
        setEditingTenant(null);
        setFormData({ name: '', slug: '', plan: 'free', isActive: true, subscriptionStatus: 'active', subscriptionEndsAt: '' });
        setIsModalOpen(true);
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    };

    const filteredTenants = tenants.filter(tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-gray-900 text-white p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Building2 className="text-green-500" />
                        Gestão de Empresas (Tenants)
                    </h1>
                    <p className="text-gray-400">Gerencie as empresas que utilizam o sistema</p>
                </div>
                <button
                    onClick={openNewTenantModal}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Nova Empresa
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-gray-800 p-4 rounded-xl mb-6 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou slug..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 bg-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-900/50 border-b border-gray-700 text-gray-400 uppercase text-xs">
                                <th className="p-4 font-semibold">Nome</th>
                                <th className="p-4 font-semibold">Slug (URL)</th>
                                <th className="p-4 font-semibold">Plano</th>
                                <th className="p-4 font-semibold">Status (Assinatura)</th>
                                <th className="p-4 font-semibold">Expira em</th>
                                <th className="p-4 font-semibold">Ativo?</th>
                                <th className="p-4 font-semibold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-400">Carregando empresas...</td>
                                </tr>
                            ) : filteredTenants.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-400">Nenhuma empresa encontrada.</td>
                                </tr>
                            ) : (
                                filteredTenants.map(tenant => (
                                    <tr key={tenant.id} className="hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 font-medium text-white flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-xs font-bold uppercase">
                                                {tenant.name.substring(0, 2)}
                                            </div>
                                            {tenant.name}
                                        </td>
                                        <td className="p-4 text-gray-300 font-mono text-sm">
                                            {tenant.slug}
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-blue-900/30 text-blue-400 border-blue-900/50 uppercase">
                                                {tenant.plan}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border uppercase ${tenant.subscriptionStatus === 'active' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' :
                                                    tenant.subscriptionStatus === 'past_due' ? 'bg-red-900/30 text-red-400 border-red-900/50' :
                                                        'bg-gray-700/50 text-gray-400 border-gray-600'
                                                }`}>
                                                {tenant.subscriptionStatus}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-300 text-sm">
                                            {tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="p-4">
                                            {tenant.isActive ? (
                                                <span className="flex items-center gap-1 text-emerald-400 text-sm">
                                                    <CheckCircle size={14} /> Ativo
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-400 text-sm">
                                                    <XCircle size={14} /> Inativo
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(tenant)}
                                                    className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tenant.id)}
                                                    className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">
                            {editingTenant ? 'Editar Empresa' : 'Nova Empresa'}
                        </h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => {
                                        const name = e.target.value;
                                        // Auto-generate slug if creating new
                                        if (!editingTenant) {
                                            setFormData({ ...formData, name, slug: generateSlug(name) });
                                        } else {
                                            setFormData({ ...formData, name });
                                        }
                                    }}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-green-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Slug (Identificador)</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.slug}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-green-500 outline-none font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Plano</label>
                                <select
                                    value={formData.plan}
                                    onChange={e => setFormData({ ...formData, plan: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-green-500 outline-none"
                                >
                                    <option value="free">Free</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Status Assinatura</label>
                                    <select
                                        value={formData.subscriptionStatus}
                                        onChange={e => setFormData({ ...formData, subscriptionStatus: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-green-500 outline-none"
                                    >
                                        <option value="active">Ativo</option>
                                        <option value="past_due">Vencido</option>
                                        <option value="canceled">Cancelado</option>
                                        <option value="trialing">Trial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Vencimento</label>
                                    <input
                                        type="date"
                                        value={formData.subscriptionEndsAt}
                                        onChange={e => setFormData({ ...formData, subscriptionEndsAt: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-green-500 outline-none text-white scheme-dark"
                                    />
                                </div>
                            </div>
                            {editingTenant && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-green-500"
                                    />
                                    <label htmlFor="isActive" className="text-sm text-gray-300">Ativo</label>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-300 hover:text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tenants;
