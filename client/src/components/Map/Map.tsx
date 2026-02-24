import { useEffect, useState, useCallback, Fragment, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Zap, Box, Home, Radio, X, Scissors, Edit3, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, ZoomControl, useMap, useMapEvents, Marker, Popup, Polyline, LayersControl, Circle } from 'react-leaflet';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import L, { divIcon, LatLng, type LatLngExpression, type LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NetworkToolbar, type ToolType } from './NetworkToolbar';
import { SidebarProperties } from './SidebarProperties';
import { BoxInternals } from './BoxInternals';
import { InventoryOverlay } from './InventoryOverlay';
import { TechnicalMemorialModal } from './TechnicalMemorialModal';
import { ImportExportModal } from './ImportExportModal';
import { ProjectMetricsModal } from './ProjectMetricsModal';
import { useAuth } from '../../contexts/AuthContext';

// Component to handle map view updates
const MapController = ({ center, bounds, flyToTarget, onCancel }: { center: LatLngExpression | null, bounds?: LatLngBounds | null, flyToTarget?: LatLng | null, onCancel: () => void }) => {
    const map = useMap();
    const lastMovedTo = useRef<string>('');

    useEffect(() => {
        if (flyToTarget) {
            const posKey = `target-${flyToTarget.lat}-${flyToTarget.lng}`;
            if (lastMovedTo.current === posKey) return;

            lastMovedTo.current = posKey;
            map.flyTo(flyToTarget, 19, { duration: 1.5 });
        }
    }, [flyToTarget, map]);

    useEffect(() => {
        if (bounds && bounds.isValid()) {
            const boundsKey = `bounds-${bounds.toBBoxString()}`;
            if (lastMovedTo.current === boundsKey) return;

            lastMovedTo.current = boundsKey;
            map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
        } else if (center) {
            const lat = Array.isArray(center) ? (center as any)[0] : (center as any).lat;
            const lng = Array.isArray(center) ? (center as any)[1] : (center as any).lng;

            if (lat == null || lng == null) return;

            const posKey = `center-${lat}-${lng}`;
            if (lastMovedTo.current === posKey) return;

            const currentCenter = map.getCenter();
            const dist = L.latLng(lat, lng).distanceTo(currentCenter);

            // Only move if significantly far (more than 10 meters)
            if (dist > 10) {
                lastMovedTo.current = posKey;
                const currentZoom = map.getZoom();
                const targetZoom = Math.max(currentZoom, 17);
                map.flyTo([lat, lng], targetZoom, { duration: 1.5 });
            }
        }
    }, [center, bounds, map]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    return null;
};

const getSnappedPosition = (
    latlng: LatLng,
    elements: { poles: any[], boxes: any[] },
    map: L.Map,
    radius: number = 20
): { latlng: LatLng, id?: string, type?: 'pole' | 'box' } => {
    const snapDistancePixels = radius;
    let closest: { latlng: LatLng, id: string, type: 'pole' | 'box' } | null = null;
    let minDistance = Infinity;

    const checkSnap = (item: any, type: 'pole' | 'box') => {
        if (item.latitude == null || item.longitude == null) return;
        const itemLatLng = new LatLng(item.latitude, item.longitude);
        const point = map.latLngToLayerPoint(itemLatLng);
        const eventPoint = map.latLngToLayerPoint(latlng);
        const distance = point.distanceTo(eventPoint);

        if (distance < snapDistancePixels && distance < minDistance) {
            minDistance = distance;
            closest = { latlng: itemLatLng, id: item.id, type };
        }
    };

    // Check Boxes FIRST so that if a Box is on a Pole, we snap to the Box
    elements.boxes.forEach(b => checkSnap(b, 'box'));
    elements.poles.forEach(p => checkSnap(p, 'pole'));

    return closest || { latlng };
};

// MapEdgePanner removed as per user request

const MapResizer = () => {
    const map = useMap();
    useEffect(() => {
        // Simple timer instead of ResizeObserver to avoid potential layout loops
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 500);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};

const getBoxIcon = (type: string, name?: string, isFull?: boolean) => {
    const isCTO = type === 'cto' || type === 'termination' || name?.toUpperCase().includes('CTO');
    const isCEO = type === 'ceo' || type === 'splice_closure' || name?.toUpperCase().includes('CEO') || name?.toUpperCase().includes('EMENDA');
    const isSplitter = type === 'splitter' || name?.toUpperCase().includes('SPLITTER') || name?.toUpperCase().includes('SPL');

    // Emerald for CTO, Blue for CEO, Orange for Splitter, Gray for others
    const color = isFull ? '#ef4444' : (isCTO ? '#10b981' : (isCEO ? '#3b82f6' : (isSplitter ? '#f59e0b' : '#94a3b8')));
    const shape = isCTO ? 'square' : (isSplitter ? 'circle' : 'diamond');

    return divIcon({
        className: 'custom-box-icon cursor-grab active:cursor-grabbing',
        html: `<div style="
            background-color: ${color}; 
            width: 14px; 
            height: 14px; 
            border: 2px solid white; 
            box-shadow: 0 0 10px ${isFull ? 'rgba(239,68,68,0.6)' : isCTO ? 'rgba(16,185,129,0.4)' : isSplitter ? 'rgba(245,158,11,0.4)' : 'rgba(59,130,246,0.4)'}; 
            transform: ${shape === 'diamond' ? 'rotate(45deg)' : 'none'};
            border-radius: ${shape === 'square' ? '2px' : shape === 'circle' ? '50%' : '0'};
            transition: all 0.2s ease-in-out;
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });
};

const getOnuIcon = (status: string) => {
    const color = status === 'online' ? '#10b981' : (status === 'planned' ? '#22d3ee' : '#ef4444'); // Green if online, Cyan if planned, Red if offline
    return divIcon({
        className: 'custom-onu-icon cursor-grab active:cursor-grabbing',
        html: `<div style="
            background-color: ${color}; 
            width: 10px; 
            height: 10px; 
            border: 2px solid white; 
            border-radius: 50%; 
            box-shadow: 0 0 8px ${status === 'online' ? 'rgba(16,185,129,0.5)' : 'rgba(0,0,0,0.3)'};
            transition: all 0.2s ease-in-out;
        "></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5]
    });
};

const getRadioIcon = (status: string) => {
    const color = status === 'online' ? '#a855f7' : '#94a3b8'; // Purple for Radio
    return divIcon({
        className: 'custom-radio-icon cursor-grab active:cursor-grabbing',
        html: `<div style="background-color: ${color}; width: 18px; height: 18px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(168,85,247,0.5); display: flex; align-items: center; justify-content: center; color: white;">
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path><circle cx="12" cy="12" r="2"></circle><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"></path></svg>
               </div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
    });
};

const MapEvents = ({ activeTool, projectId, onElementCreated, cableStart, setCableStart, elements, cableSettings, boxSettings, setRulerPoints, setPendingBoxAt }: any) => {
    const map = useMap();

    useMapEvents({
        click: async (e) => {
            if (activeTool === 'select') return;


            const snapped = getSnappedPosition(e.latlng, elements, map);
            const finalLatLng = snapped.latlng;

            if (activeTool === 'ruler') {
                // Left click on ruler tool = ADD POINT
                setRulerPoints((prev: LatLng[]) => [...prev, finalLatLng]);
                return;
            }

            if (activeTool === 'pole') {
                try {
                    await api.post('/network-elements/poles', {
                        projectId,
                        latitude: finalLatLng.lat,
                        longitude: finalLatLng.lng
                    });
                    onElementCreated();
                } catch (error) {
                    console.error('Error creating pole:', error);
                    alert('Erro ao criar poste');
                }
            } else if (activeTool === 'box') {
                try {
                    const isCTO = boxSettings.type === 'cto' || boxSettings.type === 'termination';
                    const typeLabel = isCTO ? 'CTO' : 'CEO';
                    const defaultName = `${typeLabel}-${(elements.boxes.filter((b: any) => (isCTO ? (b.type === 'cto' || b.type === 'termination') : (b.type !== 'cto' && b.type !== 'termination'))).length + 1)}`;

                    await api.post('/network-elements/boxes', {
                        projectId,
                        latitude: finalLatLng.lat,
                        longitude: finalLatLng.lng,
                        type: boxSettings.type,
                        capacity: boxSettings.capacity,
                        name: defaultName
                    });
                    onElementCreated();
                } catch (error) {
                    console.error('Error creating box:', error);
                    alert('Erro ao criar caixa');
                }
            } else if (activeTool === 'cable') {
                if (!cableStart) {
                    setCableStart({
                        latlng: finalLatLng,
                        elementId: snapped.id,
                        elementType: snapped.type,
                        path: [finalLatLng],
                        poles: snapped.type === 'pole' && snapped.id ? [snapped.id] : []
                    });
                } else {
                    const newPath = [...cableStart.path, finalLatLng];
                    const newPoles = snapped.type === 'pole' && snapped.id ? [...cableStart.poles, snapped.id] : cableStart.poles;

                    if (!snapped.id) {
                        setPendingBoxAt(finalLatLng);
                        return;
                    }

                    // End or continue cable
                    await api.post('/network-elements/cables', {
                        projectId,
                        type: cableSettings.type,
                        fiberCount: cableSettings.fiberCount,
                        points: newPath,
                        fromId: cableStart.elementId,
                        fromType: cableStart.elementType,
                        toId: snapped.id,
                        toType: snapped.type,
                        poleIds: newPoles
                    });

                    setCableStart({
                        latlng: finalLatLng,
                        elementId: snapped.id,
                        elementType: snapped.type,
                        path: [finalLatLng],
                        poles: []
                    });
                    onElementCreated();
                }
            }
            else if (activeTool === 'customer') {
                try {
                    // 1. Create the ONU (Customer)
                    const onuResponse = await api.post('/network-elements/onus', {
                        projectId,
                        latitude: finalLatLng.lat,
                        longitude: finalLatLng.lng,
                        name: 'Novo Cliente',
                        status: 'planned'
                    });

                    const newOnu = onuResponse.data;

                    // 2. Find nearest CTO or Pole for auto-drop
                    let nearestElement: any = null;
                    let minDistance = Infinity;

                    const allConnectables = [
                        ...elements.boxes.filter((b: any) => b.type === 'cto' || b.type === 'termination'),
                        ...elements.poles
                    ];

                    allConnectables.forEach((el: any) => {
                        const dist = finalLatLng.distanceTo(new LatLng(el.latitude, el.longitude));
                        if (dist < minDistance) {
                            minDistance = dist;
                            nearestElement = el;
                        }
                    });

                    // 3. If nearest element is within 400m, create auto-drop cable
                    if (nearestElement && minDistance < 400) {
                        await api.post('/network-elements/cables', {
                            projectId,
                            type: 'drop',
                            fiberCount: 1,
                            points: [
                                { lat: nearestElement.latitude, lng: nearestElement.longitude },
                                { lat: finalLatLng.lat, lng: finalLatLng.lng }
                            ],
                            fromId: nearestElement.id,
                            fromType: elements.boxes.find((b: any) => b.id === nearestElement.id) ? 'box' : 'pole',
                            toId: newOnu.id,
                            toType: 'onu'
                        });
                    }

                    onElementCreated();
                } catch (error) {
                    console.error('Error creating customer:', error);
                    alert('Erro ao criar cliente');
                }
            } else if (activeTool === 'rbs') {
                try {
                    await api.post('/network-elements/rbs', {
                        projectId,
                        latitude: finalLatLng.lat,
                        longitude: finalLatLng.lng,
                        name: 'Nova RBS',
                        model: 'Modelo Padrão',
                        ipAddress: '0.0.0.0',
                        status: 'online',
                        range: 500 // Default range in meters
                    });
                    onElementCreated();
                } catch (error) {
                    console.error('Error creating RBS:', error);
                    alert('Erro ao criar RBS');
                }
            }
        },
        contextmenu: () => {
            if (activeTool === 'ruler') {
                // Right click on ruler tool = UNDO (Remove last point)
                setRulerPoints((prev: LatLng[]) => prev.slice(0, -1));
            }
        }
    });

    return null;
};

// Move constants outside to avoid re-renders
const DEFAULT_CENTER: LatLngExpression = [-23.5505, -46.6333];

const Map = () => {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('projectId');
    const { user } = useAuth();
    const readOnly = user?.role === 'viewer';
    const [center, setCenter] = useState<LatLngExpression | null>(null);
    const [bounds, setBounds] = useState<LatLngBounds | null>(null); // New state for bounds

    const [activeTool, setActiveTool] = useState<ToolType>('select');
    // New State for Cable Settings
    const [cableSettings, setCableSettings] = useState({ type: 'drop', fiberCount: 1 });
    // New State for Box Settings
    const [boxSettings, setBoxSettings] = useState({ type: 'cto', capacity: 16 });

    const [elements, setElements] = useState<{ poles: any[], boxes: any[], cables: any[], onus: any[], rbs: any[], ctoCustomers: any[] }>({ poles: [], boxes: [], cables: [], onus: [], rbs: [], ctoCustomers: [] });
    // Updated state for cable start to include element info
    const [cableStart, setCableStart] = useState<{ latlng: LatLng, elementId?: string, elementType?: string, path: any[], poles: string[] } | null>(null);
    const [selectedElement, setSelectedElement] = useState<{ id: string, type: 'pole' | 'box' | 'cable' | 'onu' | 'rbs', [key: string]: any } | null>(null);
    const [viewingBoxId, setViewingBoxId] = useState<string | null>(null);
    const [isImportExportOpen, setIsImportExportOpen] = useState(false);
    const [showInventory, setShowInventory] = useState(false);
    const [showMetrics, setShowMetrics] = useState(false);
    const [showMemorial, setShowMemorial] = useState(false);
    const [tracedPath, setTracedPath] = useState<any[]>([]);
    const [deletedItem, setDeletedItem] = useState<{ id: string, type: 'pole' | 'box' | 'cable' | 'onu' | 'rbs', timeout: ReturnType<typeof setTimeout> } | null>(null);

    const [showCoverage, setShowCoverage] = useState(false);
    const [rulerPoints, setRulerPoints] = useState<LatLng[]>([]);
    const [mapImage, setMapImage] = useState<string | null>(null);
    const [editingCableId, setEditingCableId] = useState<string | null>(null);
    const [snapConfig, setSnapConfig] = useState({ enabled: true, radius: 20 });
    const [contextMenu, setContextMenu] = useState<{ latlng: any, element: any, type: string } | null>(null);
    const [pendingBoxAt, setPendingBoxAt] = useState<LatLng | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);

    // Search & Navigation
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [flyToTarget, setFlyToTarget] = useState<LatLng | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const handleOpenMemorial = async () => {
        if (!mapRef.current) {
            setShowMemorial(true);
            return;
        }

        try {
            // Leaflet maps can be tricky to capture due to tile loading.
            // We'll give it a small delay or use useCORS: true
            const canvas = await html2canvas(mapRef.current, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                scale: 2 // Better quality for PDF
            });
            const dataUrl = canvas.toDataURL('image/png');
            setMapImage(dataUrl);
            setShowMemorial(true);
        } catch (error) {
            console.error('Error capturing map:', error);
            setShowMemorial(true);
        }
    };

    const handleDelete = async (id: string, type: 'pole' | 'box' | 'cable' | 'onu' | 'rbs') => {
        try {
            const endpoint = type === 'pole' ? 'poles' : type === 'box' ? 'boxes' : type === 'onu' ? 'onus' : type === 'rbs' ? 'rbs' : 'cables';
            await api.delete(`/network-elements/${endpoint}/${id}`);

            // Close sidebar
            setSelectedElement(null);
            fetchElements();

            // Clear previous timeout if any
            if (deletedItem) {
                clearTimeout(deletedItem.timeout);
            }

            // Set up undo state
            const timeout = setTimeout(() => {
                setDeletedItem(null);
            }, 5000); // 5 seconds to undo

            setDeletedItem({ id, type, timeout });

        } catch (error) {
            console.error('Error deleting:', error);
            alert('Erro ao excluir');
        }
    };

    const handleUndo = async () => {
        if (!deletedItem) return;

        try {
            const endpoint = deletedItem.type === 'pole' ? 'poles' : deletedItem.type === 'box' ? 'boxes' : deletedItem.type === 'onu' ? 'onus' : deletedItem.type === 'rbs' ? 'rbs' : 'cables';
            await api.patch(`/network-elements/${endpoint}/${deletedItem.id}/restore`);

            clearTimeout(deletedItem.timeout);
            setDeletedItem(null);
            fetchElements();
        } catch (error) {
            console.error('Error restoring:', error);
            alert('Erro ao desfazer exclusão');
        }
    };

    const fetchProjectLocation = useCallback(async () => {
        if (!projectId) return;
        try {
            const response = await api.get(`/projects/${projectId}`);
            const { latitude, longitude } = response.data || {};
            if (typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude)) {
                setCenter(prev => {
                    if (Array.isArray(prev)) {
                        const [pLat, pLng] = prev as any;
                        if (pLat === latitude && pLng === longitude) return prev;
                    }
                    return [latitude, longitude];
                });
            }
        } catch (error) {
            console.error('Error fetching project details:', error);
        }
    }, [projectId]);

    const fetchElements = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/network-elements/project/${projectId}`);
            console.log('Fetched elements:', response.data);
            if (response.data && typeof response.data === 'object') {
                const newElements = {
                    poles: Array.isArray(response.data.poles) ? response.data.poles : [],
                    boxes: Array.isArray(response.data.boxes) ? response.data.boxes : [],
                    cables: Array.isArray(response.data.cables) ? response.data.cables : [],
                    onus: Array.isArray(response.data.onus) ? response.data.onus : [],
                    rbs: Array.isArray(response.data.rbs) ? response.data.rbs : [],
                    ctoCustomers: Array.isArray(response.data.ctoCustomers) ? response.data.ctoCustomers : [],
                };
                setElements(newElements);
            }
        } catch (error: any) {
            console.error('Error fetching elements:', error);
            setError('Falha ao carregar elementos do mapa. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    // Reset state when project changes
    useEffect(() => {
        setBounds(null);
        setElements({ poles: [], boxes: [], cables: [], onus: [], rbs: [], ctoCustomers: [] });
    }, [projectId]);

    useEffect(() => {
        if (projectId) {
            fetchProjectLocation();
            fetchElements();
        }
    }, [projectId, fetchProjectLocation, fetchElements]);

    // Use a ref for hasZoomedToProject to be more stable against re-renders
    const hasZoomedRef = useRef<string | null>(null);

    // Calculate bounds and zoom when elements are loaded for the first time
    useEffect(() => {
        if (projectId && hasZoomedRef.current !== projectId && elements.poles.length + elements.boxes.length + elements.cables.length > 0) {
            const allPoints: LatLngExpression[] = [];

            elements.poles.forEach(p => {
                if (p.latitude != null && p.longitude != null) {
                    allPoints.push([p.latitude, p.longitude]);
                }
            });
            elements.boxes.forEach(b => {
                if (b.latitude != null && b.longitude != null) {
                    allPoints.push([b.latitude, b.longitude]);
                }
            });
            elements.cables.forEach(c => {
                if (c.points && Array.isArray(c.points)) {
                    c.points.forEach((p: any) => {
                        if (p && p.lat != null && p.lng != null) {
                            allPoints.push([p.lat, p.lng]);
                        }
                    });
                }
            });

            if (allPoints.length > 0) {
                try {
                    const newBounds = L.latLngBounds(allPoints);
                    if (newBounds.isValid()) {
                        hasZoomedRef.current = projectId;
                        setBounds(newBounds);
                    }
                } catch (err) {
                    console.error('Error calculating bounds:', err);
                    hasZoomedRef.current = projectId; // Mark as attempted
                }
            }
        }
    }, [projectId, elements]);

    // Reset cable start when tool changes
    useEffect(() => {
        setCableStart(null);
        setTracedPath([]); // Reset trace when tool changes
        setRulerPoints([]); // Reset ruler when tool changes
    }, [activeTool]);

    const handleTrace = async (elementId: string, fiberIndex: number) => {
        try {
            const response = await api.get('/network-elements/trace-path', {
                params: { elementId, fiberIndex }
            });
            if (Array.isArray(response.data)) {
                setTracedPath(response.data);
                console.log('Traced Path:', response.data);
            } else {
                console.error('Invalid trace response:', response.data);
                alert('Erro: Resposta invÃ¡lida do servidor');
                setTracedPath([]);
            }
        } catch (error) {
            console.error('Error tracing path:', error);
            alert('Erro ao rastrear caminho');
        }
    };


    // Icons
    const createIcon = (color: string, shape: 'circle' | 'square' = 'circle') => divIcon({
        className: 'custom-icon cursor-grab active:cursor-grabbing',
        html: `<div style="
            background-color: ${color}; 
            width: ${shape === 'circle' ? '12px' : '14px'}; 
            height: ${shape === 'circle' ? '12px' : '14px'}; 
            border-radius: ${shape === 'circle' ? '50%' : '2px'}; 
            border: 2px solid white; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });


    // Handlers
    const handleElementClick = async (e: any, element: any, type: 'pole' | 'box' | 'cable' | 'onu' | 'rbs') => {
        // Stop propagation to prevent map click event
        if (e && e.originalEvent) {
            e.originalEvent.stopPropagation();
        }

        if (activeTool === 'ruler') {
            if (e.originalEvent.button === 2 || e.type === 'contextmenu') {
                // Right click/Context menu = UNDO
                setRulerPoints((prev: LatLng[]) => prev.slice(0, -1));
            } else {
                // Left click = ADD POINT
                if (element.latitude != null && element.longitude != null) {
                    const latlng = { lat: element.latitude, lng: element.longitude } as LatLng;
                    setRulerPoints((prev: LatLng[]) => [...prev, latlng]);
                }
            }
            return;
        }

        if (activeTool === 'select') {
            setSelectedElement({ ...element, type });

            // Focus map on element
            if (type === 'pole' || type === 'box' || type === 'onu' || type === 'rbs') {
                if (element.latitude != null && element.longitude != null) {
                    setBounds(null); // Clear bounds so center takes effect
                    setCenter([element.latitude, element.longitude]);
                }
            } else if (type === 'cable') {
                setCenter(null);
                if (element.points && element.points.length > 0) {
                    try {
                        const cableBounds = L.latLngBounds(element.points);
                        if (cableBounds.isValid()) {
                            setBounds(cableBounds);
                        }
                    } catch (err) {
                        console.error('Error calculating cable bounds', err);
                    }
                }
            }

        } else if (activeTool === 'cable') {
            if (element.latitude == null || element.longitude == null) return;
            const latlng = { lat: element.latitude, lng: element.longitude } as LatLng;

            if (!cableStart) {
                // Start cable from this element
                setCableStart({
                    latlng,
                    elementId: element.id,
                    elementType: type,
                    path: [latlng],
                    poles: []
                });
            } else {
                if (cableStart.elementId === element.id && cableStart.path.length === 1) {
                    console.warn('Cannot connect cable to itself');
                    return;
                }

                const newPath = [...cableStart.path, latlng];
                const newPoles = type === 'pole' ? [...(cableStart.poles || []), element.id] : (cableStart.poles || []);

                // If we click a BOX, we MANDATORY FINISH. 
                // If we click a POLE, we can either finish OR continue. 
                // For now, let's allow finishing on any element but if it's a pole we can extend it.
                // Professional OZMap style: boxes are terminations, poles are pass-through.

                const isTermination = type === 'box' || type === 'onu' || type === 'rbs';

                if (isTermination) {
                    try {
                        await api.post('/network-elements/cables', {
                            projectId,
                            type: cableSettings.type,
                            fiberCount: cableSettings.fiberCount,
                            points: newPath,
                            fromId: cableStart.elementId,
                            fromType: cableStart.elementType,
                            toId: element.id,
                            toType: type,
                            poleIds: newPoles
                        });

                        // After box, we can start a new cable from this box
                        setCableStart({
                            latlng,
                            elementId: element.id,
                            elementType: type,
                            path: [latlng],
                            poles: []
                        });
                        fetchElements();
                    } catch (error) {
                        console.error('Error creating cable:', error);
                        setCableStart(null);
                    }
                } else {
                    // It's a pole. We add it to the path and wait for next click.
                    setCableStart({
                        ...cableStart,
                        latlng, // Current end point
                        path: newPath,
                        poles: newPoles
                    });
                    // Visual feedback: element snapped
                }
            }
        }
    };

    const handleCreatePendingBox = async (type: 'cto' | 'ceo') => {
        if (!pendingBoxAt || !projectId || loading) return;
        setLoading(true);

        try {
            const isCTO = type === 'cto';
            const boxName = `${type.toUpperCase()}-${Math.floor(Date.now() / 1000).toString().slice(-4)}`;

            // Create the box
            const boxResponse = await api.post('/network-elements/boxes', {
                type: isCTO ? 'cto' : 'ceo',
                name: boxName,
                latitude: pendingBoxAt.lat,
                longitude: pendingBoxAt.lng,
                projectId
            });

            // Create the cable if exists
            if (activeTool === 'cable' && cableStart) {
                await api.post('/network-elements/cables', {
                    projectId,
                    fromId: cableStart.elementId,
                    fromType: cableStart.elementType,
                    toId: boxResponse.data.id,
                    toType: 'box',
                    type: cableSettings.type,
                    fiberCount: cableSettings.fiberCount,
                    points: [...(cableStart.path || []), pendingBoxAt]
                });
            }

            setPendingBoxAt(null);
            setCableStart(null);
            await fetchElements();
        } catch (error) {
            console.error('Error creating pending box:', error);
            alert('Erro ao criar caixa. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleClearProject = async () => {
        if (!projectId) return;
        try {
            await api.delete(`/network-elements/project/${projectId}`);
            fetchElements();
            alert('Projeto limpo com sucesso!');
        } catch (error) {
            console.error('Error clearing project:', error);
            alert('Erro ao limpar projeto.');
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        if (!elements) return;

        const q = query.toLowerCase();
        const results = [
            ...(elements.poles || []).map(p => ({ ...p, resultType: 'pole' })),
            ...(elements.boxes || []).map(b => ({ ...b, resultType: 'box' })),
            ...(elements.onus || []).map(o => ({ ...o, resultType: 'onu' })),
            ...(elements.rbs || []).map(r => ({ ...r, resultType: 'rbs' }))
        ].filter(item =>
            (item.id && item.id.toLowerCase().includes(q)) ||
            (item.name && item.name.toLowerCase().includes(q)) ||
            (item.serialNumber && item.serialNumber.toLowerCase().includes(q))
        ).slice(0, 10);

        setSearchResults(results);
    };

    const handleSplitCable = async (cable: any, latlng: any) => {
        if (!projectId || loading) return;
        setLoading(true);
        try {
            await api.post('/network-elements/cables/split', {
                cableId: cable.id,
                lat: latlng.lat,
                lng: latlng.lng
            });
            await fetchElements();
            alert('Cabo dividido com sucesso!');
        } catch (error) {
            console.error('Error splitting cable:', error);
            alert('Erro ao dividir cabo.');
        } finally {
            setLoading(false);
        }
    };

    const handleJumpToNodes = (item: any) => {
        if (item.latitude != null && item.longitude != null) {
            setFlyToTarget(new LatLng(item.latitude, item.longitude));
            setSelectedElement({ ...item, type: item.resultType });
            setIsSearchOpen(false);
            setSearchQuery('');
            setSearchResults([]);

            setTimeout(() => setFlyToTarget(null), 2000);
        }
    };


    return (
        <div className="flex-1 relative h-full w-full">
            {loading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600/90 text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 animate-pulse">
                    Atualizando Mapa...
                </div>
            )}

            {editingCableId && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-2">
                    <button
                        onClick={async () => {
                            setEditingCableId(null);
                            fetchElements();
                            alert('Geometria salva e postes vinculados!');
                        }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-[0_10px_40px_rgba(37,99,235,0.4)] flex items-center gap-3 border border-white/20 hover:scale-105 active:scale-95 transition-all animate-in slide-in-from-top-4"
                    >
                        <Box size={18} /> SALVAR GEOMETRIA
                    </button>
                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Arraste os pontos brancos para editar</span>
                </div>
            )}

            {error && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-red-600/90 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <span>{error}</span>
                    <button
                        onClick={() => fetchElements()}
                        className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            )}

            <NetworkToolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                cableSettings={cableSettings}
                onCableSettingsChange={setCableSettings}
                boxSettings={boxSettings}
                onBoxSettingsChange={setBoxSettings}
                onImportExport={() => setIsImportExportOpen(true)}
                onClearProject={handleClearProject}
                onToggleInventory={() => setShowInventory(!showInventory)}
                onOpenMetrics={() => setShowMetrics(true)}
                onOpenMemorial={handleOpenMemorial}
                showInventory={showInventory}
                showCoverage={showCoverage}
                onToggleCoverage={() => setShowCoverage(!showCoverage)}
                snapConfig={snapConfig}
                onSnapConfigChange={setSnapConfig}
                readOnly={readOnly}
            />

            {/* Search Tool Overlay */}
            <div className="absolute top-4 right-16 z-[1000] flex flex-col items-end gap-2">
                <div className={`flex items-center bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl transition-all duration-300 ${isSearchOpen ? 'w-64 px-4 py-2' : 'w-12 h-12 justify-center'}`}>
                    {isSearchOpen ? (
                        <div className="flex items-center gap-2 w-full">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Buscar componente..."
                                className="bg-transparent border-none outline-none text-white text-sm w-full"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            <button onClick={() => setIsSearchOpen(false)} className="text-gray-500 hover:text-white shrink-0">
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsSearchOpen(true)} className="w-full h-full flex items-center justify-center text-blue-400 hover:text-blue-300">
                            BUSCAR
                        </button>
                    )}
                </div>

                {isSearchOpen && searchResults.length > 0 && (
                    <div className="w-64 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                        {searchResults.map((result) => (
                            <button
                                key={`${result.resultType}-${result.id}`}
                                onClick={() => handleJumpToNodes(result)}
                                className="w-full p-3 flex items-center gap-3 hover:bg-gray-800 border-b border-gray-800 text-left transition-colors group"
                            >
                                <div className={`p-2 rounded-lg ${result.resultType === 'pole' ? 'bg-yellow-500/20 text-yellow-500' : result.resultType === 'onu' ? 'bg-cyan-500/20 text-cyan-500' : result.resultType === 'rbs' ? 'bg-purple-500/20 text-purple-500' : 'bg-green-500/20 text-green-500'}`}>
                                    {result.resultType === 'pole' ? <Zap size={14} /> : result.resultType === 'onu' ? <Home size={14} /> : result.resultType === 'rbs' ? <Radio size={14} /> : <Box size={14} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-white uppercase truncate">
                                        {result.name || `${result.resultType.toUpperCase()} - ${result.id.slice(0, 8)}`}
                                    </div>
                                    <div className="text-[10px] text-gray-400 truncate">
                                        {result.serialNumber ? `SN: ${result.serialNumber}` : `ID: ${result.id.slice(0, 12)}...`}
                                    </div>
                                </div>
                                <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">VER</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <SidebarProperties
                element={selectedElement}
                elementType={selectedElement?.type || null}
                onClose={() => setSelectedElement(null)}
                onUpdate={() => {
                    fetchElements();
                    setSelectedElement(null);
                }}
                onOpenInternals={(id) => setViewingBoxId(id)}
                onTrace={handleTrace}
                onDelete={handleDelete}
            />

            {viewingBoxId && (
                <BoxInternals
                    boxId={viewingBoxId}
                    onClose={() => setViewingBoxId(null)}
                />
            )}

            {isImportExportOpen && projectId && (
                <ImportExportModal
                    projectId={projectId}
                    onClose={() => setIsImportExportOpen(false)}
                    onImportSuccess={() => {
                        fetchElements();
                        setIsImportExportOpen(false);
                    }}
                />
            )}

            {showInventory && projectId && (
                <InventoryOverlay
                    projectId={projectId}
                    onClose={() => setShowInventory(false)}
                />
            )}

            {showMetrics && (
                <ProjectMetricsModal
                    isOpen={showMetrics}
                    onClose={() => setShowMetrics(false)}
                    elements={elements}
                />
            )}

            {showMemorial && projectId && (
                <TechnicalMemorialModal
                    projectId={projectId}
                    onClose={() => setShowMemorial(false)}
                    mapImage={mapImage}
                />
            )}


            {/* Instruction for Cable Tool */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg pointer-events-none">
                {cableStart ? 'Clique para continuar o cabo (ESC para cancelar)' : 'Clique no ponto inicial'}
            </div>

            <div ref={mapRef} className="w-full h-full bg-gray-900 overflow-hidden relative" style={{ minHeight: '400px' }}>
                <MapContainer
                    key={projectId || 'none'}
                    center={DEFAULT_CENTER}
                    zoom={13}
                    zoomControl={false}
                    className="w-full h-full"
                    style={{
                        height: '100%',
                        width: '100%',
                        cursor: activeTool !== 'select' ? 'crosshair' : 'grab',
                        background: '#111827'
                    }}
                >
                    <LayersControl position="topright">
                        <LayersControl.BaseLayer checked name="OpenStreetMap">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                maxNativeZoom={19}
                                maxZoom={22}
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Satélite">
                            <TileLayer
                                attribution='&copy; Google Maps'
                                url="https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}"
                                maxNativeZoom={20}
                                maxZoom={22}
                            />
                        </LayersControl.BaseLayer>
                    </LayersControl>
                    <ZoomControl position="bottomright" />
                    <MapResizer />
                    <MapController center={center} bounds={bounds} flyToTarget={flyToTarget} onCancel={() => setCableStart(null)} />
                    <MapEvents
                        activeTool={activeTool}
                        projectId={projectId}
                        onElementCreated={fetchElements}
                        cableStart={cableStart}
                        setCableStart={setCableStart}
                        elements={elements}
                        cableSettings={cableSettings}
                        boxSettings={boxSettings}
                        setRulerPoints={setRulerPoints}
                        setPendingBoxAt={setPendingBoxAt}
                    />

                    {/* Render Signal Coverage (Heatmap/Radius) */}
                    {activeTool === 'heatmap' && elements.boxes
                        .filter(b => b.type === 'cto' && b.latitude != null && b.longitude != null)
                        .map(cto => (
                            <Fragment key={`coverage-${cto.id}`}>
                                {/* Outer Circle (Accepted/Red-ish) - 300m */}
                                <Circle
                                    center={[cto.latitude, cto.longitude]}
                                    radius={300}
                                    pathOptions={{
                                        fillColor: '#ef4444',
                                        fillOpacity: 0.1,
                                        color: '#ef4444',
                                        weight: 1,
                                        dashArray: '5, 10'
                                    }}
                                >
                                    <Popup>
                                        <div className="text-xs p-1">
                                            <div className="font-bold text-red-500 mb-1 leading-tight">ZONA LIMITE (300m)</div>
                                            <div className="text-gray-400">Sinal estimado: ~ -28dBm</div>
                                        </div>
                                    </Popup>
                                </Circle>
                                {/* Inner Circle (Optimal/Green) - 150m */}
                                <Circle
                                    center={[cto.latitude, cto.longitude]}
                                    radius={150}
                                    pathOptions={{
                                        fillColor: '#22c55e',
                                        fillOpacity: 0.2,
                                        color: '#22c55e',
                                        weight: 1
                                    }}
                                >
                                    <Popup>
                                        <div className="text-xs p-1">
                                            <div className="font-bold text-green-500 mb-1 leading-tight">ZONA ÓTIMA (150m)</div>
                                            <div className="text-gray-400">Sinal estimado: &gt; -22dBm</div>
                                        </div>
                                    </Popup>
                                </Circle>
                            </Fragment>
                        ))}




                    {/* Render Cables */}
                    {elements.cables.map(cable => {
                        const isSelected = selectedElement?.id === cable.id && selectedElement?.type === 'cable';

                        const fiberColorMap: Record<string, string> = {
                            'Verde': '#009c3b',
                            'Amarelo': '#ffdf00',
                            'Branco': '#ffffff',
                            'Azul': '#0072bc',
                            'Vermelho': '#ff0000',
                            'Violeta': '#8a2be2',
                            'Marrom': '#964b00',
                            'Rosa': '#ffc0cb',
                            'Preto': '#000000',
                            'Cinza': '#808080',
                            'Laranja': '#ff7f00',
                            'Aqua': '#00ffff'
                        };

                        const getCableColor = () => {
                            if (isSelected) return '#f59e0b';

                            // If user has selected specific colors, use the first one
                            if (cable.colors) {
                                const firstColor = cable.colors.split(',')[0].trim();
                                if (fiberColorMap[firstColor]) return fiberColorMap[firstColor];
                            }

                            // Fallback to type-based colors
                            switch (cable.type) {
                                case 'as80': return '#ef4444';
                                case 'as120': return '#b91c1c';
                                case 'underground': return '#8b5cf6';
                                default: return '#ec4899';
                            }
                        };

                        const color = getCableColor();

                        return (
                            <div key={cable.id}>
                                {cable.points && cable.points.length >= 2 && (
                                    <>
                                        <Polyline
                                            positions={cable.points.filter((p: any) => p && p.lat != null && p.lng != null)}
                                            pathOptions={{
                                                color,
                                                weight: isSelected ? 6 : cable.type === 'as120' ? 5 : 4,
                                                opacity: 0.8,
                                                dashArray: cable.type === 'underground' ? '5, 5' : undefined
                                            }}
                                            eventHandlers={{
                                                click: async (e) => {
                                                    handleElementClick(e, cable, 'cable');
                                                },
                                                contextmenu: (e) => {
                                                    L.DomEvent.stopPropagation(e);
                                                    setContextMenu({
                                                        latlng: { x: (e as any).originalEvent.clientX, y: (e as any).originalEvent.clientY },
                                                        element: cable,
                                                        type: 'cable'
                                                    });
                                                }
                                            }}
                                        >
                                            <Popup>
                                                <div className="text-center">
                                                    <div className="font-bold">Cabo: {cable.type.toUpperCase()}</div>
                                                    <div className="text-xs text-gray-500">{cable.fiberCount} Fibras</div>
                                                </div>
                                            </Popup>
                                        </Polyline>

                                        {/* Cable Label at Midpoint */}
                                        {(() => {
                                            const pts = cable.points.filter((p: any) => p && p.lat != null && p.lng != null);
                                            if (pts.length < 2) return null;
                                            const midIdx = Math.floor(pts.length / 2);
                                            const midPoint = pts[midIdx];

                                            return (
                                                <Marker
                                                    position={midPoint}
                                                    interactive={false}
                                                    icon={divIcon({
                                                        className: 'cable-label',
                                                        html: `
                                                                <div style="
                                                                    background-color: rgba(0,0,0,0.7); 
                                                                    color: white; 
                                                                    padding: 1px 4px; 
                                                                    border-radius: 4px; 
                                                                    font-size: 8px; 
                                                                    font-weight: bold; 
                                                                    white-space: nowrap;
                                                                    border: 1px solid rgba(255,255,255,0.2);
                                                                    pointer-events: none;
                                                                ">
                                                                    ${cable.fiberCount}FO - ${cable.type.toUpperCase()}
                                                                </div>
                                                            `,
                                                        iconSize: [40, 14],
                                                        iconAnchor: [20, 7]
                                                    })}
                                                />
                                            );
                                        })()}
                                    </>
                                )}

                                {/* Draggable Points for Editing Cable */}
                                {editingCableId === cable.id && cable.points && cable.points.map((point: LatLng, index: number) => {
                                    if (point.lat == null || point.lng == null) return null;
                                    return (
                                        <Marker
                                            key={`${cable.id}-point-${index}`}
                                            position={point}
                                            draggable={true}
                                            icon={divIcon({
                                                className: 'vertex-icon',
                                                html: `<div style="background-color: white; width: 10px; height: 10px; border: 2px solid #f59e0b; border-radius: 50%;"></div>`,
                                                iconSize: [10, 10],
                                                iconAnchor: [5, 5]
                                            })}
                                            eventHandlers={{
                                                dragend: async (e) => {
                                                    const marker = e.target;
                                                    const newLatLng = marker.getLatLng();

                                                    // Update local state temporarily
                                                    const newPoints = [...cable.points];
                                                    newPoints[index] = newLatLng;

                                                    // Update elements state to reflect change immediately
                                                    const updatedCables = elements.cables.map(c =>
                                                        c.id === cable.id ? { ...c, points: newPoints } : c
                                                    );
                                                    setElements({ ...elements, cables: updatedCables });

                                                    // Persist to backend and re-associate poles (A4)
                                                    try {
                                                        await api.patch(`/network-elements/cables/${cable.id}`, {
                                                            points: newPoints
                                                        });
                                                        await api.post(`/network-elements/cables/auto-poles`, { cableId: cable.id });
                                                        console.log('Cable geometry and poles updated');
                                                    } catch (error) {
                                                        console.error('Error updating cable geometry:', error);
                                                    }
                                                },
                                                click: (e) => {
                                                    e.originalEvent.stopPropagation();
                                                    if (activeTool === 'ruler') {
                                                        setRulerPoints((prev: LatLng[]) => [...prev, point]);
                                                    }
                                                },
                                                contextmenu: (e) => {
                                                    e.originalEvent.stopPropagation();
                                                    if (activeTool === 'ruler') {
                                                        setRulerPoints((prev: LatLng[]) => prev.slice(0, -1));
                                                    }
                                                }
                                            }}
                                        />
                                    );
                                })}

                                {/* Midpoint Insertion for Editing (OZMap Style) */}
                                {editingCableId === cable.id && cable.points && cable.points.map((point: LatLng, index: number) => {
                                    if (index === cable.points.length - 1) return null;
                                    const nextPoint = cable.points[index + 1];
                                    const midLat = (point.lat + nextPoint.lat) / 2;
                                    const midLng = (point.lng + nextPoint.lng) / 2;

                                    return (
                                        <Marker
                                            key={`${cable.id}-mid-${index}`}
                                            position={[midLat, midLng]}
                                            icon={divIcon({
                                                className: 'midpoint-icon',
                                                html: `<div style="background-color: white; width: 6px; height: 6px; border: 2px solid #3b82f6; border-radius: 50%; opacity: 0.5;"></div>`,
                                                iconSize: [6, 6],
                                                iconAnchor: [3, 3]
                                            })}
                                            eventHandlers={{
                                                click: async (e) => {
                                                    const newPoints = [...cable.points];
                                                    newPoints.splice(index + 1, 0, new LatLng(midLat, midLng));

                                                    // Update elements state
                                                    const updatedCables = elements.cables.map(c =>
                                                        c.id === cable.id ? { ...c, points: newPoints } : c
                                                    );
                                                    setElements({ ...elements, cables: updatedCables });

                                                    // Persist
                                                    try {
                                                        await api.patch(`/network-elements/cables/${cable.id}`, { points: newPoints });
                                                    } catch (err) { console.error(err); }
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}

                    {/* Render Poles */}
                    {elements.poles.map(pole => {
                        if (pole.latitude == null || pole.longitude == null) return null;
                        return (
                            <Marker
                                key={pole.id}
                                position={[pole.latitude, pole.longitude]}
                                icon={createIcon('#3b82f6', 'circle')}
                                draggable={true}
                                eventHandlers={{
                                    click: (e) => handleElementClick(e, pole, 'pole'),
                                    contextmenu: (e) => {
                                        L.DomEvent.stopPropagation(e);
                                        setContextMenu({
                                            latlng: { x: (e as any).originalEvent.clientX, y: (e as any).originalEvent.clientY },
                                            element: pole,
                                            type: 'pole'
                                        });
                                    },
                                    dragend: async (e) => {
                                        const marker = e.target;
                                        const newLatLng = marker.getLatLng();

                                        // Update local state
                                        const updatedPoles = elements.poles.map(p =>
                                            p.id === pole.id ? { ...p, latitude: newLatLng.lat, longitude: newLatLng.lng } : p
                                        );
                                        setElements({ ...elements, poles: updatedPoles });

                                        // Persist to backend
                                        try {
                                            await api.patch(`/network-elements/poles/${pole.id}`, {
                                                latitude: newLatLng.lat,
                                                longitude: newLatLng.lng
                                            });
                                        } catch (error) {
                                            console.error('Error moving pole:', error);
                                        }
                                    }
                                }}
                            >
                                <Popup>Poste ID: {pole.id.slice(0, 8)}</Popup>
                            </Marker>
                        );
                    })}

                    {/* Render Boxes */}
                    {elements.boxes.map(box => {
                        if (box.latitude == null || box.longitude == null) return null;
                        const isCTO = box.type === 'cto' || box.boxType === 'cto' || box.name?.toUpperCase().includes('CTO');

                        return (
                            <Fragment key={box.id}>
                                {showCoverage && isCTO && (
                                    <Circle
                                        center={[box.latitude, box.longitude]}
                                        radius={200}
                                        pathOptions={{
                                            color: '#3b82f6',
                                            fillColor: '#3b82f6',
                                            fillOpacity: 0.05,
                                            weight: 1,
                                            dashArray: '5, 10'
                                        }}
                                        interactive={false}
                                    />
                                )}
                                <Marker
                                    position={[box.latitude, box.longitude]}
                                    icon={(() => {
                                        const customers = (elements.ctoCustomers || []).filter(c => c.boxId === box.id);
                                        const isFull = isCTO && customers.length >= (box.capacity || 16);
                                        return getBoxIcon(box.type, box.name, isFull);
                                    })()}
                                    draggable={true}
                                    eventHandlers={{
                                        click: (e) => handleElementClick(e, box, 'box'),
                                        contextmenu: (e) => {
                                            L.DomEvent.stopPropagation(e);
                                            setContextMenu({
                                                latlng: { x: (e as any).originalEvent.clientX, y: (e as any).originalEvent.clientY },
                                                element: box,
                                                type: 'box'
                                            });
                                        },
                                        dragend: async (e) => {
                                            const marker = e.target;
                                            const newLatLng = marker.getLatLng();

                                            // Update local state
                                            const updatedBoxes = elements.boxes.map(b =>
                                                b.id === box.id ? { ...b, latitude: newLatLng.lat, longitude: newLatLng.lng } : b
                                            );
                                            setElements({ ...elements, boxes: updatedBoxes });

                                            // Persist to backend
                                            try {
                                                await api.patch(`/network-elements/boxes/${box.id}`, {
                                                    latitude: newLatLng.lat,
                                                    longitude: newLatLng.lng
                                                });
                                            } catch (error) {
                                                console.error('Error moving box:', error);
                                            }
                                        }
                                    }}
                                >
                                    <Popup>
                                        <div className="text-center">
                                            <div className="font-bold">Caixa: {box.name || box.type.toUpperCase()}</div>
                                            <div className="text-[10px] text-gray-500">{box.type.toUpperCase()}</div>
                                        </div>
                                    </Popup>
                                </Marker>
                            </Fragment>
                        );
                    })}

                    {/* Render RBS (Radio Base Stations) */}
                    {(elements.rbs || []).map(rbs => {
                        if (rbs.latitude == null || rbs.longitude == null) return null;
                        return (
                            <Fragment key={rbs.id}>
                                {showCoverage && rbs.range > 0 && (
                                    <Circle
                                        center={[rbs.latitude, rbs.longitude]}
                                        radius={rbs.range}
                                        pathOptions={{ fillColor: '#a855f7', color: '#a855f7', fillOpacity: 0.1, weight: 1, dashArray: '5, 5' }}
                                    />
                                )}
                                <Marker
                                    position={[rbs.latitude, rbs.longitude]}
                                    icon={getRadioIcon(rbs.status)}
                                    draggable={true}
                                    eventHandlers={{
                                        click: (e) => handleElementClick(e, rbs, 'rbs'),
                                        contextmenu: (e) => handleElementClick(e, rbs, 'rbs'),
                                        dragend: async (e) => {
                                            const marker = e.target;
                                            const newLatLng = marker.getLatLng();

                                            // Update local state
                                            const updatedRbs = elements.rbs.map(r =>
                                                r.id === rbs.id ? { ...r, latitude: newLatLng.lat, longitude: newLatLng.lng } : r
                                            );
                                            setElements({ ...elements, rbs: updatedRbs });

                                            // Persist to backend
                                            try {
                                                await api.patch(`/network-elements/rbs/${rbs.id}`, {
                                                    latitude: newLatLng.lat,
                                                    longitude: newLatLng.lng
                                                });
                                            } catch (error) {
                                                console.error('Error moving RBS:', error);
                                            }
                                        }
                                    }}
                                >
                                    <Popup>
                                        <div className="p-2">
                                            <h3 className="font-bold text-purple-400">{rbs.name}</h3>
                                            <p className="text-xs text-gray-400">Modelo: {rbs.model}</p>
                                            <p className="text-xs text-gray-400">IP: {rbs.ipAddress}</p>
                                            <p className={`text-xs font-bold ${rbs.status === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                                                Status: {rbs.status?.toUpperCase()}
                                            </p>
                                        </div>
                                    </Popup>
                                </Marker>
                            </Fragment>
                        );
                    })}

                    {/* Render ONUs (Customers) */}
                    {(elements.onus || []).map(onu => {
                        if (onu.latitude == null || onu.longitude == null) return null;
                        return (
                            <Marker
                                key={onu.id}
                                position={[onu.latitude, onu.longitude]}
                                icon={getOnuIcon(onu.status)}
                                draggable={true}
                                eventHandlers={{
                                    click: (e) => handleElementClick(e, onu, 'onu'),
                                    contextmenu: (e) => handleElementClick(e, onu, 'onu'),
                                    dragend: async (e) => {
                                        const marker = e.target;
                                        const newLatLng = marker.getLatLng();

                                        // Update local state
                                        const updatedOnus = elements.onus.map(o =>
                                            o.id === onu.id ? { ...o, latitude: newLatLng.lat, longitude: newLatLng.lng } : o
                                        );
                                        setElements({ ...elements, onus: updatedOnus });

                                        // Persist to backend
                                        try {
                                            await api.patch(`/network-elements/onus/${onu.id}`, {
                                                latitude: newLatLng.lat,
                                                longitude: newLatLng.lng
                                            });
                                        } catch (error) {
                                            console.error('Error moving ONU:', error);
                                        }
                                    }
                                }}
                            >
                                <Popup>
                                    <div className="text-center">
                                        <div className="font-bold text-xs">Cliente: {onu.name || 'Sem Nome'}</div>
                                        <div className="text-[10px] text-gray-500">
                                            Status: {onu.status === 'planned' ? 'Planejado' : onu.status}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* Render Traced Path (Overlay - AFTER elements to ensure visibility) */}
                    {(tracedPath || []).map((item, idx) => {
                        if (item.type === 'cable') {
                            const cable = elements.cables.find(c => c.id === item.id);
                            if (!cable) return null;
                            return (
                                <Polyline
                                    key={`trace-${idx}`}
                                    positions={cable.points}
                                    pathOptions={{
                                        color: '#00ffff', // Cyan glow
                                        weight: 10,
                                        opacity: 0.9,
                                        lineCap: 'round',
                                        lineJoin: 'round',
                                        dashArray: '10, 10',
                                        className: 'animate-pulse' // Add pulse animation if supported or just style
                                    }}
                                />
                            );
                        }
                        return null;
                    })}



                    {/* Pending Box Selection UI */}
                    {pendingBoxAt && (
                        <Marker
                            position={pendingBoxAt}
                            icon={divIcon({
                                className: 'pending-box-picker',
                                html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59,130,246,0.8);"></div>`,
                                iconSize: [12, 12],
                                iconAnchor: [6, 6]
                            })}
                        >
                            <Popup autoClose={false} closeOnClick={false} closeButton={false} className="box-choice-popup">
                                <div className="p-2 min-w-[160px]">
                                    <div className="text-xs font-bold text-gray-700 mb-2 text-center uppercase tracking-wider">Criar Caixa no Final</div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handleCreatePendingBox('cto')}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 px-3 rounded shadow-sm transition-colors flex items-center justify-between"
                                        >
                                            <span>CAIXA CTO</span>
                                            <Box size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleCreatePendingBox('ceo')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 px-3 rounded shadow-sm transition-colors flex items-center justify-between"
                                        >
                                            <span>CAIXA CEO</span>
                                            <Zap size={12} />
                                        </button>
                                        <button
                                            onClick={() => setPendingBoxAt(null)}
                                            className="text-[9px] text-gray-400 hover:text-gray-600 font-medium py-1 mt-1 border-t border-gray-100"
                                        >
                                            CANCELAR
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Ruler Rendering */}
                    {rulerPoints.length > 0 && (
                        <>
                            <Polyline
                                positions={rulerPoints}
                                pathOptions={{ color: '#ffffff', weight: 4, dashArray: '10, 10', opacity: 0.8 }}
                                interactive={false}
                            />
                            {rulerPoints.map((p, i) => (
                                <Marker
                                    key={`ruler-p-${i}`}
                                    position={p}
                                    interactive={false}
                                    icon={divIcon({
                                        className: 'ruler-marker',
                                        html: `<div style="background-color: white; width: 8px; height: 8px; border: 2px solid black; border-radius: 50%;"></div>`,
                                        iconSize: [8, 8],
                                        iconAnchor: [4, 4]
                                    })}
                                />
                            ))}
                            {rulerPoints.length >= 2 && (() => {
                                let totalDist = 0;
                                const labels = [];
                                for (let i = 1; i < rulerPoints.length; i++) {
                                    const prev = rulerPoints[i - 1];
                                    const current = rulerPoints[i];
                                    const dist = prev.distanceTo(current);
                                    totalDist += dist;

                                    const midLat = (prev.lat + current.lat) / 2;
                                    const midLng = (prev.lng + current.lng) / 2;

                                    labels.push(
                                        <Marker
                                            key={`ruler-label-${i}`}
                                            position={[midLat, midLng]}
                                            interactive={false}
                                            icon={divIcon({
                                                className: 'ruler-label',
                                                html: `<div style="background-color: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; white-space: nowrap;">${dist.toFixed(1)}m</div>`,
                                                iconSize: [40, 20],
                                                iconAnchor: [20, 10]
                                            })}
                                        />
                                    );

                                    // If last point, add total label
                                    if (i === rulerPoints.length - 1) {
                                        labels.push(
                                            <Marker
                                                key="ruler-total"
                                                position={current}
                                                interactive={false}
                                                icon={divIcon({
                                                    className: 'ruler-total-label',
                                                    html: `<div style="background-color: #2563eb; color: white; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 900; white-space: nowrap; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5); margin-top: -30px;">TOTAL: ${totalDist.toFixed(1)}m</div>`,
                                                    iconSize: [120, 30],
                                                    iconAnchor: [60, 15]
                                                })}
                                            />
                                        );
                                    }
                                }
                                return labels;
                            })()}
                        </>
                    )}

                    {/* Temporary line while drawing cable */}
                    {activeTool === 'cable' && cableStart && (
                        <Marker position={cableStart.latlng} icon={createIcon('#ec4899', 'circle')} />
                    )}
                </MapContainer>
            </div>



            {/* Context Menu (A6) */}
            {contextMenu && (
                <div
                    className="fixed z-[9999] bg-gray-950/90 border border-gray-700/50 rounded-xl shadow-2xl py-1.5 min-w-[200px] backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.latlng.y, left: contextMenu.latlng.x }}
                >
                    <div className="px-3 py-1 border-b border-gray-800/50 mb-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Opções: {contextMenu.type.toUpperCase()}</span>
                    </div>

                    {contextMenu.type === 'cable' && (
                        <>
                            <button
                                onClick={() => {
                                    setEditingCableId(contextMenu.element.id);
                                    setContextMenu(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-600/20 text-blue-400 text-xs font-bold transition-all text-left"
                            >
                                <Edit3 size={14} /> Editar Geometria
                            </button>
                            <button
                                onClick={() => {
                                    handleSplitCable(contextMenu.element, contextMenu.latlng);
                                    setContextMenu(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-orange-600/20 text-orange-400 text-xs font-bold transition-all text-left"
                            >
                                <Scissors size={14} /> Inserir Caixa (Split)
                            </button>
                        </>
                    )}

                    {contextMenu.type === 'box' && (
                        <button
                            onClick={() => {
                                setViewingBoxId(contextMenu.element.id);
                                setContextMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-emerald-600/20 text-emerald-400 text-xs font-bold transition-all text-left"
                        >
                            <Box size={14} /> Ver Interno
                        </button>
                    )}

                    <button
                        onClick={async () => {
                            if (confirm(`Deseja excluir este ${contextMenu.type === 'cable' ? 'cabo' : 'elemento'}?`)) {
                                try {
                                    await api.delete(`/network-elements/${contextMenu.type}s/${contextMenu.element.id}`);
                                    fetchElements();
                                    setContextMenu(null);
                                } catch (err) { alert('Erro ao excluir'); }
                            }
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-600/20 text-red-500 text-xs font-bold transition-all text-left mt-1 border-t border-gray-800/50"
                    >
                        <Trash2 size={14} /> Excluir
                    </button>
                    <button
                        onClick={() => setContextMenu(null)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-700/20 text-gray-400 text-xs font-bold transition-all text-left mt-1 border-t border-gray-800/50"
                    >
                        <X size={14} /> Fechar
                    </button>
                </div>
            )}

            {/* Undo Toast */}
            {deletedItem && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-2 fade-in">
                    <span>Elemento excluído</span>
                    <button
                        onClick={handleUndo}
                        className="text-blue-400 font-bold hover:text-blue-300 uppercase text-sm tracking-wide"
                    >
                        Desfazer
                    </button>
                    <button
                        onClick={() => setDeletedItem(null)}
                        className="text-gray-500 hover:text-gray-300 ml-2"
                    >
                        ✕
                    </button>
                </div>
            )
            }
        </div>
    );
};

export default Map;
