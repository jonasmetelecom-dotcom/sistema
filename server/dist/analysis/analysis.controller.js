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
exports.AnalysisController = void 0;
const common_1 = require("@nestjs/common");
const analysis_service_1 = require("./analysis.service");
let AnalysisController = class AnalysisController {
    analysisService;
    constructor(analysisService) {
        this.analysisService = analysisService;
    }
    countBuildings(south, west, north, east, points) {
        if (points) {
            return this.analysisService.countBuildingsPolygon(points);
        }
        return this.analysisService.countBuildings({
            south: parseFloat(south),
            west: parseFloat(west),
            north: parseFloat(north),
            east: parseFloat(east),
        });
    }
};
exports.AnalysisController = AnalysisController;
__decorate([
    (0, common_1.Get)('count-buildings'),
    __param(0, (0, common_1.Query)('south')),
    __param(1, (0, common_1.Query)('west')),
    __param(2, (0, common_1.Query)('north')),
    __param(3, (0, common_1.Query)('east')),
    __param(4, (0, common_1.Query)('points')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], AnalysisController.prototype, "countBuildings", null);
exports.AnalysisController = AnalysisController = __decorate([
    (0, common_1.Controller)('analysis'),
    __metadata("design:paramtypes", [analysis_service_1.AnalysisService])
], AnalysisController);
//# sourceMappingURL=analysis.controller.js.map