import { useState, useEffect } from 'react';
import api from '../../services/api';
import { ClipboardList, CheckCircle, Clock, AlertTriangle, User, Search, Trash2 } from 'lucide-react';

const WorkOrderPage = () => {
    const [workOrders, setWorkOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchWorkOrders = async () => {
        try {
            const response = await api.get('/network-elements/work-orders');
            setWorkOrders(response.data);
        } catch (error) {
            console.error('Error fetching work orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            await api.patch(`/network-elements/work-orders/${id}`, {
                status,
                completedAt: status === 'COMPLETED' ? new Date() : null
            });
            fetchWorkOrders();
        } catch (error) {
            console.error('Error updating work order status:', error);
        }
    };

    const deleteWorkOrder = async (id: string) => {
        if (!confirm('Deseja excluir esta ordem de serviço?')) return;
        try {
            await api.delete(`/network-elements/work-orders/${id}`);
            fetchWorkOrders();
        } catch (error) {
            console.error('Error deleting work order:', error);
        }
    };

    useEffect(() => {
        fetchWorkOrders();
        const interval = setInterval(fetchWorkOrders, 15000);
        return () => clearInterval(interval);
    }, []);

    const filteredWOs = workOrders.filter(wo => {
        if (filter === 'all') return true;
        if (filter === 'pending') return wo.status === 'PENDING';
        if (filter === 'in_progress') return wo.status === 'IN_PROGRESS';
        if (filter === 'completed') return wo.status === 'COMPLETED';
        return true;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle className="text-green-500" size={20} />;
            case 'IN_PROGRESS': return <Clock className="text-blue-500" size={20} />;
            case 'PENDING': return <AlertTriangle className="text-yellow-500" size={20} />;
            case 'CANCELLED': return <Trash2 className="text-gray-500" size={20} />;
            default: return <ClipboardList className="text-gray-400" size={20} />;
        }
    };

    const getPriorityClass = (priority: string) => {
        switch (priority) {
            case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'MEDIUM': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'LOW': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <ClipboardList className="text-blue-500" /> Ordens de Serviço
                    </h1>
                    <p className="text-gray-400 mt-2">Gestão de tarefas técnicas e manutenções de campo</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-yellow-600/20 text-yellow-500 border border-yellow-500/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Pendentes
                    </button>
                    <button
                        onClick={() => setFilter('in_progress')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'in_progress' ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Em Andamento
                    </button>
                    <button onClick={fetchWorkOrders} className="p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 ml-2">
                        <Search size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : filteredWOs.length === 0 ? (
                <div className="text-center py-20 bg-gray-800/20 rounded-2xl border border-gray-800 border-dashed">
                    <CheckCircle className="mx-auto text-gray-600 mb-4" size={48} />
                    <p className="text-gray-500">Nenhuma ordem de serviço pendente.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredWOs.map((wo) => (
                        <div key={wo.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all shadow-xl group">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className="p-3 bg-gray-800 rounded-xl mt-1">
                                        {getStatusIcon(wo.status)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityClass(wo.priority)}`}>
                                                {wo.priority}
                                            </span>
                                            <span className="text-xs text-gray-500 font-mono">#{wo.id.slice(0, 8)}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">{wo.title}</h3>
                                        <p className="text-gray-400 text-sm mb-4 max-w-2xl">{wo.description}</p>

                                        <div className="flex flex-wrap gap-6 text-xs text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-blue-400" />
                                                <span>{wo.technicianName || 'Técnico não atribuído'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-yellow-400" />
                                                <span>Aberto em {new Date(wo.createdAt).toLocaleString()}</span>
                                            </div>
                                            {wo.completedAt && (
                                                <div className="flex items-center gap-2 text-green-500 font-medium">
                                                    <CheckCircle size={14} />
                                                    <span>Concluído em {new Date(wo.completedAt).toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {wo.status === 'PENDING' && (
                                        <button
                                            onClick={() => updateStatus(wo.id, 'IN_PROGRESS')}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95 whitespace-nowrap"
                                        >
                                            INICIAR TRABALHO
                                        </button>
                                    )}
                                    {wo.status === 'IN_PROGRESS' && (
                                        <button
                                            onClick={() => updateStatus(wo.id, 'COMPLETED')}
                                            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95 whitespace-nowrap"
                                        >
                                            FINALIZAR
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteWorkOrder(wo.id)}
                                        className="text-gray-600 hover:text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WorkOrderPage;
