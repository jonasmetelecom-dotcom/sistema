import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map as MapIcon, Users, Settings, FolderOpen, LogOut, Activity, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import BottomNav from '../components/Layout/BottomNav';
import { UpdateBanner } from '../components/Layout/UpdateBanner';
import { NotificationBell } from '../components/Layout/NotificationBell';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
            {/* Sidebar - Hidden on Mobile */}
            <aside className="w-16 hidden md:flex flex-col items-center py-4 border-r border-gray-800 bg-gray-950 z-20">
                <div className="mb-8 p-2 bg-blue-600 rounded-lg">
                    <MapIcon size={24} className="text-white" />
                </div>

                <nav className="flex flex-col gap-4 flex-1 w-full px-2 items-center">
                    <NavLink to="/projects" className={({ isActive }) => `p-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`} title="Projetos">
                        <FolderOpen size={24} />
                    </NavLink>
                    <NavLink to="/dashboard" className={({ isActive }) => `p-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`} title="Dashboard">
                        <LayoutDashboard size={24} />
                    </NavLink>
                    <NavLink to="/monitoring" className={({ isActive }) => `p-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`} title="Monitoramento (NOC)">
                        <Activity size={24} />
                    </NavLink>
                    <NavLink to="/users" className={({ isActive }) => `p-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`} title="Usuários">
                        <Users size={24} />
                    </NavLink>

                    {/* Super Admin Global Link */}
                    {user?.role === 'super_admin' && (
                        <NavLink to="/admin/tenants" className={({ isActive }) => `p-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`} title="Gestão Master (Empresas)">
                            <Shield size={24} />
                        </NavLink>
                    )}

                    <NavLink to="/audit-logs" className={({ isActive }) => `p-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`} title="Logs de Auditoria">
                        <Activity size={24} />
                    </NavLink>

                    <div className="mt-auto flex flex-col gap-4 items-center w-full">
                        <NavLink to="/settings" className={({ isActive }) => `p-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`} title="Configurações">
                            <Settings size={24} />
                        </NavLink>

                        <button
                            onClick={handleLogout}
                            className="p-3 rounded-lg cursor-pointer transition-colors text-red-400 hover:bg-red-900/30 hover:text-red-300 mb-2"
                            title="Sair"
                        >
                            <LogOut size={24} />
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative pb-20 md:pb-0 overflow-y-auto md:overflow-hidden flex flex-col">
                <NotificationBell />
                <UpdateBanner />
                <Outlet />
            </main>

            {/* Bottom Nav - Visible on Mobile */}
            <div className="md:hidden">
                <BottomNav />
            </div>
        </div>
    );
};

export default Layout;
