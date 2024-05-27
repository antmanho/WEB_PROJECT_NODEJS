//-----------------------------------------------------------------------------------
//     _ __  ___ _ _ _  _
//    | '  \/ -_) ' \ || |
//    |_|_|_\___|_||_\_,_|
//
//-----------------------------------------------------------------------------------

const path = require('path');
const express = require('express');
const router = express.Router();

module.exports = (db ) => {
    //----------------------------------------------------------------------
    //----------------------------------- /menu ---------------------
    //----------------------------------------------------------------------
    router.get('/menu', (req, res) => {
        req.session.situation = 'menu';
        console.log("------------------ /menu --------------");
        console.log("$_SESSION['email_connecte'] : ", req.session.email_connecte);
        console.log("$_SESSION['situation'] : ", req.session.situation);
        res.render('menu', { email_connecte: req.session.email_connecte });
      
    });
return router;
};

