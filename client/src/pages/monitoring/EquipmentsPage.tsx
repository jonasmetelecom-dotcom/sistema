import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Server, Radio, Trash2, Edit2, Clock, Filter, X, Users, MapPin, Activity, LayoutList, ShieldAlert, ShieldCheck, RotateCcw, Search, Terminal, User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { RbMonitoringModal } from '../../components/Monitoring/RbMonitoringModal';

type DeviceType = 'olt' | 'rbs';

const EquipmentsPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<DeviceType>('olt');
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        ipAddress: '',
        community: 'public',
        model: '',
        projectId: '',
        latitude: '',
        longitude: '',
        port: 161,
        cliProtocol: 'ssh',
        cliUsername: '',
        cliPassword: '',
        monitoringMethod: 'api',
        apiUsername: '',
        apiPassword: '',
        apiPort: 8728
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedOlt, setSelectedOlt] = useState<any>(null);
    const [onus, setOnus] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOnuModalOpen, setIsOnuModalOpen] = useState(false);
    const [maintenanceDevice, setMaintenanceDevice] = useState<any>(null);
    const [editingOnu, setEditingOnu] = useState<any>(null);
    const [onuFormData, setOnuFormData] = useState({
        name: ''
    });
    const [isTestingCli, setIsTestingCli] = useState(false);
    const [cliTestResult, setCliTestResult] = useState<{ success: boolean, message: string } | null>(null);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean, message: string } | null>(null);
    const [isMonitoringModalOpen, setIsMonitoringModalOpen] = useState(false);
    const [selectedRbId, setSelectedRbId] = useState<string | null>(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        fetchDevices(formData.projectId);
    }, [activeTab]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchDevices(formData.projectId);
        }, 30000);
        return () => clearInterval(interval);
    }, [formData.projectId, activeTab]);

    useEffect(() => {
        let timer: any;
        if (isOnuModalOpen && selectedOlt && (isSyncing || selectedOlt.discoveryResults?.status === 'running')) {
            timer = setInterval(() => {
                fetchOnus(selectedOlt.id);
            }, 5000);
        }
        return () => clearInterval(timer);
    }, [isOnuModalOpen, selectedOlt, isSyncing]);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchDevices = async (projectId: string) => {
        try {
            let endpoint = '';
            if (!projectId) {
                endpoint = activeTab === 'olt' ? '/network-elements/olts' : '/network-elements/rbs';
            } else {
                endpoint = activeTab === 'olt' ? `/network-elements/project/${projectId}/olts` : `/network-elements/project/${projectId}/rbs`;
            }

            const res = await api.get(endpoint);
            setDevices(res.data);
        } catch (error) {
            console.error('Error fetching devices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                projectId: formData.projectId || null,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                port: Number(formData.port)
            };

            const endpoint = activeTab === 'olt' ? '/network-elements/olts' : '/network-elements/rbs';
            await api.post(endpoint, payload);

            setIsModalOpen(false);
            fetchDevices(formData.projectId);
            alert('Equipamento criado com sucesso!');
            resetForm();
        } catch (error: any) {
            console.error('Error creating device:', error);
            const msg = error.response?.data?.message || 'Erro ao criar equipamento.';
            alert(`Erro: ${msg}`);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;

        try {
            const payload = {
                ...formData,
                projectId: formData.projectId || null,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                port: Number(formData.port)
            };

            const endpoint = activeTab === 'olt' ? `/network-elements/olts/${editingId}` : `/network-elements/rbs/${editingId}`;
            await api.patch(endpoint, payload);

            setIsModalOpen(false);
            setEditingId(null);
            fetchDevices(formData.projectId);
            alert('Equipamento atualizado com sucesso!');
            resetForm();
        } catch (error: any) {
            console.error('Error updating device:', error);
            const msg = error.response?.data?.message || 'Erro ao atualizar equipamento.';
            alert(`Erro: ${msg}`);
        }
    };

    const handleTestCli = async () => {
        if (!formData.ipAddress || !formData.cliUsername || !formData.cliPassword) {
            alert('Preencha IP, Usuário e Senha para testar.');
            return;
        }

        setIsTestingCli(true);
        setCliTestResult(null);
        try {
            const res = await api.post('/network-elements/test-cli-connection', {
                ipAddress: formData.ipAddress,
                cliProtocol: formData.cliProtocol,
                cliUsername: formData.cliUsername,
                cliPassword: formData.cliPassword,
                id: editingId // Passamos o ID se estivermos editando
            });
            setCliTestResult(res.data);
            if (res.data.success) {
                alert('Conexão CLI bem-sucedida!');
            } else {
                alert(`Erro na conexão: ${res.data.message}`);
            }
        } catch (error: any) {
            console.error('Error testing CLI:', error);
            const msg = error.response?.data?.message || error.message || 'Erro desconhecido.';
            alert(`Erro ao testar conexão CLI: ${msg}`);
        } finally {
            setIsTestingCli(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            ipAddress: '',
            community: 'public',
            model: '',
            projectId: '',
            latitude: '',
            longitude: '',
            port: 161,
            cliProtocol: 'ssh',
            cliUsername: '',
            cliPassword: '',
            monitoringMethod: 'api',
            apiUsername: '',
            apiPassword: '',
            apiPort: 8728
        });
        setCliTestResult(null);
        setConnectionTestResult(null);
    };

    const handleTestConnection = async () => {
        if (!formData.ipAddress) {
            alert('Por favor, preencha o endereço IP primeiro.');
            return;
        }

        if (formData.monitoringMethod === 'api' && (!formData.apiUsername || !formData.apiPassword)) {
            alert('Por favor, preencha as credenciais da API.');
            return;
        }

        if (formData.monitoringMethod === 'snmp' && !formData.community) {
            alert('Por favor, preencha a comunidade SNMP.');
            return;
        }

        setIsTestingConnection(true);
        setConnectionTestResult(null);

        try {
            const testData = {
                ipAddress: formData.ipAddress,
                monitoringMethod: formData.monitoringMethod,
                apiUsername: formData.apiUsername,
                apiPassword: formData.apiPassword,
                apiPort: formData.apiPort,
                port: formData.port,
                community: formData.community
            };

            const response = await api.post('/network-elements/test-rbs-connection', testData);
            setConnectionTestResult({
                success: true,
                message: response.data.message || 'Conexão estabelecida com sucesso!'
            });
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Falha ao conectar. Verifique as credenciais e tente novamente.';
            setConnectionTestResult({
                success: false,
                message: errorMsg
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    const startEdit = (device: any) => {
        setEditingId(device.id);
        setFormData({
            name: device.name,
            ipAddress: device.ipAddress,
            community: device.community,
            model: device.model || '',
            projectId: device.projectId || '',
            latitude: device.latitude || '',
            longitude: device.longitude || '',
            port: device.port || 161,
            cliProtocol: device.cliProtocol || 'ssh',
            cliUsername: device.cliUsername || '',
            cliPassword: '', // Deixar vazio no edit para não sobrescrever a menos que alterado
            monitoringMethod: device.monitoringMethod || 'api',
            apiUsername: device.apiUsername || '',
            apiPassword: '', // Deixar vazio no edit
            apiPort: device.apiPort || 8728
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este equipamento?')) return;
        try {
            const endpoint = activeTab === 'olt' ? `/network-elements/olts/${id}` : `/network-elements/rbs/${id}`;
            await api.delete(endpoint);
            fetchDevices(formData.projectId);
        } catch (error: any) {
            console.error('Error deleting device:', error);
            const msg = error.response?.data?.message || 'Erro ao excluir equipamento.';
            alert(`Erro: ${msg}`);
        }
    };

    const handlePoll = async (id: string) => {
        try {
            const endpoint = `/network-elements/poll/${activeTab}/${id}`;
            const res = await api.post(endpoint);
            alert(`Status atualizado: ${res.data.name} (Online)`);
            fetchDevices(formData.projectId);
        } catch (error) {
            console.error('Error polling device:', error);
            alert('Falha na comunicação com o equipamento (SNMP).');
        }
    };

    const fetchOnus = async (oltId: string) => {
        try {
            const [onusRes, oltRes] = await Promise.all([
                api.get(`/network-elements/olts/${oltId}/onus`),
                api.get(`/network-elements/olts/${oltId}/discovery`) // Novo campo para pegar o status da OLT
            ]);

            setOnus(onusRes.data);

            // Atualiza o статус da OLT selecionada para o modal saber se parou de "Descobrir"
            if (selectedOlt && selectedOlt.id === oltId) {
                setSelectedOlt((prev: any) => ({
                    ...prev,
                    discoveryResults: oltRes.data.discoveryResults
                }));
            }
        } catch (error) {
            console.error('Error fetching ONUs or OLT status:', error);
        }
    };

    const handleSyncOnus = async (oltId: string) => {
        setIsSyncing(true);
        try {
            await api.post(`/network-elements/olts/${oltId}/sync-onus`);
            await fetchOnus(oltId);
            alert('Sincronização concluída!');
        } catch (error) {
            console.error('Error syncing ONUs:', error);
            alert('Falha na sincronização.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRebootOnu = async (onuId: string) => {
        if (!confirm('Deseja realmente reiniciar esta ONU?')) return;
        try {
            await api.post(`/network-elements/onus/${onuId}/reboot`);
            alert('Comando de reinicialização enviado!');
        } catch (error) {
            console.error('Error rebooting ONU:', error);
            alert('Erro ao enviar comando de reboot.');
        }
    };

    const handleSaveOnu = async () => {
        if (!editingOnu) return;
        try {
            await api.patch(`/network-elements/onus/${editingOnu.id}`, {
                name: onuFormData.name
            });

            alert('Dados da ONU atualizados!');
            setEditingOnu(null);
            setOnuFormData({ name: '' });
            fetchOnus(selectedOlt.id);
        } catch (error) {
            console.error('Error updating ONU:', error);
            alert('Erro ao atualizar ONU.');
        }
    };

    const openOnuList = (olt: any) => {
        setSelectedOlt(olt);
        setOnus([]);
        fetchOnus(olt.id);
        setIsOnuModalOpen(true);
    };

    const handleSetMaintenance = async (id: string, hours: number | null) => {
        try {
            const until = hours ? new Date(Date.now() + hours * 60 * 60 * 1000) : null;
            const endpoint = activeTab === 'olt' ? `/network-elements/olts/${id}` : `/network-elements/rbs/${id}`;
            await api.patch(endpoint, { maintenanceUntil: until });

            setMaintenanceDevice(null);
            fetchDevices(formData.projectId);
            if (hours) alert(`Modo de manutenção ativado por ${hours}h`);
            else alert('Modo de manutenção desativado.');
        } catch (error) {
            console.error('Error setting maintenance:', error);
            alert('Erro ao atualizar modo de manutenção.');
        }
    };

    return (
        <div className="p-6 h-full flex flex-col bg-gray-900 overflow-y-auto">
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-green-600/20 rounded-lg">
                        <Activity size={20} className="text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Equipamentos de Rede</h1>
                </div>
                <p className="text-gray-400 text-sm">Gerencie OLTs e Concentradores (RBS MikroTik)</p>
                <button
                    onClick={() => {
                        setEditingId(null);
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                    <Plus size={20} />
                    Adicionar {activeTab.toUpperCase()}
                </button>
            </header>

            {/* Filter */}
            <div className="mb-6 flex gap-4 items-center">
                <div className="flex-1 max-w-xs">
                    <label className="block text-xs font-bold text-gray-400 mb-2 ml-1 uppercase tracking-wider">Filtrar por Projeto</label>
                    <div className="relative">
                        <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <select
                            value={formData.projectId}
                            onChange={(e) => {
                                const pid = e.target.value;
                                setFormData(prev => ({ ...prev, projectId: pid }));
                                fetchDevices(pid);
                            }}
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-green-500 outline-none appearance-none"
                        >
                            <option value="">Todos os Projetos</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-800">
                <button
                    onClick={() => setActiveTab('olt')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${activeTab === 'olt' ? 'border-green-500 text-green-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                    <Server size={20} />
                    OLTs (GPON/EPON)
                </button>
                <button
                    onClick={() => setActiveTab('rbs')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${activeTab === 'rbs' ? 'border-green-500 text-green-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                >
                    <Radio size={20} />
                    RBS (Rádios/MikroTik)
                </button>
            </div>

            {/* List */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-950 text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="p-4">Status</th>
                                <th className="p-4">Nome / IP</th>
                                <th className="p-4">Modelo</th>
                                <th className="p-4">Uptime</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {devices.map((device) => {
                                const isOnline = device.status === 'online';
                                return (
                                    <tr key={device.id} className="group border-b border-gray-800/50 hover:bg-gray-800/40 transition-all">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl border ${isOnline ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                                    {activeTab === 'olt' ? <Server size={20} /> : <Radio size={20} />}
                                                </div>
                                                <div>
                                                    <div className="text-white font-bold tracking-tight">{device.name}</div>
                                                    <div className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">{device.ipAddress}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-gray-300 font-medium">{device.model || 'N/A'}</div>
                                            <div className="text-[9px] text-gray-500 flex items-center gap-1 opacity-70">
                                                <LayoutList size={10} />
                                                <span className="truncate max-w-[140px]">{device.projectName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1.5">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${isOnline ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
                                                    {isOnline ? 'Conectado' : 'Offline'}
                                                </div>
                                                {activeTab === 'rbs' && device.monitoringMethod && (
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[9px] font-bold uppercase tracking-wide w-fit">
                                                        {device.monitoringMethod === 'api' && '🚀 API'}
                                                        {device.monitoringMethod === 'snmp' && '📡 SNMP'}
                                                        {device.monitoringMethod === 'ping' && '📶 Ping'}
                                                    </div>
                                                )}
                                                {device.maintenanceUntil && new Date(device.maintenanceUntil) > new Date() && (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[9px] font-black uppercase tracking-wide w-fit">
                                                        <ShieldAlert size={10} />
                                                        Em Manutenção
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-gray-400 text-[11px] font-mono whitespace-nowrap">
                                                <Clock size={12} className="text-gray-600" />
                                                {device.uptime || 'Desconhecido'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                <button
                                                    onClick={() => navigate(`/monitoring/dashboard?deviceId=${device.id}`)}
                                                    className="p-2 hover:bg-gray-800 text-gray-400 hover:text-indigo-400 rounded-lg transition-all"
                                                    title="Ver no Mapa Operacional"
                                                >
                                                    <MapPin size={18} />
                                                </button>

                                                {activeTab === 'olt' && (
                                                    <button
                                                        onClick={() => navigate(`/monitoring/olts/${device.id}`)}
                                                        className="p-2 hover:bg-gray-800 text-green-400 rounded-lg transition-all"
                                                        title="Auto-Descoberta e Capacidades"
                                                    >
                                                        <Search size={18} />
                                                    </button>
                                                )}

                                                {activeTab === 'olt' && (
                                                    <button
                                                        onClick={() => openOnuList(device)}
                                                        className="p-2 hover:bg-gray-800 text-indigo-400 rounded-lg transition-all"
                                                        title="Gerenciar ONUs"
                                                    >
                                                        <Users size={18} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handlePoll(device.id)}
                                                    className="p-2 hover:bg-gray-800 text-blue-400 rounded-lg transition-all"
                                                    title="Sincronizar IP/SNMP"
                                                >
                                                    <RefreshCw size={18} />
                                                </button>

                                                {activeTab === 'rbs' && device.monitoringMethod === 'api' && isOnline && (
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm('Desconectar da API MikroTik?')) {
                                                                try {
                                                                    await api.post(`/network-elements/rbs/${device.id}/disconnect`);
                                                                    alert('Desconectado com sucesso!');
                                                                    fetchDevices(formData.projectId);
                                                                } catch (error: any) {
                                                                    alert('Erro ao desconectar: ' + (error.response?.data?.message || error.message));
                                                                }
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-red-900/20 text-red-400 rounded-lg transition-all"
                                                        title="Desconectar API"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => setMaintenanceDevice(device)}
                                                    className={`p-2 hover:bg-gray-800 rounded-lg transition-all ${device.maintenanceUntil && new Date(device.maintenanceUntil) > new Date() ? 'text-amber-500' : 'text-gray-400 hover:text-amber-400'}`}
                                                    title="Modo de Manutenção"
                                                >
                                                    <ShieldAlert size={18} />
                                                </button>

                                                <div className="w-px h-6 bg-gray-800 mx-1 self-center"></div>

                                                <button
                                                    onClick={() => startEdit(device)}
                                                    className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-all"
                                                    title="Editar Configurações"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(device.id)}
                                                    className="p-2 hover:bg-red-900/20 text-red-500 rounded-lg transition-all"
                                                    title="Remover Equipamento"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {devices.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <Server size={48} className="opacity-10" />
                                            <p className="italic">Nenhum equipamento cadastrado ou encontrado nos filtros.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ONU List Modal */}
            {isOnuModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-950/50">
                            <div>
                                <h2 className="text-xl font-bold text-white">Clientes ONUs - {selectedOlt?.name}</h2>
                                <p className="text-xs text-gray-400 mt-1">Gerenciamento de terminais ópticos ativos nesta OLT</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleSyncOnus(selectedOlt?.id)}
                                    disabled={isSyncing || selectedOlt?.discoveryResults?.status === 'running'}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isSyncing || selectedOlt?.discoveryResults?.status === 'running' ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'}`}
                                >
                                    <RefreshCw size={18} className={isSyncing || selectedOlt?.discoveryResults?.status === 'running' ? 'animate-spin' : ''} />
                                    {isSyncing || selectedOlt?.discoveryResults?.status === 'running' ? 'Descobrindo ONUs...' : 'Novo Scan (Discovery)'}
                                </button>
                                <button onClick={() => setIsOnuModalOpen(false)} className="text-gray-400 hover:text-white p-2">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-gray-900/50">
                            {onus.length > 0 && (
                                <div className="mb-6 flex flex-col gap-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1 bg-gray-950 p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-500/10 rounded-lg">
                                                    <Activity size={20} className="text-green-500" />
                                                </div>
                                                <div className="text-xs font-bold text-gray-500 uppercase">ONUs Online</div>
                                            </div>
                                            <div className="text-2xl font-black text-green-400">{onus.filter(o => o.status === 'online').length}</div>
                                        </div>
                                        <div className="flex-1 bg-gray-950 p-4 rounded-xl border border-gray-700 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-red-500/10 rounded-lg">
                                                    <Activity size={20} className="text-red-500" />
                                                </div>
                                                <div className="text-xs font-bold text-gray-500 uppercase">ONUs Offline</div>
                                            </div>
                                            <div className="text-2xl font-black text-red-500">{onus.filter(o => o.status !== 'online').length}</div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-950 rounded-xl border border-gray-700 flex flex-wrap gap-4 items-center">
                                        <div className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                            <Filter size={14} /> Resumo por Porta:
                                        </div>
                                        {Object.entries(
                                            onus.reduce((acc: any, onu: any) => {
                                                const port = onu.ponPort || 'Desconhecida';
                                                acc[port] = (acc[port] || 0) + 1;
                                                return acc;
                                            }, {})
                                        ).map(([port, count]: [string, any]) => (
                                            <div key={port} className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700 flex items-center gap-2">
                                                <span className="text-indigo-400 font-mono text-xs">{port}</span>
                                                <span className="bg-indigo-900/50 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-md font-bold">{count} ONUs</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {onus.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="p-4 bg-gray-950 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-gray-800">
                                        <Users size={32} className="text-gray-600" />
                                    </div>
                                    <p className="text-gray-500">Nenhuma ONU encontrada para este concentrador.</p>
                                    <p className="text-xs text-gray-600 mt-2">Clique em "Novo Scan" para descobrir dispositivos conectados via SNMP.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="text-xs font-semibold text-gray-500 uppercase border-b border-gray-800">
                                        <tr>
                                            <th className="pb-3 px-2">Status</th>
                                            <th className="pb-3 px-2">Serial Number</th>
                                            <th className="pb-3 px-2">Identificação</th>
                                            <th className="pb-3 px-2">Porta PON</th>
                                            <th className="pb-3 px-2">Sinal (dBm)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {onus.map((onu) => (
                                            <tr key={onu.id} className="hover:bg-gray-800/20 transition-colors">
                                                <td className="py-3 px-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${onu.status === 'online' ? 'bg-green-900/50 text-green-400 border border-green-800/50' : 'bg-red-900/50 text-red-400 border border-red-800/50'}`}>
                                                        {onu.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-sm text-gray-300 font-mono">{onu.serialNumber}</td>
                                                <td className="py-3 px-2 text-sm text-white font-medium">{onu.name || '---'}</td>
                                                <td className="py-3 px-2 text-sm text-gray-400">{onu.ponPort}</td>
                                                <td className="py-3 px-2 text-sm">
                                                    <span className={`font-mono font-bold ${onu.signalLevel > -25 ? 'text-green-400' : onu.signalLevel > -30 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                        {onu.signalLevel.toFixed(1)} dBm
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingOnu(onu);
                                                                setOnuFormData({ name: onu.name || '' });
                                                            }}
                                                            className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-all"
                                                            title="Editar Nome"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRebootOnu(onu.id)}
                                                            className="p-1.5 hover:bg-gray-700 text-gray-400 hover:text-amber-500 rounded-lg transition-all"
                                                            title="Reiniciar ONU"
                                                        >
                                                            <RotateCcw size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <h2 className="text-xl font-bold text-white mb-4">
                            {editingId ? 'Editar' : 'Adicionar'} {activeTab.toUpperCase()}
                        </h2>
                        <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Projeto</label>
                                <select
                                    value={formData.projectId}
                                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-green-500 outline-none"
                                >
                                    <option value="">Sem Projeto (Global)</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Nome Identificador</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-green-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Endereço IP</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-green-500 outline-none"
                                    value={formData.ipAddress}
                                    onChange={e => setFormData({ ...formData, ipAddress: e.target.value })}
                                />
                            </div>

                            {activeTab === 'rbs' && (
                                <div className="space-y-4 pt-4 border-t border-gray-800">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                        <Activity size={14} /> Método de Monitoramento
                                    </h3>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Selecione o método</label>
                                        <div className="flex gap-3">
                                            {[
                                                { value: 'api', label: '🚀 API Nativa', desc: 'Mais rápido e completo' },
                                                { value: 'snmp', label: '📡 SNMP', desc: 'Compatibilidade universal' },
                                                { value: 'ping', label: '📶 Ping', desc: 'Apenas conectividade' }
                                            ].map(method => (
                                                <label key={method.value} className="flex-1 cursor-pointer group">
                                                    <input
                                                        type="radio"
                                                        name="monitoringMethod"
                                                        value={method.value}
                                                        checked={formData.monitoringMethod === method.value}
                                                        onChange={e => setFormData({ ...formData, monitoringMethod: e.target.value as any })}
                                                        className="sr-only"
                                                    />
                                                    <div className={`p-3 rounded-lg border-2 transition-all ${formData.monitoringMethod === method.value
                                                        ? 'border-green-500 bg-green-500/10'
                                                        : 'border-gray-700 bg-gray-800/50 group-hover:border-gray-600'
                                                        }`}>
                                                        <div className="text-sm font-bold text-white mb-1">{method.label}</div>
                                                        <div className="text-[10px] text-gray-500">{method.desc}</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {formData.monitoringMethod === 'api' && (
                                        <div className="space-y-3 pt-2">
                                            <p className="text-xs text-gray-500 italic">Credenciais da API MikroTik RouterOS</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                                        <User size={14} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Usuário API"
                                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 pl-9 pr-3 text-white focus:border-green-500 outline-none text-sm"
                                                        value={formData.apiUsername}
                                                        onChange={e => setFormData({ ...formData, apiUsername: e.target.value })}
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                                        <Lock size={14} />
                                                    </div>
                                                    <input
                                                        type="password"
                                                        placeholder={editingId ? "Manter senha atual" : "Senha API"}
                                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 pl-9 pr-3 text-white focus:border-green-500 outline-none text-sm"
                                                        value={formData.apiPassword}
                                                        onChange={e => setFormData({ ...formData, apiPassword: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1">Porta API</label>
                                                <input
                                                    type="number"
                                                    value={formData.apiPort}
                                                    onChange={e => setFormData({ ...formData, apiPort: parseInt(e.target.value) })}
                                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-white focus:border-green-500 outline-none text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.monitoringMethod === 'snmp' && (
                                        <div className="space-y-3 pt-2">
                                            <p className="text-xs text-gray-500 italic">Configurações SNMP</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">Porta SNMP</label>
                                                    <input
                                                        type="number"
                                                        value={formData.port}
                                                        onChange={e => setFormData({ ...formData, port: parseInt(e.target.value) })}
                                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-white focus:border-green-500 outline-none text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1">Comunidade SNMP</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-white focus:border-green-500 outline-none text-sm"
                                                        value={formData.community}
                                                        onChange={e => setFormData({ ...formData, community: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {formData.monitoringMethod === 'ping' && (
                                        <div className="pt-2">
                                            <p className="text-xs text-gray-500 italic">Modo Ping: apenas verificação de conectividade básica</p>
                                        </div>
                                    )}

                                    {/* Botão de Teste de Conexão */}
                                    <button
                                        type="button"
                                        onClick={handleTestConnection}
                                        disabled={isTestingConnection || !formData.ipAddress}
                                        className={`w-full py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 border-2 ${connectionTestResult?.success
                                            ? 'bg-green-500/10 text-green-500 border-green-500/50'
                                            : connectionTestResult === null
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                                                : 'bg-red-500/10 text-red-500 border-red-500/30'
                                            }`}
                                    >
                                        <RefreshCw size={16} className={isTestingConnection ? 'animate-spin' : ''} />
                                        {isTestingConnection
                                            ? 'Testando Conexão...'
                                            : connectionTestResult?.success
                                                ? '✓ Conexão OK!'
                                                : connectionTestResult
                                                    ? '✗ Falha na Conexão'
                                                    : 'Testar Conexão'}
                                    </button>

                                    {connectionTestResult && (
                                        <div className={`p-3 rounded-lg text-xs ${connectionTestResult.success
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                            }`}>
                                            {connectionTestResult.message}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'olt' && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Porta SNMP</label>
                                    <input
                                        type="number"
                                        value={formData.port}
                                        onChange={e => setFormData({ ...formData, port: parseInt(e.target.value) })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-green-500 outline-none"
                                    />
                                </div>
                            )}

                            {activeTab === 'olt' && (
                                <div className="space-y-4 pt-4 border-t border-gray-800">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                        <Terminal size={14} /> Credenciais de Acesso CLI (Opcional)
                                    </h3>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Protocolo</label>
                                        <div className="flex gap-4">
                                            {['ssh', 'telnet'].map(proto => (
                                                <label key={proto} className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="radio"
                                                        name="cliProtocol"
                                                        value={proto}
                                                        checked={formData.cliProtocol === proto}
                                                        onChange={e => setFormData({ ...formData, cliProtocol: e.target.value })}
                                                        className="accent-green-500"
                                                    />
                                                    <span className={`text-sm tracking-widest uppercase font-black ${formData.cliProtocol === proto ? 'text-green-500' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                                        {proto}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                                <User size={14} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Usuário"
                                                className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 pl-9 pr-3 text-white focus:border-green-500 outline-none text-sm"
                                                value={formData.cliUsername}
                                                onChange={e => setFormData({ ...formData, cliUsername: e.target.value })}
                                            />
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                                <Lock size={14} />
                                            </div>
                                            <input
                                                type="password"
                                                placeholder={editingId ? "Manter senha atual" : "Senha"}
                                                className="w-full bg-gray-950 border border-gray-800 rounded-lg py-2 pl-9 pr-3 text-white focus:border-green-500 outline-none text-sm"
                                                value={formData.cliPassword}
                                                onChange={e => setFormData({ ...formData, cliPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 italic px-1">
                                        * Necessário para auto-descoberta profunda quando o SNMP é instável.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={handleTestCli}
                                        disabled={isTestingCli}
                                        className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border ${cliTestResult?.success
                                            ? 'bg-green-500/10 text-green-500 border-green-500/30'
                                            : cliTestResult === null
                                                ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-750'
                                                : 'bg-red-500/10 text-red-500 border-red-500/30'
                                            }`}
                                    >
                                        <RefreshCw size={14} className={isTestingCli ? 'animate-spin' : ''} />
                                        {isTestingCli ? 'Testando...' : cliTestResult?.success ? 'Conexão OK!' : 'Testar Conexão CLI'}
                                    </button>
                                </div>
                            )}

                            {activeTab === 'olt' && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1 font-bold">Comunidade SNMP</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-green-500 outline-none"
                                        value={formData.community}
                                        onChange={e => setFormData({ ...formData, community: e.target.value })}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Modelo (Opcional)</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-green-500 outline-none"
                                    value={formData.model}
                                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                                />
                            </div>


                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        min="-90"
                                        max="90"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-green-500 outline-none"
                                        value={formData.latitude}
                                        onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                                        placeholder="-23.5505"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        min="-180"
                                        max="180"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-green-500 outline-none"
                                        value={formData.longitude}
                                        onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                                        placeholder="-46.6333"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium"
                                >
                                    {editingId ? 'Atualizar' : 'Salvar'} Equipamento
                                </button>
                            </div>
                        </form >
                    </div >
                </div >
            )}

            {/* Maintenance Selection Modal */}
            {
                maintenanceDevice && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-amber-600/20 rounded-lg">
                                    <ShieldAlert size={20} className="text-amber-500" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Modo de Manutenção</h2>
                            </div>

                            <p className="text-sm text-gray-400 mb-6">
                                Ao ativar este modo para <strong>{maintenanceDevice.name}</strong>, todos os novos alarmes críticos serão silenciados até o fim do período.
                            </p>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {[1, 4, 12, 24].map(h => (
                                    <button
                                        key={h}
                                        onClick={() => handleSetMaintenance(maintenanceDevice.id, h)}
                                        className="bg-gray-800 hover:bg-amber-600/20 text-gray-300 hover:text-amber-400 border border-gray-700 hover:border-amber-500/30 p-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1"
                                    >
                                        <span className="text-lg">{h}h</span>
                                        <span className="opacity-50 text-[9px] uppercase tracking-tighter">{h === 1 ? 'Hora' : 'Horas'}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-col gap-2">
                                {maintenanceDevice.maintenanceUntil && new Date(maintenanceDevice.maintenanceUntil) > new Date() && (
                                    <button
                                        onClick={() => handleSetMaintenance(maintenanceDevice.id, null)}
                                        className="w-full py-3 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded-xl text-xs font-black uppercase tracking-widest border border-red-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ShieldCheck size={16} />
                                        Desativar Manutenção
                                    </button>
                                )}
                                <button
                                    onClick={() => setMaintenanceDevice(null)}
                                    className="w-full py-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-wider"
                                >
                                    Agora Não
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ONU Edit Modal */}
            {
                editingOnu && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                            <div className="p-6 border-b border-gray-700 bg-gray-950/50 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Editar ONU</h2>
                                    <p className="text-xs text-indigo-400 mt-1 font-mono">{editingOnu.serialNumber}</p>
                                </div>
                                <button onClick={() => setEditingOnu(null)} className="text-gray-400 hover:text-white p-2">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Identificação / Nome do Cliente</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Ex: Cliente 01"
                                        value={onuFormData.name}
                                        onChange={e => setOnuFormData({ ...onuFormData, name: e.target.value })}
                                    />
                                </div>

                                <button
                                    onClick={handleSaveOnu}
                                    disabled={!onuFormData.name}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-bold transition-all shadow-xl active:scale-95 mt-4 flex items-center justify-center gap-2"
                                >
                                    <ShieldCheck size={20} />
                                    SALVAR ALTERAÇÕES
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                isMonitoringModalOpen && selectedRbId && (
                    <RbMonitoringModal
                        rbId={selectedRbId}
                        onClose={() => {
                            setIsMonitoringModalOpen(false);
                            setSelectedRbId(null);
                        }}
                    />
                )
            }
        </div >
    );
};

export default EquipmentsPage;
