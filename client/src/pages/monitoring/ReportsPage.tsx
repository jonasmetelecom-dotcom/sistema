import { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart3, TrendingUp, Download, Target, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReportsPage = () => {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        try {
            const response = await api.get('/network-elements/analytics');
            setAnalytics(response.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const exportPDF = () => {
        if (!analytics) return;

        const doc = new jsPDF() as any;
        const now = new Date().toLocaleString();

        // Title
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text('Relatório Executivo NOC FTTH', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Gerado em: ${now}`, 14, 30);
        doc.line(14, 35, 196, 35);

        // KPIs
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Resumo de Operação', 14, 45);

        const kpiData = [
            ['Métrica', 'Valor'],
            ['Total de Ativações (ONU)', analytics.growthData.reduce((acc: number, d: any) => acc + d.count, 0).toString()]
        ];

        doc.autoTable({
            startY: 50,
            head: [kpiData[0]],
            body: kpiData.slice(1),
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] }
        });

        // Technicians
        doc.text('Produtividade por Técnico', 14, doc.lastAutoTable.finalY + 15);
        const techData = analytics.techStats.map((t: any) => [t.name || 'Sem Nome', t.completed]);

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Técnico', 'OS Concluídas']],
            body: techData,
            theme: 'grid'
        });

        doc.save(`Relatorio_NOC_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // SVG Bar Chart Data Prep
    const maxGrowth = Math.max(...analytics.growthData.map((d: any) => d.count), 1);
    const chartHeight = 200;

    return (
        <div className="p-8 h-full overflow-y-auto bg-gray-900 text-white scrollbar-hide">
            <header className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <BarChart3 className="text-blue-500" /> Relatórios e BI
                    </h1>
                    <p className="text-gray-400 mt-2">Visão analítica de performance e expansão da rede</p>
                </div>
                <button
                    onClick={exportPDF}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                >
                    <Download size={20} />
                    EXPORTAR PDF
                </button>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Target size={64} />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Novas Ativações (Geral)</p>
                    <h2 className="text-4xl font-bold mt-2 text-blue-400">
                        {analytics.growthData.reduce((acc: number, d: any) => acc + d.count, 0)}
                    </h2>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <ChevronRight size={12} className="text-blue-500" /> Clientes autorizados na base
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Custom SVG Growth Chart */}
                <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
                    <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                        <TrendingUp className="text-blue-500" size={20} /> Crescimento Mensal (Novas ONUs)
                    </h3>

                    <div className="relative h-64 w-full flex items-end gap-2 border-b border-l border-gray-700 pb-1 pl-2">
                        {analytics.growthData.length > 0 ? analytics.growthData.map((d: any, i: number) => {
                            const barHeight = (d.count / maxGrowth) * chartHeight;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center group">
                                    <div
                                        className="w-full bg-blue-600 rounded-t-lg transition-all duration-700 origin-bottom hover:bg-blue-400 shadow-lg shadow-blue-900/40 relative"
                                        style={{ height: `${barHeight}px` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-700 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {d.count}
                                        </div>
                                    </div>
                                    <span className="text-[10px] transform -rotate-45 mt-4 text-gray-500">{d.month}</span>
                                </div>
                            );
                        }) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-600 italic">
                                Sem dados históricos suficientes
                            </div>
                        )}

                        {/* Y-Axis Label */}
                        <div className="absolute -left-10 top-0 h-full flex flex-col justify-between text-[10px] text-gray-600 pr-2 border-r border-gray-800">
                            <span>{maxGrowth}</span>
                            <span>{Math.round(maxGrowth / 2)}</span>
                            <span>0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
