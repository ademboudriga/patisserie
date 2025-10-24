
const db = require('../config/db');
const bcryptjs = require('bcryptjs');

class userModel {
    static create(username, password) {
        const hashed = bcryptjs.hashSync(password, 10);
        const stmt = db.prepare(`INSERT INTO users (username, password) VALUES (?, ?)`);
        const info = stmt.run(username, hashed);
        return { id: info.lastInsertRowid, username };
    }

    static getByUsername(username) {
        const stmt = db.prepare(`SELECT * FROM users WHERE username = ?`);
        return stmt.get(username);
    }

    static verifyPassword(username, password) {
        const user = this.getByUsername(username);
        if (!user) return false;
        return bcryptjs.compareSync(password, user.password);
    }

    static getAll() {
        return db.prepare(`SELECT id, username FROM users`).all();
    }


}

module.exports = User;
