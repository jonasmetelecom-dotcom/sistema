import { useState, useEffect } from 'react';
import { Activity, Users, AlertTriangle, CheckCircle, Shield, Map as MapIcon } from 'lucide-react';
import api from '../services/api';
import MonitoringMap from '../components/Monitoring/MonitoringMap';
import OnuManagementModal from '../components/Monitoring/OnuManagementModal';

const StatCard = ({ title, value, subtext, icon: Icon, color, onClick }: any) => (
    <div
        onClick={onClick}
        className={`bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all shadow-lg backdrop-blur-sm ${onClick ? 'cursor-pointer hover:bg-gray-800/80 active:scale-[0.98]' : ''}`}
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-white mb-2">{value}</h3>
                <p className={`text-xs ${color === 'red' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {subtext}
                </p>
            </div>
            <div className={`p-3 rounded-lg bg-gray-700/50 ${color === 'blue' ? 'text-blue-400' : color === 'red' ? 'text-red-400' : 'text-emerald-400'}`}>
                <Icon size={20} />
            </div>
        </div>
    </div>
);

const DashboardHome = () => {
    const [stats, setStats] = useState<any>(null);
    const [recentAlarms, setRecentAlarms] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // ONU Modal States
    const [isOnuModalOpen, setIsOnuModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, alarmsRes, logsRes] = await Promise.all([
                    api.get('/stats/dashboard'),
                    api.get('/stats/recent-alarms'),
                    api.get('/network-elements/audit-logs')
                ]);
                setStats(statsRes.data);
                setRecentAlarms(alarmsRes.data);
                setAuditLogs(logsRes.data.slice(0, 5));
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh stats every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="p-8 text-white">Carregando estatísticas...</div>;
    }

    return (
        <div className="p-8 h-full overflow-y-auto bg-gray-900">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">Visão Geral da Rede</h1>
                <p className="text-gray-400 mt-2">Monitoramento em tempo real do sistema FTTX</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total de Clientes"
                    value={stats?.totalClients || 0}
                    subtext="Registrados na base"
                    icon={Users}
                    color="blue"
                    onClick={() => setIsOnuModalOpen(true)}
                />
                <StatCard
                    title="Saúde da Rede"
                    value={stats?.networkHealth || '100%'}
                    subtext={stats?.networkStatus || 'Operação Normal'}
                    icon={Activity}
                    color={stats?.networkHealth === '100%' ? 'green' : 'blue'}
                />
                <StatCard
                    title="Equipamentos Offline"
                    value={stats?.equipmentStats?.offline || 0}
                    subtext={`${stats?.equipmentStats?.online || 0} equipamentos online`}
                    icon={AlertTriangle}
                    color={stats?.equipmentStats?.offline > 0 ? 'red' : 'green'}
                />
                <StatCard
                    title="Projetos Ativos"
                    value={stats?.activeProjects || 0}
                    subtext="Documentações em uso"
                    icon={CheckCircle}
                    color="indigo"
                />
            </div>

            {/* Network Map Preview */}
            <div className="grid grid-cols-1 mb-8">
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg h-[400px] relative">
                    <div className="absolute top-4 right-4 z-[1000] flex gap-2">
                        <a
                            href="/monitoring"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center gap-2"
                        >
                            <MapIcon size={14} /> VER MAPA COMPLETO
                        </a>
                    </div>
                    <MonitoringMap />
                </div>
            </div>

            {/* Recent Activity & Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Ocupação de Portas PON</h3>
                    <div className="h-64 flex flex-col items-center justify-center">
                        {/* Custom SVG Donut Chart */}
                        <div className="relative">
                            <svg width="160" height="160" className="transform -rotate-90">
                                {/* Background Circle */}
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="#374151"
                                    strokeWidth="15"
                                    fill="transparent"
                                />
                                {/* Progress Circle */}
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="#3b82f6"
                                    strokeWidth="15"
                                    fill="transparent"
                                    strokeDasharray="439.8"
                                    strokeDashoffset={439.8 * (1 - (stats?.occupation?.percent || 0.7) / 100)}
                                    strokeLinecap="round"
                                    className="drop-shadow-lg shadow-blue-500/50 transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                <span className="text-3xl font-bold">{stats?.occupation?.percent || 0}%</span>
                                <span className="text-xs text-gray-400">Ocupação</span>
                            </div>
                        </div>

                        <div className="flex gap-6 mt-6">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500 shadow shadow-blue-500/50"></span>
                                <span className="text-sm text-gray-400">Em Uso ({stats?.occupation?.used || 0})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-gray-700"></span>
                                <span className="text-sm text-gray-400">Disponível ({(stats?.occupation?.total || 0) - (stats?.occupation?.used || 0)})</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">Alertas Recentes</h3>
                    <div className="space-y-4">
                        {recentAlarms.length > 0 ? recentAlarms.map((alarm) => (
                            <div key={alarm.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 border border-gray-700/50">
                                <div className={`w-2 h-2 rounded-full ${alarm.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{alarm.message}</p>
                                    <p className="text-xs text-gray-500">{new Date(alarm.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                                <CheckCircle size={32} className="mb-2 opacity-20" />
                                <p className="text-sm italic">Tudo limpo!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Audit Logs Row */}
            <div className="mt-6">
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Shield size={20} className="text-indigo-400" /> Atividade do Sistema
                        </h3>
                        <a href="/audit-logs" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider">Ver Tudo</a>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {auditLogs.length > 0 ? auditLogs.map((log) => (
                            <div key={log.id} className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${log.action === 'CREATE' ? 'text-green-500 border-green-500/20' :
                                        log.action === 'DELETE' ? 'text-red-500 border-red-500/20' : 'text-blue-500 border-blue-500/20'
                                        }`}>
                                        {log.action}
                                    </span>
                                    <span className="text-[10px] text-gray-600">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-xs text-white font-bold truncate">{log.userName}</p>
                                <p className="text-[10px] text-gray-500 truncate">{log.entityType}: {log.entityId.slice(0, 8)}</p>
                            </div>
                        )) : (
                            <div className="col-span-5 text-center py-4 text-gray-500 text-sm italic">
                                Sem atividades recentes para exibir.
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Dashboard ONU Management Modal */}
            <OnuManagementModal
                isOpen={isOnuModalOpen}
                onClose={() => setIsOnuModalOpen(false)}
            />
        </div>
    );
};

export default DashboardHome;
