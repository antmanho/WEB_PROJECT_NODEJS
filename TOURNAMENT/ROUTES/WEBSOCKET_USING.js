//----------------------------------------------------------------------
//                   _                _       _            _
//       __ __ _____| |__ ___ ___  __| |_____| |_  _  _ __(_)_ _  __ _
//       \ V  V / -_) '_ (_-</ _ \/ _| / / -_)  _|| || (_-< | ' \/ _` |
//        \_/\_/\___|_.__/__/\___/\__|_\_\___|\__|_\_,_/__/_|_||_\__, |
//                                              |___|            |___/
//----------------------------------------------------------------------
const path = require('path');
const express = require('express');
const router = express.Router();
module.exports = (db ) => {
    
    //----------------------------------------------------------------------
    //----------------------------------- C2 -------------------------------
    //----------------------------------------------------------------------
    router.get('/C2', async (req, res) => {
        console.log("------------------/C2--------------");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        var email_connecte = req.session.email_connecte || 'dced';
        const escapedEmail = db.escape(email_connecte);
        // Maintenant, nous allons rendre la vue 'R3' avec les données
        res.render('C2', {
            email_connecte
        });
    });
    
    router.post('/ajouter_pixel', (req, res) => {
        const { x, y, couleur } = req.body;
        const email_connecte = req.session.email_connecte; // Supposons que l'email est stocké dans la session

        if (x === undefined || y === undefined || couleur === undefined) {
            return res.status(400).send('Coordonnées ou couleur manquante.');
        }

        if (!email_connecte) {
            return res.status(401).send('Utilisateur non connecté.');
        }

        db.beginTransaction((err) => {
            if (err) {
                return res.status(500).send('Erreur lors de la transaction.');
            }

            const selectPreviousEmailQuery = 'SELECT email FROM PIXEL_WARS WHERE x = ? AND y = ? ORDER BY id_pixel_war DESC LIMIT 1';
            db.query(selectPreviousEmailQuery, [x, y], (err, results) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).send('Erreur lors de la récupération de l\'email précédent.');
                    });
                }

                const ancien_email = results.length > 0 ? results[0].email : null;

                const updatePreviousUserQuery = 'UPDATE UTILISATEUR SET pixel_war_placé = pixel_war_placé - 1 WHERE email = ?';
                if (ancien_email) {
                    db.query(updatePreviousUserQuery, [ancien_email], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).send('Erreur lors de la mise à jour de l\'utilisateur précédent.');
                            });
                        }
                    });
                }

                const selectUserValuesQuery = 'SELECT pixel_war_restant, pixel_war_placé FROM UTILISATEUR WHERE email = ?';
                db.query(selectUserValuesQuery, [email_connecte], (err, results) => {
                    if (err || results.length === 0) {
                        return db.rollback(() => {
                            res.status(500).send('Erreur lors de la récupération des valeurs utilisateur.');
                        });
                    }

                    let { pixel_war_restant, pixel_war_placé } = results[0];
                    pixel_war_restant--;
                    pixel_war_placé++;

                    const updateUserValuesQuery = 'UPDATE UTILISATEUR SET pixel_war_restant = ?, pixel_war_placé = ? WHERE email = ?';
                    db.query(updateUserValuesQuery, [pixel_war_restant, pixel_war_placé, email_connecte], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).send('Erreur lors de la mise à jour des valeurs utilisateur.');
                            });
                        }

                        const insertPixelQuery = 'INSERT INTO PIXEL_WARS (x, y, couleur, email) VALUES (?, ?, ?, ?)';
                        db.query(insertPixelQuery, [x, y, couleur, email_connecte], (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).send('Erreur lors de l\'ajout du pixel.');
                                });
                            }

                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).send('Erreur lors de la validation de la transaction.');
                                    });
                                }
                                res.send('Pixel ajouté avec succès.');
                            });
                        });
                    });
                });
            });
        });
    });
    //----------------------------------------------------------------------
    //----------------------------------- messagerie ------------------------
    //----------------------------------------------------------------------
  // Route pour la page de messagerie
    router.post('/messagerie', (req, res) => {
        console.log("------------------/messagerie--------------");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        // Récupérer les données nécessaires à partir de la session ou de la requête (remplacez cela par votre logique)
    //    var email_connecte = req.session.email_connecwte;
        var email_connecte = req.session.email_connecte;
        var createur = req.body.createur; // Récupérer la valeur de createur du formulaire
        var participant = req.body.participant; // Récupérer la valeur de participant du formulaire
        console.log("participant : " + participant);
        console.log("createur : " + createur);
        // Déterminer le lien en fonction de la session
        var lien = 'pas défini';
        if (email_connecte === createur) {
            lien = "/C3";
            console.log("lien  : "+lien);
        }
        if (email_connecte === participant) {
            lien = "/R3";
            console.log("lien  : "+lien);
        }
        console.log("lien  : "+lien);
        // Rendre la page de messagerie avec les données nécessaires
        res.render('messagerie', { lien, from_email: createur, to_email: participant });
    });
    //----------------------------------------------------------------------
    //----------------------------------- submit_message -------------------
    //----------------------------------------------------------------------

    // Route pour insérer un nouveau message dans la base de données
    router.post('/submit_message', async (req, res) => {
        console.log("*** /submit_message ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
      
        const { contenu, from_email, to_email } = req.body;

        // Requête SQL pour insérer le message
        const sql = 'INSERT INTO MESSAGE (from_email, contenu, to_email) VALUES (?, ?, ?)';
        const values = [from_email, contenu, to_email];
        
        try {
            db.query(sql, values, (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'envoi du message :', error);
                    return res.status(500).send('Erreur lors de l\'envoi du message.');
                }
                res.status(200).send('Message envoyé avec succès.');
            });
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message :', error);
            res.status(500).send('Erreur lors de l\'envoi du message.');
        }
    });






return router;
};
