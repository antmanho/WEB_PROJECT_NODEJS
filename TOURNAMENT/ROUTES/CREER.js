//-----------------------------------------------------------------------------------
//     __ _ _ ___ ___ _ _
//    / _| '_/ -_) -_) '_|
//    \__|_| \___\___|_|
//
//-----------------------------------------------------------------------------------

const path = require('path');
const express = require('express');
const axios = require('axios');
const router = express.Router();

module.exports = (db ) => {
    //----------------------------------------------------------------------
    //----------------------------------- FONCTIONS ------------------------
    //----------------------------------------------------------------------
       function formatDate(date) {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
       }
    
    async function getCoordinates(address) {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json`;
        try {
            const response = await axios.get(url);
            const data = response.data;
            if (data.length > 0 && data[0].lat && data[0].lon) {
                return {
                    latitude: data[0].lat,
                    longitude: data[0].lon
                };
            } else {
                return {
                    latitude: 0,
                    longitude: 0
                };
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des coordonnées:', error);
            return {
                latitude: 0,
                longitude: 0
            };
        }
    }
    //----------------------------------------------------------------------
    //----------------------------------- /C1_ajouter_tournoi ---------------
    //----------------------------------------------------------------------
    
    router.post('/C1_ajouter_tournoi', async (req, res) => {
        console.log("*** /C1_ajouter_tournoi ***");
        console.log("$_SESSION['email_connecte']:", req.session.email_connecte);
        console.log("$_SESSION['situation']:", req.session.situation);
        
        const createur = req.session.email_connecte;
        const {
            nom_tournois, date_tournois, lieu_tournois, h_tournois, m_tournois,
            numero_telephone, nbr_equipe = '0', place_maximum = '1000',
            plus_info = 'd', nom_activite = 'd', cash_prize = '0', cout_tournois = '0',
            prive = 'false', equipe = 'false', num = 'false'
        } = req.body;

        // Convert string values to appropriate types
        const priveInt = prive === 'true' ? 1 : 0;
        const equipeInt = equipe === 'true' ? 1 : 0;
        const numInt = num === 'true' ? 1 : 0;
        const nbrEquipeInt = parseInt(nbr_equipe) || 0;
        const placeMaximumInt = parseInt(place_maximum) || 1000;
        const cashPrizeInt = parseFloat(cash_prize) || 0;
        const coutTournoisInt = parseFloat(cout_tournois) || 0;

        const coords = await getCoordinates(lieu_tournois);
        const { latitude, longitude } = coords;

        const sql = `
            INSERT INTO TOURNOIS (
                nom_tournois, date_tournois, lieu_tournois, h_tournois, m_tournois,
                numero_telephone, prive, equipe, nbr_equipe, place_maximum, plus_info,
                nom_activite, cash_prize, cout_tournois, createur, demander_numero, latitude, longitude
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            nom_tournois, date_tournois, lieu_tournois, parseInt(h_tournois), parseInt(m_tournois),
            numero_telephone, priveInt, equipeInt, nbrEquipeInt, placeMaximumInt, plus_info,
            nom_activite, cashPrizeInt, coutTournoisInt, createur, numInt, latitude, longitude
        ];

        db.query(sql, values, (error, results) => {
            if (error) {
                console.error('Erreur lors de l\'ajout du tournoi:', error);
                res.status(500).send('Erreur lors de l\'ajout du tournoi.');
                return;
            }
            res.redirect('/C1?success=true');
        });
    });

    //----------------------------------------------------------------------
    //----------------------------------- /C1 -------------------------------
    //----------------------------------------------------------------------
   
    router.get('/C1', async (req, res) => {
        console.log("------------------/C1--------------");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        var email_connecte = req.session.email_connecte || 'dced';
        var search_query = req.query.search || '';
        console.log(search_query);
        
        try {
            const coords = await getCoordinates("9 Pl. Corot, 34070 Montpellier");
            console.log("coordonne", coords);
        } catch (error) {
            console.error('Erreur lors de la récupération des coordonnées:', error);
        }
        
        // Escaper la valeur de l'email pour éviter les injections SQL
        const escapedEmail = db.escape(email_connecte);
        
        // Maintenant, nous allons rendre la vue 'R3' avec les données
        res.render('C1', {
            email_connecte
        });
    });
    //----------------------------------------------------------------------
    //----------------------------------- /C3_accepter ---------------------
    //----------------------------------------------------------------------
    router.post('/C3_accepter', (req, res) => {
        console.log("*** /C3_accepter ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        const { id_tournoi, id_participation, email } = req.body;

        const sqlInsertDemande = `
            INSERT INTO DEMANDE (numero_tournois, demandeur, accepter)
            VALUES (?, ?, 1)
        `;

        db.query(sqlInsertDemande, [id_tournoi, email], (err, result) => {
            if (err) {
                console.error('Erreur lors de l\'ajout de la demande:', err);
                res.status(500).send('Erreur lors de l\'ajout de la demande.');
                return;
            }

            console.log('Demande acceptée avec succès.');

            const sqlUpdateParticipation = `
                UPDATE PARTICIPATION SET demandeur = 0, participant = 1
                WHERE id_participation = ?
            `;

            db.query(sqlUpdateParticipation, [id_participation], (err, result) => {
                if (err) {
                    console.error('Erreur lors de la mise à jour de la participation:', err);
                    res.status(500).send('Erreur lors de la mise à jour de la participation.');
                    return;
                }

                console.log('Participation mise à jour avec succès.');
                res.redirect('/C3'); // Assurez-vous que cette route est définie dans votre application
            });
        });
    });
    //----------------------------------------------------------------------
    //----------------------------------- /C3_refuserr ---------------------
    //----------------------------------------------------------------------
    // Route pour gérer la demande et supprimer la participation
    router.post('/C3_refuser', (req, res) => {
        console.log("*** /C3_refuser ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        const { id_tournoi, email, id_participation } = req.body;

        // Requête pour insérer une nouvelle entrée dans la table DEMANDE
        const sqlInsertDemande = `
            INSERT INTO DEMANDE (numero_tournois, demandeur, accepter)
            VALUES (?, ?, 0)
        `;

        db.query(sqlInsertDemande, [id_tournoi, email], (err, result) => {
            if (err) {
                console.error('Erreur lors de l\'ajout de la demande:', err);
                res.status(500).send('Erreur lors de l\'ajout de la demande.');
                return;
            }

            console.log('Demande ajoutée avec succès.');

            // Requête pour supprimer la ligne de la table PARTICIPATION
            const sqlDeleteParticipation = `
                DELETE FROM PARTICIPATION WHERE id_participation = ?
            `;

            db.query(sqlDeleteParticipation, [id_participation], (err, result) => {
                if (err) {
                    console.error('Erreur lors de la suppression de la participation:', err);
                    res.status(500).send('Erreur lors de la suppression de la participation.');
                    return;
                }

                console.log('Participation supprimée avec succès.');

                // Redirection vers la page C3.php (ou toute autre page appropriée)
                res.redirect('/C3'); // Assurez-vous que cette route est définie dans votre application
            });
        });
    });
    //----------------------------------------------------------------------
    //----------------------------------- /C3--------------------------------
    //----------------------------------------------------------------------
    // Route pour afficher la liste des tournois
    router.get('/C3', async (req, res) => {
        //----------------------mess
        // Route pour la page de messagerie
        console.log("------------------/C3--------------");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        var email_connecte = req.session.email_connecte || 'dced';
        var search_query = req.query.search || '';
        console.log(search_query);

        // Escaper la valeur de l'email pour éviter les injections SQL
        const escapedEmail = db.escape(email_connecte);
        let sql = `
           SELECT p.*,t.*,
                              COUNT(DISTINCT CASE WHEN p.participant = 1 THEN p.email END) AS nombre_participants
                       FROM PARTICIPATION AS p
                       JOIN TOURNOIS AS t ON t.id_tournois = p.numero_tournois
                       WHERE p.numero_tournois IN (
                           SELECT id_tournois FROM TOURNOIS WHERE createur = ?
                       )
                       AND NOT EXISTS (
                           SELECT 1
                           FROM DEMANDE d
                           WHERE d.numero_tournois = p.numero_tournois
                           AND d.demandeur = p.demandeur
                       )
                       AND p.demandeur = 1
                       
        `;

        const params = [email_connecte];

        // Ajout des conditions supplémentaires à la requête SQL
        if (req.query.public) {
            sql += " AND t.prive = 0";
        }
        if (req.query.public2) {
            sql += " AND t.demander_numero = 0";
        }
        if (req.query.nbr_equipe) {
            sql += " AND t.nbr_equipe = ?";
            params.push(req.query.nbr_equipe);
        }
        if (req.query.activite) {
            const activite_lowercase = req.query.activite.toLowerCase();
            sql += " AND LOWER(t.nom_activite) LIKE ?";
            params.push('%' + activite_lowercase + '%');
        }
        if (req.query.cash_prize_min) {
            sql += " AND t.cash_prize >= ?";
            params.push(req.query.cash_prize_min);
        }
        if (req.query.cout_tournois_max) {
            sql += " AND t.cout_tournois <= ?";
            params.push(req.query.cout_tournois_max);
        }
        if (search_query) {
            // Utilisation de la fonction SQL LIKE pour rechercher dans plusieurs colonnes
            const search_query_lower = search_query.toLowerCase();
            sql += " AND (LOWER(t.nom_tournois) LIKE ? OR LOWER(t.lieu_tournois) LIKE ? OR LOWER(t.nom_activite) LIKE ?)";
            params.push('%' + search_query_lower + '%', '%' + search_query_lower + '%', '%' + search_query_lower + '%');
        }

        sql += " GROUP BY t.id_tournois, p.id_participation";
        sql += " HAVING nombre_participants < t.place_maximum";

        try {
            const results = await new Promise((resolve, reject) => {
                db.query(sql, params, (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });

            // Formatage des dates avant de rendre le template
            results.forEach(tournament => {
                tournament.date_formatted = formatDate(tournament.date_tournois);
                console.log(tournament.date_formatted); // Ajout du log ici
                console.log(tournament.createur);
            });

           

            // Maintenant, nous allons rendre la vue 'C3' avec les données
            res.render('C3', {
                tournaments: results,
                email_connecte,
                public: req.query.public || false,
                public2: req.query.public2 || false,
                nbr_equipe: req.query.nbr_equipe || '',
                activite: req.query.activite || '',
                cash_prize_min: req.query.cash_prize_min || '',
                cout_tournois_max: req.query.cout_tournois_max || ''
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des tournois :', error);
            // Gérer l'erreur et renvoyer une réponse appropriée
            res.status(500).send('Une erreur s\'est produite lors de la récupération des tournois.');
        }
    });

    //----------------------------------------------------------------------
    //----------------------------------- /C4_ajouter_tournois -------------
    //----------------------------------------------------------------------
    router.post('/C4_ajouter_tournois', async (req, res) => {
        console.log("*** /C4_ajouter_tournois ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ", req.session.situation);
        
        const {
            id_tournoi, nom_tournois, date_tournois, lieu_tournois, h_tournois, m_tournois,
            numero_telephone, nbr_equipe = '0', place_maximum = '1000',
            plus_info = 'd', nom_activite = 'd', cash_prize = '0', cout_tournois = '0',
            prive = 'false', equipe = 'false', num = 'false'
        } = req.body;
        console.log(id_tournoi);
        // Convert string values to appropriate types
        const priveInt = prive === 'true' ? 1 : 0;
        const equipeInt = equipe === 'true' ? 1 : 0;
        const numInt = num === 'true' ? 1 : 0;
        const nbrEquipeInt = parseInt(nbr_equipe) || 0;
        const placeMaximumInt = parseInt(place_maximum) || 1000;
        const cashPrizeInt = parseFloat(cash_prize) || 0;
        const coutTournoisInt = parseFloat(cout_tournois) || 0;

        try {
            const coords = await getCoordinates(lieu_tournois);
            const { latitude, longitude } = coords;

            const sql = `
                UPDATE TOURNOIS
                SET
                    nom_tournois = ?,
                    date_tournois = ?,
                    lieu_tournois = ?,
                    h_tournois = ?,
                    m_tournois = ?,
                    numero_telephone = ?,
                    prive = ?,
                    equipe = ?,
                    nbr_equipe = ?,
                    place_maximum = ?,
                    plus_info = ?,
                    nom_activite = ?,
                    cash_prize = ?,
                    cout_tournois = ?,
                    createur = ?,
                    demander_numero = ?
                WHERE id_tournois = ?`;

            const values = [
                nom_tournois,
                date_tournois,
                lieu_tournois,
                parseInt(h_tournois),
                parseInt(m_tournois),
                numero_telephone,
                priveInt,
                equipeInt,
                nbrEquipeInt,
                placeMaximumInt,
                plus_info,
                nom_activite,
                cashPrizeInt,
                coutTournoisInt,
                req.session.email_connecte,
                numInt,
                parseInt(id_tournoi)
            ];

            db.query(sql, values, (err, result) => {
                if (err) {
                    console.error('Erreur lors de la modification du tournoi:', err);
                    res.status(500).send('Erreur lors de la modification du tournoi.');
                    return;
                }

                console.log('Le tournoi a été modifié avec succès.');
                res.redirect('/C4?success=true');
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des coordonnées:', error);
            res.status(500).send('Erreur lors de la récupération des coordonnées.');
        }
    });

   
    //----------------------------------------------------------------------
    //----------------------------------- /C4_supprimer ---------------------
    //----------------------------------------------------------------------
  
    router.post('/C4_supprimer', (req, res) => {
        console.log("*** /C4_supprimer ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        const { id_tournoi, email_connecte } = req.body;

        const deleteQuery = `
            DELETE FROM TOURNOIS
            WHERE id_tournois = ?
            AND createur = ?
        `;

        db.query(deleteQuery, [id_tournoi, email_connecte], (err, result) => {
            if (err) {
                console.error('Erreur lors de la suppression du tournoi:', err);
                res.status(500).send('Erreur lors de la suppression du tournoi.');
                return;
            }

            console.log('Le tournoi a été supprimé avec succès.');
            res.redirect('/C4'); // Assurez-vous que cette route est définie dans votre application
        });
    });
    //----------------------------------------------------------------------
    //----------------------------------- /C4_tout ---------------------
    //----------------------------------------------------------------------
    router.get('/C4_tout', (req, res) => {
        console.log("*** /C4_tout ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        const tournoisId = req.query.tournoisId;
        const email_connecte = req.query.email_connecte;
        
        
        //  ce tournois a t'il demander_numero = 1???
        const demande_numero_query = `SELECT * FROM TOURNOIS WHERE id_tournois = ${tournoisId} AND demander_numero = 1`;
        db.query(demande_numero_query, (err, result_demande_numero) => {
            if (err) {
                console.error('Erreur lors de la récupération de la demande de numéro:', err);
                res.status(500).json({ error: 'Erreur lors de la récupération de la demande de numéro.' });
                return;
            }

            let sql;
            if (result_demande_numero.length > 0) {
                sql = `SELECT p.email, n.numero
                        FROM PARTICIPATION AS p
                        JOIN NUMERO_ACCES AS n ON p.email = n.email
                        WHERE p.numero_tournois = ${tournoisId} AND p.participant = 1 AND n.voyeur = '${email_connecte}'`;
              
            } else {
                sql = `SELECT email
                        FROM PARTICIPATION
                        WHERE numero_tournois = ${tournoisId} AND participant = 1`;
            }
            console.log(sql);

            db.query(sql, (err, result) => {
                if (err) {
                    console.error('Erreur lors de la récupération des participants:', err);
                    res.status(500).json({ error: 'Erreur lors de la récupération des participants.' });
                    return;
                }

                const participants = result.map(row => {
                    if (row.email) {
                        return { email: row.email, numero: row.numero };
                    } else {
                        return { email: row.email };
                    }
                });

                res.json(participants);
            });
        });
    });
    // Route pour afficher le formulaire de modification de tournoi
    router.post('/C4_modifie', (req, res) => {
        console.log("*** /C4_modifie ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        // Récupérer les valeurs par défaut ou les valeurs de la requête
        const id = req.body.id_tournoi;console.log(id);
        const email_connecte = req.body.email_connecte || '';
        const nom_tournois_default = req.body.nom_tournois || '';
        const date_tournois_default = req.body.date_tournois || '';
        const lieu_tournois_default = req.body.lieu_tournois || '';
        const h_tournois_default = req.body.h_tournois || '';
        const m_tournois_default = req.body.m_tournois || '';
        const numero_telephone_default = req.body.numero_telephone || '';
        const nbr_equipe_default = req.body.nbr_equipe || '';
        const place_maximum_default = req.body.place_maximum || '';
        const plus_info_default = req.body.plus_info || '';
        const nom_activite_default = req.body.nom_activite || '';
        const cash_prize_default = req.body.cash_prize || '';
        const cout_tournois_default = req.body.cout_tournois || '';
        const createur_default = req.body.createur || '';
        const equipe_default = req.body.equipe || '';
        const demander_numero_default = req.body.demander_numero || '';
        const prive_default = req.body.prive || '';

        // Rendre la vue EJS avec les valeurs définies
        res.render('C4_modifie', {
            email_connecte,
            nom_tournois_default,
            date_tournois_default,
            lieu_tournois_default,
            h_tournois_default,
            m_tournois_default,
            numero_telephone_default,
            nbr_equipe_default,
            place_maximum_default,
            plus_info_default,
            nom_activite_default,
            cash_prize_default,
            cout_tournois_default,
            createur_default,
            equipe_default,
            demander_numero_default,
            prive_default,
            id
        });
    });


    //----------------------------------------------------------------------
    //----------------------------------- /C4 -------------------------------
    //----------------------------------------------------------------------

    router.get('/C4', (req, res) => {
        console.log("------------------/C4--------------");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        var email_connecte = req.session.email_connecte || 'dced';
        var search_query = req.query.search || '';
        console.log(search_query);
        
        // Escaper la valeur de l'email pour éviter les injections SQL
        const escapedEmail = db.escape(email_connecte);
        let sql = `
          SELECT t.*,
                         COUNT(DISTINCT CASE WHEN p.participant = 1 THEN p.email END) AS nombre_participants
                  FROM TOURNOIS AS t
                  LEFT JOIN DEMANDE AS d ON t.id_tournois = d.numero_tournois
                  LEFT JOIN PARTICIPATION AS p ON t.id_tournois = p.numero_tournois
                  WHERE createur=${escapedEmail}
        `;
        const params = [escapedEmail];


        if (req.query.public) {
            sql += " AND prive = 0";
        }
        if (req.query.public2) {
            sql += " AND demander_numero = 0";
        }
        if (req.query.nbr_equipe) {
            sql += " AND nbr_equipe = " + req.query.nbr_equipe;
        }
        if (req.query.activite) {
            const activite_lowercase = req.query.activite.toLowerCase();
            sql += " AND LOWER(nom_activite) LIKE '%" + activite_lowercase + "%'";
        }
        if (req.query.cash_prize_min) {
            sql += " AND cash_prize >= " + req.query.cash_prize_min;
        }
        if (req.query.cout_tournois_max) {
            sql += " AND cout_tournois <= " + req.query.cout_tournois_max;
        
        }
        if (search_query) {
            // Utilisation de la fonction SQL LIKE pour rechercher dans plusieurs colonnes
            sql += " AND (LOWER(nom_tournois) LIKE '%" + search_query.toLowerCase() + "%' OR LOWER(lieu_tournois) LIKE '%" + search_query.toLowerCase() + "%' OR LOWER(nom_activite) LIKE '%" + search_query.toLowerCase() + "%')";
        }

        sql += " GROUP BY t.id_tournois";


        db.query(sql, params, (err, results) => {
            if (err) throw err;

            // Formatage des dates avant de rendre le template
            results.forEach(tournament => {
                tournament.date_formatted = formatDate(tournament.date_tournois);
                console.log(tournament.date_formatted);  // Ajout du log ici
                
            });
            
       

            // Maintenant, nous allons rendre la vue 'R1' avec les données
                    res.render('C4', {
                        tournaments: results,
                        email_connecte,
                        public: req.query.public || false,
                        public2: req.query.public2 || false,
                        nbr_equipe: req.query.nbr_equipe || '',
                        activite: req.query.activite || '',
                        cash_prize_min: req.query.cash_prize_min || '',
                        cout_tournois_max: req.query.cout_tournois_max || ''
                  
            });
        });
        });




    return router;
    };
