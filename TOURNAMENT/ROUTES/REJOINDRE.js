//-----------------------------------------------------------------------------------
//              _     _         _
//     _ _ ___ (_)___(_)_ _  __| |_ _ ___
//    | '_/ -_)| / _ \ | ' \/ _` | '_/ -_)
//    |_| \___|/ \___/_|_||_\__,_|_| \___|
//           |__/
//-----------------------------------------------------------------------------------

const path = require('path');
const express = require('express');
const router = express.Router();

module.exports = (db) => {
    //----------------------------------------------------------------------
    //----------------------------------- FONCTIONS -------------------------
    //----------------------------------------------------------------------
   
    function formatDate(date) {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }
    //----------------------------------------------------------------------
    //----------------------------------- R1_inscription -------------------
    //----------------------------------------------------------------------
   
    // Route pour traiter l'inscription au tournoi
    router.post('/R1_inscription', (req, res) => {
        console.log("*** /R1_inscription ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        // Récupérer les données du formulaire
        const { id_tournoi, email_connecte, prive } = req.body;
        
        // Définir les valeurs pour demandeur et participant en fonction de la confidentialité du tournoi
        const demandeur = (prive == 1) ? 1 : 0;
        const participant = (prive == 1) ? 0 : 1;

        // Requête d'insertion dans la table PARTICIPATION
        const sql = `INSERT INTO PARTICIPATION (numero_tournois, demandeur, participant, email)
                     VALUES (?, ?, ?, ?)`;
    //
        // Exécution de la requête
        db.query(sql, [id_tournoi, demandeur, participant, email_connecte], (err, result) => {
            if (err) {
                res.status(500).send("Erreur lors de l'inscription au tournoi : " + err.message);
                return;
            }
            // Rediriger vers la page R1 (ou toute autre page)
            res.redirect('/R1');
           
        });
    });
    //----------------------------------------------------------------------
    //----------------------------------- /R1_ajout_numero -----------------
    //----------------------------------------------------------------------
   
    // Route pour traiter l'ajout de numéro et l'inscription au tournoi
    router.post('/R1_ajout_numero', (req, res) => {
        console.log("*** /R1_ajout_numero ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        // Récupérer les données du formulaire
        const { num: numero, id_tournoi, email_connecte, prive, createur } = req.body;

        // Définir les valeurs pour demandeur et participant en fonction de la confidentialité du tournoi
        const demandeur = (prive == 1) ? 1 : 0;
        const participant = (prive == 1) ? 0 : 1;

        // Créer les requêtes d'insertion dans les tables NUMERO_ACCES et PARTICIPATION
        const sql1 = `INSERT INTO NUMERO_ACCES (email, numero, voyeur) VALUES (?, ?, ?)`;
        const sql2 = `INSERT INTO PARTICIPATION (numero_tournois, demandeur, participant, email) VALUES (?, ?, ?, ?)`;

        // Exécuter les requêtes d'insertion
        db.query(sql1, [email_connecte, numero, createur], (err, result1) => {
            if (err) {
                res.status(500).send("Erreur lors de l'ajout du numéro d'accès : " + err.message);
                return;
            }

            db.query(sql2, [id_tournoi, demandeur, participant, email_connecte], (err, result2) => {
                if (err) {
                    res.status(500).send("Erreur lors de l'inscription au tournoi : " + err.message);
                    return;
                }

                // Rediriger vers la page R1 (ou toute autre page)
                res.redirect('/R1');
            });
        });
    });
    //----------------------------------------------------------------------
    //----------------------------------- /R1 -------------------------------
    //----------------------------------------------------------------------
   
    router.get('/R1', (req, res) => {
        const id = req.query.id;
        console.log("------------------/R1--------------");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        console.log("id : ",id);
        
        var email_connecte = req.session.email_connecte || 'dced';
        var search_query = req.query.search || '';
        
        
        // Escaper la valeur de l'email pour éviter les injections SQL
            const escapedEmail = db.escape(email_connecte);
        let sql = `
            SELECT t.*, COUNT(DISTINCT CASE WHEN p.participant = 1 THEN p.email END) AS nombre_participants
            FROM TOURNOIS AS t
            LEFT JOIN DEMANDE AS d ON t.id_tournois = d.numero_tournois
            LEFT JOIN PARTICIPATION AS p ON t.id_tournois = p.numero_tournois
            WHERE t.id_tournois NOT IN (
                SELECT numero_tournois
                FROM PARTICIPATION
                WHERE email=${escapedEmail} AND (participant=1 OR demandeur=1)
            )
        `;

        const params = [email_connecte];
        
        if (id) {
                sql += " AND id_tournois = " + id;
            }
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
        sql += " HAVING nombre_participants < place_maximum";

        db.query(sql, params, (err, results) => {
            if (err) throw err;

            // Formatage des dates avant de rendre le template
            results.forEach(tournament => {
                tournament.date_formatted = formatDate(tournament.date_tournois);
                console.log(tournament.date_formatted);  // Ajout du log ici
            });
            
            

            // Maintenant, nous allons rendre la vue 'R1' avec les données
                    res.render('R1', {
                        tournaments: results,
                        email_connecte,
                        public: req.query.public || false,
                        public2: req.query.public2 || false,
                        nbr_equipe: req.query.nbr_equipe || '',
                        activite: req.query.activite || '',
                        cash_prize_min: req.query.cash_prize_min || '',
                        cout_tournois_max: req.query.cout_tournois_max || '',
                        id
                  
            });
        });
        });

    //----------------------------------------------------------------------
    //----------------------------------- /R2 -------------------------------
    //----------------------------------------------------------------------
     // Route pour récupérer les tournois en attente pour un utilisateur donné
    router.get('/R2_tournois_en_attente', (req, res) => {
        console.log("*** /R2_tournois_en_attente ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        const email_connecte = req.session.email_connecte;
        // Récupérer l'email de l'utilisateur à partir des paramètres de requête
      
        // Requête SQL pour récupérer les tournois en attente pour l'utilisateur donné
        const sql = `SELECT * FROM TOURNOIS AS t LEFT JOIN PARTICIPATION AS p ON p.numero_tournois = t.id_tournois WHERE p.email = ? AND t.id_tournois IN (SELECT numero_tournois FROM PARTICIPATION WHERE email = ? AND demandeur=1);`;

        // Exécution de la requête SQL avec les valeurs des paramètres
        db.query(sql, [email_connecte, email_connecte], (err, results) => {
            if (err) {
                console.error('Erreur lors de l\'exécution de la requête SQL :', err);
                res.status(500).json({ error: 'Erreur lors de la récupération des données' });
                return;
            }
            

            // Si des résultats sont trouvés, renvoyer les données au format JSON
            if (results.length > 0) {
         
                res.json(results);
            } else {
                // Si aucun résultat n'est trouvé, renvoyer un tableau vide
                res.json([]);
            }
        });
    });

    // Route pour récupérer les tournois inscrits pour un utilisateur donné
    router.get('/R2_tournois_inscrit', (req, res) => {
        console.log("*** /R2_tournois_inscrit ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        // Récupérer l'email de l'utilisateur à partir des paramètres de requête
        const email_connecte = req.session.email_connecte;

        // Requête SQL pour récupérer les tournois inscrits pour l'utilisateur donné
        const sql = `SELECT * FROM TOURNOIS AS t LEFT JOIN PARTICIPATION AS p ON p.numero_tournois = t.id_tournois WHERE p.email = ? AND t.id_tournois IN (SELECT numero_tournois FROM PARTICIPATION WHERE email = ? AND participant = 1);`;

        // Exécution de la requête SQL avec les valeurs des paramètres
        db.query(sql, [email_connecte, email_connecte], (err, results) => {
            if (err) {
                console.error('Erreur lors de l\'exécution de la requête SQL :', err);
                res.status(500).json({ error: 'Erreur lors de la récupération des données' });
                return;
            }

            // Si des résultats sont trouvés, renvoyer les données au format JSON
            if (results.length > 0) {
        
                res.json(results);
            } else {
                // Si aucun résultat n'est trouvé, renvoyer un tableau vide
                res.json([]);
            }
        });
    });
    //----------------------------------------------------------------------
    //----------------------------------- /R2_tournois_non_inscrit ----------
    //----------------------------------------------------------------------
   
    // Route pour récupérer les tournois non inscrits pour un utilisateur donné
    router.get('/R2_tournois_non_inscrit', (req, res) => {
        console.log("*** /R2_tournois_non_inscrit ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        // Récupérer l'email de l'utilisateur à partir des paramètres de requête
        const email_connecte = req.session.email_connecte;

        // Requête SQL pour récupérer les tournois non inscrits pour l'utilisateur donné
        const sql = `SELECT t.nom_tournois AS nom, t.latitude, t.longitude, t.id_tournois
                     FROM TOURNOIS AS t
                     WHERE t.id_tournois NOT IN
                         (SELECT numero_tournois FROM PARTICIPATION WHERE email = ?)`;

        // Exécution de la requête SQL avec les valeurs des paramètres
        db.query(sql, [email_connecte], (err, results) => {
            if (err) {
                console.error('Erreur lors de l\'exécution de la requête SQL :', err);
                res.status(500).json({ error: 'Erreur lors de la récupération des données' });
                return;
            }

            // Si des résultats sont trouvés, renvoyer les données au format JSON
            if (results.length > 0) {
         
                res.json(results);
            } else {
                // Si aucun résultat n'est trouvé, renvoyer un tableau vide
                res.json([]);
            }
        });
    });
    //----------------------------------------------------------------------
    //----------------------------------- /R2  -----------------------------
    //----------------------------------------------------------------------
   
    router.get('/R2', (req, res) => {
        
        console.log("------------------/R2--------------");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        // Simulez la session et l'email_connecte
        const email_connecte = req.session.email_connecte;
        
        // Rendu de la vue avec les données
        res.render('R2', { email_connecte });
    });

    //--------------------------------------R3
    router.post('/R3_annuler', (req, res) => {
        console.log("*** /R3_annuler ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        const id_tournoi = req.body.id_tournoi;
        //const email_connecte = req.body.email_connecte;
        const email_connecte = req.session.email_connecte;

        const delete_sql = 'DELETE FROM PARTICIPATION WHERE email = ? AND numero_tournois = ? AND DEMANDEUR = 1';

        db.query(delete_sql, [email_connecte, id_tournoi], (error, results) => {
            if (error) {
                console.error('Erreur lors de l\'annulation de la demande :', error);
                return res.status(500).send('Erreur lors de l\'annulation de la demande.');
            }

            if (results.affectedRows > 0) {
                return res.redirect('/R3'); // Redirige seulement si la demande est annulée avec succès
            } else {
                return res.status(404).send('Aucune demande correspondante trouvée.');
            }
        });
    });

    function returnDecision(email_connecte, x) {
        console.log(email_connecte,x);
        return new Promise((resolve, reject) => {
            let sql = "SELECT COUNT(*) AS demande_count FROM DEMANDE WHERE demandeur = ? AND numero_tournois = ? AND accepter = 0";
            let sql2 = "SELECT COUNT(*) AS demande_count FROM DEMANDE WHERE demandeur = ? AND numero_tournois = ? AND accepter = 1";

            db.query(sql, [email_connecte, x], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la vérification de la demande refusée :', error);
                    return reject('Erreur lors de la vérification de la demande refusée.');
                }
                const demande_count = results[0].demande_count;

                db.query(sql2, [email_connecte, x], (error, results2) => {
                    if (error) {
                        console.error('Erreur lors de la vérification de la demande acceptée :', error);
                        return reject('Erreur lors de la vérification de la demande acceptée.');
                    }
                    const demande_count2 = results2[0].demande_count;

                    let reponse;
                    if (demande_count > 0) {
                        reponse = 'refuser';
                    } else if (demande_count2 > 0) {
                        reponse = 'accepter';
                    } else {
                        reponse = 'en_attente';
                    }
                    console.log(reponse);
                    resolve(reponse);
                });
            });
        });
    }
    
    //----------------------------------------------------------------------
    //----------------------------------- /R3  -----------------------------
    //----------------------------------------------------------------------
    // Route pour afficher la liste des tournois
    router.get('/R3', async (req, res) => {
        //----------------------mess
        // Route pour la page de messagerief
        
        console.log("------------------/R3--------------");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        const id = req.query.id;
        var email_connecte = req.session.email_connecte || 'dced';
        var search_query = req.query.search || '';
        console.log(search_query);
        
        // Escaper la valeur de l'email pour éviter les injections SQL
        const escapedEmail = db.escape(email_connecte);
        let sql = `
        SELECT t.*,
            COUNT(DISTINCT CASE WHEN p.participant = 1 THEN p.email END) AS nombre_participants
        FROM TOURNOIS AS t
        LEFT JOIN PARTICIPATION AS p ON t.id_tournois = p.numero_tournois
        WHERE t.id_tournois IN (
            SELECT numero_tournois
            FROM PARTICIPATION
            WHERE email = ${escapedEmail} AND demandeur = 1
            UNION
            SELECT numero_tournois
            FROM DEMANDE
            WHERE demandeur = ${escapedEmail}
        )
  
        `;
        console.log(sql);
        const params = [email_connecte];
        if (id) {
                sql += " AND id_tournois = " + id;
            }

        // Ajout des conditions supplémentaires à la requête SQL
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
        sql += " HAVING nombre_participants < place_maximum";


        try {
            const results = await new Promise((resolve, reject) => {
                db.query(sql, params, (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });

            // Récupération des décisions pour chaque tournoi
            await Promise.all(results.map(async tournament => {
                tournament.date_formatted = formatDate(tournament.date_tournois);
                console.log(tournament);
                
                try {
                    console.log(tournament.id_tournois);
                    
                    const decision = await returnDecision("invite@example.com", tournament.id_tournois);
                    tournament.decision = decision;
                } catch (error) {
                    console.error('Erreur lors de la récupération de la décision :', error);
                    tournament.decision = 'erreur';
                }
            }));

            // Maintenant, nous allons rendre la vue 'R3' avec les données
            res.render('R3', {
                tournaments: results,
                email_connecte,
                public: req.query.public || false,
                public2: req.query.public2 || false,
                nbr_equipe: req.query.nbr_equipe || '',
                activite: req.query.activite || '',
                cash_prize_min: req.query.cash_prize_min || '',
                cout_tournois_max: req.query.cout_tournois_max || '',
                id
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des tournois :', error);
            // Gérer l'erreur et renvoyer une réponse appropriée
            res.status(500).send('Une erreur s\'est produite lors de la récupération des tournois.');
        }
    });


    
    //----------------------------------------------------------------------
    //----------------------------------- /R4_quitter  ---------------------
    //----------------------------------------------------------------------  
    // Route pour annuler la participation
    router.post('/R4_quitter', (req, res) => {
        console.log("*** /R4_quitter ***");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
      
        const idTournoi = req.body.id_tournoi;
        const emailConnecte = req.body.email_connecte;

        if (!idTournoi || !emailConnecte) {
            return res.status(400).send('Les paramètres id_tournoi et email_connecte sont requis.');
        }

        const deleteSql = 'DELETE FROM PARTICIPATION WHERE email = ? AND numero_tournois = ? AND participant = 1';

        db.query(deleteSql, [emailConnecte, idTournoi], (err, result) => {
            if (err) {
                console.error('Erreur lors de l\'annulation de la demande :', err);
                return res.status(500).send('Erreur lors de l\'annulation de la demande.');
            }

            if (result.affectedRows > 0) {
                // Rediriger vers R4.php après succès
                res.redirect('/R4');
            } else {
                res.send('Aucune participation trouvée pour annulation.');
            }
        });
    });
    //----------------------------------------------------------------------
    //----------------------------------- /R4  -----------------------------
    //----------------------------------------------------------------------
    // Route pour afficher la liste des tournois
    router.get('/R4', async (req, res) => {
        console.log("------------------/R4--------------");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ",req.session.situation);
        const id = req.query.id;
        var email_connecte = req.session.email_connecte || 'dced';
        var search_query = req.query.search || '';
        console.log(search_query);
        
        // Escaper la valeur de l'email pour éviter les injections SQL
        const escapedEmail = db.escape(email_connecte);
        let sql = `
            SELECT t.*, COUNT(DISTINCT CASE WHEN p.participant = 1 THEN p.email END) AS nombre_participants
            FROM TOURNOIS AS t
            LEFT JOIN DEMANDE AS d ON t.id_tournois = d.numero_tournois
            LEFT JOIN PARTICIPATION AS p ON t.id_tournois = p.numero_tournois
            WHERE t.id_tournois IN (
                SELECT numero_tournois
                FROM PARTICIPATION
                WHERE email = ? AND participant = 1
            )
        `;

        const params = [email_connecte];
        if (id) {
            sql += " AND id_tournois = " + id;
            }
        // Ajout des conditions supplémentaires à la requête SQL
        if (req.query.public) {
            sql += " AND prive = 0";
        }
        if (req.query.public2) {
            sql += " AND demander_numero = 0";
        }
        if (req.query.nbr_equipe) {
            sql += " AND nbr_equipe = ?";
            params.push(req.query.nbr_equipe);
        }
        if (req.query.activite) {
            const activite_lowercase = req.query.activite.toLowerCase();
            sql += " AND LOWER(nom_activite) LIKE ?";
            params.push('%' + activite_lowercase + '%');
        }
        if (req.query.cash_prize_min) {
            sql += " AND cash_prize >= ?";
            params.push(req.query.cash_prize_min);
        }
        if (req.query.cout_tournois_max) {
            sql += " AND cout_tournois <= ?";
            params.push(req.query.cout_tournois_max);
        }
        if (search_query) {
            // Utilisation de la fonction SQL LIKE pour rechercher dans plusieurs colonnes
            const search_query_lower = search_query.toLowerCase();
            sql += " AND (LOWER(nom_tournois) LIKE ? OR LOWER(lieu_tournois) LIKE ? OR LOWER(nom_activite) LIKE ?)";
            params.push('%' + search_query_lower + '%', '%' + search_query_lower + '%', '%' + search_query_lower + '%');
        }

        sql += " GROUP BY t.id_tournois";
        sql += " HAVING nombre_participants < t.place_maximum";

        try {
            const results = await new Promise((resolve, reject) => {
                db.query(sql, params, (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });

            // Récupération des décisions pour chaque tournoi
            await Promise.all(results.map(async tournament => {
                tournament.date_formatted = formatDate(tournament.date_tournois);
                try {
                    const decision = await returnDecision("invite@example.com", tournament.id_tournois);
                    tournament.decision = decision;
                } catch (error) {
                    console.error('Erreur lors de la récupération de la décision :', error);
                    tournament.decision = 'erreur';
                }
            }));

            // Maintenant, nous allons rendre la vue 'R3' avec les données
            res.render('R4', {
                tournaments: results,
                email_connecte,
                public: req.query.public || false,
                public2: req.query.public2 || false,
                nbr_equipe: req.query.nbr_equipe || '',
                activite: req.query.activite || '',
                cash_prize_min: req.query.cash_prize_min || '',
                cout_tournois_max: req.query.cout_tournois_max || '',
                id
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des tournois :', error);
            // Gérer l'erreur et renvoyer une réponse appropriée
            res.status(500).send('Une erreur s\'est produite lors de la récupération des tournois.');
        }
    });

    return router;
};


