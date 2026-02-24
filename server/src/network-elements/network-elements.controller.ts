import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NetworkElementsService } from './network-elements.service';
import { Pole } from './entities/pole.entity';
import { InfrastructureBox } from './entities/box.entity';
import { Cable } from './entities/cable.entity';
import { CtoCustomer } from './entities/cto-customer.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('network-elements')
// @UseGuards(AuthGuard('jwt')) // Redundante pois o AppModule já possui o JwtAuthGuard como global
export class NetworkElementsController {
  constructor(
    private readonly networkElementsService: NetworkElementsService,
  ) { }

  @Get('project/:projectId')
  findAllByProject(@Param('projectId') projectId: string, @Req() req: any) {
    return this.networkElementsService.findAllByProject(projectId, req.user);
  }


  @Post('poles')
  createPole(@Body() data: Partial<Pole>) {
    return this.networkElementsService.createPole(data);
  }

  @Post('boxes')
  createBox(@Body() data: Partial<InfrastructureBox>) {
    return this.networkElementsService.createBox(data);
  }

  @Get('boxes/:id')
  findOneBox(@Param('id') id: string) {
    return this.networkElementsService.findOneBox(id);
  }

  @Post('cables')
  createCable(@Body() data: Partial<Cable>) {
    return this.networkElementsService.createCable(data);
  }

  @Patch('poles/:id')
  updatePole(@Param('id') id: string, @Body() data: Partial<Pole>) {
    return this.networkElementsService.updatePole(id, data);
  }

  @Patch('boxes/:id')
  updateBox(@Param('id') id: string, @Body() data: Partial<InfrastructureBox>) {
    return this.networkElementsService.updateBox(id, data);
  }

  @Patch('cables/:id')
  updateCable(@Param('id') id: string, @Body() data: Partial<Cable>) {
    return this.networkElementsService.updateCable(id, data);
  }

  @Delete('poles/:id')
  deletePole(@Param('id') id: string) {
    return this.networkElementsService.deletePole(id);
  }

  @Delete('boxes/:id')
  deleteBox(@Param('id') id: string) {
    return this.networkElementsService.deleteBox(id);
  }

  @Delete('cables/:id')
  deleteCable(@Param('id') id: string) {
    return this.networkElementsService.deleteCable(id);
  }

  @Patch('poles/:id/restore')
  restorePole(@Param('id') id: string) {
    return this.networkElementsService.restorePole(id);
  }

  @Patch('boxes/:id/restore')
  restoreBox(@Param('id') id: string) {
    return this.networkElementsService.restoreBox(id);
  }

  @Patch('cables/:id/restore')
  restoreCable(@Param('id') id: string) {
    return this.networkElementsService.restoreCable(id);
  }

  @Patch('onus/:id/restore')
  restoreOnu(@Param('id') id: string) {
    return this.networkElementsService.restoreOnu(id);
  }

  @Patch('rbs/:id/restore')
  restoreRbs(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.restoreRbs(id, req.user);
  }

  // --- Connectivity Endpoints ---

  @Get('box/:boxId/internals')
  getBoxInternals(@Param('boxId') boxId: string) {
    console.log(
      `[NetworkElementsController] getBoxInternals header hit for ${boxId}`,
    );
    return this.networkElementsService.getBoxInternals(boxId);
  }

  @Post('splitters')
  createSplitter(@Body() data: any) {
    return this.networkElementsService.createSplitter(data);
  }

  @Post('cables/split')
  async splitCable(@Body() body: { cableId: string, lat: number, lng: number }) {
    return this.networkElementsService.splitCable(body.cableId, body.lat, body.lng);
  }

  @Post('cables/auto-poles')
  async autoAssociatePoles(@Body('cableId') cableId: string) {
    return this.networkElementsService.autoAssociatePoles(cableId);
  }

  @Post('cables/:id/license-poles')
  licensePoles(@Param('id') id: string) {
    return this.networkElementsService.licensePoles(id);
  }

  @Post('cables/:id/convert-points-to-poles')
  convertPointsToPoles(@Param('id') id: string) {
    return this.networkElementsService.convertPointsToPoles(id);
  }

  @Post('cables/:id/convert-poles-to-points')
  convertPolesToPoints(@Param('id') id: string) {
    return this.networkElementsService.convertPolesToPoints(id);
  }

  @Post('cables/:id/calculate-elevation-distance')
  calculateElevationDistance(@Param('id') id: string) {
    return this.networkElementsService.calculateElevationDistance(id);
  }

  @Post('fusions')
  createFusion(@Body() data: any) {
    return this.networkElementsService.createFusion(data);
  }

  @Delete('fusions/:id')
  deleteFusion(@Param('id') id: string) {
    return this.networkElementsService.deleteFusion(id);
  }

  @Delete('splitters/:id')
  deleteSplitter(@Param('id') id: string) {
    return this.networkElementsService.deleteSplitter(id);
  }

  @Post('boxes/:id/images')
  addBoxImage(@Param('id') id: string, @Body('imageUrl') imageUrl: string) {
    return this.networkElementsService.addBoxImage(id, imageUrl);
  }

  // --- CTO Customers ---

  @Post('cto-customers')
  createCtoCustomer(@Body() data: Partial<CtoCustomer>) {
    return this.networkElementsService.createCtoCustomer(data);
  }

  @Patch('cto-customers/:id')
  updateCtoCustomer(
    @Param('id') id: string,
    @Body() data: Partial<CtoCustomer>,
  ) {
    return this.networkElementsService.createCtoCustomer({ ...data, id });
  }

  @Delete('cto-customers/:id')
  deleteCtoCustomer(@Param('id') id: string) {
    return this.networkElementsService.deleteCtoCustomer(id);
  }

  @Get('boxes/:id/cto-customers')
  getCtoCustomersByBox(@Param('id') id: string) {
    return this.networkElementsService.findCtoCustomersByBox(id);
  }

  // --- Active Equipment ---

  @Post('olts')
  createOlt(@Body() data: any, @Req() req: any) {
    return this.networkElementsService.createOlt(data, req.user);
  }

  @Post('rbs')
  createRbs(@Body() data: any, @Req() req: any) {
    return this.networkElementsService.createRbs(data, req.user);
  }

  @Post('test-rbs-connection')
  testRbsConnection(@Body() data: any) {
    return this.networkElementsService.testRbsConnection(data);
  }

  @Post('rbs/:id/disconnect')
  disconnectRbs(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.disconnectRbs(id, req.user.tenantId);
  }

  @Get('project/:projectId/olts')
  getOlts(@Param('projectId') projectId: string, @Req() req: any) {
    return this.networkElementsService.getOlts(projectId, req.user.tenantId);
  }

  @Get('olts')
  getAllOlts(@Req() req: any) {
    return this.networkElementsService.getAllOlts(req.user.tenantId);
  }

  @Get('olts/:id')
  getOltById(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.getOltById(id, req.user.tenantId);
  }

  @Get('project/:projectId/rbs')
  getRbs(@Param('projectId') projectId: string, @Req() req: any) {
    return this.networkElementsService.getRbs(projectId, req.user.tenantId);
  }

  @Get('rbs')
  getAllRbs(@Req() req: any) {
    return this.networkElementsService.getAllRbs(req.user.tenantId);
  }

  @Get('monitoring-data')
  getMonitoringData(@Req() req: any) {
    return this.networkElementsService.getMonitoringData(req.user.tenantId);
  }

  @Delete('olts/:id')
  deleteOlt(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.deleteOlt(id, req.user);
  }

  @Patch('olts/:id')
  updateOlt(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.networkElementsService.updateOlt(id, data, req.user);
  }

  @Delete('rbs/:id')
  deleteRbs(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.deleteRbs(id, req.user);
  }

  @Patch('rbs/:id')
  updateRbs(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.networkElementsService.updateRbs(id, data, req.user);
  }

  @Get('rbs/:id/monitoring')
  getRbsMonitoring(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.getRbsMonitoring(id, req.user.tenantId);
  }

  @Post('olts/:id/sync-onus')
  syncOnus(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.syncOnus(id, req.user.tenantId);
  }

  @Get('olts/:id/onus')
  getOnus(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.getOnus(id, req.user.tenantId);
  }

  @Get('olts/:id/onus-live')
  getOnusLive(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.getOnusLive(id, req.user.tenantId);
  }

  @Get('onus')
  getAllOnus(@Req() req: any) {
    return this.networkElementsService.getAllOnus(req.user.tenantId);
  }

  @Delete('onus/:id')
  deleteOnu(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.deleteOnu(id, req.user.tenantId);
  }

  @Post('poll/:type/:id')
  pollDevice(@Param('type') type: 'olt' | 'rbs', @Param('id') id: string) {
    return this.networkElementsService.pollDeviceStatus(id, type);
  }

  @Get('trace-path')
  tracePath(
    @Query('elementId') elementId: string,
    @Query('fiberIndex') fiberIndex: string,
    @Req() req: any,
  ) {
    return this.networkElementsService.tracePath(
      elementId,
      parseInt(fiberIndex),
      req.user.tenantId,
    );
  }

  @Get('link-budget')
  getLinkBudget(
    @Query('elementId') elementId: string,
    @Query('fiberIndex') fiberIndex: string,
    @Req() req: any,
  ) {
    return this.networkElementsService.calculateLinkBudget(
      elementId,
      parseInt(fiberIndex),
      req.user.tenantId,
    );
  }

  @Get('project/:projectId/technical-memorial')
  getTechnicalMemorial(@Param('projectId') projectId: string, @Req() req: any) {
    return this.networkElementsService.getTechnicalMemorial(
      projectId,
      req.user,
    );
  }

  @Delete('project/:projectId')
  removeAllByProject(@Param('projectId') projectId: string, @Req() req: any) {
    console.log(`Request to delete all elements for project: ${projectId}`);
    return this.networkElementsService.removeAllByProject(
      projectId,
      req.user.tenantId,
    );
  }

  // --- Alarms & Audit ---

  @Get('alarms')
  getAlarms(@Req() req: any) {
    return this.networkElementsService.getAlarms(req.user.tenantId);
  }

  @Get('audit-logs')
  getAuditLogs(@Req() req: any) {
    return this.networkElementsService.getAuditLogs(req.user.tenantId);
  }

  @Get('analytics')
  getAnalytics(@Req() req: any) {
    return this.networkElementsService.getNetworkAnalytics(req.user.tenantId);
  }

  @Patch('alarms/:id/acknowledge')
  acknowledgeAlarm(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.acknowledgeAlarm(
      id,
      req.user.userId,
      req.user.username,
      req.user.tenantId,
    );
  }

  // --- Work Orders ---

  @Get('work-orders')
  getWorkOrders(@Req() req: any) {
    return this.networkElementsService.getWorkOrders(req.user.tenantId);
  }

  @Post('work-orders')
  createWorkOrder(@Body() data: any, @Req() req: any) {
    return this.networkElementsService.createWorkOrder(data, req.user);
  }

  @Patch('work-orders/:id')
  updateWorkOrder(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.networkElementsService.updateWorkOrder(
      id,
      data,
      req.user.tenantId,
    );
  }

  @Delete('work-orders/:id')
  deleteWorkOrder(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.deleteWorkOrder(id, req.user.tenantId);
  }

  @Post('onus/:id/reboot')
  rebootOnu(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.rebootOnu(id, req.user.tenantId);
  }

  @Post('onus/bulk/reboot')
  bulkReboot(@Body('ids') ids: string[], @Req() req: any) {
    return this.networkElementsService.bulkRebootOnus(ids, req.user.tenantId);
  }

  @Post('onus/bulk/authorize')
  bulkAuthorize(@Body('ids') ids: string[], @Req() req: any) {
    return this.networkElementsService.bulkAuthorizeOnus(ids, req.user.tenantId);
  }

  @Patch('onus/:id')
  updateOnu(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.networkElementsService.updateOnu(id, data, req.user.tenantId);
  }

  // ==================== OLT Discovery Endpoints ====================

  @Post('test-cli-connection')
  testOltCliConnection(@Body() data: any, @Req() req: any) {
    return this.networkElementsService.testOltCliConnection(data);
  }

  @Post('olts/:id/discovery/run')
  runOltDiscovery(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.runOltDiscovery(id, req.user.tenantId);
  }

  @Get('olts/:id/discovery')
  getOltDiscovery(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.getOltDiscovery(id, req.user.tenantId);
  }

  @Get('olts/:id/pons')
  getOltPonPorts(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.getOltPonPorts(id, req.user.tenantId);
  }

  @Post('olts/:id/apply-template')
  applyOltTemplate(
    @Param('id') id: string,
    @Body('template') template: string,
    @Req() req: any,
  ) {
    return this.networkElementsService.applyOltTemplate(id, template, req.user);
  }

  @Post('olts/:id/pons/manual')
  createManualPonPort(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    return this.networkElementsService.createManualPonPort(id, data, req.user);
  }

  @Delete('pons/:id')
  deletePonPort(@Param('id') id: string, @Req() req: any) {
    return this.networkElementsService.deletePonPort(id, req.user);
  }
}
