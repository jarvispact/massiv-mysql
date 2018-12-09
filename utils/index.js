const ensureMigrationTable = require('./ensure-migration-table');
const getAllFilesInFolder = require('./get-all-files-in-folder');
const replace = require('./replace');
const sleep = require('./sleep');

module.exports = {
    ensureMigrationTable,
    getAllFilesInFolder,
    replace,
    sleep,
};
