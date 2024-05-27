//-----------------------------------------------------------------------------------
//     ___ _  _ ___ _____ ____  __ ___ ___  ___  _    _____      ___   ___ ___
//    |_ _| \| |_ _|_   _/ /  \/  |_ _|   \|   \| |  | __\ \    / /_\ | _ \ __|
//     | || .` || |  | |/ /| |\/| || || |) | |) | |__| _| \ \/\/ / _ \|   / _|
//    |___|_|\_|___| |_/_/ |_|  |_|___|___/|___/|____|___| \_/\_/_/ \_\_|_\___|
//
//-----------------------------------------------------------------------------------
const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'SITE_TOURNAMENT',
    socketPath: '../../../../var/run/mysqld/mysqld.sock'
});

// Connectez-vous à la base de données
db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
        return;
    }
    console.log('Connexion à la base de données réussie');
});

module.exports = db;

