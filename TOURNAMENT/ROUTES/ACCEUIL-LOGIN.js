//-----------------------------------------------------------------------------------
//
//                        _ _   ___           _
//    __ _ __ __ ___ _  _(_) | / / |___  __ _(_)_ _
//   / _` / _/ _/ -_) || | | |/ /| / _ \/ _` | | ' \ _ _ _
//   \__,_\__\__\___|\_,_|_|_/_/ |_\___/\__, |_|_||_(_|_|_)
//                                       |___/
//-----------------------------------------------------------------------------------




const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

module.exports = (db) => {
    const router = express.Router();
    //----------------------------------------------------------------------
    //----------------------------------- RACINE ---------------------------
    //----------------------------------------------------------------------
    router.get('/', (req, res) => {
        req.session.email_connecte = 'invite@example.com';
        req.session.situation = 'demarrage';
        console.log("------------------ INDEX --------------");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ", req.session.situation);
        res.render('D_connexion', { error: false, situation: req.session.situation });
    });
    //----------------------------------------------------------------------
    //----------------------------------- D_connexion ---------------------------
    //----------------------------------------------------------------------
    router.get('/D_connexion', (req, res) => {
        console.log("------------------/D_CONNEXION--------------");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ", req.session.situation);
        if (req.session.situation === 'demarrage') {
            req.session.situation = 'demarrage2';
        }
        res.render('D_connexion', { error: false, situation: req.session.situation });
        console.log("$_SESSION['situation'] : ", req.session.situation);
    });
    //----------------------------------------------------------------------
    //----------------------------------- D_connexion ---------------------------
    //----------------------------------------------------------------------
   
    router.post('/connexion', (req, res) => {
        console.log("post");
        const { email, password } = req.body;

        db.query('SELECT * FROM UTILISATEUR WHERE email=? AND mot_de_passe=?', [email, password], (err, results) => {
            if (err) {
                console.error('Erreur lors de la vérification de l\'utilisateur :', err);
                res.status(500).send('Erreur lors de la vérification de l\'utilisateur.');
                return;
            }

            if (results.length > 0) {
                req.session.email_connecte = email;
                if (req.session.situation === "menu") {
                    res.redirect('/chargement.html');
                } else {
                    res.redirect('/menu');
                }
            } else {
                console.log("pas de compte");
                res.render('D_connexion', { error: true, situation: req.session.situation });
            }
        });
    });
    //----------------------------------------------------------------------
    //----------------------------------- /D_SENDEMAIL --------------------
    //----------------------------------------------------------------------
    //MAIL AUTOMATIQUE AUX NOUVEAUX EMAIL
    router.get('/D_send_email', async (req, res) => {
        console.log("*** /D_send_email ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ", req.session.situation);

        const email = req.session.email_connecte;

        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'barbedetanthony@gmail.com',
                pass: 'dmunpyeuzmkuebqc'
            }
        });

        let mailOptions = {
            from: '"Anthony" <barbedetanthony@gmail.com>',
            to: email,
            subject: 'Bienvenue sur le meilleur site de tournois au monde !',
            html: `
                Cher utilisateur,<br><br>
                
                Félicitations pour avoir rejoint le meilleur site de tournois au monde ! Nous sommes ravis de vous accueillir dans notre communauté de passionnes de jeux et de competitions.<br><br>
                
                En vous inscrivant sur notre plateforme, vous avez maintenant la possibilite de creer et de rejoindre une multitude de tournois dans differents jeux et categories. Voici quelques-uns des avantages que vous allez decouvrir :
                <ul>
                    <li>Creer vos propres tournois selon vos preferences et vos regles.</li>
                    <li>Rejoindre des tournois organise par d'autres membres de la communaute, dans une variete de jeux.</li>
                    <li>Rencontrer de nouveaux joueurs passionnes et competitifs.</li>
                    <li>Ameliorer vos competences en participant a des competitions regulieres.</li>
                    <li>Gagner des recompenses et des distinctions en remportant des tournois.</li>
                    <li>Acceder a un espace dedie pour gerer vos tournois crees et rejoindre ceux auxquels vous participez.</li>
                </ul>
                
                Nous sommes convaincus que vous allez adorer l'experience que notre site vous offre. N'hesitez pas a explorer toutes les fonctionnalites disponibles et a nous contacter si vous avez des questions ou des suggestions d'amelioration.<br><br>
                
                Encore une fois, bienvenue sur notre plateforme ! Nous sommes impatients de vous voir en action et de partager des moments de competition et de divertissement avec vous.<br><br>
                
                Cordialement,<br>
                L'equipe de 'TOURNAMENT'<br>
            `
        };


        try {
            await transporter.sendMail(mailOptions);
            req.session.email_connecte = email;
            res.send('<script>window.top.location.href = "/menu";</script>');
        } catch (error) {
            console.error("Error sending email:", error);
            res.status(500).send("Erreur lors de l'envoi de l'e-mail.");
        }
        if (req.session.situation === "menu") {
            res.redirect('/chargement.html');
        } else {
            res.redirect('/menu');
        }
    });
    //----------------------------------------------------------------------
    //----------------------------------- /D_INSCRIPTION --------------------
    //----------------------------------------------------------------------
    router.get('/D_inscription', (req, res) => {
        console.log("------------------/D_INSCRIPTION--------------");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ", req.session.situation);

        res.render('D_inscription', { error: false, situation: req.session.situation });
        if (req.session.situation === 'demarrage2') {
            req.session.situation = 'demarrage';
        }

        console.log("$_SESSION['situation'] : ", req.session.situation);
    });
    //----------------------------------------------------------------------
    //----------------------------------- /INSCRIPTION --------------------
    //----------------------------------------------------------------------
    router.post('/inscription', (req, res) => {
        console.log("*** /inscription ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ", req.session.situation);
        const { new_email, new_password, confirm_password } = req.body;

        if (new_password !== confirm_password) {
            res.render('D_inscription', { error: 'Les mots de passe ne correspondent pas.', situation: req.session.situation });
            return;
        }

        db.query('SELECT * FROM UTILISATEUR WHERE email = ?', [new_email], (err, results) => {
            if (err) {
                console.error('Erreur lors de la vérification de l\'email :', err);
                res.status(500).send('Erreur lors de la vérification de l\'email.');
                return;
            }

            if (results.length > 0) {
                res.render('D_inscription', { error: 'Cet email est déjà utilisé.', situation: req.session.situation });
            } else {
                db.query('INSERT INTO UTILISATEUR (email, mot_de_passe, pixel_war_placé, pixel_war_restant) VALUES (?, ?, 0, 5)', [new_email, new_password], (err, result) => {
                    if (err) {
                        console.error('Erreur lors de l\'insertion de l\'utilisateur :', err);
                        res.status(500).send('Erreur lors de l\'inscription.');
                        return;
                    }
                    req.session.email_connecte = new_email;
                    res.redirect('/D_send_email');
                });
            }
        });
    });
    //----------------------------------------------------------------------
    //----------------------------------- /PROFIL --------------------
    //----------------------------------------------------------------------
    router.get('/profil', (req, res) => {
        console.log("*** /profil ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ", req.session.situation);
        res.render('profil', { email_connecte: req.session.email_connecte });
    });
    
    
    router.post('/mdp_oublie', (req, res) => {
        console.log("post");
        const { email } = req.body;

        db.query('SELECT * FROM UTILISATEUR WHERE email=?', [email], (err, results) => {
            if (err) {
                console.error('Erreur lors de la vérification de l\'utilisateur :', err);
                res.status(500).send('Erreur lors de la vérification de l\'utilisateur.');
                return;
            }

            if (results.length > 0) {
                req.session.email_connecte = email;

                let transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'barbedetanthony@gmail.com',
                        pass: 'dmunpyeuzmkuebqc'
                    }
                });

                let mailOptions = {
                    from: '"Anthony" <barbedetanthony@gmail.com>',
                    to: email,
                    subject: 'Réinitialisation de votre mot de passe',
                    html: `
                        <p>Bonjour,</p>
                        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
                        <a href="https://nodejsanthonybarbedet:3000/page_change_mdp/${encodeURIComponent(email)}">Réinitialiser le mot de passe</a>
                        <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
                        <p>Cordialement,</p>
                        <p>L'équipe de 'TOURNAMENT'</p>
                    `
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Erreur lors de l\'envoi de l\'email :', error);
                        res.status(500).send('Erreur lors de l\'envoi de l\'email.');
                    } else {
                        console.log('Email envoyé :', info.response);
                        res.render('mot_passe_oublie', {  error: false , situation: req.session.situation , message : "Un lien de renitialisation mot de passe a été envoyé ."});
                    }
                });
                
            } else {
                console.log("pas de compte");
                res.render('mot_passe_oublie', { error: "aucun compte associé à ce mail ", situation: req.session.situation, message : false });
            }
        });
    });
    
    //----------------------------------------------------------------------
    //----------------------------------- /mot_passe_oublie --------------------
    //----------------------------------------------------------------------
    router.get('/mot_passe_oublie', (req, res) => {
        console.log("*** /mot_passe_oublie ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ", req.session.situation);
        res.render('mot_passe_oublie', {  error: false , situation: req.session.situation , message: false});
    });
    //----------------------------------------------------------------------
    //----------------------------------- /page_change_mdp --------------------
    //----------------------------------------------------------------------
    router.get('/page_change_mdp/:email', (req, res) => {
        req.session.situation = "démarrage";
        const email = req.params.email; // Accédez à l'email passé en tant que paramètre d'URL

        req.session.email_connecte = email;

        console.log("*** /page_change_mdp ***");
        console.log("$_SESSION['email_connecte'] : ", email);
        console.log("$_SESSION['situation'] : ", req.session.situation);

        res.render('page_change_mdp', { email_qui_veut_changer_mdp: email, error: false, situation: req.session.situation });
    });   
    
    
    router.post('/changer_mdp', (req, res) => {
        console.log("*** /changer_mdp ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ", req.session.situation);
        
        const { email_mdp, new_password, confirm_password } = req.body;
        console.log("email_mdp : ", email_mdp);
        console.log("new_password: ", confirm_password);
        console.log("new_password: ", confirm_password);
        // Vérifier si les  s de passe correspondent
        if (new_password !== confirm_password) {
            res.render('page_change_mdp', { email_qui_veut_changer_mdp: email_mdp, error: 'Les mots de passe ne correspondent pas.', situation: req.session.situation });
            return;
        }

        // Mettre à jour le mot de passe dans la base de données
        db.query('UPDATE UTILISATEUR SET mot_de_passe = ? WHERE email = ?', [new_password, email_mdp], (err, result) => {
            if (err) {
                console.error('Erreur lors de la mise à jour du mot de passe :', err);
                res.status(500).send('Erreur lors de la mise à jour du mot de passe.');
                return;
            }
            console.log("Mot de passe changé avec succès.");
            //mail de validité
            let transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'barbedetanthony@gmail.com',
                    pass: 'dmunpyeuzmkuebqc'
                }
            });

            let mailOptions = {
                from: '"Anthony" <barbedetanthony@gmail.com>',
                to: email_mdp,
                subject: 'Réinitialisation de votre mot de passe',
                html: `
                    <p>Bonjour,</p>
                    <p>Nous vous confirmons que votre mot de passe a bien été modifié <p>
                    <p>Cordialement,</p>
                    <p>L'équipe de 'TOURNAMENT'</p>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Erreur lors de l\'envoi de l\'email :', error);
                    res.status(500).send('Erreur lors de l\'envoi de l\'email.');
                } else {
                    console.log('Email envoyé :', info.response);
                    res.render('mot_passe_oublie', {  error: false , situation: req.session.situation , message : "Un lien de renitialisation mot de passe a été envoyé ."});
                }
            });
            if (req.session.situation === "menu") {
                res.redirect('/chargement.html');
            } else {
                res.redirect('/menu');
            }
        });
    });

    //----------------------------------------------------------------------
    //----------------------------------- /contact --------------------
    //----------------------------------------------------------------------
    router.get('/contact', (req, res) => {
        console.log("*** /contact ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ", req.session.situation);
        res.sendFile(path.join(__dirname, '../FICHIERS/html/contact.html'));
    });
    //----------------------------------------------------------------------
    //----------------------------------- /acceuil --------------------
    //----------------------------------------------------------------------
    router.get('/acceuil', (req, res) => {
        console.log("*** /acceuil ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ", req.session.situation);
        res.sendFile(path.join(__dirname, '../FICHIERS/html/acceuil.html'));
    });

    return router;
};
