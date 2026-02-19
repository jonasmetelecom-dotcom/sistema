import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Activity, Server, ArrowLeft, AlertTriangle, Bell, BarChart3 } from 'lucide-react';
import api from '../services/api';

const MonitoringLayout = () => {
    const navigate = useNavigate();
    const [criticalCount, setCriticalCount] = useState(0);

    const fetchAlarmCount = async () => {
        try {
            const response = await api.get('/network-elements/alarms');
            const unacknowledged = response.data.filter((a: any) => !a.isAcknowledged && a.severity === 'critical');
            setCriticalCount(unacknowledged.length);
        } catch (error) {
            console.error('Error fetching alarm count:', error);
        }
    };

    useEffect(() => {
        fetchAlarmCount();
        const interval = setInterval(fetchAlarmCount, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
            {/* NOC Sidebar */}
            <aside className="w-64 flex flex-col border-r border-gray-800 bg-gray-900 z-20">
                <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-green-600 rounded-lg shadow-lg shadow-green-900/50">
                        <Activity size={24} className="text-white animate-pulse" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-tight">NOC CodeFibra</h2>
                        <span className="text-xs text-green-400 font-mono">ONLINE</span>
                    </div>
                </div>

                <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
                    <NavLink
                        to="/monitoring/dashboard"
                        className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-all ${isActive ? 'bg-green-900/20 text-green-400 border border-green-800' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <Activity size={20} />
                        <span className="font-medium">Visão Geral</span>
                    </NavLink>

                    <NavLink
                        to="/monitoring/equipments"
                        className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-all ${isActive ? 'bg-green-900/20 text-green-400 border border-green-800' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <Server size={20} />
                        <span className="font-medium">Equipamentos (OLT/RBS)</span>
                    </NavLink>

                    <NavLink
                        to="/monitoring/alarms"
                        className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-all ${isActive ? 'bg-green-900/20 text-green-400 border border-green-800' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <Bell size={20} />
                        <span className="font-medium">Histórico de Alarmes</span>
                    </NavLink>



                    <NavLink
                        to="/monitoring/reports"
                        className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-all ${isActive ? 'bg-green-900/20 text-green-400 border border-green-800' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                    >
                        <BarChart3 size={20} />
                        <span className="font-medium">Relatórios e BI</span>
                    </NavLink>

                    <div className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status Crítico
                    </div>

                    <div className={`transition-all border rounded-lg p-3 ${criticalCount > 0 ? 'bg-red-900/20 border-red-900/50' : 'bg-gray-900/10 border-gray-800/30'}`}>
                        <div className={`flex items-center gap-2 mb-1 ${criticalCount > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                            <AlertTriangle size={16} className={criticalCount > 0 ? 'animate-bounce' : ''} />
                            <span className="text-xs font-bold">Alertas Pendentes ({criticalCount})</span>
                        </div>
                        <div className="text-[10px] text-gray-500">
                            {criticalCount > 0 ? `Existem ${criticalCount} falhas não reconhecidas.` : 'Nenhum alerta crítico ativo.'}
                        </div>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={() => navigate('/projects')}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white w-full p-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        <span>Voltar aos Projetos</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden bg-black">
                {/* Header / Top Bar for Monitoring could go here */}
                <Outlet />
            </main>
        </div>
    );
};

export default MonitoringLayout;
