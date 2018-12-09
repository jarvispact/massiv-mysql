const fs = require('fs');

module.exports = async (folder) => new Promise((resolve, reject) => {
    fs.readdir(folder, (err, files) => {
        if (err) return reject(err);
        return resolve(files);
    });
});
