"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportExportController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const import_export_service_1 = require("./import-export.service");
let ImportExportController = class ImportExportController {
    importExportService;
    constructor(importExportService) {
        this.importExportService = importExportService;
    }
    async importKml(projectId, file) {
        return this.importExportService.importKml(projectId, file.buffer);
    }
    async exportKml(projectId, res) {
        const kml = await this.importExportService.exportKml(projectId);
        res.set({
            'Content-Type': 'application/vnd.google-earth.kml+xml',
            'Content-Disposition': `attachment; filename="project_export.kml"`,
        });
        res.send(kml);
    }
    async importGeoJson(projectId, file) {
        return this.importExportService.importGeoJson(projectId, file.buffer);
    }
    async exportGeoJson(projectId, res) {
        const geojson = await this.importExportService.exportGeoJson(projectId);
        res.set({
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="project_export.geojson"`,
        });
        res.send(geojson);
    }
    async exportBoxesCsv(projectId, res) {
        const csv = await this.importExportService.exportBoxesCsv(projectId);
        res.set({
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="lista_ctos_${projectId.slice(0, 8)}.csv"`,
        });
        res.send(csv);
    }
};
exports.ImportExportController = ImportExportController;
__decorate([
    (0, common_1.Post)('kml/:projectId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ImportExportController.prototype, "importKml", null);
__decorate([
    (0, common_1.Get)('kml/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ImportExportController.prototype, "exportKml", null);
__decorate([
    (0, common_1.Post)('geojson/:projectId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ImportExportController.prototype, "importGeoJson", null);
__decorate([
    (0, common_1.Get)('geojson/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ImportExportController.prototype, "exportGeoJson", null);
__decorate([
    (0, common_1.Get)('boxes/csv/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ImportExportController.prototype, "exportBoxesCsv", null);
exports.ImportExportController = ImportExportController = __decorate([
    (0, common_1.Controller)('import-export'),
    __metadata("design:paramtypes", [import_export_service_1.ImportExportService])
], ImportExportController);
//# sourceMappingURL=import-export.controller.js.map