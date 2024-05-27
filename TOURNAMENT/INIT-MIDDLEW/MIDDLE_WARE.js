//-----------------------------------------------------------------------------------
//     ___ _  _ ___ _____ ____  __ ___ ___  ___  _    _____      ___   ___ ___
//    |_ _| \| |_ _|_   _/ /  \/  |_ _|   \|   \| |  | __\ \    / /_\ | _ \ __|
//     | || .` || |  | |/ /| |\/| || || |) | |) | |__| _| \ \/\/ / _ \|   / _|
//    |___|_|\_|___| |_/_/ |_|  |_|___|___/|___/|____|___| \_/\_/_/ \_\_|_\___|
//
//-----------------------------------------------------------------------------------

const session = require('express-session');
const { v4: uuid } = require('uuid');
const helmet = require('helmet');
//autorise uniquement kles liens que je decide
const cspDirectives = {
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'",
            "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
            "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
            "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
            "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
            "https://unpkg.com/leaflet@1.7.1/dist/images/layers-2x.png",
            "https://unpkg.com/leaflet@1.7.1/dist/images/layers.png",
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
            "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png"
        ],
        fontSrc: ["'self'"],
        connectSrc: ["'self'", "https://anthonybarbedet.com:8080", "https://{s}.tile.openstreetmap.org"]
    }
};

const helmetCspMiddleware = helmet.contentSecurityPolicy(cspDirectives);

// Middleware de session
const sessionMiddleware = session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 7200000  },
    // Définition des variables pour chaque session
    genid: (req) => {
        if (!req.session) {
            req.session = {}; // Assurez-vous que req.session est défini
        }
        req.session.situation = 'demarrage';
        req.session.email_connecte = 'invite@example.com'; // Initialisation de email_connecte
        return uuid(); // Utilisez un générateur d'identifiants unique si nécessaire
    }
});

// Middleware pour vérifier les modifications de session
const sessionCheckMiddleware = (req, res, next) => {
    const originalSituation = req.session.situation; // Stockez la valeur originale de la session
    const originalEmailConnecte = req.session.email_connecte; // Stockez la valeur originale de email_connecte

    res.on('finish', () => {
        if (req.session.situation !== originalSituation || req.session.email_connecte !== originalEmailConnecte) {
            console.log("Modification de la session détectée");
            req.app.set('sessionModified', true); // Marquez que la session a été modifiée

           //MODIFIE TOUTE LES ROUTES
        }
    });

    next();
};

module.exports = { sessionMiddleware, sessionCheckMiddleware };
//module.exports = { sessionMiddleware, sessionCheckMiddleware ,helmetCspMiddleware};

