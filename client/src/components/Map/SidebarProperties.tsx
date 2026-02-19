import { useState, useEffect, type ChangeEvent } from 'react';
import { X, Save, Trash2, Zap, Activity, Ruler, ChevronRight, Camera, Maximize2 } from 'lucide-react';
import api from '../../services/api';

interface ElementData {
    id: string;
    type: string;
    points?: { lat: number; lng: number }[];
    [key: string]: any;
}

interface SidebarPropertiesProps {
    element: ElementData | null;
    elementType: 'pole' | 'box' | 'cable' | 'onu' | 'rbs' | null;
    onClose: () => void;
    onUpdate: () => void;
    onOpenInternals?: (id: string) => void;
    onTrace?: (elementId: string, fiberIndex: number) => void;
    onOTDR?: (distance: number) => void;
    onDelete?: (id: string, type: 'pole' | 'box' | 'cable' | 'onu' | 'rbs') => void;
}

export const SidebarProperties = ({ element, elementType, onClose, onUpdate, onOpenInternals, onTrace, onOTDR, onDelete }: SidebarPropertiesProps) => {
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'engineering'>('general');
    const [linkBudget, setLinkBudget] = useState<any>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (element) {
            setFormData({ ...element });
            setActiveTab('general');
            setLinkBudget(null);

            if (elementType === 'cable') {
                fetchLinkBudget(element.id, 1);
            }
        }
    }, [element, elementType]);

    const fetchLinkBudget = async (elementId: string, fiberIndex: number) => {
        try {
            const response = await api.get(`/network-elements/link-budget?elementId=${elementId}&fiberIndex=${fiberIndex}`);
            setLinkBudget(response.data);
        } catch (error) {
            console.error('Error fetching link budget:', error);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!element || !elementType) return;
        setLoading(true);
        try {
            const endpoint = elementType === 'pole' ? 'poles'
                : elementType === 'box' ? 'boxes'
                    : elementType === 'onu' ? 'onus'
                        : elementType === 'rbs' ? 'rbs'
                            : 'cables';

            console.log('Saving', endpoint, formData);

            await api.patch(`/network-elements/${endpoint}/${element.id}`, formData);
            onUpdate();
        } catch (error) {
            console.error('Error updating element:', error);
            alert('Erro ao salvar');
        } finally {
            setLoading(false);
        }
    };

    if (!element) return null;

    return (
        <div className="fixed sm:absolute bottom-0 sm:bottom-auto sm:top-4 right-0 sm:right-4 z-[1000] w-full sm:w-80 bg-gray-900 border-t sm:border border-gray-700 rounded-t-2xl sm:rounded-xl shadow-2xl p-4 flex flex-col gap-4 max-h-[85vh] sm:max-h-none overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`text-sm font-bold pb-1 transition-colors ${activeTab === 'general' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Geral
                    </button>
                    {(elementType === 'cable' || elementType === 'box') && (
                        <button
                            onClick={() => setActiveTab('engineering')}
                            className={`text-sm font-bold pb-1 transition-colors ${activeTab === 'engineering' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Engenharia
                        </button>
                    )}
                    {elementType === 'rbs' && (
                        <button
                            onClick={() => setActiveTab('engineering')}
                            className={`text-sm font-bold pb-1 transition-colors ${activeTab === 'engineering' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Monitoramento
                        </button>
                    )}
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            {activeTab === 'general' ? (
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">ID</label>
                        <input
                            disabled
                            value={element.id.slice(0, 8)}
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-500 text-sm"
                        />
                    </div>

                    {elementType === 'pole' && (
                        <>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Type</label>
                                <select
                                    name="material"
                                    value={formData.material || 'concrete'}
                                    onChange={handleChange}
                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-blue-500 outline-none"
                                >
                                    <option value="concrete">Concreto</option>
                                    <option value="wood">Madeira</option>
                                    <option value="metal">Metal</option>
                                </select>
                            </div>
                        </>
                    )}

                    {elementType === 'box' && (
                        <>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Type</label>
                                <select
                                    name="type"
                                    value={formData.type || 'cto'}
                                    onChange={handleChange}
                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-blue-500 outline-none"
                                >
                                    <option value="cto">CTO</option>
                                    <option value="ceo">CEO</option>
                                    <option value="splice">Emenda</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Capacity</label>
                                <select
                                    name="capacity"
                                    value={formData.capacity || 16}
                                    onChange={handleChange}
                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-blue-500 outline-none"
                                >
                                    <option value={8}>8 Portas</option>
                                    <option value={16}>16 Portas</option>
                                    <option value={24}>24 Portas</option>
                                </select>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-800 flex flex-col gap-3">
                                <button
                                    onClick={() => onOpenInternals && element && onOpenInternals(element.id)}
                                    className="w-full bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-900/50 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                    Ver Fusões (Interno)
                                </button>

                                {/* Image Gallery Section */}
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Camera size={12} /> Fotos de Campo
                                    </h4>

                                    {element.images && element.images.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            {element.images.slice(0, 3).map((img: string, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 cursor-pointer group"
                                                    onClick={() => setSelectedImage(img)}
                                                >
                                                    <img src={img} alt={`Field photo ${idx}`} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Maximize2 size={16} className="text-white" />
                                                    </div>
                                                </div>
                                            ))}
                                            {element.images.length > 3 && (
                                                <button
                                                    onClick={() => onOpenInternals && onOpenInternals(element.id)}
                                                    className="aspect-square rounded-lg border border-dashed border-gray-700 flex flex-col items-center justify-center text-[10px] text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-all"
                                                >
                                                    +{element.images.length - 3}
                                                    <span>Mais</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-gray-800/20 border border-dashed border-gray-800 rounded-lg p-4 flex flex-col items-center justify-center gap-1">
                                            <Camera size={24} className="text-gray-700" />
                                            <p className="text-[10px] text-gray-600 italic">Nenhuma foto anexada</p>
                                            <button
                                                onClick={() => onOpenInternals && onOpenInternals(element.id)}
                                                className="mt-1 text-[10px] text-blue-400 hover:underline"
                                            >
                                                Adicionar Fotos
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {elementType === 'onu' && (
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Nome do Cliente</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleChange}
                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Nº de Série (SN)</label>
                                <input
                                    type="text"
                                    name="serialNumber"
                                    value={formData.serialNumber || ''}
                                    onChange={handleChange}
                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Status</label>
                                <select
                                    name="status"
                                    value={formData.status || 'planned'}
                                    onChange={handleChange}
                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-blue-500 outline-none"
                                >
                                    <option value="planned">Planejado</option>
                                    <option value="online">Online</option>
                                    <option value="offline">Offline</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {elementType === 'rbs' && (
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Nome da RBS</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleChange}
                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Endereço IP</label>
                                <input
                                    type="text"
                                    name="ipAddress"
                                    value={formData.ipAddress || ''}
                                    onChange={handleChange}
                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-blue-500 outline-none"
                                    placeholder="192.168.0.1"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Comunidade SNMP</label>
                                <input
                                    type="text"
                                    name="snmpCommunity"
                                    value={formData.snmpCommunity || 'public'}
                                    onChange={handleChange}
                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Raio de Cobertura (metros)</label>
                                <input
                                    type="number"
                                    name="range"
                                    value={formData.range || 500}
                                    onChange={handleChange}
                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Modelo</label>
                                <select
                                    name="model"
                                    value={formData.model || 'MikroTik'}
                                    onChange={handleChange}
                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-blue-500 outline-none"
                                >
                                    <option value="MikroTik">MikroTik</option>
                                    <option value="Ubiquiti">Ubiquiti</option>
                                    <option value="Mimosa">Mimosa</option>
                                    <option value="Other">Outro</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {elementType === 'cable' && (
                        <div className="flex flex-col gap-1">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Fiber Count</label>
                                <input
                                    type="number"
                                    name="fiberCount"
                                    value={formData.fiberCount || 1}
                                    onChange={handleChange}
                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Tipo de Cabo</label>
                                <select
                                    name="type"
                                    value={formData.type || 'drop'}
                                    onChange={handleChange}
                                    disabled
                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-400 text-sm outline-none cursor-not-allowed"
                                >
                                    <option value="drop">Drop</option>
                                    <option value="as80">AS80</option>
                                    <option value="as120">AS120</option>
                                    <option value="underground">Subterrâneo</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Reserva Técnica (Metros)</label>
                                <input
                                    type="number"
                                    name="slack"
                                    value={formData.slack || 0}
                                    onChange={handleChange}
                                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                                    placeholder="0"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400">Total Length (Meters)</label>
                                <div className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-emerald-400 text-sm font-mono">
                                    {(() => {
                                        if (!element.points || !Array.isArray(element.points)) return '0 m';
                                        let totalDist = 0;
                                        for (let i = 0; i < element.points.length - 1; i++) {
                                            const lat1 = element.points[i].lat;
                                            const lon1 = element.points[i].lng;
                                            const lat2 = element.points[i + 1].lat;
                                            const lon2 = element.points[i + 1].lng;

                                            const R = 6371e3; // metres
                                            const φ1 = lat1 * Math.PI / 180;
                                            const φ2 = lat2 * Math.PI / 180;
                                            const Δφ = (lat2 - lat1) * Math.PI / 180;
                                            const Δλ = (lon2 - lon1) * Math.PI / 180;

                                            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                                                Math.cos(φ1) * Math.cos(φ2) *
                                                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                                            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                            totalDist += R * c;
                                        }
                                        return `${totalDist.toFixed(2)} m`;
                                    })()}
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
                                <button
                                    onClick={() => onTrace && element && onTrace(element.id, 1)}
                                    className="w-full bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-400 border border-yellow-900/50 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Zap size={16} />
                                    Rastrear Fibra 1
                                </button>

                                <button
                                    onClick={() => {
                                        const dist = prompt('Distância do rompimento (metros):');
                                        if (dist && onOTDR) {
                                            onOTDR(parseFloat(dist));
                                        }
                                    }}
                                    className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Zap size={16} />
                                    OTDR (Rompimento)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-2">
                    {linkBudget ? (
                        <>
                            <div className="bg-gray-800/50 rounded-xl p-4 border border-blue-900/30">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <Activity size={18} />
                                        <span className="text-xs font-bold uppercase tracking-widest">Sinal Estimado</span>
                                    </div>
                                    <span className={`text-2xl font-black ${linkBudget.status === 'optimal' ? 'text-emerald-400' : linkBudget.status === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {linkBudget.estimatedSignal} <small className="text-sm font-normal">dBm</small>
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden mb-4">
                                    <div
                                        className={`h-full transition-all duration-500 rounded-full ${linkBudget.status === 'optimal' ? 'bg-emerald-500' : linkBudget.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${Math.max(0, Math.min(100, (linkBudget.estimatedSignal + 35) * 4))}%` }}
                                    ></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Atenuação Total</p>
                                        <p className="text-lg font-bold text-white text-mono">{linkBudget.totalLoss} <span className="text-xs">dB</span></p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Distância Total</p>
                                        <p className="text-lg font-bold text-white text-mono">{linkBudget.totalDistance} <span className="text-xs">m</span></p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Ruler size={14} /> Detalhamento de Perdas
                                </h4>
                                <div className="bg-gray-800/30 rounded-lg overflow-hidden border border-gray-800">
                                    {linkBudget.events.map((ev: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-2 border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <ChevronRight size={14} className="text-gray-600 flex-shrink-0" />
                                                <span className="text-xs text-gray-300 truncate">{ev.description}</span>
                                            </div>
                                            <span className="text-xs font-mono text-red-400">-{ev.loss.toFixed(2)} dB</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-2 p-3 bg-blue-900/10 rounded-lg border border-blue-900/20">
                                <p className="text-[10px] text-blue-400 leading-tight">
                                    <strong>Nota Técnica:</strong> Este cálculo é teórico. Considera perda de 0.35dB/km (1310nm), perdas nominais de splitters e fusions. Potência OLT: +3.0dBm.
                                </p>
                            </div>
                            {linkBudget.status === 'critical' && (
                                <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-900/40 text-[10px] text-red-400 font-medium animate-pulse">
                                    ⚠️ SINAL CRÍTICO: Possível dificuldade de sincronismo da ONU.
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {elementType === 'rbs' && (
                                <div className="space-y-4">
                                    <div className="bg-gray-800/50 rounded-xl p-4 border border-purple-900/30">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-purple-400">
                                                <Activity size={18} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Saúde da RBS</span>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${element.status === 'online' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                {element.status || 'offline'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mt-4">
                                            <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800">
                                                <p className="text-[9px] text-gray-500 uppercase font-bold">CPU Load</p>
                                                <p className="text-lg font-bold text-white font-mono">{element.cpuLoad || 0}%</p>
                                            </div>
                                            <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800">
                                                <p className="text-[9px] text-gray-500 uppercase font-bold">Temperatura</p>
                                                <p className="text-lg font-bold text-white font-mono">{element.temperature || 0}°C</p>
                                            </div>
                                            <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800">
                                                <p className="text-[9px] text-gray-500 uppercase font-bold">Memória Livre</p>
                                                <p className="text-sm font-bold text-white font-mono">
                                                    {element.freeMemory ? (element.freeMemory / 1024 / 1024).toFixed(1) : 0} MB
                                                </p>
                                            </div>
                                            <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-800">
                                                <p className="text-[9px] text-gray-500 uppercase font-bold">Voltagem</p>
                                                <p className="text-lg font-bold text-white font-mono">{element.voltage || 0}V</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-800">
                                            <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Última Atualização</p>
                                            <p className="text-[10px] text-gray-400 font-mono">
                                                {element.lastUpdate ? new Date(element.lastUpdate).toLocaleString() : 'Nunca'}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={async () => {
                                            try {
                                                setLoading(true);
                                                await api.post(`/network-elements/rbs/${element.id}/poll`);
                                                onUpdate();
                                            } catch (err) {
                                                alert('Erro ao forçar atualização SNMP');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className="w-full bg-purple-900/30 hover:bg-purple-900/50 text-purple-400 border border-purple-900/50 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                        disabled={loading}
                                    >
                                        <Activity size={16} />
                                        Forçar Atualização SNMP
                                    </button>
                                </div>
                            )}

                            {elementType !== 'rbs' && (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-600 italic text-sm">
                                    <Activity size={40} className="mb-4 opacity-20" />
                                    <p>Cálculo não disponível para este elemento.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <div className="flex gap-2 mt-2">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                >
                    <Save size={16} />
                    Salvar
                </button>
                <button
                    onClick={() => {
                        if (onDelete && element && elementType) {
                            onDelete(element.id, elementType);
                        } else if (!onDelete) {
                            // Fallback if onDelete is not provided (should not start happen with updated Map.tsx)
                            if (!confirm('Tem certeza que deseja excluir este item?')) return;
                            // ... old logic would go here but we prefer onDelete
                            alert('Função de excluir não disponível ou atualizada.');
                        }
                    }}
                    disabled={loading}
                    className="bg-red-900/30 hover:bg-red-900/50 text-red-400 p-2 rounded-lg"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Image Preview Modal (Lightbox) */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center p-8 animate-in fade-in zoom-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={32} />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};
