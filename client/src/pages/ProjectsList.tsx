import { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, MapPin, Search, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Project {
    id: string;
    name: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    createdAt: string;
}

const ProjectsList = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editFormData, setEditFormData] = useState({ name: '', city: '' });

    // Check permissions
    const canCreate = user?.role === 'admin' || user?.role === 'engineer';


    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full bg-gray-900 text-white p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Projetos</h1>
                        <p className="text-gray-400 mt-1">Gerencie suas redes e áreas de atuação</p>
                    </div>

                    {canCreate && (
                        <button
                            onClick={() => navigate('/projects/new')}
                            className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-medium text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                            <Plus size={20} className="relative z-10" />
                            <span className="relative z-10">Novo Projeto</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar projetos por nome ou cidade..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center text-gray-400 py-10">Carregando projetos...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => navigate(`/map?projectId=${project.id}`)}
                            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer group relative"
                        >
                            <div className="absolute top-4 right-4 flex gap-2">

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingProject(project);
                                        setEditFormData({ name: project.name, city: project.city || '' });
                                        setIsEditModalOpen(true);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Tem certeza que deseja excluir este projeto?')) {
                                            try {
                                                // First clear elements to be safe
                                                await api.delete(`/network-elements/project/${project.id}`);
                                                // Then delete project
                                                await api.delete(`/projects/${project.id}`);
                                                fetchProjects();
                                            } catch (err: any) {
                                                console.error('Error deleting project:', err);
                                                alert(`Erro ao excluir projeto: ${err.response?.data?.message || err.message}`);
                                            }
                                        }
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-gray-700 rounded-lg group-hover:bg-blue-900 group-hover:text-blue-200 transition-colors">
                                    <MapPin size={24} />
                                </div>
                                <span className="text-xs font-mono text-gray-500">#{project.id.slice(0, 8)}</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                            <p className="text-gray-400 text-sm mb-4">{project.city || 'Cidade não informada'}</p>

                            <div className="flex justify-between items-center text-sm text-gray-500 pt-4 border-t border-gray-700">
                                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                <span className="text-blue-400 group-hover:underline">Abrir Mapa →</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Editar Projeto</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Nome do Projeto</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={editFormData.name}
                                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Cidade</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                    value={editFormData.city}
                                    onChange={e => setEditFormData({ ...editFormData, city: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    if (!editingProject) return;
                                    try {
                                        await api.patch(`/projects/${editingProject.id}`, editFormData);
                                        setIsEditModalOpen(false);
                                        fetchProjects();
                                    } catch (err: any) {
                                        alert(`Erro ao atualizar: ${err.response?.data?.message || err.message}`);
                                    }
                                }}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
                            >
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsList;
