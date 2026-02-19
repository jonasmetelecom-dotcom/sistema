import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Shield, User, Clock, HardDrive, Tag, Info, Search, Globe } from 'lucide-react';

const AuditLogPage = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            const response = await api.get('/network-elements/audit-logs');
            setLogs(response.data);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'UPDATE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'DELETE': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'LOGIN': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
            case 'POLL': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    const getEntityIcon = (type: string) => {
        switch (type) {
            case 'OLT': case 'RBS': return <HardDrive size={14} />;
            case 'PROJECT': return <Tag size={14} />;
            case 'ONU': return <User size={14} />;
            default: return <Info size={14} />;
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Shield className="text-indigo-500" /> Trilha de Auditoria
                    </h1>
                    <p className="text-gray-400 mt-2">Histórico completo de ações e alterações de segurança</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchLogs} className="p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700">
                        <Search size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-20 bg-gray-800/20 rounded-2xl border border-gray-800 border-dashed">
                    <Info className="mx-auto text-gray-600 mb-4" size={48} />
                    <p className="text-gray-500">Nenhum registro de auditoria encontrado.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {logs.map((log) => (
                        <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-indigo-500/30 transition-all shadow-xl">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex gap-4">
                                    <div className={`p-3 rounded-xl border self-start ${getActionColor(log.action)}`}>
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                            <span className="text-gray-600 font-mono text-[10px]">ID: {log.id.slice(0, 8)}</span>
                                        </div>
                                        <h3 className="text-white font-medium mb-1">
                                            <span className="font-bold text-indigo-300">{log.userName}</span>
                                            <span className="text-gray-400 mx-2">realizou</span>
                                            <span className="font-bold">{log.action}</span>
                                            <span className="text-gray-400 mx-2">em</span>
                                            <span className="flex inline-items-center gap-1.5 px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300 border border-gray-700">
                                                {getEntityIcon(log.entityType)}
                                                {log.entityType}
                                            </span>
                                        </h3>

                                        {log.details && (
                                            <div className="mt-3 p-3 bg-black/40 rounded-lg border border-gray-800 text-xs text-gray-400 font-mono overflow-x-auto max-w-2xl">
                                                {log.details}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-6 text-[11px] text-gray-500 mt-4">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-indigo-400" />
                                                <span>{new Date(log.createdAt).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Globe size={14} className="text-blue-400" />
                                                <span>IP: {log.ipAddress || 'Interno'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Tag size={14} className="text-gray-600" />
                                                <span className="text-[10px]">UUID Entidade: {log.entityId}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AuditLogPage;
