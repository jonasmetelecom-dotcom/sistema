import { useState } from 'react';
import { X, Upload, Download, FileJson, MapPin, HardDrive, FileText, FileSpreadsheet } from 'lucide-react';
import api from '../../services/api';

import { generateFusionDiagram } from '../../utils/FusionDiagramGenerator';

interface ImportExportModalProps {
    projectId: string;
    onClose: () => void;
    onImportSuccess: () => void;
}

export const ImportExportModal = ({ projectId, onClose, onImportSuccess }: ImportExportModalProps) => {
    const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) return;
        setLoading(true);
        setStatus('Importando...');

        const formData = new FormData();
        formData.append('file', file);

        const format = file.name.endsWith('.kml') || file.name.endsWith('.xml') ? 'kml' : 'geojson';

        try {
            const response = await api.post(`/import-export/${format}/${projectId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const summary = response.data.summary;
            setStatus(`Importado com sucesso! Postes: ${summary.poles}, Caixas: ${summary.boxes}, Cabos: ${summary.cables}`);
            onImportSuccess();
            setFile(null);
        } catch (error) {
            console.error('Import error:', error);
            setStatus('Erro ao importar arquivo.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format: 'kml' | 'geojson' | 'csv' = 'kml') => {
        setLoading(true);
        setStatus(`Gerando ${format.toUpperCase()}...`);
        try {
            let endpoint = `/import-export/${format}/${projectId}`;
            if (format === 'csv') {
                endpoint = `/import-export/boxes/csv/${projectId}`;
            }

            const response = await api.get(endpoint, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            let filename = `projeto_rede.${format}`;
            if (format === 'csv') filename = `lista_ctos_${projectId.slice(0, 8)}.csv`;

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setStatus('Exportação concluída.');
        } catch (error) {
            console.error('Export error:', error);
            setStatus('Erro ao exportar arquivo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950/50">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <HardDrive size={20} className="text-blue-400" />
                        Gestão de Arquivos do Projeto
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800">
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'import'
                            ? 'bg-gray-800/50 text-blue-400 border-b-2 border-blue-400'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                            }`}
                    >
                        Importar (KML/KMZ)
                    </button>
                    <button
                        onClick={() => setActiveTab('export')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'export'
                            ? 'bg-gray-800/50 text-blue-400 border-b-2 border-blue-400'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                            }`}
                    >
                        Exportar Projeto
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'import' && (
                        <div className="flex flex-col gap-4">
                            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-gray-600 transition-colors bg-gray-950/30">
                                <Upload size={32} className="text-gray-500 mb-2" />
                                <p className="text-sm text-gray-400 mb-4">Selecione .kml, .kmz ou .geojson</p>
                                <input
                                    type="file"
                                    accept=".kml,.xml,.json,.geojson"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors"
                                >
                                    Escolher Arquivo
                                </label>
                                {file && (
                                    <p className="mt-2 text-xs text-blue-400 font-medium">{file.name}</p>
                                )}
                            </div>

                            <button
                                onClick={handleImport}
                                disabled={!file || loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                Importar Agora
                            </button>
                        </div>
                    )}

                    {activeTab === 'export' && (
                        <div className="flex flex-col gap-4 items-center text-center py-4">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-2">
                                <Download size={32} className="text-blue-400" />
                            </div>
                            <p className="text-gray-300 text-sm">
                                Escolha o formato de exportação desejado.
                            </p>

                            <div className="w-full grid grid-cols-2 gap-3 mt-2">
                                <button
                                    onClick={() => handleExport('kml')}
                                    disabled={loading}
                                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex flex-col items-center justify-center gap-2"
                                >
                                    {loading && status.includes('KML') ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <MapPin size={24} />}
                                    <span className="text-sm">Google Earth (KML)</span>
                                </button>

                                <button
                                    onClick={() => handleExport('csv')}
                                    disabled={loading}
                                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex flex-col items-center justify-center gap-2"
                                >
                                    {loading && status.includes('CSV') ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileSpreadsheet size={24} />}
                                    <span className="text-sm">Lista CTOs (CSV)</span>
                                </button>

                                <button
                                    onClick={() => handleExport('geojson')}
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex flex-col items-center justify-center gap-2"
                                >
                                    {loading && status.includes('GEOJSON') ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileJson size={24} />}
                                    <span className="text-sm">GeoJSON (GIS)</span>
                                </button>

                                <button
                                    onClick={async () => {
                                        setLoading(true);
                                        setStatus('Gerando PDF...');
                                        try {
                                            // Dynamic imports with safe resolution
                                            const jsPDFModule = await import('jspdf');
                                            const jsPDF = jsPDFModule.default || jsPDFModule;

                                            const autoTableModule = await import('jspdf-autotable');
                                            // Make sure autoTable is registered
                                            const autoTable = autoTableModule.default || autoTableModule;
                                            // @ts-ignore
                                            if (typeof autoTable === 'function' && typeof jsPDF === 'function') {
                                                // @ts-ignore
                                                // autoTable(jsPDF); // Some versions require this
                                            }

                                            // @ts-ignore
                                            const turfModule: any = await import('@turf/turf');
                                            const turf = turfModule.default || turfModule;

                                            // Fetch project details for name/city
                                            const projectRes = await api.get(`/projects/${projectId}`);
                                            const project = projectRes.data;

                                            // Fetch elements
                                            const response = await api.get(`/network-elements/project/${projectId}`);
                                            // Backend returns separate arrays
                                            const { cables: allCables, boxes: allBoxes, fusions: allFusions, splitters: allSplitters } = response.data;

                                            // Use them directly
                                            // Sort cables by name for consistent diagram
                                            const cables = (allCables || []).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
                                            const boxes = allBoxes || [];
                                            const fusions = allFusions || [];
                                            const splitters = allSplitters || [];

                                            // Metrics logic (Reused)
                                            let totalCableLength = 0;
                                            let cableDetails: any = {};

                                            cables.forEach((cable: any) => {
                                                if (cable.points && cable.points.length > 1) {
                                                    const line = turf.lineString(cable.points.map((p: any) => [p.lng, p.lat]));
                                                    const length = turf.length(line, { units: 'kilometers' }) * 1000;
                                                    const totalLen = length + (cable.slack || 0);
                                                    totalCableLength += totalLen;

                                                    const type = cable.type || 'Desconhecido';
                                                    if (!cableDetails[type]) cableDetails[type] = { count: 0, length: 0 };
                                                    cableDetails[type].count++;
                                                    cableDetails[type].length += totalLen;
                                                }
                                            });

                                            let boxDetails: any = { cto: 0, ceo: 0, other: 0 };
                                            let totalCapacity = 0;

                                            boxes.forEach((box: any) => {
                                                const type = box.boxType || box.type || 'other';
                                                if (type === 'cto' || type === 'termination') {
                                                    boxDetails.cto++;
                                                    totalCapacity += (box.capacity || 16);
                                                } else if (type === 'ceo' || type === 'splice_closure' || type === 'spline') {
                                                    boxDetails.ceo++;
                                                } else {
                                                    boxDetails.other++;
                                                }
                                            });

                                            // Generate PDF
                                            const doc = new jsPDF();
                                            doc.setFontSize(22);
                                            doc.setTextColor(37, 99, 235);
                                            doc.text('Relatório Quantitativo de Rede', 14, 20);

                                            doc.setFontSize(12);
                                            doc.setTextColor(100);
                                            doc.text(`Projeto: ${project.name}`, 14, 30);
                                            doc.text(`Cidade: ${project.city || '-'}`, 14, 36);
                                            doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 42);

                                            doc.setFontSize(16);
                                            doc.setTextColor(0);
                                            doc.text('Resumo Geral', 14, 55);

                                            const summaryData = [
                                                ['Métrica', 'Valor'],
                                                ['Total de Cabos (Metros)', `${totalCableLength.toFixed(2)} m`],
                                                ['Total de Cabos (Km)', `${(totalCableLength / 1000).toFixed(3)} km`],
                                                ['Total de Caixas (CTO)', `${boxDetails.cto}`],
                                                ['Total de Caixas (CEO)', `${boxDetails.ceo}`],
                                                ['Capacidade Total (Portas)', `${totalCapacity}`]
                                            ];

                                            // Use standalone function
                                            autoTable(doc, {
                                                startY: 60,
                                                head: [['Métrica', 'Valor']],
                                                body: summaryData.slice(1),
                                                theme: 'grid',
                                                headStyles: { fillColor: [37, 99, 235] }
                                            });

                                            let finalY = (doc as any).lastAutoTable.finalY + 15;
                                            doc.text('Detalhamento de Cabos', 14, finalY);

                                            const cableTableData = Object.entries(cableDetails).map(([type, data]: any) => [
                                                type.toUpperCase(),
                                                data.count,
                                                `${data.length.toFixed(2)} m`
                                            ]);

                                            autoTable(doc, {
                                                startY: finalY + 5,
                                                head: [['Tipo de Cabo', 'Qtd Trechos', 'Comprimento Total']],
                                                body: cableTableData,
                                                theme: 'striped',
                                                headStyles: { fillColor: [75, 85, 99] }
                                            });

                                            finalY = (doc as any).lastAutoTable.finalY + 15;
                                            doc.text('Detalhamento de Infraestrutura', 14, finalY);

                                            const boxTableData = [
                                                ['Caixa de Terminação (CTO)', boxDetails.cto, `${boxDetails.cto * 16} portas (est.)`],
                                                ['Caixa de Emenda (CEO)', boxDetails.ceo, '-'],
                                                ['Outros Elementos', boxDetails.other, '-']
                                            ];

                                            autoTable(doc, {
                                                startY: finalY + 5,
                                                head: [['Tipo', 'Quantidade', 'Observação']],
                                                body: boxTableData,
                                                theme: 'striped',
                                                headStyles: { fillColor: [75, 85, 99] }
                                            });

                                            // --- Fusion Diagrams ---
                                            // Sort boxes by name for order
                                            const sortedBoxes = [...boxes].sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));

                                            for (const box of sortedBoxes) {
                                                doc.addPage();
                                                try {
                                                    generateFusionDiagram(doc, box, cables, fusions, splitters);
                                                } catch (diagramErr) {
                                                    console.error(`Error generating diagram for box ${box.id}:`, diagramErr);
                                                    doc.setTextColor(255, 0, 0);
                                                    doc.text(`Erro ao gerar diagrama para: ${box.name}`, 20, 20);
                                                }
                                            }

                                            // Footer logic moved to end to cover all pages
                                            const pageCount = (doc as any).internal.getNumberOfPages();
                                            for (let i = 1; i <= pageCount; i++) {
                                                doc.setPage(i);
                                                doc.setFontSize(10);
                                                doc.setTextColor(150);
                                                doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
                                                doc.text('Gerado por SaaS FTTX Manager', 14, doc.internal.pageSize.height - 10);
                                            }

                                            doc.save(`Relatorio_Completo_${project.name.replace(/\s+/g, '_')}.pdf`);
                                            setStatus('PDF (Relatório + Diagramas) gerado com sucesso!');

                                        } catch (err: any) {
                                            console.error('Error generating PDF:', err);
                                            // Show detailed error in UI
                                            const errorMsg = err?.message || 'Erro desconhecido';
                                            setStatus(`Erro: ${errorMsg}`);

                                            // Fallback: If it's the specific autoTable error, suggest refreshing
                                            if (errorMsg.includes('autoTable') || errorMsg.includes('not a function')) {
                                                setStatus(`Erro: Plugin PDF falhou (${errorMsg}). Tente recarregar.`);
                                            }
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    disabled={loading}
                                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex flex-col items-center justify-center gap-2"
                                >
                                    {loading && status.includes('PDF') ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileText size={24} />}
                                    <span className="text-sm">Relatório PDF Completo</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {status && (
                        <div className={`mt-4 p-3 rounded-lg text-xs font-medium ${status.includes('sucesso') || status.includes('concluída') ? 'bg-emerald-900/30 text-emerald-400' :
                            status.includes('Erro') ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'
                            }`}>
                            {status}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
