import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map as MapIcon, Users, Settings, FolderOpen, Building2, LogOut, Menu, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';

const BottomNav = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isTechnicianMode, toggleTechnicianMode } = useUIStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-gray-950 border-t border-gray-800 flex justify-around items-center h-16 z-50 md:hidden pb-safe">
                <NavLink
                    to="/projects"
                    className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-blue-500' : 'text-gray-400'}`}
                >
                    <FolderOpen size={20} />
                    <span className="text-xs mt-1">Projetos</span>
                </NavLink>

                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-blue-500' : 'text-gray-400'}`}
                >
                    <LayoutDashboard size={20} />
                    <span className="text-xs mt-1">Dash</span>
                </NavLink>

                {/* Central Map Button - Emphasized */}
                <div className="relative -top-5">
                    <NavLink
                        to="/map"
                        className={({ isActive }) => `flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 border-4 border-gray-900 shadow-lg ${isActive ? 'text-white' : 'text-gray-200'}`}
                    >
                        <MapIcon size={24} />
                    </NavLink>
                </div>

                <NavLink
                    to="/users"
                    className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-blue-500' : 'text-gray-400'}`}
                >
                    <Users size={20} />
                    <span className="text-xs mt-1">Users</span>
                </NavLink>

                <button
                    onClick={() => setIsMenuOpen(true)}
                    className={`flex flex-col items-center justify-center w-full h-full ${isMenuOpen ? 'text-blue-500' : 'text-gray-400'}`}
                >
                    <Menu size={20} />
                    <span className="text-xs mt-1">Menu</span>
                </button>
            </div>

            {/* Mobile Menu Drawer (for extra items) */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[60] md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Drawer Content */}
                    <div className="absolute bottom-0 left-0 w-full bg-gray-900 rounded-t-2xl p-4 border-t border-gray-800 animate-slide-up">
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    toggleTechnicianMode();
                                    setIsMenuOpen(false);
                                }}
                                className={`flex flex-col items-center p-4 rounded-xl active:bg-gray-700 transition-colors ${isTechnicianMode ? 'bg-green-900/30 border border-green-800' : 'bg-gray-800'}`}
                            >
                                <Zap size={24} className={`mb-2 ${isTechnicianMode ? 'text-green-400' : 'text-gray-400'}`} />
                                <span className={`text-sm ${isTechnicianMode ? 'text-green-400 font-medium' : 'text-gray-400'}`}>
                                    {isTechnicianMode ? 'Modo Técnico' : 'Modo Engenheiro'}
                                </span>
                            </button>

                            {user?.role === 'admin' && (
                                <NavLink
                                    to="/tenants"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex flex-col items-center p-4 bg-gray-800 rounded-xl active:bg-gray-700"
                                >
                                    <Building2 size={24} className="mb-2 text-purple-400" />
                                    <span className="text-sm">Empresas</span>
                                </NavLink>
                            )}

                            <NavLink
                                to="/settings"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex flex-col items-center p-4 bg-gray-800 rounded-xl active:bg-gray-700"
                            >
                                <Settings size={24} className="mb-2 text-cyan-400" />
                                <span className="text-sm">Configurações</span>
                            </NavLink>

                            <button
                                onClick={handleLogout}
                                className="col-span-2 flex items-center justify-center p-4 bg-red-900/20 text-red-400 rounded-xl active:bg-red-900/40 mt-2"
                            >
                                <LogOut size={20} className="mr-2" />
                                <span className="text-sm font-medium">Sair do Sistema</span>
                            </button>
                        </div>

                        <div className="mt-6 text-center text-xs text-gray-500">
                            Logado como {user?.name} ({user?.role})
                        </div>
                        <div className="h-6" /> {/* Safe area spacer */}
                    </div>
                </div>
            )}
        </>
    );
};

export default BottomNav;
