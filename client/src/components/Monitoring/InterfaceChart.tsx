import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface ChartData {
    time: string;
    in: number;
    out: number;
}

interface InterfaceChartProps {
    data: ChartData[];
    name: string;
}

export const InterfaceChart = ({ data, name }: InterfaceChartProps) => {
    const formatBps = (value: number) => {
        if (value === 0) return '0 bps';
        const k = 1024;
        const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
        const i = Math.floor(Math.log(value) / Math.log(k));
        return parseFloat((value / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="bg-gray-800/30 border border-gray-700/50 p-4 rounded-xl h-[300px] flex flex-col">
            <h4 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
                Tráfego em Tempo Real: <span className="text-blue-400">{name}</span>
            </h4>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#9ca3af"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#9ca3af"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={formatBps}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '12px' }}
                            formatter={(value: number) => [formatBps(value), 'Bits/s']}
                        />
                        <Area
                            type="monotone"
                            dataKey="in"
                            name="Download (Rx)"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorIn)"
                            strokeWidth={2}
                        />
                        <Area
                            type="monotone"
                            dataKey="out"
                            name="Upload (Tx)"
                            stroke="#3b82f6"
                            fillOpacity={1}
                            fill="url(#colorOut)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
