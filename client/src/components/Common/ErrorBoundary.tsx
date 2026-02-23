import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                    <div className="bg-gray-800 border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">Ops! Algo deu errado</h1>
                        <p className="text-gray-400 mb-8 text-sm">
                            Ocorreu um erro inesperado na interface. Isso pode acontecer devido a falhas de conexão ou problemas de processamento.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95"
                            >
                                <RefreshCw size={20} />
                                Recarregar Página
                            </button>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95"
                            >
                                <Home size={20} />
                                Voltar ao Início
                            </button>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-8 p-4 bg-black/40 rounded-lg text-left overflow-auto max-h-40">
                                <p className="text-[10px] font-mono text-red-400 break-all">
                                    {this.state.error?.toString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.children;
    }
}

export default ErrorBoundary;
