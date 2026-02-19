import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DOMParser } from '@xmldom/xmldom';
import * as togeojson from '@mapbox/togeojson';
import { Project } from '../projects/entities/project.entity';
import { Pole } from '../network-elements/entities/pole.entity';
import { InfrastructureBox } from '../network-elements/entities/box.entity';
import { Cable } from '../network-elements/entities/cable.entity';

@Injectable()
export class ImportExportService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Pole)
    private poleRepository: Repository<Pole>,
    @InjectRepository(InfrastructureBox)
    private boxRepository: Repository<InfrastructureBox>,
    @InjectRepository(Cable)
    private cableRepository: Repository<Cable>,
  ) { }

  async importKml(projectId: string, fileBuffer: Buffer) {
    const kmlString = fileBuffer.toString('utf-8');
    const kmlDom = new DOMParser().parseFromString(kmlString);
    const geojson = togeojson.kml(kmlDom);

    let addedPoles = 0;
    let addedBoxes = 0;
    let addedCables = 0;

    for (const feature of geojson.features) {
      if (!feature.geometry) continue;

      const { type, coordinates } = feature.geometry;
      const name = feature.properties?.name || 'Unnamed';
      const description = feature.properties?.description || '';

      // Heuristic detection based on icons or names could be added later.
      // For now, we use simple geometry and potentially name cues.

      if (type === 'Point') {
        const [lng, lat] = coordinates;

        // Heuristic: If name contains "CTO" or "CEO" -> Box, else Pole
        if (
          name.toUpperCase().includes('CTO') ||
          name.toUpperCase().includes('NAP') ||
          name.toUpperCase().includes('CEO') ||
          name.toUpperCase().includes('CX') ||
          name.toUpperCase().includes('BOX')
        ) {
          const isCEO = name.toUpperCase().includes('CEO') || name.toUpperCase().includes('EMENDA');
          const box = this.boxRepository.create({
            projectId,
            name,
            latitude: lat,
            longitude: lng,
            type: isCEO ? 'ceo' : 'cto',
            capacity: isCEO ? 24 : 16, // Better defaults
          });
          await this.boxRepository.save(box);
          addedBoxes++;
        } else {
          const pole = this.poleRepository.create({
            projectId,
            name,
            latitude: lat,
            longitude: lng,
            material: 'concrete', // Default
          });
          await this.poleRepository.save(pole);
          addedPoles++;
        }
        const points = coordinates.map((coord: number[]) => ({
          lat: coord[1],
          lng: coord[0],
        }));

        // Heuristic: Extract fiber count from name (e.g. "Cabo 12F" -> 12)
        const fiberMatch = name.match(/(\d+)\s*[fF]/);
        const fiberCount = fiberMatch ? parseInt(fiberMatch[1]) : 12;

        // Heuristic: Detect Slack (Reserva Técnica) from name "RT 20m"
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

  async exportKml(projectId: string): Promise<string> {
    const poles = await this.poleRepository.find({ where: { projectId } });
    const boxes = await this.boxRepository.find({ where: { projectId } });
    const cables = await this.cableRepository.find({ where: { projectId } });

    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Projeto de Rede - Exportação</name>
    <description>Projeto FTTH gerado via FTTX OPS</description>
`;

    // Styles
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

    // Folder for Poles
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

    // Folder for Boxes
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

    // Folder for Cables
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

  async exportBoxesCsv(projectId: string): Promise<string> {
    const boxes = await this.boxRepository.find({
      where: { projectId },
      order: { name: 'ASC' },
    });

    // Header
    let csv = '\uFEFF'; // BOM for Excel
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

  async exportGeoJson(projectId: string): Promise<any> {
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

  async importGeoJson(projectId: string, fileBuffer: Buffer) {
    const geojson = JSON.parse(fileBuffer.toString('utf-8'));

    let addedPoles = 0;
    let addedBoxes = 0;
    let addedCables = 0;

    for (const feature of geojson.features) {
      if (!feature.geometry) continue;
      const { type, coordinates } = feature.geometry;
      const props = feature.properties || {};

      if (type === 'Point') {
        const [lng, lat] = coordinates;
        const name = props.name || 'Unnamed';
        const elementType =
          props.type ||
          (name.toUpperCase().match(/CTO|CEO|CX/) ? 'box' : 'pole');

        if (elementType === 'box' || props.capacity) {
          const box = this.boxRepository.create({
            projectId,
            name,
            latitude: lat,
            longitude: lng,
            type:
              props.type ||
              (name.toUpperCase().includes('CEO') ? 'ceo' : 'cto'),
            capacity:
              props.capacity || (name.toUpperCase().includes('CEO') ? 24 : 16),
          });
          await this.boxRepository.save(box);
          addedBoxes++;
        } else {
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
      } else if (type === 'LineString') {
        const points = coordinates.map((coord: number[]) => ({
          lat: coord[1],
          lng: coord[0],
        }));
        const fiberMatch = (props.name || '').match(/(\d+)\s*[fF]/);
        const fiberCount =
          props.fiberCount || (fiberMatch ? parseInt(fiberMatch[1]) : 12);

        const cable = this.cableRepository.create({
          projectId,
          name: props.name || 'Unnamed Cable',
          points,
          fiberCount,
          type:
            props.type ||
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
}
