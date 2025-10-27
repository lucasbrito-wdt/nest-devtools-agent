"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const event_entity_1 = require("./src/modules/events/entities/event.entity");
const user_entity_1 = require("./src/modules/auth/entities/user.entity");
const project_entity_1 = require("./src/modules/projects/entities/project.entity");
const _1698000000000_InitialSchema_1 = require("./src/migrations/1698000000000-InitialSchema");
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://devtools:devtools@localhost:5432/nest_devtools',
    entities: [event_entity_1.Event, user_entity_1.User, project_entity_1.Project],
    migrations: [_1698000000000_InitialSchema_1.InitialSchema1698000000000],
    synchronize: false,
    ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false,
});
//# sourceMappingURL=ormconfig.js.map