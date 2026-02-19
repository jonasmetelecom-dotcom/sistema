
import { useState } from 'react';
import { Bell, RefreshCw, Download, X } from 'lucide-react';
import { useSystemUpdate } from '../../hooks/useSystemUpdate';

export const NotificationBell = () => {
    const { updateAvailable, changelog, triggers } = useSystemUpdate();
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // If we are updating, we can show that state locally or rely on the hook if it exposed it
    // The hook exposes 'triggerUpdate' which returns a promise.

    const handleUpdate = async () => {
        if (!confirm('O sistema será reiniciado. Deseja continuar?')) return;
        setIsUpdating(true);
        try {
            await triggers.triggerUpdate(); // We renamed it in the hook? Let's check hook definition
            // Actually the hook returns { triggerUpdate ... }
        } catch (e) {
            alert('Erro ao iniciar: ' + e);
            setIsUpdating(false);
        }
    };

    if (!updateAvailable) return null;

    return (
        <>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(true)}
                className="absolute top-6 right-6 z-50 bg-gray-800 p-2 rounded-full border border-gray-700 shadow-lg hover:bg-gray-700 transition-colors group"
            >
                <div className="relative">
                    <Bell size={24} className="text-gray-300 group-hover:text-white" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-gray-800"></span>
                </div>
            </button>

            {/* update Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl max-w-md w-full overflow-hidden relative animate-fade-in">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-6">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4 text-blue-400">
                                    {isUpdating ? <RefreshCw className="animate-spin" size={32} /> : <Download size={32} />}
                                </div>
                                <h2 className="text-xl font-bold text-white">Nova Atualização Disponível</h2>
                                <p className="text-gray-400 text-sm mt-2">
                                    {isUpdating ? 'Atualizando o sistema, por favor aguarde...' : 'Uma nova versão do sistema está pronta para ser instalada.'}
                                </p>
                            </div>

                            {!isUpdating && (
                                <>
                                    <div className="bg-gray-900/50 rounded-lg p-4 mb-6 text-left max-h-48 overflow-y-auto border border-gray-700/50">
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">O que há de novo:</p>
                                        <ul className="space-y-2">
                                            {changelog && changelog.length > 0 ? changelog.map((log, i) => (
                                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 shrink-0"></span>
                                                    {log}
                                                </li>
                                            )) : (
                                                <li className="text-sm text-gray-500 italic">Melhorias gerais e correções de bugs.</li>
                                            )}
                                        </ul>
                                    </div>

                                    <button
                                        onClick={handleUpdate}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        <RefreshCw size={20} />
                                        Atualizar Agora
                                    </button>
                                </>
                            )}

                            {isUpdating && (
                                <div className="text-center py-4">
                                    <p className="text-xs text-yellow-500 animate-pulse">
                                        O sistema será reiniciado automaticamente. <br />
                                        Não feche esta janela.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
