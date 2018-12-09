module.exports = (query, db, ids = {}, params = {}) => query.replace(/:(\w+)/g, (txt, key) => {
    if (ids[key]) return db.escapeId(ids[key]);
    if (params[key]) return db.escape(params[key]);
    return txt;
});
