import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import api from '../../services/api';

export const UpdateBanner = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [commitsBehind, setCommitsBehind] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const checkUpdate = async () => {
            // Avoid checking too often in dev
            if (import.meta.env.DEV) return;

            try {
                const res = await api.get('/system/check-update');
                if (res.data.updateAvailable) {
                    setUpdateAvailable(true);
                    setCommitsBehind(res.data.commitsBehind);
                }
            } catch (error) {
                console.error('Failed to check for updates', error);
            }
        };

        checkUpdate();
        // Check every hour
        const interval = setInterval(checkUpdate, 3600000);
        return () => clearInterval(interval);
    }, []);

    if (!updateAvailable || !visible) return null;

    return (
        <div className="bg-blue-600 text-white px-4 py-3 shadow-lg relative z-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                    <Download size={20} className="animate-bounce" />
                </div>
                <div>
                    <p className="font-bold">Nova atualização disponível!</p>
                    <p className="text-sm text-blue-100">
                        O sistema está {commitsBehind} versões atrás.
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden md:block text-sm text-blue-100">
                    Versão desatualizada
                </div>
                <button
                    onClick={async () => {
                        try {
                            if (confirm('Isso irá fechar o servidor e iniciar o processo de atualização. O sistema ficará indisponível por alguns minutos. Deseja continuar?')) {
                                await api.post('/system/trigger-update');
                                alert('Atualização iniciada! Por favor, aguarde alguns instantes e recarregue a página.');
                                setVisible(false);
                            }
                        } catch (e) {
                            alert('Erro ao iniciar atualização: ' + e);
                        }
                    }}
                    className="bg-white text-blue-600 px-3 py-1 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm"
                >
                    Atualizar Agora
                </button>
                <button
                    onClick={() => setVisible(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    title="Lembrar depois"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};
