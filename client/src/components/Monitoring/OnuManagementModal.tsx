import React, { useState, useEffect } from 'react';
import { Users, X, Filter, RotateCcw, Edit2, Signal, Cpu, CheckSquare, Square } from 'lucide-react';
import api from '../../services/api';

interface OnuManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialOltId?: string;
}

const OnuManagementModal: React.FC<OnuManagementModalProps> = ({ isOpen, onClose, initialOltId }) => {
    const [allOnus, setAllOnus] = useState<any[]>([]);
    const [filteredOnus, setFilteredOnus] = useState<any[]>([]);
    const [selectedPon, setSelectedPon] = useState<string | null>(null);
    const [selectedOnuIds, setSelectedOnuIds] = useState<string[]>([]);
    const [editingOnu, setEditingOnu] = useState<any>(null);
    const [onuName, setOnuName] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isLoadingOnus, setIsLoadingOnus] = useState(false);

    const fetchOnus = async (isLive = false) => {
        try {
            if (isLive) {
                setIsLoadingOnus(true);
                setAllOnus([]); // LIMPA A TELA IMEDIATAMENTE PARA MOSTRAR QUE ESTÁ RESETANDO
                setFilteredOnus([]);
                setSelectedPon(null);
            }
            const endpoint = initialOltId
                ? `/network-elements/olts/${initialOltId}/${isLive ? 'onus-live' : 'onus'}`
                : '/network-elements/onus';
            const res = await api.get(endpoint);
            setAllOnus(res.data);

            if (res.data.length > 0) {
                const uniquePons = Array.from(new Set(res.data.map((o: any) => String(o.ponPort).trim()))).sort() as string[];
                const initialPon = uniquePons.find(p => p === '1/1') || uniquePons[0];
                setSelectedPon(initialPon || '1/1');
            }
        } catch (error) {
            console.error('Error fetching ONUs:', error);
        } finally {
            if (isLive) setIsLoadingOnus(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchOnus(true); // First load is ALWAYS live for this OLT
        }
    }, [isOpen, initialOltId]);

    useEffect(() => {
        if (selectedPon) {
            setFilteredOnus(allOnus.filter((o: any) => String(o.ponPort).trim() === String(selectedPon).trim()));
        } else {
            setFilteredOnus(allOnus);
        }
        setSelectedOnuIds([]); // RESET SELECTION ON CHANGE
    }, [selectedPon, allOnus]);

    const toggleOnuSelection = (id: string) => {
        setSelectedOnuIds((prev: string[]) =>
            prev.includes(id) ? prev.filter((i: string) => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedOnuIds.length === filteredOnus.length) {
            setSelectedOnuIds([]);
        } else {
            setSelectedOnuIds(filteredOnus.map((o: any) => o.id));
        }
    };

    const handleBulkReboot = async () => {
        if (selectedOnuIds.length === 0) return;
        if (!confirm(`Deseja reiniciar ${selectedOnuIds.length} ONUs selecionadas?`)) return;

        setIsActionLoading(true);
        try {
            await api.post('/network-elements/onus/bulk/reboot', { ids: selectedOnuIds });
            alert(`${selectedOnuIds.length} comandos de reboot enviados.`);
            setSelectedOnuIds([]);
        } catch (error) {
            alert('Erro ao realizar reboot em massa.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleBulkAuthorize = async () => {
        if (selectedOnuIds.length === 0) return;
        if (!confirm(`Deseja autorizar ${selectedOnuIds.length} ONUs selecionadas?`)) return;

        setIsActionLoading(true);
        try {
            await api.post('/network-elements/onus/bulk/authorize', { ids: selectedOnuIds });
            alert(`${selectedOnuIds.length} ONUs autorizadas.`);
            await fetchOnus(true); // REFRESH DATA
            setSelectedOnuIds([]);
        } catch (error) {
            alert('Erro ao autorizar ONUs em massa.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRebootOnu = async (id: string) => {
        if (!confirm('Deseja realmente reiniciar esta ONU?')) return;
        setIsActionLoading(true);
        try {
            await api.post(`/network-elements/onus/${id}/reboot`);
            alert('Comando de reboot enviado com sucesso!');
        } catch (error) {
            alert('Erro ao reiniciar ONU.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleUpdateOnu = async () => {
        if (!editingOnu) return;
        setIsActionLoading(true);
        try {
            await api.patch(`/network-elements/onus/${editingOnu.id}`, { name: onuName });
            const updatedAll = allOnus.map((o: any) => o.id === editingOnu.id ? { ...o, name: onuName } : o);
            setAllOnus(updatedAll);
            setEditingOnu(null);
            setOnuName('');
            alert('Nome atualizado!');
        } catch (error) {
            alert('Erro ao atualizar nome.');
        } finally {
            setIsActionLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                <div className="bg-gray-900 w-full max-w-5xl h-[85vh] rounded-3xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600/20 rounded-2xl">
                                <Users size={24} className="text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Gestão de Clientes (ONUs)</h2>
                                <p className="text-sm text-gray-500">
                                    {isLoadingOnus ? (
                                        <span className="text-blue-400 animate-pulse flex items-center gap-2">
                                            <RotateCcw size={14} className="animate-spin" />
                                            Escaneando hardware (CLI+SNMP)... Isso pode levar até 45s.
                                        </span>
                                    ) : (
                                        'Visualização detalhada em tempo real direto da OLT'
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fetchOnus(true)}
                                disabled={isLoadingOnus}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-900/20 disabled:opacity-50"
                            >
                                <RotateCcw size={16} className={isLoadingOnus ? 'animate-spin' : ''} />
                                {isLoadingOnus ? 'Escaneando...' : 'Novo Scan (Discovery)'}
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-full transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Sidebar - PON Selection */}
                        <div className="w-64 border-r border-gray-800 bg-gray-900/30 p-4 overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-4 px-2">
                                <Filter size={14} /> Selecionar Porta PON
                            </div>
                            <div className="space-y-1">
                                {Array.from(new Set(allOnus.map((o: any) => String(o.ponPort).trim()))).sort().map((pon: any) => (
                                    <button
                                        key={pon}
                                        onClick={() => setSelectedPon(pon)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium ${String(selectedPon).trim() === String(pon).trim()
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                            }`}
                                    >
                                        <span className="font-mono text-sm">Porta {pon}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${String(selectedPon).trim() === String(pon).trim() ? 'bg-white/20' : 'bg-gray-800'
                                            }`}>
                                            {allOnus.filter((o: any) => String(o.ponPort).trim() === String(pon).trim()).length}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Content - ONU List */}
                        <div className="flex-1 flex flex-col bg-gray-950/20">
                            {/* Stats Summary for selected PON */}
                            <div className="p-6">
                                <div className="grid grid-cols-4 gap-4 mb-6">
                                    <div className="bg-gray-800/40 p-4 rounded-2xl border border-gray-700/50">
                                        <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Status da Porta</p>
                                        <div className="flex items-end justify-between">
                                            <span className="text-2xl font-bold text-white">{filteredOnus.length}</span>
                                            <span className="text-xs text-blue-400 font-bold uppercase">Total</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/40 p-4 rounded-2xl border border-gray-700/50">
                                        <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Online</p>
                                        <div className="flex items-end justify-between">
                                            <span className="text-2xl font-bold text-green-400">{filteredOnus.filter((o: any) => o.status === 'online').length}</span>
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] mb-2"></div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/40 p-4 rounded-2xl border border-gray-700/50">
                                        <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Offline</p>
                                        <div className="flex items-end justify-between">
                                            <span className="text-2xl font-bold text-red-400">{filteredOnus.filter((o: any) => o.status !== 'online').length}</span>
                                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] mb-2"></div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/40 p-4 rounded-2xl border border-gray-700/50">
                                        <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Média de Sinal</p>
                                        <div className="flex items-end justify-between">
                                            <span className="text-2xl font-bold text-indigo-400">
                                                {(() => {
                                                    const onlineOnus = filteredOnus.filter((o: any) => o.status === 'online' && Number(o.signalLevel) < 0);
                                                    if (onlineOnus.length === 0) return '0';
                                                    const avg = onlineOnus.reduce((acc: number, o: any) => acc + Number(o.signalLevel), 0) / onlineOnus.length;
                                                    return avg.toFixed(1);
                                                })()}
                                                <span className="text-sm font-normal ml-1">dBm</span>
                                            </span>
                                            <Signal size={16} className="text-indigo-500 mb-2" />
                                        </div>
                                    </div>
                                </div>

                                {/* Bulk Actions Bar */}
                                {selectedOnuIds.length > 0 && (
                                    <div className="flex items-center justify-between p-4 bg-blue-600/10 border border-blue-500/30 rounded-2xl mb-6 animate-in slide-in-from-top-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-600 rounded-lg">
                                                <CheckSquare size={16} className="text-white" />
                                            </div>
                                            <span className="text-sm text-blue-100 font-bold">
                                                {selectedOnuIds.length} selecionados
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleBulkAuthorize}
                                                disabled={isActionLoading}
                                                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-blue-400 rounded-xl font-bold text-xs border border-gray-700 transition-all disabled:opacity-50"
                                            >
                                                Autorizar em Massa
                                            </button>
                                            <button
                                                onClick={handleBulkReboot}
                                                disabled={isActionLoading}
                                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50 shadow-lg shadow-amber-900/40"
                                            >
                                                Reiniciar em Massa
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Table */}
                            <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-800/50 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800">
                                            <tr>
                                                <th className="px-6 py-4 w-12">
                                                    <button
                                                        onClick={toggleSelectAll}
                                                        className={`p-1 rounded-md transition-colors ${selectedOnuIds.length === filteredOnus.length && filteredOnus.length > 0 ? 'text-blue-500 bg-blue-500/10' : 'text-gray-600 hover:bg-gray-700'}`}
                                                    >
                                                        {selectedOnuIds.length === filteredOnus.length && filteredOnus.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                                                    </button>
                                                </th>
                                                <th className="px-6 py-4">Sinal / Status</th>
                                                <th className="px-6 py-4">Nome do Cliente</th>
                                                <th className="px-6 py-4">Modelo / Serial</th>
                                                <th className="px-6 py-4 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800/50">
                                            {filteredOnus.map((onu: any) => (
                                                <tr key={onu.id} className={`hover:bg-gray-800/20 transition-all group ${selectedOnuIds.includes(onu.id) ? 'bg-blue-600/5' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => toggleOnuSelection(onu.id)}
                                                            className={`p-1 rounded-md transition-colors ${selectedOnuIds.includes(onu.id) ? 'text-blue-500 bg-blue-500/10' : 'text-gray-700 hover:bg-gray-800 opacity-0 group-hover:opacity-100'}`}
                                                        >
                                                            {selectedOnuIds.includes(onu.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2.5 h-2.5 rounded-full ${onu.status === 'online' ? 'bg-green-500' : 'bg-red-500'} shadow-lg`} />
                                                            <span className={`font-mono font-bold text-sm ${(Number(onu.signalLevel) || 0) > -25 ? 'text-green-400' : (Number(onu.signalLevel) || 0) > -30 ? 'text-yellow-400' : 'text-red-400'
                                                                }`}>
                                                                {(Number(onu.signalLevel) || 0).toFixed(1)} <span className="text-[10px] opacity-60">dBm</span>
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-white font-bold text-sm">{onu.name || onu.serialNumber || '---'}</div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-[10px] text-gray-500 font-mono uppercase">{onu.olt?.name || 'OLT Principal'}</div>
                                                            {onu.isAuthorized && (
                                                                <span className="text-[8px] bg-green-500/20 text-green-500 px-1 rounded border border-green-500/30 font-black tracking-tighter uppercase">Authorized</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-gray-300 text-xs font-medium">{onu.serialNumber}</div>
                                                        <div className="flex items-center gap-1 text-[10px] text-gray-600 uppercase font-black">
                                                            <Cpu size={10} /> {onu.model || 'ONU Standard'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                            <button
                                                                onClick={() => { setEditingOnu(onu); setOnuName(onu.name || ''); }}
                                                                className="p-2 hover:bg-gray-800 text-gray-500 hover:text-white rounded-lg transition-all"
                                                                title="Editar Nome"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRebootOnu(onu.id)}
                                                                className="p-2 hover:bg-gray-800 text-gray-500 hover:text-amber-500 rounded-lg transition-all"
                                                                title="Reiniciar ONU"
                                                            >
                                                                <RotateCcw size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredOnus.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="py-20 text-center text-gray-600 italic">
                                                        Nenhum cliente detectado nesta porta PON.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inline ONU Rename Modal */}
            {editingOnu && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-700 p-6 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-white mb-4">Renomear Cliente</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase mb-1 block">Serial Number</label>
                                <div className="text-sm text-gray-400 font-mono bg-gray-950 p-2 rounded-lg border border-gray-800">{editingOnu.serialNumber}</div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase mb-1 block">Novo Nome</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none transition-all"
                                    value={onuName}
                                    onChange={(e) => setOnuName(e.target.value)}
                                    placeholder="Ex: ONU-NOVO-CLIENTE"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setEditingOnu(null)}
                                    className="flex-1 py-3 text-gray-500 hover:text-white font-bold uppercase text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpdateOnu}
                                    disabled={isActionLoading}
                                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase text-xs transition-all disabled:opacity-50"
                                >
                                    {isActionLoading ? 'Salvando...' : 'Atualizar Identificação'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default OnuManagementModal;
