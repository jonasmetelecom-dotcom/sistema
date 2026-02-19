import { Controller, Get, Query } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('count-buildings')
  countBuildings(
    @Query('south') south?: string,
    @Query('west') west?: string,
    @Query('north') north?: string,
    @Query('east') east?: string,
    @Query('points') points?: string,
  ) {
    if (points) {
      return this.analysisService.countBuildingsPolygon(points);
    }
    return this.analysisService.countBuildings({
      south: parseFloat(south!),
      west: parseFloat(west!),
      north: parseFloat(north!),
      east: parseFloat(east!),
    });
  }
}
