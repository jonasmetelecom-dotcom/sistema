import { useState, useEffect } from 'react';
import { X, Package, HardDrive, Ruler, Zap } from 'lucide-react';
import api from '../../services/api';

interface InventoryData {
    poles: number;
    boxes: Record<string, number>;
    cablesInMeters: Record<string, number>;
    totalCablesMeters: number;
    rbs: number;
}

interface InventoryOverlayProps {
    projectId: string;
    onClose: () => void;
}

export const InventoryOverlay = ({ projectId, onClose }: InventoryOverlayProps) => {
    const [data, setData] = useState<InventoryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const response = await api.get(`/stats/project/${projectId}/inventory`);
                setData(response.data);
            } catch (error) {
                console.error('Error fetching inventory:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInventory();
    }, [projectId]);

    if (loading) return null;

    return (
        <div className="absolute top-20 right-4 z-[1001] w-80 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl p-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Package className="text-blue-400" size={20} />
                    <h3 className="font-bold text-white text-lg">Inventário (BOM)</h3>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-6">
                {/* Poles */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-yellow-400">
                            <Zap size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Postes</span>
                        </div>
                        <span className="text-xl font-bold text-white">{data?.poles || 0}</span>
                    </div>
                </div>

                {/* Boxes */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center gap-2 text-green-400 mb-3">
                        <HardDrive size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Caixas Terminadoras</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {data?.boxes && Object.entries(data.boxes).map(([type, count]) => (
                            <div key={type} className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase">{type}</span>
                                <span className="text-sm font-bold text-white">{count} un</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cables */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center gap-2 text-pink-400 mb-3">
                        <Ruler size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Cabeamento Total</span>
                    </div>
                    <div className="space-y-3">
                        {data?.cablesInMeters && Object.entries(data.cablesInMeters).map(([type, meters]) => (
                            <div key={type} className="flex justify-between items-end">
                                <span className="text-[10px] text-gray-500 uppercase">{type}</span>
                                <div className="flex-1 border-b border-gray-700 border-dotted mx-2 mb-1"></div>
                                <span className="text-sm font-bold text-white font-mono">{(meters || 0).toFixed(1)}m</span>
                            </div>
                        ))}
                        <div className="pt-2 border-t border-gray-700 mt-2 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-300">TOTAL</span>
                            <span className="text-lg font-black text-blue-400 font-mono">
                                {(data?.totalCablesMeters || 0).toFixed(1)}m
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800">
                <p className="text-[10px] text-gray-500 text-center italic leading-tight">
                    * Metragem calculada via coordenadas geográficas + reserva técnica (slack) cadastrada.
                </p>
            </div>
        </div>
    );
};
