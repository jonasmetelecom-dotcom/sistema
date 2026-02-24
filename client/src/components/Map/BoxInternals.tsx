import { useState, useEffect } from 'react';
import { X, Cable, Split as SplitIcon, Link, Trash2, FileDown, Camera, Image as ImageIcon, Plus, Activity } from 'lucide-react';
import api from '../../services/api';
import { getFiberColor, getFiberName } from '../../utils/fiberColors';
import { generateFusionDiagram } from '../../utils/FusionDiagramGenerator';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../contexts/AuthContext';

interface BoxInternalsProps {
    boxId: string;
    onClose: () => void;
}

interface FiberPoint {
    id: string; // cableId or splitterId
    type: 'cable' | 'splitter';
    fiberIndex: number; // 1-based
    side: 'left' | 'right'; // left (input) or right (output)
    x?: number;
    y?: number;
}

export const BoxInternals = ({ boxId, onClose }: BoxInternalsProps) => {
    const { user } = useAuth();
    // Removed unused loading state
    const [data, setData] = useState<{ splitters: any[], fusions: any[], incomingCables: any[], outgoingCables: any[], destinationTypes?: Record<string, string>, images?: string[], ctoCustomers?: any[], poleId?: string } | null>(null);
    const [selectedOrigin, setSelectedOrigin] = useState<FiberPoint | null>(null);
    const [boxDetails, setBoxDetails] = useState<any>(null); // Store full box details
    const [projectId, setProjectId] = useState<string | null>(null);
    const [newSplitterConfig, setNewSplitterConfig] = useState({
        type: '1:8',
        connectorType: 'APC', // APC, UPC, None
        structure: 'balanced'
    });
    const [exporting, setExporting] = useState(false);
    const [activeTab, setActiveTab] = useState<'fusions' | 'photos'>('fusions');
    const [uploading, setUploading] = useState(false);
    const [customerDialog, setCustomerDialog] = useState<{ isOpen: boolean, splitterId: string, portIndex: number, customerId?: string, name: string, observation: string } | null>(null);

    // Refs for calculating line positions (unused for now)
    // const fiberRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const fetchData = async () => {
        console.log('BoxInternals: Fetching data for box', boxId);
        try {
            // Fetch box details to know type
            const boxResponse = await api.get(`/network-elements/boxes/${boxId}`);
            if (boxResponse.data) {
                setBoxDetails(boxResponse.data);
                setProjectId(boxResponse.data.projectId);
                // Set default config based on box type
                if (boxResponse.data.type === 'cto') {
                    setNewSplitterConfig(prev => ({ ...prev, connectorType: 'APC', type: '1:8' }));
                } else {
                    setNewSplitterConfig(prev => ({ ...prev, connectorType: 'None', type: '1:2' }));
                }
            }

            console.log('BoxInternals: Calling internals endpoint...');
            const internalsResponse = await api.get(`/network-elements/box/${boxId}/internals`);
            console.log('BoxInternals: Data received', internalsResponse.data);
            setData(internalsResponse.data);
        } catch (error) {
            console.error('Error fetching box internals:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [boxId]);

    const handleExportPDF = async () => {
        if (!data || !boxDetails) return;
        setExporting(true);
        try {
            const doc = new jsPDF();

            // Combine cables
            const allCables = [...(data.incomingCables || []), ...(data.outgoingCables || [])];
            // Sort by name
            allCables.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            generateFusionDiagram(
                doc,
                { ...boxDetails, poleId: data.poleId },
                allCables,
                data.fusions,
                data.splitters
            );

            doc.save(`Diagrama_${boxDetails.name || boxDetails.type}_${boxId.slice(0, 4)}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Erro ao gerar PDF');
        } finally {
            setExporting(false);
        }
    };

    const handleFiberClick = async (point: FiberPoint) => {
        if (!selectedOrigin) {
            // ... (rest of function)
            // New selection
            setSelectedOrigin(point);
        } else {
            // We have an origin, try to fuse
            if (selectedOrigin.id === point.id && selectedOrigin.fiberIndex === point.fiberIndex && selectedOrigin.type === point.type) {
                setSelectedOrigin(null); // Clicked same point -> Deselect
                return;
            }

            // Determine Start and End automatically regardless of click order
            let origin = selectedOrigin;
            let destination = point;

            // Standard Flow Logic:
            // Sources (Left side): Incoming Cable, Splitter Output
            // Sinks (Right side): Outgoing Cable, Splitter Input

            const isSource = (p: FiberPoint) => (p.type === 'cable' && p.side === 'left') || (p.type === 'splitter' && p.side === 'right');
            const isSink = (p: FiberPoint) => (p.type === 'cable' && p.side === 'right') || (p.type === 'splitter' && p.side === 'left');

            if (isSource(destination) && isSink(origin)) {
                // User clicked Sink first, then Source. Swap so Origin is Source.
                [origin, destination] = [destination, origin];
            }

            if (!projectId) {
                alert('Project ID not loaded');
                return;
            }

            // check for existing fusion (either as source or sink) to prevent duplication/loops
            const isOriginConnected = data?.fusions.some((f: any) =>
                (f.originId === origin.id && f.originFiberIndex === origin.fiberIndex) ||
                (f.destinationId === origin.id && f.destinationFiberIndex === origin.fiberIndex)
            );

            const isDestConnected = data?.fusions.some((f: any) =>
                (f.originId === destination.id && f.originFiberIndex === destination.fiberIndex) ||
                (f.destinationId === destination.id && f.destinationFiberIndex === destination.fiberIndex)
            );

            if (isOriginConnected || isDestConnected) {
                alert('Uma das fibras selecionadas já possui uma conexão ativa. Remova a conexão existente antes de criar uma nova.');
                setSelectedOrigin(null);
                return;
            }

            // Create Fusion
            try {
                await api.post('/network-elements/fusions', {
                    projectId,
                    boxId,
                    originId: origin.id,
                    originType: origin.type,
                    originFiberIndex: origin.fiberIndex,
                    destinationId: destination.id,
                    destinationType: destination.type,
                    destinationFiberIndex: destination.fiberIndex,
                    color: getFiberColor(origin.fiberIndex), // Use origin color by default
                    userResponsible: user?.name || 'Sistema'
                });
                setSelectedOrigin(null);
                fetchData();
            } catch (error) {
                console.error('Error fusing:', error);
                alert('Erro ao conectar fibras');
                setSelectedOrigin(null);
            }
        }
    };

    const handleDeleteFusion = async (id: string) => {
        if (!confirm('Desfazer conexão?')) return;
        try {
            await api.delete(`/network-elements/fusions/${id}`);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddSplitter = async () => {
        if (!projectId) {
            alert('Project ID not loaded');
            return;
        }
        try {
            await api.post('/network-elements/splitters', {
                boxId,
                type: newSplitterConfig.type,
                connectorType: newSplitterConfig.connectorType,
                structure: newSplitterConfig.structure,
                projectId
            });
            fetchData();
        } catch (error) {
            console.error('Error creating splitter:', error);
            alert('Erro ao adicionar splitter');
        }
    };

    const handleSaveCustomer = async () => {
        if (!customerDialog || !projectId) return;
        try {
            const customerData = {
                boxId,
                splitterId: customerDialog.splitterId,
                portIndex: customerDialog.portIndex,
                name: customerDialog.name,
                observation: customerDialog.observation,
                externalId: (customerDialog as any).externalId,
                status: (customerDialog as any).status || 'active',
                description: (customerDialog as any).description,
                projectId
            };

            if (customerDialog.customerId) {
                await api.patch(`/network-elements/cto-customers/${customerDialog.customerId}`, customerData);
            } else {
                await api.post('/network-elements/cto-customers', customerData);
            }
            setCustomerDialog(null);
            fetchData();
        } catch (error) {
            console.error('Error saving customer:', error);
            alert('Erro ao salvar cliente');
        }
    };

    const handleDeleteCustomer = async (id: string) => {
        if (!confirm('Excluir registro do cliente?')) return;
        try {
            await api.delete(`/network-elements/cto-customers/${id}`);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    if (!boxId) return null;

    return (
        <div className="fixed inset-0 z-[1100] bg-black/80 flex items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
            <div className="bg-gray-900 w-full h-full max-w-7xl rounded-none sm:rounded-2xl border-x sm:border border-gray-700 shadow-2xl flex flex-col overflow-hidden text-white">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-950">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-900/30 rounded-lg">
                            <Link size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-3">
                                Editor de Fusões ({(boxDetails?.type || 'cto').toUpperCase()})
                                {(() => {
                                    const isCTO = (boxDetails?.type || 'cto').toUpperCase().includes('CTO');
                                    const capacity = boxDetails?.capacity || 16;

                                    if (isCTO) {
                                        const occupiedPorts = data?.ctoCustomers?.length || 0;
                                        return (
                                            <span className={`text-xs px-2 py-0.5 rounded border border-opacity-30 ${occupiedPorts >= capacity ? 'bg-red-600/20 text-red-500 border-red-600' : 'bg-blue-600/20 text-blue-400 border-blue-600'}`}>
                                                Clientes: {occupiedPorts}/{capacity}
                                            </span>
                                        );
                                    }

                                    const usedPorts = data?.splitters.reduce((acc, s) => acc + (parseInt(s.type.split(':')[1]) || 0), 0) || 0;
                                    if (usedPorts > capacity) {
                                        return (
                                            <span className="text-xs bg-red-600/20 text-red-500 border border-red-600/30 px-2 py-0.5 rounded animate-pulse">
                                                ALERTA: CAPACIDADE EXCEDIDA ({usedPorts}/{capacity})
                                            </span>
                                        );
                                    } else if (usedPorts > 0) {
                                        return (
                                            <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30 px-2 py-0.5 rounded">
                                                Ocupação Fibras: {usedPorts}/{capacity}
                                            </span>
                                        );
                                    }
                                    return null;
                                })()}
                            </h2>
                            <p className="text-xs text-gray-400 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Box ID: {boxId.slice(0, 8)} | Capacidade: {boxDetails?.capacity || 16} Portas
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportPDF}
                            disabled={exporting}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors text-sm font-medium border border-red-600/30"
                            title="Baixar Diagrama PDF"
                        >
                            {exporting ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <FileDown size={18} />}
                            <span className="hidden sm:inline">Exportar PDF</span>
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-950 px-4 border-b border-gray-800">
                    <button
                        onClick={() => setActiveTab('fusions')}
                        className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'fusions' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Link size={16} /> Mapa de Fusões
                    </button>
                    <button
                        onClick={() => setActiveTab('photos')}
                        className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'photos' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Camera size={16} /> Fotos de Campo
                    </button>
                </div>

                {/* Visual Editor Area / Photos Area */}
                <div className="flex-1 flex overflow-hidden relative overflow-x-auto custom-scrollbar">
                    <div className="min-w-[900px] lg:min-w-0 flex-1 flex h-full">
                        {activeTab === 'fusions' ? (
                            <>

                                {/* LEFT COLUMN: INCOMING */}
                                <div className="w-1/3 border-r border-gray-800 flex flex-col bg-gray-900/50 overflow-y-auto custom-scrollbar">
                                    <div className="p-3 bg-gray-950/50 sticky top-0 backdrop-blur z-10 border-b border-gray-800">
                                        <h3 className="font-semibold text-sm text-gray-400 flex items-center gap-2">
                                            <Cable size={14} /> Cabos de Entrada (Esquerda)
                                        </h3>
                                    </div>
                                    <div className="p-4 space-y-6">
                                        {data?.incomingCables?.map(cable => (
                                            <div key={cable.id} className="bg-gray-800/40 rounded-lg border border-gray-700 overflow-hidden">
                                                <div className="px-3 py-2 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                                                    <span className="text-xs font-mono text-gray-300">Cabo {cable.id.slice(0, 4)}</span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await api.patch(`/network-elements/cables/${cable.id}`, { fiberCount: Math.max(1, (cable.fiberCount || 1) - 1) });
                                                                    fetchData();
                                                                } catch (err) { console.error(err); }
                                                            }}
                                                            className="w-5 h-5 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-gray-300 text-xs shadow"
                                                        >-</button>
                                                        <span className="text-xs text-blue-400 font-bold">{cable.fiberCount}FO</span>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await api.patch(`/network-elements/cables/${cable.id}`, { fiberCount: (cable.fiberCount || 0) + 1 });
                                                                    fetchData();
                                                                } catch (err) { console.error(err); }
                                                            }}
                                                            className="w-5 h-5 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-gray-300 text-xs shadow"
                                                        >+</button>
                                                    </div>
                                                </div>
                                                <div className="p-2 space-y-1">
                                                    {Array.from({ length: cable.fiberCount }).map((_, i) => {
                                                        const fiberIdx = i + 1;
                                                        const isConnected = data.fusions.some(f =>
                                                            (f.originId === cable.id && f.originFiberIndex === fiberIdx) ||
                                                            (f.destinationId === cable.id && f.destinationFiberIndex === fiberIdx)
                                                        );
                                                        const isSelected = selectedOrigin?.id === cable.id && selectedOrigin?.fiberIndex === fiberIdx;

                                                        return (
                                                            <div
                                                                key={`${cable.id}-${fiberIdx}`}
                                                                onClick={() => handleFiberClick({ id: cable.id, type: 'cable', fiberIndex: fiberIdx, side: 'left' })}
                                                                className={`
                                                        flex items-center gap-3 p-1.5 rounded cursor-pointer transition-all
                                                        ${isSelected ? 'bg-blue-500/20 border border-blue-500' : 'hover:bg-white/5 border border-transparent'}
                                                    `}
                                                            >
                                                                {/* Fiber Color Dot */}
                                                                <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: getFiberColor(fiberIdx) }}></div>
                                                                <span className="text-xs text-gray-300 flex-1">Fibra {fiberIdx} - {getFiberName(fiberIdx)}</span>

                                                                {/* Connector Point */}
                                                                <div className={`w-3 h-3 rounded-full border-2 ${isConnected ? 'bg-green-500 border-green-500' : 'bg-transparent border-gray-600'}`}></div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* CENTER: SPLITTERS & CONNECTIONS */}
                                <div className="flex-1 bg-black/20 overflow-y-auto custom-scrollbar flex flex-col border-x border-gray-800">
                                    {/* SPLITTERS SECTION */}
                                    <div className="bg-gray-900/80 border-b border-gray-800 pb-4">
                                        <div className="p-3 bg-gray-950/50 sticky top-0 backdrop-blur z-10 border-b border-gray-800 mb-2">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="font-semibold text-sm text-gray-400 flex items-center gap-2">
                                                    <SplitIcon size={14} /> Splitters
                                                </h3>
                                                <button
                                                    onClick={handleAddSplitter}
                                                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded shadow flex items-center gap-1"
                                                >
                                                    + Adicionar Splitter
                                                </button>
                                            </div>

                                            {/* Controls based on Box Type */}
                                            <div className="flex gap-4 text-xs bg-gray-800/50 p-2 rounded items-center flex-wrap">
                                                {/* Type Selector */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500">Tipo:</span>
                                                    <select
                                                        value={newSplitterConfig.type}
                                                        onChange={(e) => setNewSplitterConfig(p => ({ ...p, type: e.target.value }))}
                                                        className="bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                                                    >
                                                        <option value="1:2">1:2</option>
                                                        <option value="1:4">1:4</option>
                                                        <option value="1:8">1:8</option>
                                                        <option value="1:16">1:16</option>
                                                        <option value="1:32">1:32</option>
                                                    </select>
                                                </div>

                                                {(boxDetails?.type || 'cto') === 'cto' ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-500">Conector:</span>
                                                        <div className="flex bg-gray-800 rounded p-0.5 border border-gray-700">
                                                            <button
                                                                onClick={() => setNewSplitterConfig(p => ({ ...p, connectorType: 'APC' }))}
                                                                className={`px-2 py-0.5 rounded ${newSplitterConfig.connectorType === 'APC' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                            >APC (Verde)</button>
                                                            <button
                                                                onClick={() => setNewSplitterConfig(p => ({ ...p, connectorType: 'UPC' }))}
                                                                className={`px-2 py-0.5 rounded ${newSplitterConfig.connectorType === 'UPC' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                                            >UPC (Azul)</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-500">Estrutura:</span>
                                                        <select
                                                            value={newSplitterConfig.structure}
                                                            onChange={(e) => setNewSplitterConfig(p => ({ ...p, structure: e.target.value }))}
                                                            className="bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white"
                                                        >
                                                            <option value="balanced">Balanceado</option>
                                                            <option value="unbalanced">Desbalanceado</option>
                                                        </select>
                                                        <span className="text-gray-500 ml-2">Conector:</span>
                                                        <span className="text-gray-400 italic">Nenhum (Fusão)</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="px-4 space-y-4">
                                            {data?.splitters.map(splitter => {
                                                const capacity = parseInt(splitter.type.split(':')[1]) || 8;
                                                const inputConnected = data?.fusions?.some((f: any) => f.destinationId === splitter.id && f.destinationType === 'splitter');

                                                // Visual color based on connector
                                                const connectorColor = splitter.connectorType === 'APC' ? 'bg-green-500 border-green-500' :
                                                    splitter.connectorType === 'UPC' ? 'bg-blue-500 border-blue-500' :
                                                        'bg-gray-500 border-gray-500'; // None/Fusion

                                                const connectorRing = splitter.connectorType === 'APC' ? 'ring-green-500' :
                                                    splitter.connectorType === 'UPC' ? 'ring-blue-500' :
                                                        'ring-gray-500';

                                                return (
                                                    <div key={splitter.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-mono text-gray-400">Splitter {splitter.type}</span>
                                                                {splitter.structure === 'unbalanced' && <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1 rounded">Desbal.</span>}
                                                                {splitter.connectorType && splitter.connectorType !== 'None' && (
                                                                    <span className={`text-[10px] px-1 rounded ${splitter.connectorType === 'APC' ? 'bg-green-900/50 text-green-300' : 'bg-blue-900/50 text-blue-300'}`}>
                                                                        {splitter.connectorType}
                                                                    </span>
                                                                )}
                                                                <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">ID: {splitter.id.slice(0, 4)}</span>
                                                            </div>
                                                            <button
                                                                onClick={async () => {
                                                                    if (confirm('Excluir este splitter?')) {
                                                                        try {
                                                                            await api.delete(`/network-elements/splitters/${splitter.id}`);
                                                                            fetchData();
                                                                        } catch (error) { console.error(error); }
                                                                    }
                                                                }}
                                                                className="text-gray-500 hover:text-red-400"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>

                                                        <div className="flex justify-between items-center gap-8">
                                                            {/* INPUT */}
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="text-[10px] text-gray-500">IN</span>
                                                                <div
                                                                    onClick={() => handleFiberClick({ id: splitter.id, type: 'splitter', fiberIndex: 1, side: 'left' })}
                                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110
                                                            ${selectedOrigin?.id === splitter.id && selectedOrigin?.fiberIndex === 1 && selectedOrigin?.side === 'left' ? `border-white ring-2 ${connectorRing}` : ''}
                                                            ${inputConnected ? 'bg-white border-white' : connectorColor}
                                                        `}
                                                                >
                                                                    {splitter.connectorType === 'None' && <div className="w-1.5 h-1.5 bg-black/50 rounded-full"></div>}
                                                                </div>
                                                            </div>

                                                            {/* BODY */}
                                                            <div className="h-px bg-gray-600 flex-1 relative">
                                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1 bg-gray-800 border border-gray-600 rounded">
                                                                    <SplitIcon size={12} className="text-gray-400" />
                                                                </div>
                                                            </div>

                                                            {/* OUTPUTS */}
                                                            <div className="grid grid-cols-4 gap-2">
                                                                {Array.from({ length: capacity }).map((_, i) => {
                                                                    const idx = i + 1;
                                                                    const fusion = data?.fusions?.find((f: any) => f.originId === splitter.id && f.originFiberIndex === idx);
                                                                    const isConnected = !!fusion;
                                                                    const isSelected = selectedOrigin?.id === splitter.id && selectedOrigin?.fiberIndex === idx;

                                                                    let destinationType = null;
                                                                    if (fusion && fusion.destinationType === 'cable') {
                                                                        const cable = data?.outgoingCables?.find((c: any) => c.id === fusion.destinationId);
                                                                        if (cable && cable.toType === 'box' && cable.toId && data.destinationTypes) {
                                                                            destinationType = data.destinationTypes[cable.toId];
                                                                        }
                                                                    }

                                                                    // Color based on destination
                                                                    let portColor = connectorColor;
                                                                    if (isConnected) {
                                                                        if (destinationType === 'cto') portColor = 'bg-green-500 border-green-500';
                                                                        else if (destinationType === 'splice_closure') portColor = 'bg-blue-500 border-blue-500';
                                                                        else portColor = 'bg-orange-500 border-orange-500';
                                                                    }

                                                                    const customer = data?.ctoCustomers?.find((c: any) => c.splitterId === splitter.id && parseInt(c.portIndex) === idx);

                                                                    const getStatusColor = (status: string) => {
                                                                        switch (status) {
                                                                            case 'reserved': return 'bg-yellow-500 border-yellow-600';
                                                                            case 'blocked': return 'bg-red-500 border-red-600';
                                                                            case 'damaged': return 'bg-purple-600 border-purple-700';
                                                                            case 'free': return 'bg-gray-600 border-gray-700';
                                                                            default: return 'bg-orange-500 border-orange-600'; // active
                                                                        }
                                                                    };

                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setCustomerDialog({
                                                                                    isOpen: true,
                                                                                    splitterId: splitter.id,
                                                                                    portIndex: idx,
                                                                                    customerId: customer?.id,
                                                                                    name: customer?.name || '',
                                                                                    observation: customer?.observation || ''
                                                                                });
                                                                            }}
                                                                            className={`w-6 h-6 rounded-md border-2 cursor-pointer transition-all hover:scale-110 relative group flex items-center justify-center
                                                                    ${isSelected ? `border-white ring-2 ${connectorRing}` : ''}
                                                                    ${customer ? `${getStatusColor(customer.status)} shadow-[0_0_8px_rgba(249,115,22,0.5)]` : portColor}
                                                                `}
                                                                            title={customer ? `Cliente: ${customer.name}\nStatus: ${customer.status}\n${customer.observation || ''}` : `Porta ${idx} - Livre`}
                                                                        >
                                                                            {customer ? (
                                                                                <span className="text-[10px] font-black text-white uppercase leading-none drop-shadow-sm">
                                                                                    {customer.name.substring(0, 2)}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-[8px] text-white/40 opacity-0 group-hover:opacity-100">{idx}</span>
                                                                            )}

                                                                            {/* Connector Port Index (Small) */}
                                                                            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] text-gray-500">{idx}</span>

                                                                            {!customer && (
                                                                                <div
                                                                                    className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleFiberClick({ id: splitter.id, type: 'splitter', fiberIndex: idx, side: 'right' });
                                                                                    }}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {(!data?.splitters || data.splitters.length === 0) && (
                                                <div className="text-xs text-center text-gray-600 py-2 border-2 border-dashed border-gray-800 rounded">
                                                    Nenhum splitter nesta caixa
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* FUSIONS LIST SECTION */}
                                    <div className="p-3 bg-gray-950/50 sticky top-0 backdrop-blur z-10 border-b border-gray-800">
                                        <h3 className="font-semibold text-sm text-gray-400 flex items-center gap-2">
                                            <Link size={14} /> Fusões Realizadas
                                        </h3>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 gap-2">
                                        {data?.fusions.length === 0 && (
                                            <div className="text-center text-gray-600 mt-10">
                                                <SplitIcon size={48} className="mx-auto mb-2 opacity-20" />
                                                <p>Nenhuma fusão feita.</p>
                                                <p className="text-xs">Selecione uma fibra de um lado e do outro para conectar.</p>
                                            </div>
                                        )}
                                        {data?.fusions.map((fusion: any) => (
                                            <div key={fusion.id} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700 group">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getFiberColor(fusion.originFiberIndex) }}></div>
                                                    <span className="text-gray-400">Orig:</span>
                                                    <span className="font-mono text-white">{fusion.originId.slice(0, 4)} #{fusion.originFiberIndex}</span>
                                                </div>

                                                <div className="h-px bg-gray-600 flex-1 mx-4 relative">
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 p-1 rounded-full border border-gray-600">
                                                        <Link size={10} className="text-gray-400" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-gray-400">Dest:</span>
                                                    <span className="font-mono text-white">{fusion.destinationId.slice(0, 4)} #{fusion.destinationFiberIndex}</span>
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getFiberColor(fusion.destinationFiberIndex) }}></div>
                                                </div>

                                                <button
                                                    onClick={() => handleDeleteFusion(fusion.id)}
                                                    className="ml-3 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: OUTGOING */}
                                <div className="w-1/3 border-l border-gray-800 flex flex-col bg-gray-900/50 overflow-y-auto custom-scrollbar">
                                    <div className="p-3 bg-gray-950/50 sticky top-0 backdrop-blur z-10 border-b border-gray-800">
                                        <h3 className="font-semibold text-sm text-gray-400 flex items-center gap-2">
                                            <Cable size={14} /> Cabos de Saída (Direita)
                                        </h3>
                                    </div>
                                    <div className="p-4 space-y-6">
                                        {data?.outgoingCables?.map(cable => (
                                            <div key={cable.id} className="bg-gray-800/40 rounded-lg border border-gray-700 overflow-hidden">
                                                <div className="px-3 py-2 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                                                    <span className="text-xs font-mono text-gray-300">Cabo {cable.id.slice(0, 4)}</span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await api.patch(`/network-elements/cables/${cable.id}`, { fiberCount: Math.max(1, (cable.fiberCount || 1) - 1) });
                                                                    fetchData();
                                                                } catch (err) { console.error(err); }
                                                            }}
                                                            className="w-5 h-5 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-gray-300 text-xs shadow"
                                                        >-</button>
                                                        <span className="text-xs text-emerald-400 font-bold">{cable.fiberCount}FO</span>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await api.patch(`/network-elements/cables/${cable.id}`, { fiberCount: (cable.fiberCount || 0) + 1 });
                                                                    fetchData();
                                                                } catch (err) { console.error(err); }
                                                            }}
                                                            className="w-5 h-5 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-gray-300 text-xs shadow"
                                                        >+</button>
                                                    </div>
                                                </div>
                                                <div className="p-2 space-y-1">
                                                    {Array.from({ length: cable.fiberCount }).map((_, i) => {
                                                        const fiberIdx = i + 1;
                                                        const isConnected = data?.fusions?.some((f: any) =>
                                                            (f.originId === cable.id && f.originFiberIndex === fiberIdx) ||
                                                            (f.destinationId === cable.id && f.destinationFiberIndex === fiberIdx)
                                                        );
                                                        const isSelected = selectedOrigin?.id === cable.id && selectedOrigin?.fiberIndex === fiberIdx;

                                                        return (
                                                            <div
                                                                key={`${cable.id}-${fiberIdx}`}
                                                                onClick={() => handleFiberClick({ id: cable.id, type: 'cable', fiberIndex: fiberIdx, side: 'right' })}
                                                                className={`
                                                        flex items-center gap-3 p-1.5 rounded cursor-pointer transition-all flex-row-reverse
                                                        ${isSelected ? 'bg-blue-500/20 border border-blue-500' : 'hover:bg-white/5 border border-transparent'}
                                                    `}
                                                            >
                                                                {/* Fiber Color Dot */}
                                                                <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: getFiberColor(fiberIdx) }}></div>
                                                                <span className="text-xs text-gray-300 flex-1 text-right">Fibra {fiberIdx} - {getFiberName(fiberIdx)}</span>

                                                                {/* Connector Point */}
                                                                <div className={`w-3 h-3 rounded-full border-2 ${isConnected ? 'bg-green-500 border-green-500' : 'bg-transparent border-gray-600'}`}></div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/20">
                                <div className="max-w-4xl mx-auto">
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h3 className="text-2xl font-bold flex items-center gap-3">
                                                <ImageIcon className="text-blue-400" /> Galeria de Fotos
                                            </h3>
                                            <p className="text-gray-400 text-sm">Evidências técnicas e fotos da instalação física.</p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                const url = prompt('Cole aqui a URL da imagem da evidência:');
                                                if (url) {
                                                    setUploading(true);
                                                    try {
                                                        await api.post(`/network-elements/boxes/${boxId}/images`, { imageUrl: url });
                                                        fetchData(); // Refresh to show new image
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert('Erro ao salvar imagem');
                                                    } finally {
                                                        setUploading(false);
                                                    }
                                                }
                                            }}
                                            disabled={uploading}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                                        >
                                            {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={18} />}
                                            Adicionar Foto
                                        </button>
                                    </div>

                                    {(!data?.images || data.images.length === 0) ? (
                                        <div className="flex flex-col items-center justify-center py-20 bg-gray-800/20 border-2 border-dashed border-gray-700 rounded-2xl">
                                            <Camera size={64} className="text-gray-600 mb-4" />
                                            <p className="text-gray-400">Nenhuma foto anexada a esta caixa.</p>
                                            <p className="text-xs text-gray-500 mt-1">Use o botão acima para documentar o trabalho de campo.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                            {(data as any).images.map((img: string, i: number) => (
                                                <div key={i} className="group relative aspect-square bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all shadow-xl">
                                                    <img src={img} alt={`Evidência ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                                        <span className="text-xs font-medium">Foto #{i + 1}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Customer Registration Modal */}
            {customerDialog?.isOpen && (
                <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-800 bg-gray-950 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Registro de Cliente - Porta {customerDialog.portIndex}</h3>
                            <button onClick={() => setCustomerDialog(null)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Nome do Cliente</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={customerDialog.name}
                                        onChange={(e) => setCustomerDialog({ ...customerDialog, name: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Ex: Carlos Alberto"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">ID Externo (IXC/ERP)</label>
                                    <input
                                        type="text"
                                        value={(customerDialog as any).externalId || ''}
                                        onChange={(e) => setCustomerDialog({ ...customerDialog, externalId: e.target.value } as any)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Ex: 12345"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Status da Porta</label>
                                    <select
                                        value={(customerDialog as any).status || 'active'}
                                        onChange={(e) => setCustomerDialog({ ...customerDialog, status: e.target.value } as any)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    >
                                        <option value="active">Ativa</option>
                                        <option value="reserved">Reservada</option>
                                        <option value="blocked">Bloqueada</option>
                                        <option value="damaged">Com Defeito</option>
                                        <option value="free">Livre</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Porta</label>
                                    <div className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-gray-500 font-mono">
                                        P{customerDialog.portIndex}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Descrição do Contrato</label>
                                <textarea
                                    value={(customerDialog as any).description || ''}
                                    onChange={(e) => setCustomerDialog({ ...customerDialog, description: e.target.value } as any)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all h-20 resize-none font-sans"
                                    placeholder="Detalhes adicionais do cliente ou serviço..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Observações Técnicas</label>
                                <textarea
                                    value={customerDialog.observation}
                                    onChange={(e) => setCustomerDialog({ ...customerDialog, observation: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all h-16 resize-none"
                                    placeholder="Complemento, apto, referência..."
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-gray-950 border-t border-gray-800 flex justify-between gap-3">
                            <div className="flex gap-2">
                                {customerDialog.customerId && (
                                    <button
                                        onClick={() => {
                                            if (confirm('Limpar porta e remover cadastro do cliente?')) {
                                                handleDeleteCustomer(customerDialog.customerId!);
                                                setCustomerDialog(null);
                                            }
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg transition-all text-sm font-bold border border-red-600/30"
                                    >
                                        <Trash2 size={16} /> Limpar Porta
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCustomerDialog(null)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveCustomer}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all text-sm"
                                >
                                    Salvar Cadastro
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
