"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkElementsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const network_elements_service_1 = require("./network-elements.service");
const network_elements_controller_1 = require("./network-elements.controller");
const stats_controller_1 = require("./stats.controller");
const pole_entity_1 = require("./entities/pole.entity");
const box_entity_1 = require("./entities/box.entity");
const cable_entity_1 = require("./entities/cable.entity");
const splitter_entity_1 = require("./entities/splitter.entity");
const fusion_entity_1 = require("./entities/fusion.entity");
const olt_entity_1 = require("./entities/olt.entity");
const onu_entity_1 = require("./entities/onu.entity");
const pon_port_entity_1 = require("./entities/pon-port.entity");
const rbs_entity_1 = require("./entities/rbs.entity");
const alarm_entity_1 = require("./entities/alarm.entity");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const work_order_entity_1 = require("./entities/work-order.entity");
const cto_customer_entity_1 = require("./entities/cto-customer.entity");
const project_entity_1 = require("../projects/entities/project.entity");
const projects_module_1 = require("../projects/projects.module");
const snmp_service_1 = require("../services/snmp.service");
const olt_discovery_service_1 = require("../services/olt-discovery.service");
const olt_cli_service_1 = require("../services/olt-cli.service");
const monitoring_service_1 = require("../scheduler/monitoring.service");
const mikrotik_api_service_1 = require("../services/mikrotik-api.service");
const monitoring_gateway_1 = require("../gateways/monitoring.gateway");
const ping_service_1 = require("../services/ping.service");
const port_monitoring_service_1 = require("../services/port-monitoring.service");
const auth_module_1 = require("../auth/auth.module");
let NetworkElementsModule = class NetworkElementsModule {
};
exports.NetworkElementsModule = NetworkElementsModule;
exports.NetworkElementsModule = NetworkElementsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                pole_entity_1.Pole,
                box_entity_1.InfrastructureBox,
                cable_entity_1.Cable,
                project_entity_1.Project,
                splitter_entity_1.Splitter,
                fusion_entity_1.Fusion,
                olt_entity_1.Olt,
                onu_entity_1.Onu,
                pon_port_entity_1.PonPort,
                rbs_entity_1.Rbs,
                alarm_entity_1.Alarm,
                audit_log_entity_1.AuditLog,
                work_order_entity_1.WorkOrder,
                cto_customer_entity_1.CtoCustomer,
            ]),
            projects_module_1.ProjectsModule,
            auth_module_1.AuthModule,
        ],
        controllers: [network_elements_controller_1.NetworkElementsController, stats_controller_1.StatsController],
        providers: [
            network_elements_service_1.NetworkElementsService,
            snmp_service_1.SnmpService,
            olt_discovery_service_1.OltDiscoveryService,
            olt_cli_service_1.OltCliService,
            monitoring_service_1.MonitoringService,
            mikrotik_api_service_1.MikrotikApiService,
            monitoring_gateway_1.MonitoringGateway,
            ping_service_1.PingService,
            port_monitoring_service_1.PortMonitoringService,
        ],
    })
], NetworkElementsModule);
//# sourceMappingURL=network-elements.module.js.map