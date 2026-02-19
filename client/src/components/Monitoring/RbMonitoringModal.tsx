import { useState, useEffect } from 'react';
import { X, Activity, Cpu, HardDrive, Thermometer, Zap, ArrowUp, ArrowDown, RefreshCcw, Search, Layout, List, Bell } from 'lucide-react';
import api from '../../services/api';
import { InterfaceChart } from './InterfaceChart';
import { useMonitoringSocket } from '../../hooks/useMonitoringSocket';

interface RbMonitoringModalProps {
    rbId: string;
    onClose: () => void;
}

interface InterfaceData {
    index: number;
    name: string;
    status: 'up' | 'down';
    inOctets: number;
    outOctets: number;
}

interface Alarm {
    id: string;
    type: string;
    severity: string;
    message: string;
    createdAt: string;
    isAcknowledged: boolean;
}

interface EthernetPort {
    name: string;
    running: boolean;
    speed: string;
    duplex: string;
    linkDowns: number;
    rxBps?: number;
    txBps?: number;
}

interface RbMonitoringData {
    health: {
        cpuLoad: number;
        freeMemory: number;
        totalMemory: number;
        temperature: number;
        voltage: number;
        uptime: string;
    };
    interfaces: InterfaceData[];
    ports?: EthernetPort[];
    alarms: Alarm[];
    monitoringMethod?: 'api' | 'snmp' | 'ping';
}

const formatBits = (bits: number) => {
    if (bits === 0) return '0 bps';
    const k = 1000;
    const sizes = ['bps', 'kbps', 'Mbps', 'Gbps', 'Tbps'];
    const i = Math.floor(Math.log(bits) / Math.log(k));
    return parseFloat((bits / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


export const RbMonitoringModal = ({ rbId, onClose }: RbMonitoringModalProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');
    const [history, setHistory] = useState<Record<number, any[]>>({});
    const [selectedInterface, setSelectedInterface] = useState<number | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);

    // Use WebSocket hook for real-time updates
    const { data: wsData, connected } = useMonitoringSocket(rbId);

    // Fallback to HTTP for initial load
    const [data, setData] = useState<RbMonitoringData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initial HTTP fetch
    const fetchInitial = async () => {
        setInitialLoading(true);
        try {
            const response = await api.get(`/network-elements/rbs/${rbId}/monitoring`);
            setData(response.data);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching RB monitoring:', err);
            setError('Não foi possível conectar ao MikroTik. Verifique as configurações.');
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        fetchInitial();
    }, [rbId]);

    // Update data when WebSocket receives new data
    useEffect(() => {
        if (wsData) {
            setData(wsData);
            setLastUpdate(new Date());
            setError(null);

            // Update history for charts
            if (wsData.interfaces) {
                setHistory(prev => {
                    const newHistory = { ...prev };
                    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                    wsData.interfaces.forEach((iface: InterfaceData) => {
                        if (!newHistory[iface.index]) newHistory[iface.index] = [];
                        newHistory[iface.index] = [
                            ...newHistory[iface.index],
                            {
                                time: timeLabel,
                                in: iface.inOctets,
                                out: iface.outOctets
                            }
                        ].slice(-30); // Keep last 30 points
                    });
                    return newHistory;
                });

                // Auto-select first UP interface if none selected
                if (!selectedInterface && wsData.interfaces.length > 0) {
                    const firstUp = wsData.interfaces.find((i: InterfaceData) => i.status === 'up');
                    setSelectedInterface(firstUp ? firstUp.index : wsData.interfaces[0].index);
                }
            }
        }
    }, [wsData, selectedInterface]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 bps';
        const k = 1024;
        const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const filteredInterfaces = data?.interfaces.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const activeInterface = data?.interfaces.find(i => i.index === selectedInterface);

    return (
        <div className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700/50 w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-gray-800 bg-gray-950/40 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <Activity className="text-blue-500" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                                Painel de Controle MikroTik
                                {data?.monitoringMethod && (
                                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${data.monitoringMethod === 'api'
                                        ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                                        : data.monitoringMethod === 'snmp'
                                            ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                                            : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                        }`}>
                                        {data.monitoringMethod === 'api' ? '🚀 API NATIVA' : data.monitoringMethod === 'snmp' ? '📡 SNMP' : '📶 PING'}
                                    </span>
                                )}
                            </h2>
                            <p className="text-sm text-gray-400 flex items-center gap-2 font-medium">
                                <span className="flex h-2 w-2 relative">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'} opacity-75`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                </span>
                                {connected ? 'WebSocket Conectado' : 'Conectando...'} | {lastUpdate.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-gray-800/50 p-1 rounded-xl border border-gray-700">
                            <button
                                onClick={() => setViewMode('visual')}
                                className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${viewMode === 'visual' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Layout size={16} />
                                Dashboard
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <List size={16} />
                                Interfaces
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-gradient-to-b from-gray-900 to-gray-950">
                    {initialLoading && !data && (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                            <p className="text-gray-400 animate-pulse font-medium">Estabelecendo conexão SNMP segura...</p>
                        </div>
                    )}

                    {error && (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                            <div className="p-6 bg-red-600/10 rounded-full mb-6 border border-red-500/20">
                                <Zap className="text-red-500" size={64} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Erro de Comunicação</h3>
                            <p className="text-gray-400 max-w-md mb-8">{error}</p>
                            <button onClick={() => fetchInitial()} className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all font-bold shadow-lg shadow-red-600/20 active:scale-95">
                                Tentar Reconectar
                            </button>
                        </div>
                    )}

                    {data && (
                        <>
                            {/* Health Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 p-5 rounded-2xl group hover:border-blue-500/50 transition-all">
                                    <div className="flex items-center gap-2 text-gray-400 mb-3">
                                        <Cpu size={18} className="group-hover:text-blue-400 transition-colors" />
                                        <span className="text-xs uppercase font-extrabold tracking-wider">CPU Load</span>
                                    </div>
                                    <div className="text-3xl font-black text-white">{data.health.cpuLoad}%</div>
                                    <div className="w-full bg-gray-700/50 h-2 mt-3 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className={`h-full transition-all duration-1000 ${data.health.cpuLoad > 80 ? 'bg-red-500' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
                                            style={{ width: `${data.health.cpuLoad}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 p-5 rounded-2xl group hover:border-emerald-500/50 transition-all">
                                    <div className="flex items-center gap-2 text-gray-400 mb-3">
                                        <HardDrive size={18} className="group-hover:text-emerald-400 transition-colors" />
                                        <span className="text-xs uppercase font-extrabold tracking-wider">Memória Disponível</span>
                                    </div>
                                    <div className="text-3xl font-black text-white">
                                        {Math.round(data.health.freeMemory / (1024 * 1024))}MB
                                    </div>
                                    <div className="text-[11px] text-gray-500 mt-2 font-bold">Total: {Math.round(data.health.totalMemory / (1024 * 1024))}MB</div>
                                </div>

                                <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 p-5 rounded-2xl group hover:border-orange-500/50 transition-all">
                                    <div className="flex items-center gap-2 text-gray-400 mb-3">
                                        <Thermometer size={18} className="group-hover:text-orange-400 transition-colors" />
                                        <span className="text-xs uppercase font-extrabold tracking-wider">Temperatura</span>
                                    </div>
                                    <div className={`text-3xl font-black ${data.health.temperature > 65 ? 'text-red-400' : 'text-orange-400'}`}>
                                        {data.health.temperature}°C
                                    </div>
                                </div>

                                <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 p-5 rounded-2xl group hover:border-yellow-500/50 transition-all">
                                    <div className="flex items-center gap-2 text-gray-400 mb-3">
                                        <Zap size={18} className="group-hover:text-yellow-400 transition-colors" />
                                        <span className="text-xs uppercase font-extrabold tracking-wider">Voltagem</span>
                                    </div>
                                    <div className="text-3xl font-black text-yellow-400">{data.health.voltage}V</div>
                                </div>

                                <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 p-5 rounded-2xl group hover:border-purple-500/50 transition-all">
                                    <div className="flex items-center gap-2 text-gray-400 mb-3">
                                        <RefreshCcw size={18} className="group-hover:text-purple-400 transition-colors" />
                                        <span className="text-xs uppercase font-extrabold tracking-wider">Tempo de Atividade</span>
                                    </div>
                                    <div className="text-lg font-black text-white truncate">{data.health.uptime}</div>
                                </div>
                            </div>

                            {viewMode === 'visual' ? (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* Chassis View */}
                                        <div className="bg-gray-800/20 border border-gray-700/50 rounded-2xl p-6">
                                            <h3 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                                                <Layout size={18} className="text-blue-500" />
                                                Visualização do Chassis (Portas)
                                            </h3>
                                            <div className="bg-gray-950/80 p-8 rounded-xl border-x-8 border-gray-800 shadow-2xl relative overflow-hidden">
                                                <div className="absolute top-2 left-4 text-[10px] font-black text-gray-700 uppercase italic">MikroTik RouterBoard</div>
                                                <div className="grid grid-cols-6 sm:grid-cols-12 gap-3">
                                                    {data.interfaces.map((iface) => (
                                                        <button
                                                            key={iface.index}
                                                            onClick={() => setSelectedInterface(iface.index)}
                                                            className={`group relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all duration-300 ${selectedInterface === iface.index ? 'border-blue-500 bg-blue-500/10 scale-110 z-10' : 'border-gray-800 bg-gray-900/50 hover:border-gray-600'}`}
                                                        >
                                                            <div className={`w-8 h-8 rounded border flex items-center justify-center p-1.5 transition-colors ${iface.status === 'up' ? 'bg-green-500/20 border-green-500/50 group-hover:bg-green-500 group-hover:border-green-400' : 'bg-red-500/10 border-red-500/30 group-hover:bg-red-900/50'}`}>
                                                                <div className={`w-full h-full rounded-sm ${iface.status === 'up' ? 'bg-green-500' : 'bg-red-900/50'}`} />
                                                            </div>
                                                            <div className={`text-[10px] font-black transition-colors ${selectedInterface === iface.index ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                                                #{iface.index}
                                                            </div>

                                                            {/* Tooltip */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-gray-900 border border-gray-700 rounded-lg p-2 text-center shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-75 group-hover:scale-100">
                                                                <div className="text-[10px] font-bold text-white truncate">{iface.name}</div>
                                                                <div className={`text-[8px] font-black uppercase mt-1 ${iface.status === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                                                    {iface.status === 'up' ? 'CONECTADO' : 'DESCONECTADO'}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chart Section */}
                                        {selectedInterface && history[selectedInterface] && activeInterface && (
                                            <InterfaceChart
                                                data={history[selectedInterface]}
                                                name={activeInterface.name}
                                            />
                                        )}

                                        {/* Ethernet Ports (Native API) */}
                                        {data.ports && data.ports.length > 0 && (
                                            <div className="bg-gray-800/20 border border-gray-700/50 rounded-2xl p-6">
                                                <h3 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                                                    <Activity size={18} className="text-emerald-500" />
                                                    Portas Ethernet (API Nativa)
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {data.ports.map((port) => (
                                                        <div key={port.name} className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 hover:border-emerald-500/30 transition-all">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-2 h-2 rounded-full ${port.running ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                                                                    <span className="text-sm font-black text-white uppercase italic">{port.name}</span>
                                                                </div>
                                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${port.running ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                                    {port.running ? 'UP' : 'DOWN'}
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                                <div className="text-[10px] text-gray-500 font-bold">Velocidade: <span className="text-gray-300">{port.speed}</span></div>
                                                                <div className="text-[10px] text-gray-500 font-bold">Duplex: <span className="text-gray-300 capitalize">{port.duplex}</span></div>
                                                                <div className="text-[10px] text-gray-500 font-bold">Link Downs: <span className="text-gray-300">{port.linkDowns}</span></div>
                                                            </div>

                                                            <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-800">
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-black">
                                                                        <ArrowDown size={12} /> RX
                                                                    </div>
                                                                    <div className="text-xs font-mono font-black text-white">
                                                                        {formatBits(port.rxBps || 0)}
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <div className="flex items-center gap-1 text-blue-400 text-[10px] font-black">
                                                                        TX <ArrowUp size={12} />
                                                                    </div>
                                                                    <div className="text-xs font-mono font-black text-white">
                                                                        {formatBits(port.txBps || 0)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>


                                    {/* Event Log / Alarms */}
                                    <div className="space-y-6">
                                        <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl overflow-hidden flex flex-col h-full">
                                            <div className="p-4 bg-gray-950/50 border-b border-gray-800 flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                                    <Bell size={18} className="text-yellow-500" />
                                                    Histórico de Eventos
                                                </h3>
                                                <span className="px-2 py-0.5 bg-gray-800 rounded text-[10px] font-bold text-gray-400">Últimos 10</span>
                                            </div>
                                            <div className="flex-1 overflow-y-auto max-h-[500px] p-2 space-y-2 custom-scrollbar">
                                                {data.alarms && data.alarms.length > 0 ? (
                                                    data.alarms.map((alarm) => (
                                                        <div key={alarm.id} className={`p-3 rounded-xl border transition-all ${alarm.isAcknowledged ? 'bg-gray-800/20 border-gray-800 opacity-60' : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'}`}>
                                                            <div className="flex justify-between items-start gap-2">
                                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${alarm.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'}`}>
                                                                    {alarm.severity}
                                                                </span>
                                                                <span className="text-[9px] text-gray-500 font-bold">{new Date(alarm.createdAt).toLocaleString()}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-300 mt-2 leading-relaxed">{alarm.message}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="h-40 flex flex-col items-center justify-center text-center opacity-30 grayscale p-4">
                                                        <Activity size={32} className="mb-2" />
                                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Nenhum evento registrado</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Existing List View - Enhanced */
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-gray-800/30 p-4 rounded-2xl border border-gray-700/50">
                                        <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                                            <Activity size={20} className="text-blue-500" />
                                            Interfaces Disponíveis
                                            <span className="text-xs text-gray-500 font-medium ml-2">({filteredInterfaces.length} total)</span>
                                        </h3>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Filtrar interfaces..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="bg-gray-900/50 border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all min-w-[300px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-hidden border border-gray-700/50 rounded-2xl shadow-xl overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-950 text-gray-400 text-[10px] uppercase tracking-widest font-black">
                                                <tr>
                                                    <th className="px-6 py-4">Nome da Interface</th>
                                                    <th className="px-6 py-4 text-center">Status</th>
                                                    <th className="px-6 py-4 text-right text-emerald-400">Download (Rx)</th>
                                                    <th className="px-6 py-4 text-right text-blue-400">Upload (Tx)</th>
                                                    <th className="px-6 py-4">Carga</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800/50 bg-gray-900/20">
                                                {filteredInterfaces.map((iface) => (
                                                    <tr
                                                        key={iface.index}
                                                        onClick={() => { setSelectedInterface(iface.index); setViewMode('visual'); }}
                                                        className="hover:bg-blue-600/5 transition-all cursor-pointer group"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-3 h-3 rounded-full ${iface.status === 'up' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-500 opacity-50'}`} />
                                                                <span className="font-bold text-gray-200 group-hover:text-blue-400 transition-colors uppercase italic tracking-tight">{iface.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-black tracking-tighter ${iface.status === 'up' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                                {iface.status === 'up' ? 'ONLINE' : 'OFFLINE'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2 text-emerald-400 font-mono text-xs font-bold">
                                                                <ArrowDown size={14} className="animate-bounce" />
                                                                {formatBytes(iface.inOctets)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2 text-blue-400 font-mono text-xs font-bold">
                                                                <ArrowUp size={14} className="animate-pulse" />
                                                                {formatBytes(iface.outOctets)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 min-w-[120px]">
                                                            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden shadow-inner">
                                                                <div
                                                                    className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000"
                                                                    style={{ width: `${Math.min(100, (iface.inOctets + iface.outOctets) / 5000000)}%` }}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-950 border-t border-gray-800 flex justify-between items-center">
                    <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest px-4">
                        Sistema Integrado de Monitoramento de Rede
                    </div>
                    <button onClick={onClose} className="px-10 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all font-black text-xs uppercase tracking-widest active:scale-95 border border-gray-700">
                        Fechar Painel
                    </button>
                </div>
            </div>
        </div>
    );
};
