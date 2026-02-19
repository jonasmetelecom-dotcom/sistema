import { X, PieChart, Database, MapPin, Ruler } from 'lucide-react';

interface ProjectMetricsModalProps {
    isOpen: boolean;
    onClose: () => void;
    elements: {
        poles: any[];
        boxes: any[];
        cables: any[];
        rbs: any[];
    };
}

export const ProjectMetricsModal = ({ isOpen, onClose, elements }: ProjectMetricsModalProps) => {
    if (!isOpen) return null;

    const totalCablesLength = elements.cables.reduce((acc, cable) => {
        // Simplified length calculation if not available in properties
        // In a real app, this would come from the backend or a helper
        return acc + (cable.length || 0);
    }, 0);

    const ctoCount = elements.boxes.filter(b => b.type === 'cto' || b.name?.toUpperCase().includes('CTO')).length;
    const ceoCount = elements.boxes.filter(b => b.type === 'ceo' || b.name?.toUpperCase().includes('CEO')).length;

    const cableInventory = elements.cables.reduce((acc: any, cable) => {
        const type = cable.type?.toUpperCase() || 'OUTROS';
        acc[type] = (acc[type] || 0) + (cable.length || 0);
        return acc;
    }, {});

    const totalPorts = elements.boxes.reduce((acc, box) => {
        if (box.type === 'cto' || box.name?.toUpperCase().includes('CTO')) {
            return acc + (box.capacity || 16);
        }
        return acc;
    }, 0);

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg text-white">
                            <PieChart size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Dashboard do Projeto</h2>
                            <p className="text-xs text-gray-400">Indicadores e Métricas de Inventário</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-full text-gray-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* Summary Cards */}
                    <div className="md:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-2">
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Postes</p>
                            <p className="text-2xl font-black text-white">{elements.poles.length}</p>
                        </div>
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Caixas (CTO/CEO)</p>
                            <p className="text-2xl font-black text-white">{elements.boxes.length}</p>
                        </div>
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Cabo Total</p>
                            <p className="text-2xl font-black text-white">{totalCablesLength.toFixed(0)}m</p>
                        </div>
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">RBS (Rádio)</p>
                            <p className="text-2xl font-black text-purple-400">{(elements.rbs || []).length}</p>
                        </div>
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Portas de Atendimento</p>
                            <p className="text-2xl font-black text-emerald-400">{totalPorts}</p>
                        </div>
                    </div>

                    {/* Detailed Sections */}
                    <div className="bg-gray-800/30 p-6 rounded-2xl border border-gray-800 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <Database size={16} className="text-blue-500" /> Infraestrutura
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">CTOs (Nap)</span>
                                <span className="text-white font-mono">{ctoCount}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">CEOs (Emenda)</span>
                                <span className="text-white font-mono">{ceoCount}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">RBS (Wireless)</span>
                                <span className="text-white font-mono">{(elements.rbs || []).length}</span>
                            </div>
                            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden mt-1">
                                <div
                                    className="bg-blue-500 h-full"
                                    style={{ width: `${(ctoCount / (elements.boxes.length || 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800/30 p-6 rounded-2xl border border-gray-800 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <Ruler size={16} className="text-pink-500" /> Cabos por Tipo
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(cableInventory).length > 0 ? Object.entries(cableInventory).map(([type, length]: [string, any]) => (
                                <div key={type} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">{type}</span>
                                    <span className="text-white font-mono">{length.toFixed(0)}m</span>
                                </div>
                            )) : <p className="text-xs text-gray-600 italic">Nenhum cabo registrado</p>}
                        </div>
                    </div>

                    <div className="bg-gray-800/30 p-6 rounded-2xl border border-gray-800 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <MapPin size={16} className="text-cyan-500" /> Densidade
                        </h3>
                        <div className="space-y-3">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500">Caixas por km</span>
                                <span className="text-xl font-bold text-white">
                                    {totalCablesLength > 0 ? ((elements.boxes.length / totalCablesLength) * 1000).toFixed(2) : 0}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500">Média Cabo/Vão</span>
                                <span className="text-xl font-bold text-white">
                                    {elements.poles.length > 0 ? (totalCablesLength / elements.poles.length).toFixed(1) : 0}m
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-800/80 border-t border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all text-sm"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
