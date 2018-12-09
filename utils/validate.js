module.exports = ({ config, logger } = {}) => {
    if (!config) throw new Error('missing option: "config"');
    if (!config.db) throw new Error('missing option: "config.db"');
    if (!config.db.connection) throw new Error('missing option: "config.db.connection"');
    if (!config.db.migrationFolder) throw new Error('missing option: "config.db.migrationFolder"');
    if (!logger) throw new Error('missing option: "logger"');
};
