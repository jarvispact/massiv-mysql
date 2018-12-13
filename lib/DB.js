/* eslint-disable no-param-reassign, no-await-in-loop, global-require, import/no-dynamic-require, no-plusplus */

const path = require('path');
const mysql = require('mysql');
const { ensureMigrationTable, getAllFilesInFolder, replace, sleep, validate } = require('../utils');

const migrationTableName = 'migrations';

const DB = class {
    constructor({ config, logger } = {}) {
        validate({ config, logger });
        this.config = config;
        this.logger = logger;
        this.pool = this.createConnectionPool();
    }

    createConnectionPool() {
        const { config, logger } = this;
        const connectionConfig = config.db.connection;
        logger.info('creating connection pool with config:', { ...connectionConfig, password: '******' });
        const pool = mysql.createPool(config.db.connection);
        return pool;
    }

    async getConnection() {
        const { pool } = this;
        return new Promise((resolve, reject) => {
            pool.getConnection((err, db) => {
                if (err) return reject(err);
                db.config.queryFormat = (query, values = {}) => {
                    const { ids, params } = values;
                    if (!ids && !params) return query;
                    return replace(query, db, ids, params);
                };
                return resolve(db);
            });
        });
    }

    async query({ sql, values, connection }) {
        const { logger } = this;
        const db = connection || await this.getConnection();
        return new Promise((resolve, reject) => {
            db.query(sql, values, (error, rows) => {
                if (!connection) db.release();
                if (values) logger.debug(`perform query: '${sql}' with values: `, values);
                if (!values) logger.debug(`perform query: '${sql}'`);
                if (error) return reject(error);
                return resolve(rows);
            });
        });
    }

    async healthcheck() {
        const [{ solution }] = await this.query({ sql: 'SELECT 21 + 21 AS solution' });
        if (solution !== 42) throw new Error('invalid response from mysql server');
    }

    async ensureDBConnection() {
        const { logger } = this;
        const { connectionMaxRetry, connectionRetryTimeout } = this.config.db;
        let tries = 1;
        while (tries < connectionMaxRetry) {
            try {
                await this.healthcheck();
                return true;
            } catch (e) {
                logger.error(`error while trying to connect to db. retry in ${connectionRetryTimeout / 1000} seconds`, e);
                tries += 1;
                await sleep(connectionRetryTimeout);
            }
        }

        logger.error('reached max retry setting. terminating process.');
        process.exit(1);
    }

    async migration(upOrDown) {
        const { config, logger } = this;
        const { migrationFolder } = config.db;
        const connection = await this.getConnection();
        const query = async ({ sql, values }) => this.query({ sql, values, connection });

        try {
            await query({ sql: 'START TRANSACTION' });
            const migrationFileNames = await getAllFilesInFolder(migrationFolder);
            const migrations = migrationFileNames.map(fileName => ({ fileName, migrationModule: require(path.join(migrationFolder, fileName)) }));

            const appliedMigrationNames = (await query({
                sql: 'SELECT name FROM :table',
                values: { ids: { table: migrationTableName } },
            })).map(m => m.name);

            if (upOrDown === 'up') {
                for (let i = 0; i < migrations.length; i++) {
                    const { fileName, migrationModule } = migrations[i];
                    if (!appliedMigrationNames.includes(fileName)) {
                        logger.info(`applying migration: up "${fileName}"`);
                        await migrationModule.up({ query });
                        await query({
                            sql: 'INSERT INTO :table (name) VALUES (:name)',
                            values: {
                                ids: { table: migrationTableName },
                                params: { name: fileName },
                            },
                        });
                    }
                }
            }

            if (upOrDown === 'down') {
                for (let i = migrations.length - 1; i >= 0; i--) {
                    const { fileName, migrationModule } = migrations[i];
                    if (appliedMigrationNames.includes(fileName)) {
                        logger.info(`applying migration: down "${fileName}"`);
                        await migrationModule.down({ query });
                        await query({
                            sql: 'DELETE FROM :table WHERE name = :name',
                            values: {
                                ids: { table: migrationTableName },
                                params: { name: fileName },
                            },
                        });
                    }
                }
            }

            await query({ sql: 'COMMIT' });
        } catch (e) {
            await query({ sql: 'ROLLBACK' });
            connection.release();
            const error = new Error(`migration failed: ${e.message}`);
            error.inner = e;
            throw error;
        }
    }

    async applyMigrations() {
        const { applyDownMigrations } = this.config.db;
        const query = async ({ sql, values }) => this.query({ sql, values });
        await ensureMigrationTable(migrationTableName, { query });
        if (applyDownMigrations) await this.migration('down');
        await this.migration('up');
    }
};

module.exports = DB;
