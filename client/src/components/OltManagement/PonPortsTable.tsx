import { Activity, TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react';

interface PonPort {
    id: string;
    ifIndex: number;
    ifDescr: string;
    ifOperStatus: number; // 1=up, 2=down
    ifInOctets: number;
    ifOutOctets: number;
    onuCount?: number;
    onlineOnuCount?: number;
    lastUpdated: Date;
}

interface PonPortsTableProps {
    ponPorts: PonPort[];
    isLoading?: boolean;
    onAddPort?: () => void;
    onDeletePort?: (id: string) => void;
}

export const PonPortsTable: React.FC<PonPortsTableProps> = ({
    ponPorts,
    isLoading = false,
    onAddPort,
    onDeletePort,
}) => {
    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    const getStatusBadge = (status: number) => {
        if (status === 1) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Activity className="w-3 h-3 mr-1" />
                    UP
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    DOWN
                </span>
            );
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Portas PON</h3>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Carregando portas PON...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Portas PON ({ponPorts?.length || 0})
                </h3>
                {onAddPort && (
                    <button
                        onClick={onAddPort}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors text-xs font-bold border border-green-200"
                    >
                        <Plus size={14} />
                        Adicionar Porta
                    </button>
                )}
            </div>

            {(!ponPorts || ponPorts.length === 0) ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <p className="text-sm text-gray-500">Nenhuma porta PON cadastrada.</p>
                    <p className="text-xs mt-1 text-gray-400">Use a descoberta ou adicione manualmente.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Interface
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ONUs
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tráfego IN
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tráfego OUT
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {ponPorts.map((port) => (
                                <tr key={port.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="text-sm font-medium text-gray-900">
                                                {port.ifDescr}
                                            </div>
                                            <div className="text-xs text-gray-500 ml-2">
                                                (Idx: {port.ifIndex})
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {getStatusBadge(port.ifOperStatus)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center text-sm font-semibold text-gray-700">
                                            <span className="text-green-600">{port.onlineOnuCount || 0}</span>
                                            <span className="mx-1 text-gray-400">/</span>
                                            <span className="text-gray-500">{port.onuCount || 0}</span>
                                            <span className="ml-1 text-xs font-normal text-gray-400">ONUs</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <TrendingDown className="w-4 h-4 mr-1 text-blue-500" />
                                            {formatBytes(port.ifInOctets)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                                            {formatBytes(port.ifOutOctets)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        {onDeletePort && (
                                            <button
                                                onClick={() => onDeletePort(port.id)}
                                                className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                                                title="Excluir Porta"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
