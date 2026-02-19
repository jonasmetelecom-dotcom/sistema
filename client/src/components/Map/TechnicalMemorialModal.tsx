import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Printer, MapPin, Database, Zap, FileSpreadsheet } from 'lucide-react';
import api from '../../services/api';

interface TechnicalMemorialData {
    projectName: string;
    customer: string;
    status: string;
    date: string;
    summary: {
        totalPoles: number;
        totalBoxes: number;
        totalCablesMeters: number;
        totalSplitters: number;
    };
    details: {
        boxes: Record<string, number>;
        cables: Record<string, number>;
    };
    bom: {
        items: Array<{
            item: string;
            quantity: number;
            unit: string;
            unitPrice: number;
            total: number;
        }>;
        grandTotal: number;
    };
}

interface TechnicalMemorialModalProps {
    projectId: string;
    onClose: () => void;
    mapImage?: string | null;
}

export const TechnicalMemorialModal = ({ projectId, onClose, mapImage }: TechnicalMemorialModalProps) => {
    const [data, setData] = useState<TechnicalMemorialData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editedPrices, setEditedPrices] = useState<any>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get(`/network-elements/project/${projectId}/technical-memorial`);
                setData(response.data);
            } catch (error) {
                console.error('Error fetching technical memorial:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId]);

    const handleSavePrices = async () => {
        setSaving(true);
        try {
            await api.patch(`/projects/${projectId}`, {
                settings: {
                    prices: editedPrices
                }
            });
            // Refresh data
            const response = await api.get(`/network-elements/project/${projectId}/technical-memorial`);
            setData(response.data);
            setIsEditing(false);
            alert('Preços atualizados com sucesso!');
        } catch (error) {
            console.error('Error saving prices:', error);
            alert('Erro ao salvar preços.');
        } finally {
            setSaving(false);
        }
    };

    const toggleEditing = () => {
        if (!isEditing && data) {
            setEditedPrices({});
        }
        setIsEditing(!isEditing);
    };

    const handleExportCSV = () => {
        if (!data?.bom?.items) return;

        // Add UTF-8 BOM for Excel compatibility
        const BOM = "\uFEFF";
        const headers = ['Item', 'Quantidade', 'Unidade', 'Preço Unitário (BRL)', 'Total (BRL)'];
        const csvRows = [
            headers.join(';'),
            ...data.bom.items.map(item => [
                `"${item.item}"`,
                item.quantity,
                item.unit,
                item.unitPrice.toString().replace('.', ','),
                item.total.toString().replace('.', ',')
            ].join(';'))
        ];

        const csvContent = BOM + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `BOM_${projectId.slice(0, 8)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return null;

    return createPortal(
        <div id="memorial-modal-root" className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0">
            <div className="bg-white text-gray-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col print:shadow-none print:max-h-full print:rounded-none">
                {/* Header */}
                <div className="bg-gray-900 text-white p-6 flex justify-between items-center print:hidden">
                    <div className="flex items-center gap-3">
                        <FileText className="text-blue-400" />
                        <div>
                            <h2 className="text-xl font-black tracking-tight">DOCUMENTAÇÃO TÉCNICA</h2>
                            <p className="text-[10px] text-blue-400 uppercase font-bold tracking-[0.2em]">Engenharia de Redes & Inventário</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExportCSV} className="p-2 hover:bg-gray-800 rounded-lg flex items-center gap-2 text-sm font-medium text-emerald-400">
                            <FileSpreadsheet size={18} /> CSV
                        </button>
                        <button onClick={handlePrint} className="p-2 hover:bg-gray-800 rounded-lg flex items-center gap-2 text-sm font-medium">
                            <Printer size={18} /> Imprimir
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div id="printable-memorial" className="p-10 font-sans leading-relaxed">
                    {/* Brand/Company Info Placeholder */}
                    <div className="flex justify-between items-start mb-10 border-b-2 border-gray-100 pb-6">
                        <div>
                            <h1 className="text-3xl font-black text-blue-600 tracking-tighter">FTTX OPS <span className="text-gray-400">ENGINEERING</span></h1>
                            <p className="text-sm text-gray-500">SaaS Network Management System</p>
                        </div>
                        <div className="text-right text-sm">
                            <p className="font-bold">Emissão:</p>
                            <p>{new Date(data?.date || Date.now()).toLocaleDateString('pt-BR')}</p>
                            <p className="text-gray-400 text-xs mt-1">Ref: {projectId.slice(0, 8)}</p>
                        </div>
                    </div>

                    {/* Project Identification */}
                    <section className="mb-10">
                        <h3 className="text-lg font-bold border-l-4 border-blue-500 pl-3 mb-4 bg-blue-50 py-1">1. IDENTIFICAÇÃO DO PROJETO</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Nome do Projeto</p>
                                <p className="text-lg font-black text-gray-800 uppercase">{data?.projectName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Cliente / Operadora</p>
                                <p className="text-lg font-bold text-blue-900">{data?.customer}</p>
                            </div>
                        </div>
                    </section>

                    {/* Technical Summary */}
                    <section className="mb-10">
                        <h3 className="text-lg font-bold border-l-4 border-blue-500 pl-3 mb-4 bg-blue-50 py-1">2. RESUMO EXECUTIVO DA INFRAESTRUTURA</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="border border-gray-200 p-4 rounded-xl text-center">
                                <Zap className="mx-auto mb-2 text-yellow-500" size={20} />
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Postes</p>
                                <p className="text-2xl font-black">{data?.summary.totalPoles}</p>
                            </div>
                            <div className="border border-gray-200 p-4 rounded-xl text-center">
                                <Database className="mx-auto mb-2 text-blue-500" size={20} />
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Caixas</p>
                                <p className="text-2xl font-black">{data?.summary.totalBoxes}</p>
                            </div>
                            <div className="border border-gray-200 p-4 rounded-xl text-center">
                                <MapPin className="mx-auto mb-2 text-pink-500" size={20} />
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Metragem Cabo</p>
                                <p className="text-xl font-black">{(data?.summary.totalCablesMeters || 0).toFixed(0)}m</p>
                            </div>
                            <div className="border border-gray-200 p-4 rounded-xl text-center">
                                <div className="mx-auto mb-2 text-green-500 font-bold text-lg">1:N</div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Splitters</p>
                                <p className="text-2xl font-black">{data?.summary.totalSplitters}</p>
                            </div>
                        </div>
                    </section>

                    {/* Detailed Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                        <section>
                            <h4 className="text-sm font-bold text-gray-400 mb-3 border-b flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span> DETALHAMENTO DE ATIVOS
                            </h4>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left bg-gray-50">
                                        <th className="py-2 px-3 font-bold border-b">Recurso</th>
                                        <th className="py-2 px-3 font-bold border-b text-right">Qtd.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data && Object.entries(data.details.boxes).map(([type, count]) => (
                                        <tr key={type} className="border-b border-gray-50">
                                            <td className="py-2 px-3 uppercase text-xs">{type}</td>
                                            <td className="py-2 px-3 text-right font-medium">{count} un</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>

                        <section>
                            <h4 className="text-sm font-bold text-gray-400 mb-3 border-b flex items-center gap-2">
                                <span className="w-2 h-2 bg-pink-500 rounded-full"></span> MALHA OPTICA (METROS)
                            </h4>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left bg-gray-50">
                                        <th className="py-2 px-3 font-bold border-b">Tipo do Cabo</th>
                                        <th className="py-2 px-3 font-bold border-b text-right">Extensão</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data && Object.entries(data.details.cables).map(([type, meters]) => (
                                        <tr key={type} className="border-b border-gray-50">
                                            <td className="py-2 px-3 uppercase text-xs">{type}</td>
                                            <td className="py-2 px-3 text-right font-medium font-mono">{(meters as number).toFixed(1)}m</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    </div>

                    {/* Map Capture Section */}
                    {mapImage && (
                        <section className="mb-10 break-inside-avoid">
                            <h3 className="text-lg font-bold border-l-4 border-blue-500 pl-3 mb-4 bg-blue-50 py-1">3. VISTA GERAL DO PROJETO</h3>
                            <div className="border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                <img
                                    src={mapImage}
                                    alt="Captura do Mapa"
                                    className="w-full h-auto object-cover"
                                />
                                <div className="bg-gray-50 p-2 text-[10px] text-gray-400 text-center italic">
                                    Imagem gerada automaticamente a partir da visão atual do console.
                                </div>
                            </div>
                        </section>
                    )}

                    {/* BOM Section */}
                    {data?.bom && (
                        <section className="mb-10 break-inside-avoid">
                            <div className="flex justify-between items-end mb-4">
                                <h3 className="text-lg font-bold border-l-4 border-emerald-500 pl-3 bg-emerald-50 py-1 uppercase">4. Estimativa de Custos (BOM)</h3>
                                <button
                                    onClick={isEditing ? handleSavePrices : toggleEditing}
                                    disabled={saving}
                                    className={`print:hidden px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${isEditing
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                                        : 'bg-white border-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                                        }`}
                                >
                                    {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Editar Preços'}
                                </button>
                            </div>
                            <div className="border border-emerald-100 rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-emerald-50 text-emerald-900">
                                            <th className="py-3 px-4 text-left font-black">Item / Descrição</th>
                                            <th className="py-3 px-2 text-center font-black">Qtd.</th>
                                            <th className="py-3 px-2 text-center font-black">Und.</th>
                                            <th className="py-3 px-4 text-right font-black">Preço Unit.</th>
                                            <th className="py-3 px-4 text-right font-black">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.bom.items.map((item, idx) => {
                                            // Identify item key for settings
                                            let priceKey = '';
                                            let category: 'pole' | 'box' | 'cable' | '' = '';

                                            if (item.item.toLowerCase().includes('posteação')) category = 'pole';
                                            else if (item.item.toLowerCase().includes('aluguel')) category = 'poleRental' as any;
                                            else if (item.item.toLowerCase().includes('caixa')) {
                                                category = 'box';
                                                priceKey = item.item.split(' ')[1]?.toLowerCase() || '';
                                            } else if (item.item.toLowerCase().includes('cabo')) {
                                                category = 'cable';
                                                priceKey = item.item.split(' ')[1]?.toLowerCase() || '';
                                            }

                                            return (
                                                <tr key={idx} className="border-b border-emerald-50 hover:bg-emerald-50/30 transition-colors">
                                                    <td className="py-3 px-4 font-medium text-gray-700 uppercase">{item.item}</td>
                                                    <td className="py-3 px-2 text-center font-mono">{item.quantity}</td>
                                                    <td className="py-3 px-2 text-center text-gray-500 text-xs">{item.unit}</td>
                                                    <td className="py-3 px-4 text-right text-gray-600 font-mono">
                                                        {isEditing ? (
                                                            <input
                                                                type="number"
                                                                className="w-20 bg-white border border-emerald-200 rounded px-2 py-1 text-right text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                                                                defaultValue={item.unitPrice}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    setEditedPrices((prev: any) => {
                                                                        const next = { ...prev };
                                                                        if (category === 'pole') next.pole = val;
                                                                        else if (category === ('poleRental' as any)) next.poleRental = val;
                                                                        else if (category === 'box') {
                                                                            next.box = { ...next.box, [priceKey]: val };
                                                                        } else if (category === 'cable') {
                                                                            next.cable = { ...next.cable, [priceKey]: val };
                                                                        }
                                                                        return next;
                                                                    });
                                                                }}
                                                            />
                                                        ) : (
                                                            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-black text-emerald-700 font-mono">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-900 text-white">
                                            <td colSpan={4} className="py-4 px-4 text-right font-bold uppercase tracking-widest text-xs">Valor Total Estimado</td>
                                            <td className="py-4 px-4 text-right font-black text-lg">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.bom.grandTotal)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <p className="mt-3 text-[10px] text-emerald-600 font-medium italic">
                                * Valores baseados em tabelas referenciais de mercado. Sujeitos a alteração conforme fornecedor.
                            </p>
                        </section>
                    )}

                    {/* Notes */}
                    <section className="mt-12 p-8 bg-blue-50/50 border-2 border-blue-100 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <FileText size={80} className="text-blue-900" />
                        </div>
                        <h4 className="text-[10px] font-black text-blue-900 uppercase mb-3 tracking-widest">Observações de Engenharia</h4>
                        <p className="text-xs text-blue-800 leading-relaxed max-w-2xl">
                            Este documento constitui o registro oficial da infraestrutura implantada, gerado via sistema <strong>FTTX OPS</strong>.
                            As metragens de cabos contemplam as reservas técnicas (Slacks) informadas em projeto.
                            Recomenda-se a validação física dos sinais (Link Budget) através de certificação óptica em campo após o lançamento da rede.
                        </p>
                    </section>

                    {/* Footer / Signatures */}
                    <div className="mt-20 grid grid-cols-2 gap-20 print:mt-10">
                        <div className="text-center">
                            <div className="border-t border-gray-300 pt-2 text-xs">Engenheiro Responsável / Projetista</div>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-gray-300 pt-2 text-xs">Data de Recebimento da Obra</div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons print:hidden */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 print:hidden">
                    <button onClick={onClose} className="px-6 py-2 text-gray-500 hover:text-gray-900 font-medium transition-colors">
                        Fechar Visualização
                    </button>
                    <button onClick={handlePrint} className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95">
                        Gerar PDF / Imprimir
                    </button>
                </div>
            </div>

            {/* Print styles - DEFINITIVE PORTAL-BASED FIX */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { 
                        size: A4;
                        margin: 1.5cm; 
                    }

                    /* 1. Global Reset for Print */
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                        position: static !important;
                        background: white !important;
                    }

                    /* 2. Hide everything except our portal parent (hides #root) */
                    body > *:not(#memorial-modal-root) {
                        display: none !important;
                    }

                    /* 3. Re-enable our root */
                    #memorial-modal-root {
                        visibility: visible !important;
                        display: block !important;
                        position: static !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: white !important;
                    }

                    /* 4. Flatten the container box */
                    #memorial-modal-root > div {
                        display: block !important;
                        position: static !important;
                        width: 100% !important;
                        max-width: none !important;
                        height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        transform: none !important;
                    }

                    #printable-memorial {
                        padding: 0 !important;
                        display: block !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                    }

                    /* 5. Content Flow */
                    section {
                        break-inside: auto !important;
                        page-break-inside: auto !important;
                        display: block !important;
                        width: 100% !important;
                        margin-bottom: 2rem !important;
                    }

                    img {
                        max-width: 100% !important;
                        height: auto !important;
                        max-height: 12cm !important;
                        object-fit: contain !important;
                        display: block !important;
                        margin: 1rem auto !important;
                    }

                    table {
                        width: 100% !important;
                        table-layout: auto !important;
                        break-inside: auto !important;
                    }

                    * { 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                        visibility: visible !important;
                    }

                    .print\\:hidden { 
                        display: none !important; 
                    }
                }
            `}} />
        </div>,
        document.body
    );
};
