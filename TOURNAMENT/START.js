//-----------------------------------------------------------------------------------
//      ____  ____   ___      _ _____ _____  __        _______ ____
//     |  _ \|  _ \ / _ \    | | ____|_   _| \ \      / / ____| __ )
//     | |_) | |_) | | | |_  | |  _|   | |    \ \ /\ / /|  _| |  _ \
//     |  __/|  _ <| |_| | |_| | |___  | |     \ V  V / | |___| |_) |
//     |_|   |_| \_\\___/ \___/|_____| |_|      \_/\_/  |_____|____/
//
//-----------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------
//     __  __  ___  ___  _   _ _    ___
//    |  \/  |/ _ \|   \| | | | |  | __|
//    | |\/| | (_) | |) | |_| | |__| _|
//    |_|  |_|\___/|___/ \___/|____|___|
//
//-----------------------------------------------------------------------------------
const https = require('https');
const express = require('express');
const mysql = require('mysql');
const path = require('path');
const helmet = require('helmet');
const session = require('express-session');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const axios = require('axios');
const { v4: uuid } = require('uuid');
const fs = require("fs");
//-----------------------------------------------------------------------------------
//     ___ _  _ ___ _____ ____  __ ___ ___  ___  _    _____      ___   ___ ___
//    |_ _| \| |_ _|_   _/ /  \/  |_ _|   \|   \| |  | __\ \    / /_\ | _ \ __|
//     | || .` || |  | |/ /| |\/| || || |) | |) | |__| _| \ \/\/ / _ \|   / _|
//    |___|_|\_|___| |_/_/ |_|  |_|___|___/|___/|____|___| \_/\_/_/ \_\_|_\___|
//
//-----------------------------------------------------------------------------------
const app = express();
const port = 3000;
    // Chemins vers les fichiers de certificat et de clé Let's Encrypt
const certPath = path.join(__dirname, '../../../../etc/letsencrypt/live/nodejsanthonybarbedet.fr/fullchain.pem');
const keyPath = path.join(__dirname, '../../../../etc/letsencrypt/live/nodejsanthonybarbedet.fr/privkey.pem');

    // Lecture des fichiers de certificat et de clé
const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
const { sessionMiddleware, sessionCheckMiddleware ,helmetCspMiddleware} = require('./INIT-MIDDLEW/MIDDLE_WARE');
const { sessionMiddleware, sessionCheckMiddleware } = require('./INIT-MIDDLEW/MIDDLE_WARE');
const db = require('./INIT-MIDDLEW/DB');
const acceuilLoginRoutes = require('./ROUTES/ACCEUIL-LOGIN')(db);
const menu = require('./ROUTES/MENU')(db);
const rejoindre = require('./ROUTES/REJOINDRE')(db);
const creer = require('./ROUTES/CREER')(db);
const websocket_using = require('./ROUTES/WEBSOCKET_USING')(db);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'RESSOURCES')));
app.use(express.static(path.join(__dirname, 'FICHIERS')));

app.use(helmetCspMiddleware);
// Utilisez le middleware de session en premier
app.use(sessionMiddleware);
// Ensuite, utilisez votre middleware de vérification
app.use(sessionCheckMiddleware);
// Définir EJS comme moteur de template
app.set('view engine', 'ejs');
// Spécifier le répertoire des vues
app.set('views', path.join(__dirname, 'FICHIERS/ejs'));

//-----------------------------------------------------------------------------------
//    __  __   _   ___ _  _
//   |  \/  | /_\ |_ _| \| |
//   | |\/| |/ _ \ | || .` |
//   |_|  |_/_/ \_\___|_|\_|
//
//-----------------------------------------------------------------------------------
app.use('/', acceuilLoginRoutes)
app.use('/', websocket_using) // (la pixel wars et messagerie qui utilise websocket)
app.use('/', menu);
app.use('/', rejoindre);
app.use('/', creer);

const server = https.createServer(options, app);
server.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});
//-----------------------------------------------------------------------------------
//     _____ ___ _   _
//    |  ___|_ _| \ | |
//    | |_   | ||  \| |
//    |  _|  | || |\  |
//    |_|   |___|_| \_|
//
//-----------------------------------------------------------------------------------
//                                /T /I
//                               / |/ | .-~/
//                           T\ Y  I  |/  /  _
//          /T               | \I  |  I  Y.-~/
//         I l   /I       T\ |  |  l  |  T  /
//      T\ |  \ Y l  /T   | \I  l   \ `  l Y
//  __  | \l   \l  \I l __l  l   \   `  _. |
//  \ ~-l  `\   `\  \  \ ~\  \   `. .-~   |
//   \   ~-. "-.  `  \  ^._ ^. "-.  /  \   |
// .--~-._  ~-  `  _  ~-_.-"-." ._ /._ ." ./
//  >--.  ~-.   ._  ~>-"    "\   7   7   ]
// ^.___~"--._    ~-{  .-~ .  `\ Y . /    |
//  <__ ~"-.  ~       /_/   \   \I  Y   : |
//    ^-.__           ~(_/   \   >;._:   | l______
//        ^--.,___.-~"  /_/   !  `-.~"--l_ /     ~"-.
//               (_/ .  ~(   /'     "~"--,Y   -=b-. _)
//                (_/ .  \  :           / l      c"~o \
//                 \ /    `.    .     .^   \_.-~"~--.  )
//                  (_/ .   `  /     /       !       )/
//                   / / _.   '.   .':      /        '
//                   ~(_/ .   /    _  `  .-<_
//                     /_/ . ' .-~" `.  / \  \          ,z=.
//                     ~( /   '  :   | K   "-.~-.______//
//                       "-,.    l   I/ \_    __{--->;._(==.
//                        //(     \  <    ~"~"     //
//                       /' /\     \  \     ,v=.  ((
//                     .^. / /\     "  }__ //===-  `
//                    / / ' '  "-.,__ {---(==-
//                  .^ '       :  T  ~"   ll
//                 / .  .  . : | :!        \
//                (_/  /   | | j-"          ~^
//                  ~-<_(_.^-~"
//
//-----------------------------------------------------------------------------------
//     ___           _            _     _       _       _   _
//    | _ ) __ _ _ _| |__  ___ __| |___| |_    /_\  _ _| |_| |_  ___ _ _ _  _
//    | _ \/ _` | '_| '_ \/ -_) _` / -_)  _|  / _ \| ' \  _| ' \/ _ \ ' \ || |
//    |___/\__,_|_| |_.__/\___\__,_\___|\__| /_/ \_\_||_\__|_||_\___/_||_\_, |
//                                                                        |__/
//-----------------------------------------------------------------------------------
