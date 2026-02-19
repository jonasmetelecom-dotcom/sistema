import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface OltCapabilities {
    pon_status_snmp: boolean;
    pon_traffic_snmp: boolean;
    uplink_power_snmp: boolean;
    onu_power_snmp: boolean;
    onu_power_cli: 'unknown' | 'true' | 'false';
}

interface OltCapabilitiesCardProps {
    capabilities?: OltCapabilities;
    sysDescr?: string;
    sysObjectID?: string;
    onuSummary?: {
        total: number;
        online: number;
        avgSignal: number;
    };
    discoveryResults?: {
        lastRun: Date;
        status: 'success' | 'partial' | 'failed';
        errors: string[];
    };
    onRunDiscovery: () => void;
    onApplyTemplate: (template: string) => void;
    isLoading?: boolean;
    isApplyingTemplate?: boolean;
}

export const OltCapabilitiesCard: React.FC<OltCapabilitiesCardProps> = ({
    capabilities,
    sysDescr,
    sysObjectID,
    onuSummary,
    discoveryResults,
    onRunDiscovery,
    onApplyTemplate,
    isLoading = false,
    isApplyingTemplate = false,
}) => {
    const renderCapabilityIcon = (available: boolean) => {
        return available ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
            <XCircle className="w-5 h-5 text-red-500" />
        );
    };

    const renderCliStatus = (status: 'unknown' | 'true' | 'false') => {
        if (status === 'true') {
            return <CheckCircle className="w-5 h-5 text-green-500" />;
        } else if (status === 'unknown') {
            return <AlertCircle className="w-5 h-5 text-yellow-500" />;
        } else {
            return <XCircle className="w-5 h-5 text-red-500" />;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Configuração de Portas</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => onApplyTemplate('cianet_8pon')}
                        disabled={isLoading || isApplyingTemplate}
                        className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 disabled:bg-gray-100 text-xs font-bold transition-colors"
                        title="Criar 8 portas PON padrão Cianet"
                    >
                        {isApplyingTemplate ? 'Aplicando...' : 'Modelo 8 PON'}
                    </button>
                    <button
                        onClick={onRunDiscovery}
                        disabled={isLoading || isApplyingTemplate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                    >
                        {isLoading ? 'Descobrindo...' : 'Auto-Descoberta'}
                    </button>
                </div>
            </div>

            {/* System Information */}
            {(sysDescr || sysObjectID) && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Informações do Sistema</h4>
                    {sysDescr && (
                        <p className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">sysDescr:</span> {sysDescr}
                        </p>
                    )}
                    {sysObjectID && (
                        <p className="text-xs text-gray-600">
                            <span className="font-medium">sysObjectID:</span> {sysObjectID}
                        </p>
                    )}
                </div>
            )}

            {/* Capabilities List */}
            {capabilities ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Status PON (SNMP)</span>
                        {renderCapabilityIcon(capabilities.pon_status_snmp)}
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Tráfego PON (SNMP)</span>
                        {renderCapabilityIcon(capabilities.pon_traffic_snmp)}
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Potência Uplink/SFP (SNMP)</span>
                        {renderCapabilityIcon(capabilities.uplink_power_snmp)}
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Potência ONU (SNMP)</span>
                        {renderCapabilityIcon(capabilities.onu_power_snmp)}
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Potência ONU (CLI)</span>
                        <div className="flex items-center gap-2">
                            {renderCliStatus(capabilities.onu_power_cli)}
                            {capabilities.onu_power_cli === 'unknown' && (
                                <span className="text-xs text-yellow-600">A configurar</span>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">Nenhuma descoberta executada ainda.</p>
                    <p className="text-xs mt-1">Clique em "Executar Descoberta" para começar.</p>
                </div>
            )}

            {/* ONU Discovery Summary */}
            {onuSummary && (
                <div className="mt-6 mb-2 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Resumo de ONUs Descobertas</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-3 rounded-md text-center">
                            <p className="text-xs text-blue-600 font-medium uppercase">Total</p>
                            <p className="text-xl font-bold text-blue-900">{onuSummary.total}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-md text-center">
                            <p className="text-xs text-green-600 font-medium uppercase">Online</p>
                            <p className="text-xl font-bold text-green-900">{onuSummary.online}</p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-md text-center">
                            <p className="text-xs text-orange-600 font-medium uppercase">Sinal Médio</p>
                            <p className="text-xl font-bold text-orange-900">{onuSummary.avgSignal.toFixed(1)} <span className="text-xs">dBm</span></p>
                        </div>
                    </div>
                </div>
            )}

            {/* Discovery Status */}
            {discoveryResults && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>
                            Última execução:{' '}
                            {new Date(discoveryResults.lastRun).toLocaleString('pt-BR')}
                        </span>
                        <span
                            className={`px-2 py-1 rounded ${discoveryResults.status === 'success'
                                ? 'bg-green-100 text-green-800'
                                : discoveryResults.status === 'partial'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                        >
                            {discoveryResults.status === 'success'
                                ? 'Sucesso'
                                : discoveryResults.status === 'partial'
                                    ? 'Parcial'
                                    : 'Falhou'}
                        </span>
                    </div>
                    {discoveryResults.errors && discoveryResults.errors.length > 0 && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                            <p className="font-medium mb-1">Erros:</p>
                            <ul className="list-disc list-inside">
                                {discoveryResults.errors.map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
