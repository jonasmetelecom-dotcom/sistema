import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportExportService } from './import-export.service';
import type { Response } from 'express';

@Controller('import-export')
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) { }

  @Post('kml/:projectId')
  @UseInterceptors(FileInterceptor('file'))
  async importKml(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.importExportService.importKml(projectId, file.buffer);
  }

  @Get('kml/:projectId')
  async exportKml(@Param('projectId') projectId: string, @Res() res: Response) {
    const kml = await this.importExportService.exportKml(projectId);

    res.set({
      'Content-Type': 'application/vnd.google-earth.kml+xml',
      'Content-Disposition': `attachment; filename="project_export.kml"`,
    });

    res.send(kml);
  }

  @Post('geojson/:projectId')
  @UseInterceptors(FileInterceptor('file'))
  async importGeoJson(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.importExportService.importGeoJson(projectId, file.buffer);
  }

  @Get('geojson/:projectId')
  async exportGeoJson(
    @Param('projectId') projectId: string,
    @Res() res: Response,
  ) {
    const geojson = await this.importExportService.exportGeoJson(projectId);

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="project_export.geojson"`,
    });

    res.send(geojson);
  }

  @Get('boxes/csv/:projectId')
  async exportBoxesCsv(
    @Param('projectId') projectId: string,
    @Res() res: Response,
  ) {
    const csv = await this.importExportService.exportBoxesCsv(projectId);

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="lista_ctos_${projectId.slice(0, 8)}.csv"`,
    });

    res.send(csv);
  }
}
