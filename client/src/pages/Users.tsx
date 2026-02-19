import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, Search, User as UserIcon, Shield, Mail } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user'
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // Update
                const updateData = { ...formData };
                if (!updateData.password) delete (updateData as any).password;

                await api.patch(`/users/${editingUser.id}`, updateData);
            } else {
                // Create
                await api.post('/users', formData);
            }
            setIsModalOpen(false);
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'user' });
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Erro ao salvar usuário.');
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Search doesn't return password
            role: user.role
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Erro ao excluir usuário.');
        }
    };

    const openNewUserModal = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'user' });
        setIsModalOpen(true);
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-gray-900 text-white p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <UserIcon className="text-blue-500" />
                        Gestão de Usuários
                    </h1>
                    <p className="text-gray-400">Gerencie quem tem acesso ao sistema</p>
                </div>
                <button
                    onClick={openNewUserModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Novo Usuário
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-gray-800 p-4 rounded-xl mb-6 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 bg-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-900/50 border-b border-gray-700 text-gray-400 uppercase text-xs">
                                <th className="p-4 font-semibold">Nome</th>
                                <th className="p-4 font-semibold">Email</th>
                                <th className="p-4 font-semibold">Permissão</th>
                                <th className="p-4 font-semibold">Criado em</th>
                                <th className="p-4 font-semibold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">Carregando usuários...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">Nenhum usuário encontrado.</td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 font-medium text-white flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            {user.name}
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} className="text-gray-500" />
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${user.role === 'admin'
                                                    ? 'bg-purple-900/30 text-purple-400 border-purple-900/50'
                                                    : user.role === 'engineer'
                                                        ? 'bg-blue-900/30 text-blue-400 border-blue-900/50'
                                                        : 'bg-gray-700/50 text-gray-400 border-gray-600'
                                                }`}>
                                                <Shield size={10} />
                                                {user.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">
                            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                        </h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    Senha {editingUser && <span className="text-xs text-gray-500">(Deixe em branco para manter)</span>}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    minLength={6}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Permissão</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                                >
                                    <option value="user">Usuário (Padrão)</option>
                                    <option value="engineer">Engenheiro</option>
                                    <option value="admin">Administrador</option>
                                    <option value="viewer">Visualizador</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-300 hover:text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
