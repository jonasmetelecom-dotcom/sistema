import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { OltCapabilitiesCard } from '../components/OltManagement/OltCapabilitiesCard';
import { PonPortsTable } from '../components/OltManagement/PonPortsTable';

interface Olt {
    id: string;
    name: string;
    ipAddress: string;
    model?: string;
    status: string;
    sysDescr?: string;
    sysObjectID?: string;
    capabilities?: {
        pon_status_snmp: boolean;
        pon_traffic_snmp: boolean;
        uplink_power_snmp: boolean;
        onu_power_snmp: boolean;
        onu_power_cli: 'unknown' | 'true' | 'false';
    };
    discoveryResults?: {
        lastRun: Date;
        status: 'success' | 'partial' | 'failed';
        errors: string[];
    };
}

interface PonPort {
    id: string;
    ifIndex: number;
    ifDescr: string;
    ifOperStatus: number;
    ifInOctets: number;
    ifOutOctets: number;
    onuCount?: number;
    lastUpdated: Date;
}

export default function OltDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [olt, setOlt] = useState<Olt | null>(null);
    const [ponPorts, setPonPorts] = useState<PonPort[]>([]);
    const [isLoadingOlt, setIsLoadingOlt] = useState(true);
    const [isLoadingPons, setIsLoadingPons] = useState(false);
    const [isRunningDiscovery, setIsRunningDiscovery] = useState(false);
    const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
    const [onuSummary, setOnuSummary] = useState<{ total: number; online: number; avgSignal: number } | undefined>();

    const fetchOltDetails = async () => {
        try {
            setIsLoadingOlt(true);

            // Fetch OLT basic info
            const oltResponse = await api.get(`/network-elements/olts/${id}`);
            const oltData = oltResponse.data;

            // Fetch discovery results
            const discoveryResponse = await api.get(`/network-elements/olts/${id}/discovery`);
            const discoveryData = discoveryResponse.data;

            setOlt({ ...oltData, ...discoveryData });
        } catch (error) {
            console.error('Error fetching OLT details:', error);
        } finally {
            setIsLoadingOlt(false);
        }
    };

    const fetchPonPorts = async () => {
        try {
            setIsLoadingPons(true);

            // Fetch ports and ONUs in parallel
            const [portsResponse, onusResponse] = await Promise.all([
                api.get(`/network-elements/olts/${id}/pons`),
                api.get(`/network-elements/olts/${id}/onus`)
            ]);

            const ports = portsResponse.data;
            const onus = onusResponse.data;

            // Calculate global summary
            if (onus && onus.length > 0) {
                const onlineOnus = onus.filter((o: any) => o.status === 'online');
                const avgSignal = onlineOnus.length > 0
                    ? onlineOnus.reduce((acc: number, curr: any) => acc + (curr.signalLevel || 0), 0) / onlineOnus.length
                    : 0;

                setOnuSummary({
                    total: onus.length,
                    online: onlineOnus.length,
                    avgSignal
                });
            } else {
                setOnuSummary(undefined);
            }

            // Map ONU counts to each port
            const portsWithCounts = ports.map((port: any) => {
                const portOnus = onus.filter((onu: any) => {
                    // Normalize port format for comparison (e.g., '0/1' vs 'PON 1/1/1')
                    return onu.ponPort.includes(port.ifDescr.replace('PON ', '')) ||
                        port.ifDescr.includes(onu.ponPort);
                });

                return {
                    ...port,
                    onuCount: portOnus.length,
                    onlineOnuCount: portOnus.filter((o: any) => o.status === 'online').length
                };
            });

            setPonPorts(portsWithCounts);
        } catch (error) {
            console.error('Error fetching PON ports:', error);
        } finally {
            setIsLoadingPons(false);
        }
    };

    const runDiscovery = async () => {
        try {
            setIsRunningDiscovery(true);
            const response = await api.post(`/network-elements/olts/${id}/discovery/run`);
            const result = response.data;

            if (result.success) {
                // Refresh data after successful discovery
                await Promise.all([fetchOltDetails(), fetchPonPorts()]);
            } else {
                console.error('Discovery failed:', result.errors);
                alert('A descoberta automática falhou. Tente usar um Modelo ou adicionar manualmente.');
            }
        } catch (error) {
            console.error('Error running discovery:', error);
            alert('Erro ao executar descoberta automatizada.');
        } finally {
            setIsRunningDiscovery(false);
        }
    };

    const applyTemplate = async (template: string) => {
        if (!confirm(`Deseja aplicar o modelo "${template}"? Isso irá remover as portas atuais desta OLT.`)) {
            return;
        }

        try {
            setIsApplyingTemplate(true);
            await api.post(`/network-elements/olts/${id}/apply-template`, { template });
            await Promise.all([fetchOltDetails(), fetchPonPorts()]);
            alert('Modelo aplicado com sucesso!');
        } catch (error) {
            console.error('Error applying template:', error);
            alert('Erro ao aplicar modelo.');
        } finally {
            setIsApplyingTemplate(false);
        }
    };

    const addManualPort = async () => {
        const portName = window.prompt('Digite o nome da porta (ex: PON 1/1/1):');
        if (!portName) return;

        try {
            const ifIndex = 200 + ponPorts.length; // Index fictício para manual
            await api.post(`/network-elements/olts/${id}/pons/manual`, {
                ifDescr: portName,
                ifIndex
            });
            await fetchPonPorts();
        } catch (error) {
            console.error('Error adding port:', error);
            alert('Erro ao adicionar porta manualmente.');
        }
    };

    const deletePort = async (portId: string) => {
        if (!confirm('Excluir esta porta PON?')) return;

        try {
            await api.delete(`/network-elements/pons/${portId}`);
            await fetchPonPorts();
        } catch (error) {
            console.error('Error deleting port:', error);
            alert('Erro ao excluir porta.');
        }
    };

    useEffect(() => {
        if (id) {
            fetchOltDetails();
            fetchPonPorts();
        }
    }, [id]);

    if (isLoadingOlt) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!olt) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">OLT não encontrada</p>
                    <button
                        onClick={() => navigate('/olts')}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                        Voltar para lista
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <button
                                onClick={() => navigate('/olts')}
                                className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{olt.name}</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    {olt.ipAddress} {olt.model && `• ${olt.model}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${olt.status === 'online'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}
                            >
                                {olt.status === 'online' ? 'Online' : 'Offline'}
                            </span>
                            <button
                                onClick={() => {
                                    fetchOltDetails();
                                    fetchPonPorts();
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                title="Atualizar"
                            >
                                <RefreshCw className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Capabilities Card */}
                    <div>
                        <OltCapabilitiesCard
                            capabilities={olt.capabilities}
                            sysDescr={olt.sysDescr}
                            sysObjectID={olt.sysObjectID}
                            discoveryResults={olt.discoveryResults}
                            onuSummary={onuSummary}
                            onRunDiscovery={runDiscovery}
                            onApplyTemplate={applyTemplate}
                            isLoading={isRunningDiscovery}
                            isApplyingTemplate={isApplyingTemplate}
                        />
                    </div>

                    {/* PON Ports Table - Full Width on Second Row */}
                    <div className="lg:col-span-2">
                        <PonPortsTable
                            ponPorts={ponPorts}
                            isLoading={isLoadingPons}
                            onAddPort={addManualPort}
                            onDeletePort={deletePort}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
