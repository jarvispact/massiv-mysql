/* eslint-disable no-unused-expressions */

const { expect } = require('chai');
const { DB } = require('../');

const NullLogger = () => {};

const logger = {
    debug: NullLogger,
    info: NullLogger,
    warn: NullLogger,
    error: NullLogger,
};

describe('DB', () => {
    it('should throw if config was not passed to the service constructor', () => {
        const getInstance = () => new DB();
        expect(getInstance).to.throw('missing option: "config"');
    });

    it('should throw if config.db was not passed to the service constructor', () => {
        const getInstance = () => new DB({ config: {} });
        expect(getInstance).to.throw('missing option: "config.db"');
    });

    it('should throw if config.db.connection was not passed to the service constructor', () => {
        const getInstance = () => new DB({ config: { db: {} } });
        expect(getInstance).to.throw('missing option: "config.db.connection"');
    });

    it('should throw if config.db.migrationFolder was not passed to the service constructor', () => {
        const getInstance = () => new DB({ config: { db: { connection: {} } } });
        expect(getInstance).to.throw('missing option: "config.db.migrationFolder"');
    });

    it('should throw if logger was not passed to the service constructor', () => {
        const getInstance = () => new DB({ config: { db: { connection: {}, migrationFolder: '/tmp' } } });
        expect(getInstance).to.throw('missing option: "logger"');
    });

    it('should create a new db instance', () => {
        const db = new DB({ config: { db: { connection: {}, migrationFolder: '/tmp' } }, logger });
        expect(db.config).to.exist;
        expect(db.logger).to.exist;
        expect(db.pool).to.exist;
    });
});
