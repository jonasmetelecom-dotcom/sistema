import { useState } from 'react';
import { Zap, Box, Cable as CableIcon, MousePointer2, Settings2, Trash2, Package, FileText, Layers, PieChart, Ruler, Menu, ChevronLeft, Home, Radio, HardDrive, Undo2, Redo2, Sparkles, Activity } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export type ToolType = 'select' | 'pole' | 'box' | 'cable' | 'rbs' | 'ruler' | 'customer' | 'heatmap';

interface ToolbarItemProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    className?: string;
}

const ToolbarItem = ({ active, onClick, icon, label, className }: ToolbarItemProps) => (
    <button
        onClick={onClick}
        title={label}
        className={`p-2 sm:p-3 rounded-lg flex flex-col items-center gap-1 transition-all ${active
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
            : `bg-gray-800 border border-gray-700 ${className || 'text-gray-400 hover:bg-gray-700 hover:text-white'}`
            } `}
    >
        {icon}
        <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
);

interface NetworkToolbarProps {
    activeTool: ToolType;
    onToolChange: (tool: ToolType) => void;
    onImportExport?: () => void;
    cableSettings?: { type: string, fiberCount: number };
    onCableSettingsChange?: (settings: { type: string, fiberCount: number }) => void;
    boxSettings?: { type: string, capacity: number };
    onBoxSettingsChange?: (settings: { type: string, capacity: number }) => void;
    onClearProject?: () => void;
    onToggleInventory?: () => void;
    onOpenMetrics?: () => void;
    onOpenMemorial?: () => void;
    showInventory?: boolean;
    showCoverage?: boolean;
    onToggleCoverage?: () => void;
    snapConfig?: { enabled: boolean, radius: number };
    onSnapConfigChange?: (config: { enabled: boolean, radius: number }) => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    readOnly?: boolean;
    showDifferential?: boolean;
    onToggleDifferential?: () => void;
    hasImpactAnalysis?: boolean;
    onClearImpact?: () => void;
    showHeatmap?: boolean;
    onToggleHeatmap?: () => void;
    onExpansionAnalysis?: () => void;
    isAnalyzingExpansion?: boolean;
}

export const NetworkToolbar = ({
    activeTool,
    onToolChange,
    onImportExport,
    cableSettings,
    onCableSettingsChange,
    boxSettings,
    onBoxSettingsChange,
    onClearProject,
    onToggleInventory,
    onOpenMetrics,
    onOpenMemorial,
    showInventory,
    showCoverage,
    onToggleCoverage,
    snapConfig,
    onSnapConfigChange,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    readOnly,
    showDifferential,
    onToggleDifferential,
    hasImpactAnalysis,
    onClearImpact,
    showHeatmap,
    onToggleHeatmap,
    onExpansionAnalysis,
    isAnalyzingExpansion
}: NetworkToolbarProps) => {
    const { isTechnicianMode } = useUIStore();
    const [isExpanded, setIsExpanded] = useState(false);

    if (readOnly) return null;

    if (!isExpanded) {
        return (
            <div className="absolute top-4 left-4 z-[1000]">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="p-3 sm:p-4 bg-gray-900 border border-gray-700 text-blue-400 rounded-2xl shadow-2xl hover:bg-gray-800 transition-all active:scale-95 flex flex-col items-center gap-1 group"
                >
                    <Menu size={20} className="sm:size-24 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">Ferramentas</span>
                </button>
            </div>
        );
    }

    return (
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-[1000] flex flex-col gap-2 bg-gray-950/80 p-2 rounded-2xl backdrop-blur-xl border border-white/10 animate-in slide-in-from-left-4 duration-300 shadow-2xl ring-1 ring-white/5">
            <button
                onClick={() => setIsExpanded(false)}
                className="p-2 mb-1 sm:mb-2 bg-gray-900/50 hover:bg-gray-800 text-gray-400 rounded-xl flex items-center justify-center transition-all border border-gray-800 hover:text-white group"
                title="Recolher menu"
            >
                <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Scrollable Tool List Area */}
            <div className="flex flex-col gap-2 max-h-[65vh] overflow-y-auto custom-scrollbar pr-1 -mr-1">
                <ToolbarItem
                    active={activeTool === 'select'}
                    onClick={() => onToolChange('select')}
                    icon={<MousePointer2 size={20} />}
                    label="Select"
                />
                <ToolbarItem
                    active={activeTool === 'ruler'}
                    onClick={() => onToolChange('ruler')}
                    icon={<Ruler size={20} />}
                    label="Régua"
                    className="text-white"
                />
                <ToolbarItem
                    active={!!showCoverage}
                    onClick={() => onToggleCoverage && onToggleCoverage()}
                    icon={<Layers size={20} />}
                    label="Alcance"
                    className="text-orange-400"
                />
                <ToolbarItem
                    active={!!showInventory}
                    onClick={() => onToggleInventory && onToggleInventory()}
                    icon={<Package size={20} />}
                    label="BOM"
                    className="text-blue-400"
                />
                <ToolbarItem
                    active={false}
                    onClick={() => onOpenMetrics && onOpenMetrics()}
                    icon={<PieChart size={20} />}
                    label="Dashboard"
                    className="text-cyan-400"
                />
                <ToolbarItem
                    active={false}
                    onClick={() => onOpenMemorial && onOpenMemorial()}
                    icon={<FileText size={20} />}
                    label="Memorial"
                    className="text-gray-300"
                />

                <div className="h-px bg-gray-700 my-1 mx-2" />

                <ToolbarItem
                    active={!!snapConfig?.enabled}
                    onClick={() => onSnapConfigChange?.({ ...snapConfig!, enabled: !snapConfig?.enabled })}
                    icon={<Layers size={20} className={snapConfig?.enabled ? "text-blue-400" : "text-gray-500"} />}
                    label="Snap"
                    className={snapConfig?.enabled ? "text-blue-400" : "text-gray-500"}
                />

                <div className="flex gap-2">
                    <button
                        disabled={!canUndo}
                        onClick={onUndo}
                        className={`p-2 rounded-lg flex-1 flex flex-col items-center gap-1 transition-all border border-gray-700 ${canUndo ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-600 opacity-50 cursor-not-allowed'}`}
                        title="Desfazer"
                    >
                        <Undo2 size={16} />
                        <span className="text-[8px] uppercase">Desfazer</span>
                    </button>
                    <button
                        disabled={!canRedo}
                        onClick={onRedo}
                        className={`p-2 rounded-lg flex-1 flex flex-col items-center gap-1 transition-all border border-gray-700 ${canRedo ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-600 opacity-50 cursor-not-allowed'}`}
                        title="Refazer"
                    >
                        <Redo2 size={16} />
                        <span className="text-[8px] uppercase">Refazer</span>
                    </button>
                </div>

                {!readOnly && !isTechnicianMode && (
                    <>
                        <ToolbarItem
                            active={showDifferential || false}
                            onClick={() => onToggleDifferential?.()}
                            icon={<PieChart size={18} className={showDifferential ? 'text-white' : 'text-purple-400'} />}
                            label="Diferencial"
                        />

                        <ToolbarItem
                            active={showHeatmap || false}
                            onClick={() => onToggleHeatmap?.()}
                            icon={<Layers size={18} className={showHeatmap ? 'text-white' : 'text-orange-400'} />}
                            label="Heatmap"
                        />

                        <ToolbarItem
                            active={false}
                            onClick={() => onExpansionAnalysis?.()}
                            icon={<Sparkles size={18} className={isAnalyzingExpansion ? 'animate-spin text-yellow-400' : 'text-blue-400'} />}
                            label="Expansão"
                        />

                        {hasImpactAnalysis && (
                            <ToolbarItem
                                active={true}
                                onClick={() => onClearImpact?.()}
                                icon={<Zap size={18} className="text-white animate-pulse" />}
                                label="Limpar Impacto"
                                className="!bg-red-600 !border-red-400"
                            />
                        )}

                        <div className="w-full h-px bg-gray-800 my-1" />
                        <div className="h-px bg-gray-700 my-1 mx-2" />
                        <ToolbarItem
                            active={activeTool === 'pole'}
                            onClick={() => onToolChange('pole')}
                            icon={<Zap size={20} />}
                            label="Poste"
                            className="text-yellow-400"
                        />
                        <ToolbarItem
                            active={activeTool === 'box'}
                            onClick={() => onToolChange('box')}
                            icon={<Box size={20} />}
                            label="Caixa"
                            className="text-green-400"
                        />
                        <ToolbarItem
                            active={activeTool === 'cable'}
                            onClick={() => onToolChange('cable')}
                            icon={<CableIcon size={20} />}
                            label="Cabo"
                            className="text-pink-400"
                        />
                        <ToolbarItem
                            active={activeTool === 'customer'}
                            onClick={() => onToolChange('customer')}
                            icon={<Home size={20} />}
                            label="Cliente"
                            className="text-cyan-400"
                        />
                        <ToolbarItem
                            active={activeTool === 'rbs'}
                            onClick={() => onToolChange('rbs')}
                            icon={<Radio size={20} />}
                            label="RBS"
                            className="text-purple-400"
                        />
                    </>
                )}
            </div>

            {/* Float Settings Popovers - Outside Scroll Area */}
            <div className="relative">
                {activeTool === 'cable' && cableSettings && onCableSettingsChange && (
                    <div className="fixed inset-x-4 bottom-24 sm:absolute sm:inset-auto sm:left-[calc(100%+0.75rem)] sm:top-[-10rem] bg-gray-950/95 border border-white/10 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-auto sm:w-56 flex flex-col gap-4 animate-in slide-in-from-bottom sm:slide-in-from-left-4 duration-300 backdrop-blur-2xl ring-1 ring-white/10 z-[1001]">
                        <div className="flex items-center gap-3 text-pink-400 border-b border-white/5 pb-3">
                            <div className="p-2 bg-pink-500/10 rounded-lg">
                                <Settings2 size={16} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">Ajustes de Cabo</span>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider ml-1">Modelo de Lançamento</label>
                                <select
                                    value={cableSettings.type}
                                    onChange={(e) => onCableSettingsChange({ ...cableSettings, type: e.target.value })}
                                    className="w-full bg-gray-900 border border-white/10 rounded-xl text-xs text-white p-2.5 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 outline-none transition-all appearance-none cursor-pointer"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'org/19/9 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                                >
                                    <option value="drop">Cabo Drop (Compacto)</option>
                                    <option value="as80">Cabo AS80</option>
                                    <option value="as120">Cabo AS120</option>
                                    <option value="underground">Cabo Subterrâneo</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider ml-1">Capacidade (Fibras)</label>
                                <select
                                    value={cableSettings.fiberCount}
                                    onChange={(e) => onCableSettingsChange({ ...cableSettings, fiberCount: parseInt(e.target.value) })}
                                    className="w-full bg-gray-900 border border-white/10 rounded-xl text-xs text-white p-2.5 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/50 outline-none transition-all appearance-none cursor-pointer"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'org/19/9 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                                >
                                    {[1, 2, 4, 6, 12, 24, 36, 48, 72, 144].map(val => (
                                        <option key={val} value={val}>{val} FO{val === 1 ? ' (Drop)' : ''}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-1 p-2 bg-pink-500/5 border border-pink-500/10 rounded-lg">
                            <p className="text-[9px] text-pink-400/80 leading-tight">Os cabos serão lançados automaticamente com estas especificações.</p>
                        </div>
                    </div>
                )}

                {activeTool === 'box' && boxSettings && onBoxSettingsChange && (
                    <div className="fixed inset-x-4 bottom-24 sm:absolute sm:inset-auto sm:left-[calc(100%+0.75rem)] sm:top-[-10rem] bg-gray-950/95 border border-white/10 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-auto sm:w-56 flex flex-col gap-4 animate-in slide-in-from-bottom sm:slide-in-from-left-4 duration-300 backdrop-blur-2xl ring-1 ring-white/10 z-[1001]">
                        <div className="flex items-center gap-3 text-green-400 border-b border-white/5 pb-3">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <Settings2 size={16} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">Ajustes de Caixa</span>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider ml-1">Tipo de Equipamento</label>
                                <select
                                    value={boxSettings.type}
                                    onChange={(e) => onBoxSettingsChange({ ...boxSettings, type: e.target.value })}
                                    className="w-full bg-gray-900 border border-white/10 rounded-xl text-xs text-white p-2.5 focus:border-green-500 focus:ring-1 focus:ring-green-500/50 outline-none transition-all appearance-none cursor-pointer"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'org/19/9 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                                >
                                    <option value="cto">CTO (Atendimento)</option>
                                    <option value="ceo">CEO (Emenda)</option>
                                    <option value="splice_closure">Subterrânea</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider ml-1">Capacidade / Portas</label>
                                <select
                                    value={boxSettings.capacity}
                                    onChange={(e) => onBoxSettingsChange({ ...boxSettings, capacity: parseInt(e.target.value) })}
                                    className="w-full bg-gray-900 border border-white/10 rounded-xl text-xs text-white p-2.5 focus:border-green-500 focus:ring-1 focus:ring-green-500/50 outline-none transition-all appearance-none cursor-pointer"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'org/19/9 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                                >
                                    {[8, 16, 24, 48, 72, 144].map(val => (
                                        <option key={val} value={val}>{val} {val <= 24 ? 'Portas' : 'Fusões'}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {!readOnly && !isTechnicianMode && (
                <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                    <ToolbarItem
                        active={false}
                        onClick={onImportExport || (() => { })}
                        icon={<HardDrive size={20} className="text-blue-400" />}
                        label="Arquivos"
                        className="text-gray-400 hover:text-white"
                    />
                    <ToolbarItem
                        active={false}
                        onClick={() => {
                            if (window.confirm('Tem certeza? Isso apagará TODOS os elementos deste projeto (Postes, Caixas, Cabos). Essa ação não pode ser desfeita.')) {
                                onClearProject && onClearProject();
                            }
                        }}
                        icon={<Trash2 size={20} />}
                        label="Limpar"
                        className="text-red-500 hover:text-red-400"
                    />
                </div>
            )}
        </div>
    );
};
