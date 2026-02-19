import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import api from '../../services/api';
import { Server, Radio, Activity, Navigation, RefreshCw, Users, ChevronRight } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import 'leaflet/dist/leaflet.css';
import OnuManagementModal from './OnuManagementModal';
import { RbMonitoringModal } from './RbMonitoringModal';

// Fix for default Leaflet markers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const createCustomIcon = (type: 'olt' | 'rbs', status: boolean, isAlerting: boolean) => {
    const color = status ? '#22c55e' : '#ef4444'; // Green or Red
    const IconComponent = type === 'olt' ? Server : Radio;

    const svgString = ReactDOMServer.renderToString(
        <div style={{
            backgroundColor: '#111827',
            border: `2px solid ${color}`,
            borderRadius: '50%',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            boxShadow: `0 0 15px ${color}60`,
            cursor: 'pointer'
        }}>
            <IconComponent size={20} color={color} />
        </div>
    );

    return L.divIcon({
        html: svgString,
        className: `custom-marker ${isAlerting ? 'marker-alerting' : ''}`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
};

const MonitoringMap = () => {
    const [searchParams] = useSearchParams();
    const targetDeviceId = searchParams.get('deviceId');
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // ONU Modal State
    const [isOnuModalOpen, setIsOnuModalOpen] = useState(false);
    const [selectedRbId, setSelectedRbId] = useState<string | null>(null);

    useEffect(() => {
        const handleOpenRbMonitoring = (e: any) => {
            setSelectedRbId(e.detail.id);
        };
        window.addEventListener('open-rb-monitoring', handleOpenRbMonitoring);
        return () => window.removeEventListener('open-rb-monitoring', handleOpenRbMonitoring);
    }, []);

    const fetchDevices = async () => {
        try {
            const response = await api.get('/network-elements/monitoring-data');
            const data = response.data.map((d: any) => ({
                ...d,
                projectName: d.project?.name || 'Global / Sem Projeto'
            }));
            setDevices(data);
        } catch (error) {
            console.error('Error fetching map data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
        const interval = setInterval(fetchDevices, 30000);
        return () => clearInterval(interval);
    }, []);

    const center: [number, number] = [-23.5505, -46.6333];

    const MapController = ({ devices, targetDeviceId }: { devices: any[], targetDeviceId: string | null }) => {
        const map = useMap();
        const hasFocused = useRef(false);

        useEffect(() => {
            const timer = setTimeout(() => {
                map.invalidateSize();
            }, 500);
            return () => clearTimeout(timer);
        }, [map]);

        useEffect(() => {
            if (devices.length === 0) {
                if (!hasFocused.current) {
                    map.setView([-23.5505, -46.6333], 12);
                    hasFocused.current = true;
                }
                return;
            }

            if (targetDeviceId) {
                const device = devices.find(d => d.id === targetDeviceId);
                if (device) {
                    const lat = parseFloat(device.latitude);
                    const lng = parseFloat(device.longitude);
                    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) > 0.1 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                        map.setView([lat, lng], 16);
                        return;
                    }
                }
            }

            if (!hasFocused.current) {
                const validDevices = devices.filter(d => {
                    const lat = parseFloat(d.latitude);
                    const lng = parseFloat(d.longitude);
                    return !isNaN(lat) && !isNaN(lng) &&
                        Math.abs(lat) > 0.1 && Math.abs(lat) <= 90 &&
                        Math.abs(lng) <= 180;
                });

                if (validDevices.length > 0) {
                    const coords = validDevices.map(d => [parseFloat(d.latitude), parseFloat(d.longitude)] as [number, number]);
                    const bounds = L.latLngBounds(coords);
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
                } else {
                    map.setView([-23.5505, -46.6333], 12);
                }
                hasFocused.current = true;
            }
        }, [devices, map, targetDeviceId]);

        return null;
    };

    if (loading && devices.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-950 text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    <p className="text-gray-400 font-mono text-sm animate-pulse">Carregando mapa operacional...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative bg-gray-950 overflow-hidden">
            <MapContainer
                center={center}
                zoom={12}
                style={{ height: '100%', width: '100%', background: '#030712' }}
                className="z-10"
                zoomControl={false}
            >
                <MapController devices={devices} targetDeviceId={targetDeviceId} />
                <TileLayer
                    url="https://mt1.google.com/vt/lyrs=m&hl=pt-BR&x={x}&y={y}&z={z}"
                    attribution='&copy; Google Maps'
                />

                {devices.map(device => {
                    const lat = parseFloat(device.latitude);
                    const lng = parseFloat(device.longitude);

                    if (isNaN(lat) || isNaN(lng) || (Math.abs(lat) < 0.1 && Math.abs(lng) < 0.1) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

                    const isOnline = device.status === 'online';
                    const isAlerting = device.isAlerting;
                    const isInMaintenance = device.isInMaintenance;

                    return (
                        <Marker
                            key={device.id}
                            position={[lat, lng]}
                            icon={createCustomIcon(device.type, isOnline, isAlerting)}
                        >
                            <Popup className="monitoring-popup shadow-2xl">
                                <div className="p-3 min-w-[240px] bg-gray-900 text-white rounded-lg border border-gray-700">
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-800">
                                        <div className="flex items-center gap-2">
                                            {device.type === 'olt' ? <Server size={18} className="text-indigo-400" /> : <Radio size={18} className="text-blue-400" />}
                                            <h3 className="font-bold text-sm tracking-tight">{device.name}</h3>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                                        <div className="text-gray-500">Endereço IP</div>
                                        <div className="text-gray-300 font-mono">{device.ipAddress}</div>

                                        <div className="text-gray-500">Modelo</div>
                                        <div className="text-gray-300">{device.model || 'N/A'}</div>

                                        <div className="text-gray-500">Projeto</div>
                                        <div className="text-gray-300 truncate" title={device.projectName}>{device.projectName}</div>

                                        <div className="text-gray-500">Status</div>
                                        <div className="flex flex-col gap-1">
                                            <div className={`font-bold ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                                                {isOnline ? 'Conectado' : 'Offline'}
                                            </div>
                                            {isInMaintenance && (
                                                <div className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 w-fit">
                                                    EM MANUTENÇÃO
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Button for OLTs */}
                                    {device.type === 'olt' && (
                                        <button
                                            onClick={() => setIsOnuModalOpen(true)}
                                            className="mt-3 w-full group flex items-center justify-between p-2 bg-indigo-600/20 hover:bg-indigo-600 rounded-lg border border-indigo-500/30 transition-all text-[10px] font-black uppercase tracking-wider text-indigo-400 hover:text-white"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Users size={12} /> Gerenciar ONUs
                                            </span>
                                            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    )}

                                    {device.uptime && (
                                        <div className="mt-3 pt-2 border-t border-gray-800 flex items-center gap-1 text-[10px] text-gray-500">
                                            <Navigation size={10} />
                                            <span>Uptime: {device.uptime}</span>
                                        </div>
                                    )}

                                    {/* Action Button for RBS */}
                                    {device.type === 'rbs' && (
                                        <button
                                            onClick={() => {
                                                // Create a custom event or use a global state/search param to open the modal
                                                // For now, we'll use a search param change which the parent or a listener can detect,
                                                // or just use window.location if it's the intended way to trigger it.
                                                // However, EquipmentsPage usually handles this. 
                                                // Looking at the screenshot, the user wants to open the "RbMonitoringModal".
                                                const event = new CustomEvent('open-rb-monitoring', { detail: device });
                                                window.dispatchEvent(event);
                                            }}
                                            className="mt-3 w-full group flex items-center justify-between p-2 bg-purple-600/20 hover:bg-purple-600 rounded-lg border border-purple-500/30 transition-all text-[10px] font-black uppercase tracking-wider text-purple-400 hover:text-white"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Activity size={12} /> Monitorar Tráfego
                                            </span>
                                            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    )}

                                    {device.type === 'rbs' && device.cpuLoad !== undefined && (
                                        <div className="mt-2 text-[10px] bg-gray-800/50 p-1.5 rounded border border-gray-700/50 text-gray-400 flex justify-between">
                                            <span>CPU: {device.cpuLoad}%</span>
                                            <span>RAM: {Math.round(device.freeMemory / 1024 / 1024)}MB Free</span>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Float Overlay Legend */}
            <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
                <div className="bg-gray-900/90 backdrop-blur-md border border-gray-800 p-4 rounded-2xl shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-900/40">
                            <Activity size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm leading-tight">Central de Monitoramento</h3>
                            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Status Geral da Rede</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-950/50 p-3 rounded-xl border border-gray-800/50">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Online</span>
                            </div>
                            <div className="text-xl font-bold text-green-400">{devices.filter(d => d.status === 'online').length}</div>
                        </div>
                        <div className="bg-gray-950/50 p-3 rounded-xl border border-gray-800/50">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Offline</span>
                            </div>
                            <div className="text-xl font-bold text-red-400">{devices.filter(d => d.status !== 'online').length}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Controls */}
            <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
                <button
                    onClick={() => {
                        fetchDevices();
                    }}
                    title="Recarregar"
                    className="p-3 bg-gray-900/90 hover:bg-gray-800 text-white rounded-xl border border-gray-800 shadow-xl transition-all active:scale-90"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* ONU Management Modal */}
            <OnuManagementModal
                isOpen={isOnuModalOpen}
                onClose={() => setIsOnuModalOpen(false)}
            />
            {/* Rb Monitoring Modal */}
            {selectedRbId && (
                <RbMonitoringModal
                    rbId={selectedRbId}
                    onClose={() => setSelectedRbId(null)}
                />
            )}
        </div >
    );
};

export default MonitoringMap;
