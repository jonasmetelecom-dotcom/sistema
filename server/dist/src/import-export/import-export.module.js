"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportExportModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const import_export_controller_1 = require("./import-export.controller");
const import_export_service_1 = require("./import-export.service");
const project_entity_1 = require("../projects/entities/project.entity");
const pole_entity_1 = require("../network-elements/entities/pole.entity");
const box_entity_1 = require("../network-elements/entities/box.entity");
const cable_entity_1 = require("../network-elements/entities/cable.entity");
let ImportExportModule = class ImportExportModule {
};
exports.ImportExportModule = ImportExportModule;
exports.ImportExportModule = ImportExportModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([project_entity_1.Project, pole_entity_1.Pole, box_entity_1.InfrastructureBox, cable_entity_1.Cable]),
        ],
        controllers: [import_export_controller_1.ImportExportController],
        providers: [import_export_service_1.ImportExportService],
    })
], ImportExportModule);
//# sourceMappingURL=import-export.module.js.map