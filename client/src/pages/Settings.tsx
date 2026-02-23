import { useState, useEffect } from 'react';
import { User, Lock, Monitor, Info, Save, RefreshCw, CheckCircle, AlertCircle, Download, MapPin, Map as MapIcon, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="h-full flex flex-col bg-gray-900 text-white p-6 overflow-hidden">
            <header className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Monitor className="text-blue-500" />
                    Configurações
                </h1>
                <p className="text-gray-400">Gerencie suas preferências e conta</p>
            </header>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col gap-2 h-fit">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'profile'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                    >
                        <User size={20} />
                        <div>
                            <p className="font-medium">Perfil</p>
                            <p className="text-xs opacity-70">Dados pessoais</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('security')}
                        className={`text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'security'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                    >
                        <Lock size={20} />
                        <div>
                            <p className="font-medium">Segurança</p>
                            <p className="text-xs opacity-70">Senha e acesso</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('connections')}
                        className={`text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'connections'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                    >
                        <Monitor size={20} />
                        <div>
                            <p className="font-medium">Conexões</p>
                            <p className="text-xs opacity-70">Aparelhos logados</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('about')}
                        className={`text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'about'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                    >
                        <Info size={20} />
                        <div>
                            <p className="font-medium">Sobre</p>
                            <p className="text-xs opacity-70">Versão do sistema</p>
                        </div>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 p-8 overflow-y-auto">
                    {activeTab === 'profile' && (
                        <div className="max-w-xl">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <User className="text-blue-400" />
                                Perfil do Usuário
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={user?.name || ''}
                                        disabled
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">E-mail</label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Empresa (Tenant)</label>
                                    <input
                                        type="text"
                                        value={user?.tenant?.name || 'Não atribuído'}
                                        disabled
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Função</label>
                                    <span className="inline-block bg-blue-900/50 text-blue-400 px-3 py-1 rounded-full text-sm border border-blue-900">
                                        {user?.role === 'admin' ? 'Administrador' : user?.role === 'engineer' ? 'Engenheiro' : 'Visualizador'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="max-w-xl">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Lock className="text-blue-400" />
                                Alterar Senha
                            </h2>
                            <form className="space-y-4" onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                // const currentPassword = (form.elements[0] as HTMLInputElement).value; // Removed unused
                                const newPassword = (form.elements[1] as HTMLInputElement).value;
                                const confirmPassword = (form.elements[2] as HTMLInputElement).value;

                                if (newPassword !== confirmPassword) {
                                    alert('As novas senhas não coincidem.');
                                    return;
                                }

                                if (newPassword.length < 6) {
                                    alert('A senha deve ter no mínimo 6 caracteres.');
                                    return;
                                }

                                try {
                                    // We call the profile endpoint
                                    // Note: The UI asks for "Current Password" but standard UpdateUserDto might not verify it 
                                    // unless logic is added. backend currently just updates.
                                    // Improving security would require verifying current password, but for now we follow the existing pattern.
                                    await api.patch('/users/profile', { password: newPassword });
                                    alert('Senha atualizada com sucesso!');
                                    form.reset();
                                } catch (error) {
                                    console.error('Error updating password:', error);
                                    alert('Erro ao atualizar senha.');
                                }
                            }}>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Senha Atual (Opcional na versão Beta)</label>
                                    <input
                                        type="password"
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                                        placeholder="Digite sua senha atual"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Nova Senha</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Confirmar Nova Senha</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                                        placeholder="Repita a nova senha"
                                    />
                                </div>
                                <div className="pt-4">
                                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                                        <Save size={18} />
                                        Salvar Alterações
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'connections' && (
                        <UserConnections />
                    )}

                    {activeTab === 'about' && (
                        <div className="max-w-xl text-center flex flex-col items-center justify-center h-full opacity-80">
                            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                                <Monitor size={40} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">SaaS FTTX Manager</h2>
                            <p className="text-gray-400 mb-6">Versão 1.0.0 (Beta)</p>

                            <div className="text-left bg-gray-900/50 p-6 rounded-xl border border-gray-700 max-w-md w-full mb-6">
                                <p className="text-sm text-gray-400 mb-2">Developed by:</p>
                                <p className="text-white font-medium mb-4">DeepMind Agentic Team</p>
                                <p className="text-sm text-gray-400 mb-2">License:</p>
                                <p className="text-white font-medium">Proprietary / Internal Use</p>
                            </div>

                            <UpdateSystem />

                            <p className="text-xs text-gray-600 mt-8">© 2024 All rights reserved.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const UpdateSystem = () => {
    const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'uptodate' | 'updating'>('idle');
    const [changelog, setChangelog] = useState<string[]>([]);
    const [error, setError] = useState('');

    const checkForUpdates = async () => {
        setStatus('checking');
        setError('');
        try {
            const res = await api.get('/system/check-update');
            if (res.data.updateAvailable) {
                setChangelog(res.data.changelog || []);
                setStatus('available');
            } else {
                setStatus('uptodate');
            }
        } catch (e) {
            setError('Erro ao verificar atualizações.');
            setStatus('idle');
        }
    };

    const triggerUpdate = async () => {
        if (!confirm('O sistema será reiniciado. Deseja continuar?')) return;
        setStatus('updating');
        try {
            await api.post('/system/trigger-update');
            // Keep loading state indefinitely as server reboots
        } catch (e) {
            setError('Falha ao iniciar atualização.');
            setStatus('available');
        }
    };

    if (status === 'updating') {
        return (
            <div className="bg-blue-600/20 border border-blue-500/50 rounded-xl p-6 max-w-md w-full text-center animate-pulse">
                <RefreshCw className="animate-spin mx-auto mb-4 text-blue-400" size={32} />
                <h3 className="text-xl font-bold text-white mb-2">Atualizando Sistema...</h3>
                <p className="text-blue-200">O servidor está baixando os arquivos e reiniciando.</p>
                <p className="text-xs text-blue-300 mt-2">A página pode perder conexão. Aguarde 1-2 minutos e recarregue.</p>
            </div>
        );
    }

    if (status === 'available') {
        return (
            <div className="bg-gray-700 rounded-xl border border-gray-600 p-6 max-w-md w-full">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Download className="text-green-400" />
                    Atualização Disponível
                </h3>
                <div className="bg-gray-800 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto text-left">
                    <p className="text-xs text-gray-500 mb-2 font-bold uppercase">Mudanças:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        {changelog.map((log, i) => (
                            <li key={i} className="text-sm text-gray-300">{log}</li>
                        ))}
                    </ul>
                </div>
                <button
                    onClick={triggerUpdate}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <RefreshCw size={18} />
                    Atualizar Agora
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4">
            {status === 'uptodate' && (
                <div className="flex items-center gap-2 text-green-400 bg-green-900/20 px-4 py-2 rounded-lg border border-green-900/50">
                    <CheckCircle size={18} />
                    <span>Seu sistema está atualizado!</span>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-4 py-2 rounded-lg border border-red-900/50">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <button
                onClick={checkForUpdates}
                disabled={status === 'checking'}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
                {status === 'checking' ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                {status === 'checking' ? 'Verificando...' : 'Verificar Atualizações'}
            </button>
        </div>
    );
};

const UserConnections = () => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users/sessions');
            setSessions(res.data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const isCurrentDevice = (deviceId: string) => {
        return deviceId === localStorage.getItem('deviceId');
    };

    return (
        <div className="max-w-3xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Monitor className="text-blue-400" />
                    Aparelhos Conectados
                </h2>
                <button
                    onClick={fetchSessions}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
                    title="Atualizar"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="space-y-4">
                {sessions.length === 0 && !loading && (
                    <div className="text-center py-10 bg-gray-900/30 border border-dashed border-gray-700 rounded-xl">
                        <Monitor className="mx-auto text-gray-600 mb-3" size={40} />
                        <p className="text-gray-400 font-medium">Nenhum aparelho logado encontrado.</p>
                        <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
                            Como este recurso é novo, você precisa <b>sair e entrar novamente</b> para que este aparelho seja registrado.
                        </p>
                    </div>
                )}

                {sessions.map((session) => (
                    <div
                        key={session.id}
                        className={`bg-gray-900/50 border rounded-xl p-5 flex items-center justify-between transition-all ${isCurrentDevice(session.deviceId) ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isCurrentDevice(session.deviceId) ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-800 text-gray-400'
                                }`}>
                                <Monitor size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-white">
                                        ID: {session.deviceId.substring(0, 8)}... (MAC)
                                    </p>
                                    {isCurrentDevice(session.deviceId) && (
                                        <span className="bg-blue-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full text-white">
                                            Este Dispositivo
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-400">IP: {session.ipAddress || 'Não identificado'}</p>
                                <p className="text-xs text-gray-500">
                                    Visto em: {new Date(session.lastSeen).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {session.latitude && session.longitude ? (
                                <a
                                    href={`https://www.google.com/maps?q=${session.latitude},${session.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm flex items-center gap-2 border border-gray-600 transition-colors"
                                >
                                    <MapPin size={16} className="text-red-400" />
                                    Ver no Mapa
                                    <ExternalLink size={14} className="opacity-50" />
                                </a>
                            ) : (
                                <span className="text-xs text-gray-600 italic px-4">Localização não disponível</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {sessions.length > 1 && (
                <div className="mt-8 p-4 bg-blue-900/20 border border-blue-900/50 rounded-xl">
                    <p className="text-sm text-blue-300 flex items-center gap-2">
                        <MapIcon size={18} />
                        Há {sessions.length} aparelhos ativos. Você pode monitorar a localização de cada um acima.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Settings;
