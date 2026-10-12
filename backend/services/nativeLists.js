'use strict';
const SQL = `CREATE TABLE IF NOT EXISTS notifications(id BIGSERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),title TEXT,message TEXT NOT NULL,type TEXT NOT NULL DEFAULT 'info',read BOOLEAN NOT NULL DEFAULT FALSE,created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS webhooks(id BIGSERIAL PRIMARY KEY,name TEXT,url TEXT NOT NULL,events JSONB NOT NULL DEFAULT '[]',headers JSONB NOT NULL DEFAULT '{}',status TEXT NOT NULL DEFAULT 'disabled',created_at TIMESTAMPTZ DEFAULT NOW());`;
const ensureNativeLists = pool => pool.query(SQL);
const MINISTRY_SQL=`CREATE TABLE IF NOT EXISTS ministry_roles(id BIGSERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),ministry TEXT NOT NULL,role TEXT NOT NULL,assignee TEXT NOT NULL DEFAULT 'Unassigned',members INTEGER NOT NULL DEFAULT 0 CHECK(members>=0),schedule TEXT NOT NULL DEFAULT 'Not scheduled',active BOOLEAN NOT NULL DEFAULT FALSE,planning_reference TEXT,updated_at TIMESTAMPTZ DEFAULT NOW(),UNIQUE(user_id,planning_reference));`;
const ensureMinistryRoles=pool=>pool.query(MINISTRY_SQL);
module.exports={SQL,MINISTRY_SQL,ensureNativeLists,ensureMinistryRoles};
