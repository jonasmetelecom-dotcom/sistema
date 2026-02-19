"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportExportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const xmldom_1 = require("@xmldom/xmldom");
const togeojson = __importStar(require("@mapbox/togeojson"));
const project_entity_1 = require("../projects/entities/project.entity");
const pole_entity_1 = require("../network-elements/entities/pole.entity");
const box_entity_1 = require("../network-elements/entities/box.entity");
const cable_entity_1 = require("../network-elements/entities/cable.entity");
let ImportExportService = class ImportExportService {
    projectRepository;
    poleRepository;
    boxRepository;
    cableRepository;
    constructor(projectRepository, poleRepository, boxRepository, cableRepository) {
        this.projectRepository = projectRepository;
        this.poleRepository = poleRepository;
        this.boxRepository = boxRepository;
        this.cableRepository = cableRepository;
    }
    async importKml(projectId, fileBuffer) {
        const kmlString = fileBuffer.toString('utf-8');
        const kmlDom = new xmldom_1.DOMParser().parseFromString(kmlString);
        const geojson = togeojson.kml(kmlDom);
        let addedPoles = 0;
        let addedBoxes = 0;
        let addedCables = 0;
        for (const feature of geojson.features) {
            if (!feature.geometry)
                continue;
            const { type, coordinates } = feature.geometry;
            const name = feature.properties?.name || 'Unnamed';
            const description = feature.properties?.description || '';
            if (type === 'Point') {
                const [lng, lat] = coordinates;
                if (name.toUpperCase().includes('CTO') ||
                    name.toUpperCase().includes('NAP') ||
                    name.toUpperCase().includes('CEO') ||
                    name.toUpperCase().includes('CX') ||
                    name.toUpperCase().includes('BOX')) {
                    const isCEO = name.toUpperCase().includes('CEO') || name.toUpperCase().includes('EMENDA');
                    const box = this.boxRepository.create({
                        projectId,
                        name,
                        latitude: lat,
                        longitude: lng,
                        type: isCEO ? 'ceo' : 'cto',
                        capacity: isCEO ? 24 : 16,
                    });
                    await this.boxRepository.save(box);
                    addedBoxes++;
                }
                else {
                    const pole = this.poleRepository.create({
                        projectId,
                        name,
                        latitude: lat,
                        longitude: lng,
                        material: 'concrete',
                    });
                    await this.poleRepository.save(pole);
                    addedPoles++;
                }
                const points = coordinates.map((coord) => ({
                    lat: coord[1],
                    lng: coord[0],
                }));
                const fiberMatch = name.match(/(\d+)\s*[fF]/);
                const fiberCount = fiberMatch ? parseInt(fiberMatch[1]) : 12;
                const slackMatch = name.toUpperCase().match(/RT\s*(\d+)/) || name.toUpperCase().match(/(\d+)M\s*RT/);
                const slack = slackMatch ? parseFloat(slackMatch[1]) : 0;
                const cable = this.cableRepository.create({
                    projectId,
                    name,
                    points,
                    fiberCount,
                    slack,
                    type: name.toUpperCase().includes('DROP') ? 'drop' : 'as80',
                });
                await this.cableRepository.save(cable);
                addedCables++;
            }
        }
        return {
            success: true,
            summary: {
                poles: addedPoles,
                boxes: addedBoxes,
                cables: addedCables,
            },
        };
    }
    async exportKml(projectId) {
        const poles = await this.poleRepository.find({ where: { projectId } });
        const boxes = await this.boxRepository.find({ where: { projectId } });
        const cables = await this.cableRepository.find({ where: { projectId } });
        let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Projeto de Rede - Exportação</name>
    <description>Projeto FTTH gerado via FTTX OPS</description>
`;
        kml += `
    <Style id="poleStyle">
      <IconStyle>
        <color>ff0000ff</color>
        <scale>0.7</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="boxStyleCTO">
      <IconStyle>
        <color>ff10b981</color>
        <scale>0.8</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/square.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="boxStyleCEO">
      <IconStyle>
        <color>ff3b82f6</color>
        <scale>0.8</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/shapes/square.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="cableStyle">
      <LineStyle>
        <color>ff00ffff</color>
        <width>2</width>
      </LineStyle>
    </Style>
`;
        kml += `    <Folder><name>Postes</name>`;
        for (const pole of poles) {
            kml += `
    <Placemark>
      <name>${pole.name || 'Poste'}</name>
      <styleUrl>#poleStyle</styleUrl>
      <Point><coordinates>${pole.longitude},${pole.latitude},0</coordinates></Point>
      <ExtendedData>
        <Data name="Material"><value>${pole.material || 'Concreto'}</value></Data>
      </ExtendedData>
    </Placemark>`;
        }
        kml += `    </Folder>`;
        kml += `    <Folder><name>Caixas (CTO/CEO)</name>`;
        for (const box of boxes) {
            const isCEO = box.type?.toLowerCase().includes('ceo') || box.name?.toUpperCase().includes('CEO');
            kml += `
    <Placemark>
      <name>${box.name || (isCEO ? 'CEO' : 'CTO')}</name>
      <styleUrl>${isCEO ? '#boxStyleCEO' : '#boxStyleCTO'}</styleUrl>
      <Point><coordinates>${box.longitude},${box.latitude},0</coordinates></Point>
      <ExtendedData>
        <Data name="Tipo"><value>${box.type?.toUpperCase() || (isCEO ? 'CEO' : 'CTO')}</value></Data>
        <Data name="Capacidade"><value>${box.capacity || 16}</value></Data>
      </ExtendedData>
    </Placemark>`;
        }
        kml += `    </Folder>`;
        kml += `    <Folder><name>Cabeamento</name>`;
        for (const cable of cables) {
            const coords = cable.points.map((p) => `${p.lng},${p.lat},0`).join(' ');
            kml += `
    <Placemark>
      <name>${cable.name || cable.type.toUpperCase()}</name>
      <styleUrl>#cableStyle</styleUrl>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>${coords}</coordinates>
      </LineString>
      <ExtendedData>
        <Data name="Tipo"><value>${cable.type}</value></Data>
        <Data name="Fibras"><value>${cable.fiberCount}</value></Data>
        <Data name="Reserva"><value>${cable.slack}m</value></Data>
      </ExtendedData>
    </Placemark>`;
        }
        kml += `    </Folder>`;
        kml += `
  </Document>
</kml>`;
        return kml;
    }
    async exportBoxesCsv(projectId) {
        const boxes = await this.boxRepository.find({
            where: { projectId },
            order: { name: 'ASC' },
        });
        let csv = '\uFEFF';
        csv += 'Nome;Tipo;Latitude;Longitude;Capacidade;Fotos\n';
        for (const box of boxes) {
            const row = [
                box.name || 'Sem Nome',
                box.type?.toUpperCase() || 'CTO',
                box.latitude.toString().replace('.', ','),
                box.longitude.toString().replace('.', ','),
                box.capacity || 16,
                (box.images || []).length,
            ];
            csv += row.join(';') + '\n';
        }
        return csv;
    }
    async exportGeoJson(projectId) {
        const [poles, boxes, cables] = await Promise.all([
            this.poleRepository.find({ where: { projectId } }),
            this.boxRepository.find({ where: { projectId } }),
            this.cableRepository.find({ where: { projectId } }),
        ]);
        const features = [
            ...poles.map((p) => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
                properties: {
                    name: p.name,
                    type: 'pole',
                    material: p.material,
                    id: p.id,
                },
            })),
            ...boxes.map((b) => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [b.longitude, b.latitude] },
                properties: {
                    name: b.name,
                    type: b.type,
                    capacity: b.capacity,
                    id: b.id,
                },
            })),
            ...cables.map((c) => ({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: c.points.map((p) => [p.lng, p.lat]),
                },
                properties: {
                    name: c.name,
                    type: 'cable',
                    fiberCount: c.fiberCount,
                    id: c.id,
                },
            })),
        ];
        return {
            type: 'FeatureCollection',
            features,
        };
    }
    async importGeoJson(projectId, fileBuffer) {
        const geojson = JSON.parse(fileBuffer.toString('utf-8'));
        let addedPoles = 0;
        let addedBoxes = 0;
        let addedCables = 0;
        for (const feature of geojson.features) {
            if (!feature.geometry)
                continue;
            const { type, coordinates } = feature.geometry;
            const props = feature.properties || {};
            if (type === 'Point') {
                const [lng, lat] = coordinates;
                const name = props.name || 'Unnamed';
                const elementType = props.type ||
                    (name.toUpperCase().match(/CTO|CEO|CX/) ? 'box' : 'pole');
                if (elementType === 'box' || props.capacity) {
                    const box = this.boxRepository.create({
                        projectId,
                        name,
                        latitude: lat,
                        longitude: lng,
                        type: props.type ||
                            (name.toUpperCase().includes('CEO') ? 'ceo' : 'cto'),
                        capacity: props.capacity || (name.toUpperCase().includes('CEO') ? 24 : 16),
                    });
                    await this.boxRepository.save(box);
                    addedBoxes++;
                }
                else {
                    const pole = this.poleRepository.create({
                        projectId,
                        name,
                        latitude: lat,
                        longitude: lng,
                        material: props.material || 'concrete',
                    });
                    await this.poleRepository.save(pole);
                    addedPoles++;
                }
            }
            else if (type === 'LineString') {
                const points = coordinates.map((coord) => ({
                    lat: coord[1],
                    lng: coord[0],
                }));
                const fiberMatch = (props.name || '').match(/(\d+)\s*[fF]/);
                const fiberCount = props.fiberCount || (fiberMatch ? parseInt(fiberMatch[1]) : 12);
                const cable = this.cableRepository.create({
                    projectId,
                    name: props.name || 'Unnamed Cable',
                    points,
                    fiberCount,
                    type: props.type ||
                        ((props.name || '').toUpperCase().includes('DROP')
                            ? 'drop'
                            : 'as80'),
                });
                await this.cableRepository.save(cable);
                addedCables++;
            }
        }
        return {
            success: true,
            summary: { poles: addedPoles, boxes: addedBoxes, cables: addedCables },
        };
    }
};
exports.ImportExportService = ImportExportService;
exports.ImportExportService = ImportExportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(pole_entity_1.Pole)),
    __param(2, (0, typeorm_1.InjectRepository)(box_entity_1.InfrastructureBox)),
    __param(3, (0, typeorm_1.InjectRepository)(cable_entity_1.Cable)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ImportExportService);
//# sourceMappingURL=import-export.service.js.map