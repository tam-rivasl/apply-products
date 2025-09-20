"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./products/entities/product.entity");
const sync_state_entity_1 = require("./sync/sync-state.entity");
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [product_entity_1.Product, sync_state_entity_1.SyncState],
    migrations: ['dist/database/migrations/*.js'],
    synchronize: false,
    logging: false,
});
//# sourceMappingURL=data-source.js.map