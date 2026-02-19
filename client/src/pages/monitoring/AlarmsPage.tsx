import { useState, useEffect } from 'react';
import api from '../../services/api';
import { AlertTriangle, CheckCircle, Clock, Info, Bell, Filter } from 'lucide-react';

const AlarmsPage = () => {
    const [alarms, setAlarms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchAlarms = async () => {
        try {
            const response = await api.get('/network-elements/alarms');
            setAlarms(response.data);
        } catch (error) {
            console.error('Error fetching alarms:', error);
        } finally {
            setLoading(false);
        }
    };

    const acknowledgeAlarm = async (id: string) => {
        try {
            await api.patch(`/network-elements/alarms/${id}/acknowledge`);
            fetchAlarms();
        } catch (error) {
            console.error('Error acknowledging alarm:', error);
        }
    };

    useEffect(() => {
        fetchAlarms();
        const interval = setInterval(fetchAlarms, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const filteredAlarms = alarms.filter(alarm => {
        if (filter === 'all') return true;
        if (filter === 'unacknowledged') return !alarm.isAcknowledged;
        if (filter === 'critical') return alarm.severity === 'critical';
        return true;
    });

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertTriangle className="text-red-500" size={20} />;
            case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
            case 'info': return <Info className="text-blue-500" size={20} />;
            default: return <Bell className="text-gray-400" size={20} />;
        }
    };

    const getSeverityClass = (severity: string) => {
        switch (severity) {
            case 'critical': return 'border-red-500/30 bg-red-500/5';
            case 'warning': return 'border-yellow-500/30 bg-yellow-500/5';
            case 'info': return 'border-blue-500/30 bg-blue-500/5';
            default: return 'border-gray-700 bg-gray-800/50';
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Bell className="text-indigo-500" /> Histórico de Alarmes
                    </h1>
                    <p className="text-gray-400 mt-2">Alertas críticos e avisos do sistema em tempo real</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('unacknowledged')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'unacknowledged' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Não Lidos
                    </button>
                    <button
                        onClick={() => setFilter('critical')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'critical' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Críticos
                    </button>
                    <button onClick={fetchAlarms} className="p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            ) : filteredAlarms.length === 0 ? (
                <div className="text-center py-20 bg-gray-800/20 rounded-2xl border border-gray-800 border-dashed">
                    <CheckCircle className="mx-auto text-gray-600 mb-4" size={48} />
                    <p className="text-gray-500">Nenhum alarme encontrado para os filtros selecionados.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAlarms.map((alarm) => (
                        <div
                            key={alarm.id}
                            className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${getSeverityClass(alarm.severity)} ${alarm.isAcknowledged ? 'opacity-60 grayscale-[0.5]' : 'shadow-lg shadow-indigo-900/5'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className="mt-1">{getSeverityIcon(alarm.severity)}</div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${alarm.severity === 'critical' ? 'bg-red-500 text-white' : alarm.severity === 'warning' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'}`}>
                                                {alarm.severity}
                                            </span>
                                            <span className="text-xs text-indigo-400 font-mono">{alarm.deviceName}</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">{alarm.message}</h3>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><Clock size={14} /> {new Date(alarm.createdAt).toLocaleString()}</span>
                                            {alarm.isAcknowledged && (
                                                <span className="flex items-center gap-1 text-green-500"><CheckCircle size={14} /> Lido por {alarm.acknowledgedBy} em {new Date(alarm.acknowledgedAt).toLocaleTimeString()}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {!alarm.isAcknowledged && (
                                    <button
                                        onClick={() => acknowledgeAlarm(alarm.id)}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                                    >
                                        RECONHECER
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AlarmsPage;
