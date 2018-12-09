module.exports = async (db) => {
    const sql = 'CREATE TABLE IF NOT EXISTS :table (name VARCHAR(255) NOT NULL)';
    await db.query({ sql, values: { ids: { table: 'migration' } } });
};
