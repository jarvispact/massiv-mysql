const isNil = value => value === undefined || value === null;

module.exports = (query, db, ids = {}, params = {}) => query.replace(/:(\w+)/g, (txt, key) => {
    if (!isNil(ids[key])) return db.escapeId(ids[key]);
    if (!isNil(params[key])) return db.escape(params[key]);
    return txt;
});
