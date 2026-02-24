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
    onDelete?: (id: string, type: 'pole' | 'box' | 'cable' | 'onu' | 'rbs') => void;
    elements?: any;
}

export const SidebarProperties = ({ element, elementType, elements, onClose, onUpdate, onOpenInternals, onTrace, onDelete }: SidebarPropertiesProps) => {
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'engineering'>('general');
    const [linkBudget, setLinkBudget] = useState<any>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedFiber, setSelectedFiber] = useState<number>(1);

    useEffect(() => {
        if (element) {
            setFormData({ ...element });
            setActiveTab('general');
            setLinkBudget(null);

            // Ensure reserves is an array
            if (elementType === 'cable' && (!element.reserves || !Array.isArray(element.reserves))) {
                setFormData((prev: any) => ({ ...prev, reserves: [] }));
            }

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

            const payload = { ...formData };
            if (elementType === 'cable') {
                // Calculate totalLength before saving
                const slagLen = parseFloat(payload.slack || 0);
                const reserveSum = (payload.reserves || []).reduce((acc: number, r: any) => acc + (parseFloat(r.length) || 0), 0);
                payload.reserveLength = reserveSum;
                payload.totalLength = (parseFloat(payload.length3D) || 0) + slagLen + reserveSum;
            }

            await api.patch(`/network-elements/${endpoint}/${element.id}`, payload);
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Error updating element:', error);
            alert('Erro ao salvar');
        } finally {
            setLoading(false);
        }
    };

    const getElementName = (id: string, type: string) => {
        if (!elements || !id || !type) return id?.slice(0, 8) || 'Desconhecido';
        const list = type === 'pole' ? elements.poles : elements.boxes;
        const item = list?.find((e: any) => e.id === id);
        return item?.name || `${type.toUpperCase()} - ${id?.slice(0, 8)}`;
    };

    const handleReserveChange = (poleId: string, length: number) => {
        const currentReserves = [...(formData.reserves || [])];
        const idx = currentReserves.findIndex((r: any) => r.poleId === poleId);
        if (idx >= 0) {
            currentReserves[idx].length = length;
        } else {
            currentReserves.push({ poleId, length });
        }
        setFormData((prev: any) => ({ ...prev, reserves: currentReserves }));
    };

    const getReserveValue = (poleId: string) => {
        return (formData.reserves || []).find((r: any) => r.poleId === poleId)?.length || 0;
    };

    if (!element) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-sm bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
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
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {activeTab === 'general' ? (
                        <div className="flex flex-col gap-3">
                            <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 flex flex-col gap-1 mb-4">
                                <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                                    <span>ID: {element.id.slice(0, 8)}</span>
                                    {element.createdAt && (
                                        <span>CRIADO EM: {new Date(element.createdAt).toLocaleDateString()}</span>
                                    )}
                                </div>
                                {element.createdBy && (
                                    <div className="text-[10px] text-gray-600">
                                        Criado por: {element.createdBy}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Nome</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name || ''}
                                        onChange={handleChange}
                                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
                                        placeholder="Ex: POSTE-001, CTO-05..."
                                    />
                                    <button
                                        onClick={() => {
                                            const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                                            let prefix = 'ID-';
                                            if (elementType === 'pole') prefix = 'P-';
                                            if (elementType === 'box') prefix = formData.type === 'ceo' ? 'CEO-' : 'CTO-';
                                            if (elementType === 'cable') prefix = 'C-';
                                            setFormData((prev: any) => ({ ...prev, name: prefix + randomSuffix }));
                                        }}
                                        className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded border border-blue-600/30 transition-colors"
                                        title="Gerar Nome Aleatório"
                                    >
                                        <Zap size={14} />
                                    </button>
                                </div>
                            </div>

                            {elementType === 'pole' && (
                                <>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Material</label>
                                        <div className="flex gap-2">
                                            <select
                                                name="material"
                                                value={formData.material || 'concrete'}
                                                onChange={handleChange}
                                                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
                                            >
                                                <option value="concrete">Concreto</option>
                                                <option value="wood">Madeira</option>
                                                <option value="metal">Metal</option>
                                            </select>
                                            <button
                                                onClick={async () => {
                                                    if (!confirm('Deseja converter este poste em uma Caixa CTO?')) return;
                                                    try {
                                                        setLoading(true);
                                                        await api.delete(`/network-elements/poles/${element.id}`);
                                                        await api.post('/network-elements/boxes', {
                                                            projectId: element.projectId,
                                                            latitude: element.latitude,
                                                            longitude: element.longitude,
                                                            type: 'cto',
                                                            name: 'CTO-NEW'
                                                        });
                                                        onUpdate();
                                                        onClose();
                                                    } catch (err) {
                                                        alert('Erro ao converter elemento');
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                                className="px-3 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded border border-emerald-600/30 text-[10px] font-bold transition-colors"
                                                title="Converter para Caixa"
                                            >
                                                CONVERTER
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Altura (m)</label>
                                            <input
                                                type="number"
                                                name="height"
                                                value={formData.height || 11}
                                                onChange={handleChange}
                                                className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Esforço (daN/kg)</label>
                                            <input
                                                type="number"
                                                name="currentLoad"
                                                value={formData.currentLoad || 0}
                                                onChange={handleChange}
                                                className={`bg-gray-800 border ${parseFloat(formData.currentLoad) > 100 ? 'border-red-500 text-red-400' : 'border-gray-700 text-white'} rounded px-2 py-1.5 text-sm focus:border-blue-500 outline-none`}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Concessionária</label>
                                        <input
                                            type="text"
                                            name="concessionaire"
                                            value={formData.concessionaire || ''}
                                            onChange={handleChange}
                                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
                                            placeholder="Ex: ENEL, CPFL..."
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Status</label>
                                        <select
                                            name="status"
                                            value={formData.status || 'planned'}
                                            onChange={handleChange}
                                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
                                        >
                                            <option value="planned">Planejado</option>
                                            <option value="built">Executado (As-Built)</option>
                                            <option value="licensed">Licenciado</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {elementType === 'box' && (
                                <>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tipo</label>
                                        <select
                                            name="type"
                                            value={formData.type || 'cto'}
                                            onChange={(e) => {
                                                const newType = e.target.value;
                                                const defaultName = newType === 'cto' ? 'CTO-' : newType === 'ceo' ? 'CEO-' : newType === 'splitter' ? 'SPL-' : 'CX-';
                                                setFormData((prev: any) => ({
                                                    ...prev,
                                                    type: newType,
                                                    name: prev.name && (prev.name.startsWith('CTO-') || prev.name.startsWith('CEO-') || prev.name.startsWith('SPL-') || prev.name.startsWith('CX-'))
                                                        ? defaultName + prev.name.split('-')[1]
                                                        : prev.name || defaultName
                                                }));
                                            }}
                                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
                                        >
                                            <option value="cto">CTO (Atendimento)</option>
                                            <option value="ceo">CEO (Emenda)</option>
                                            <option value="splitter">Splitter (Divisão)</option>
                                            <option value="termination">Caixa de Terminação</option>
                                            <option value="junction">Caixa de Passagem/Outros</option>
                                        </select>
                                    </div>

                                    {(formData.type === 'cto' || !formData.type) && (
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Capacidade</label>
                                            <select
                                                name="capacity"
                                                value={formData.capacity || 16}
                                                onChange={handleChange}
                                                className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
                                            >
                                                <option value={8}>8 Portas</option>
                                                <option value={16}>16 Portas</option>
                                                <option value={24}>24 Portas</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className="mt-4 pt-4 border-t border-gray-800 flex flex-col gap-3">
                                        <button
                                            onClick={() => onOpenInternals && element && onOpenInternals(element.id)}
                                            className="w-full bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-900/50 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Activity size={16} />
                                            Ver Fusões (Interno)
                                        </button>

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
                                <div className="flex flex-col gap-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tubos (Looses)</label>
                                            <input
                                                type="number"
                                                name="looses"
                                                value={formData.looses || 1}
                                                onChange={handleChange}
                                                className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Ocupação (Fibras)</label>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        name="occupation"
                                                        value={formData.occupation || 0}
                                                        onChange={handleChange}
                                                        max={formData.fiberCount || 120}
                                                        className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
                                                    />
                                                    <span className="text-xs text-gray-500 font-mono">
                                                        / {formData.fiberCount || 1} FO ({(((formData.occupation || 0) / (formData.fiberCount || 1)) * 100).toFixed(0)}%)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${((formData.occupation || 0) / (formData.fiberCount || 1)) >= 1 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${Math.min(100, ((formData.occupation || 0) / (formData.fiberCount || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Observações</label>
                                        <textarea
                                            name="observations"
                                            value={formData.observations || ''}
                                            onChange={(e: any) => setFormData((prev: any) => ({ ...prev, observations: e.target.value }))}
                                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:border-blue-500 outline-none min-h-[60px] resize-none"
                                            placeholder="Notas adicionais..."
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tipo de Cabo</label>
                                        <select
                                            name="type"
                                            value={formData.type || 'drop'}
                                            onChange={handleChange}
                                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
                                        >
                                            <option value="drop">Cabo Drop (1F)</option>
                                            <option value="as80">Cabo AS80 (6-12F)</option>
                                            <option value="as120">Cabo AS120 (24F+)</option>
                                            <option value="underground">Cabo Subterrâneo</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Cabo em Produção?</label>
                                            <button
                                                onClick={() => setFormData((prev: any) => ({ ...prev, isLocked: !prev.isLocked }))}
                                                className={`w-full py-1.5 rounded border transition-all text-xs font-bold ${formData.isLocked
                                                    ? 'bg-red-600/20 border-red-600 text-red-500'
                                                    : 'bg-emerald-600/10 border-emerald-600/30 text-emerald-500'
                                                    }`}
                                            >
                                                {formData.isLocked ? 'SIM (TRAVADO)' : 'NÃO (EDITÁVEL)'}
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Comprimento Total</label>
                                            <div className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm font-mono flex justify-between items-center">
                                                <span>{((parseFloat(formData.length3D || 0) + parseFloat(formData.slack || 0) + (formData.reserves || []).reduce((acc: number, r: any) => acc + (parseFloat(r.length) || 0), 0))).toFixed(1)}</span>
                                                <span className="text-gray-500">m</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1 mt-2">
                                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-1 mb-2">Infraestruturas e Reservas</h4>
                                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                            {/* Start Point */}
                                            <div className="flex items-center justify-between bg-gray-900/40 p-1.5 rounded border border-gray-800/50">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[9px] text-gray-500 uppercase font-bold">Início ({formData.fromType})</span>
                                                    <span className="text-[10px] text-white truncate">{getElementName(formData.fromId, formData.fromType)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={getReserveValue(formData.fromId)}
                                                        onChange={(e) => handleReserveChange(formData.fromId, parseFloat(e.target.value) || 0)}
                                                        className="w-14 bg-gray-800 border-none rounded text-right text-[10px] text-white p-1 focus:ring-1 focus:ring-blue-500 outline-none"
                                                        placeholder="0m"
                                                        title="Reserva Inicial"
                                                    />
                                                    <span className="text-[9px] text-gray-600">m</span>
                                                </div>
                                            </div>

                                            {/* Intermediate Poles */}
                                            {(formData.poleIds || []).map((pId: string, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between bg-gray-800/30 p-1.5 rounded border border-gray-800/30">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[9px] text-blue-500/70 uppercase font-bold">Poste {idx + 1}</span>
                                                        <span className="text-[10px] text-gray-300 truncate">{getElementName(pId, 'pole')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            value={getReserveValue(pId)}
                                                            onChange={(e) => handleReserveChange(pId, parseFloat(e.target.value) || 0)}
                                                            className="w-14 bg-gray-800 border-none rounded text-right text-[10px] text-white p-1 focus:ring-1 focus:ring-blue-500 outline-none"
                                                            placeholder="0m"
                                                            title={`Reserva no Poste ${idx + 1}`}
                                                        />
                                                        <span className="text-[9px] text-gray-600">m</span>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* End Point */}
                                            <div className="flex items-center justify-between bg-gray-900/40 p-1.5 rounded border border-gray-800/50">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[9px] text-gray-500 uppercase font-bold">Fim ({formData.toType})</span>
                                                    <span className="text-[10px] text-white truncate">{getElementName(formData.toId, formData.toType)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={getReserveValue(formData.toId)}
                                                        onChange={(e) => handleReserveChange(formData.toId, parseFloat(e.target.value) || 0)}
                                                        className="w-14 bg-gray-800 border-none rounded text-right text-[10px] text-white p-1 focus:ring-1 focus:ring-blue-500 outline-none"
                                                        placeholder="0m"
                                                        title="Reserva Final"
                                                    />
                                                    <span className="text-[9px] text-gray-600">m</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Cor do Cabo</label>
                                        <div className="grid grid-cols-6 gap-2 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                            {[
                                                { name: 'Verde', color: '#009c3b' },
                                                { name: 'Amarelo', color: '#ffdf00' },
                                                { name: 'Branco', color: '#ffffff' },
                                                { name: 'Azul', color: '#0072bc' },
                                                { name: 'Vermelho', color: '#ff0000' },
                                                { name: 'Violeta', color: '#8a2be2' },
                                                { name: 'Marrom', color: '#964b00' },
                                                { name: 'Rosa', color: '#ffc0cb' },
                                                { name: 'Preto', color: '#000000' },
                                                { name: 'Cinza', color: '#808080' },
                                                { name: 'Laranja', color: '#ff7f00' },
                                                { name: 'Aqua', color: '#00ffff' }
                                            ].map((c) => (
                                                <button
                                                    key={c.name}
                                                    title={c.name}
                                                    onClick={() => {
                                                        const currentColors = formData.colors ? formData.colors.split(',').map((s: string) => s.trim()) : [];
                                                        if (currentColors.includes(c.name)) {
                                                            setFormData((prev: any) => ({ ...prev, colors: currentColors.filter((s: string) => s !== c.name).join(', ') }));
                                                        } else {
                                                            setFormData((prev: any) => ({ ...prev, colors: [...currentColors, c.name].join(', ') }));
                                                        }
                                                    }}
                                                    className={`w-full aspect-square rounded-md border-2 transition-all ${formData.colors?.includes(c.name) ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:border-gray-500'}`}
                                                    style={{ backgroundColor: c.color }}
                                                />
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            name="colors"
                                            value={formData.colors || ''}
                                            onChange={handleChange}
                                            className="mt-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs focus:border-blue-500 outline-none"
                                            placeholder="Cores selecionadas..."
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Estado de Implantação</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setFormData((prev: any) => ({ ...prev, status: 'planned' }))}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${formData.status === 'planned' || !formData.status ? 'bg-yellow-600/20 border-yellow-600 text-yellow-500 shadow-lg shadow-yellow-900/20' : 'bg-gray-800 border-gray-700 text-gray-500'}`}
                                            >
                                                Não implantado
                                            </button>
                                            <button
                                                onClick={() => setFormData((prev: any) => ({ ...prev, status: 'deployed' }))}
                                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${formData.status === 'deployed' ? 'bg-emerald-600/20 border-emerald-600 text-emerald-500 shadow-lg shadow-emerald-900/20' : 'bg-gray-800 border-gray-700 text-gray-500'}`}
                                            >
                                                Implantado
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Fibras (FO)</label>
                                            <input
                                                type="number"
                                                name="fiberCount"
                                                value={formData.fiberCount || 1}
                                                onChange={handleChange}
                                                className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Reserva (m)</label>
                                            <input
                                                type="number"
                                                name="slack"
                                                value={formData.slack || 0}
                                                onChange={handleChange}
                                                className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-1 opacity-60">
                                            <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Comprimento Plano</label>
                                            <div className="bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-gray-400 text-sm font-mono">
                                                {element.points ? (element.points.length * 10).toFixed(2) : '0.00'}m
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Comprimento 3D</label>
                                            <div className="flex gap-1">
                                                <input
                                                    type="number"
                                                    name="length3D"
                                                    value={formData.length3D || 0}
                                                    onChange={handleChange}
                                                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm focus:border-blue-500 outline-none font-mono"
                                                />
                                                <div className="bg-blue-600/20 text-blue-400 p-1.5 rounded border border-blue-600/30 flex items-center justify-center">
                                                    <span className="text-[10px] font-bold">G</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-800">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Iluminação de Fibra</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-gray-400">Pelo:</span>
                                                    <select
                                                        value={selectedFiber}
                                                        onChange={(e) => setSelectedFiber(parseInt(e.target.value))}
                                                        className="bg-gray-950 border border-gray-700 rounded text-xs text-white px-1 py-0.5 outline-none"
                                                    >
                                                        {Array.from({ length: formData.fiberCount || 1 }, (_, i) => i + 1).map(num => (
                                                            <option key={num} value={num}>{num}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => onTrace && element && onTrace(element.id, selectedFiber)}
                                                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-yellow-900/20 active:scale-95"
                                                >
                                                    <Zap size={16} fill="currentColor" />
                                                    Iluminar
                                                </button>
                                                <button
                                                    onClick={handleSave}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                                                >
                                                    Aplicar
                                                </button>
                                            </div>
                                        </div>
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
                                        <div className="bg-gray-800/30 rounded-lg overflow-hidden border border-gray-800 max-h-40 overflow-y-auto">
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
                                </>
                            ) : elementType === 'rbs' ? (
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
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            try {
                                                setLoading(true);
                                                await api.post(`/network-elements/rbs/${element.id}/poll`);
                                                onUpdate();
                                            } catch (err) { alert('Erro ao forçar atualização SNMP'); }
                                            finally { setLoading(false); }
                                        }}
                                        className="w-full bg-purple-900/30 hover:bg-purple-900/50 text-purple-400 border border-purple-900/50 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                        disabled={loading}
                                    >
                                        <Activity size={16} />
                                        Forçar Atualização
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-600 italic text-sm">
                                    <Activity size={40} className="mb-4 opacity-20" />
                                    <p>Engenharia não disponível.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/30 flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <Save size={16} />
                        Salvar
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <X size={16} />
                        Fechar
                    </button>
                    <button
                        onClick={() => {
                            if (onDelete && element && elementType) {
                                onDelete(element.id, elementType);
                            } else {
                                if (!confirm('Tem certeza que deseja excluir este item?')) return;
                                alert('Função de excluir não disponível.');
                            }
                        }}
                        disabled={loading}
                        className="bg-red-900/30 hover:bg-red-900/50 text-red-400 p-2 rounded-lg transition-all active:scale-95"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

                {/* Lightbox */}
                {selectedImage && (
                    <div
                        className="fixed inset-0 z-[3000] bg-black/90 flex items-center justify-center p-8 animate-in fade-in zoom-in duration-200 pointer-events-auto"
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
        </div>
    );
};
