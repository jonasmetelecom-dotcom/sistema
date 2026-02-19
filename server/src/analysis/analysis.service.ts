import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private readonly logPath = path.join(process.cwd(), 'scan-debug.log');

  private logToFile(message: string) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(this.logPath, `[${timestamp}] ${message}\n`);
  }

  private readonly instances = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.osm.ch/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  async countBuildingsPolygon(
    points: string,
  ): Promise<{ count: number; buildings: any[]; area: string }> {
    // Overpass poly filter expects "lat1 lon1 lat2 lon2 ..."
    const query = `[out:json][timeout:25];(nwr["building"](poly:"${points}"););out center;`;

    this.logger.log(`Scanning polygon area: ${points.substring(0, 50)}...`);
    this.logToFile(`SCAN POLYGON REQUEST: ${points}`);

    for (const baseUrl of this.instances) {
      try {
        const result = await this.queryInstance(baseUrl, query);
        this.logger.log(
          `Scan result for ${baseUrl}: ${result.buildings.length} buildings`,
        );
        this.logToFile(
          `SCAN POLYGON SUCCESS (${baseUrl}): ${result.buildings.length} buildings`,
        );
        return {
          count: result.count,
          buildings: result.buildings,
          area: 'Polygon Selection',
        };
      } catch (e: any) {
        this.logger.warn(
          `Overpass instance ${baseUrl} failed: ${e.message}. Trying next...`,
        );
        this.logToFile(`SCAN POLYGON TRY FAILED (${baseUrl}): ${e.message}`);
        continue;
      }
    }

    throw new Error(
      'All Overpass API instances are currently busy or unavailable. Please try again in a few moments.',
    );
  }

  async countBuildings(bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  }): Promise<{ count: number; buildings: any[]; area: string }> {
    const { south, west, north, east } = bounds;
    // Use nwr (node, way, relation) for a more complete count
    // out center; gives us a single lat/lng for polygons/ways
    const query = `[out:json][timeout:25];(nwr["building"](${south},${west},${north},${east}););out center;`;

    const areaStr = `S:${south}, W:${west}, N:${north}, E:${east}`;
    this.logger.log(`Scanning area: ${areaStr}`);
    this.logToFile(`SCAN REQUEST: ${areaStr}`);

    // Try instances sequentially
    for (const baseUrl of this.instances) {
      try {
        const result = await this.queryInstance(baseUrl, query);
        this.logger.log(
          `Scan result for ${baseUrl}: ${result.buildings.length} buildings`,
        );
        this.logToFile(
          `SCAN SUCCESS (${baseUrl}): ${result.buildings.length} buildings`,
        );
        return {
          count: result.count,
          buildings: result.buildings,
          area: `${south.toFixed(4)},${west.toFixed(4)} to ${north.toFixed(4)},${east.toFixed(4)}`,
        };
      } catch (e: any) {
        this.logger.warn(
          `Overpass instance ${baseUrl} failed: ${e.message}. Trying next...`,
        );
        this.logToFile(`SCAN TRY FAILED (${baseUrl}): ${e.message}`);
        continue;
      }
    }

    throw new Error(
      'All Overpass API instances are currently busy or unavailable. Please try again in a few moments.',
    );
  }

  private queryInstance(
    baseUrl: string,
    query: string,
  ): Promise<{ count: number; buildings: any[] }> {
    const url = `${baseUrl}?data=${encodeURIComponent(query)}`;
    this.logToFile(`QUERY URL: ${url}`);
    const options = {
      timeout: 20000,
      headers: {
        'User-Agent': 'Antigravity-FTTH-Project-Scanner/1.0',
        Accept: 'application/json',
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            this.logToFile(
              `HTTP ERROR ${res.statusCode}: ${data.substring(0, 200)}`,
            );
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          try {
            this.logToFile(`RAW RESPONSE: ${data.substring(0, 500)}`);
            const json = JSON.parse(data);

            const elements = json.elements || [];
            const buildings = elements
              .map((el: any) => {
                // For 'out center', Overpass provides el.center or el.lat/el.lon
                const lat = el.lat || el.center?.lat;
                const lon = el.lon || el.center?.lon;
                if (lat && lon) {
                  return {
                    id: el.id,
                    lat,
                    lng: lon,
                    type: el.tags?.building || 'yes',
                  };
                }
                return null;
              })
              .filter(Boolean);

            resolve({
              count: buildings.length,
              buildings,
            });
          } catch (e: any) {
            this.logToFile(
              `PARSE ERROR: ${e.message} | DATA: ${data.substring(0, 200)}`,
            );
            this.logger.debug('Raw response from failed parse:', data);
            reject(new Error('Invalid JSON response'));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
  }
}
