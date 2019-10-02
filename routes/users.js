var express = require('express');
var crypto = require('crypto');
var router = express.Router();
const app = express();

const { check, validationResult } = require('express-validator');
var mongo = require('../bin/mongo');

const ObjectId = require('mongodb').ObjectId;

app.use(express.json());



/* Obtenir la liste de tous les utilisateurs. */
router.get('/', function(req, res, next) {
  mongo.getInstance().collection('users').find({}).toArray(function(err, result) {
      if (err) throw err;
      console.log(result);
      res.send({ok: true, result})
  });
});




// Création d'un utlisateur
router.post('/', [ 
check('mail').isEmail(),
check('password').isLength({ min: 5 })
], function(req, res) { 
  // Vérifier que les paramètre prenent bien les valeurs demandé  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  // vérifier que l'email n'est pas utiliser
  mongo.getInstance().collection('users').find({mail : req.body.mail}).toArray(function(err, result) {
    if (err) throw err;
    console.log(result);
    if (result.length > 0 ) res.send( "L'email existe déjà");
    else {      
      // Crypter le password
      const hash = crypto.createHash('sha256');
      const passwordCrypt = hash.update(req.body.password).digest('hex');
    
      // Ajouter un utilisateur
      mongo.getInstance().collection('users').insertOne(
        // Ajouter ces infos
        {
          pseudo: req.body.pseudo,
          mail : req.body.mail,
          password : passwordCrypt,
          avatar : req.body.avatar,
          description : req.body.description,
          createdAt : new Date(),
          updatedAt : new Date(),
          lastConnect : new Date(),
        },
        (err) => {
          // Si erreur 
          if(err) throw err;
          // Renvoyer la réponse ok et le resulr
          res.send({ok: true})
      })
    }
  })
});







// Modification le relation avec le serveur - Connection
router.put('/', function(req, res) {
  // Vérifier qu'il existe déjà un session user
  if (req.session.user && req.session.user !=  "") {
    // Déjà connecter
    res.send({ ok: false, message: 'user already connected' });
  } else {
    // verifier si email et password sont les même 
    mongo.getInstance().collection('users').findOne({mail: req.body.mail},(err, user) => {
      // Si erreur 
      if(err) throw err;
      // Renvoyer la réponse ok et le result 
        const hash = crypto.createHash('sha256');
        const otherPass = hash.update(req.body.password).digest('hex');

        if (otherPass === user.password) {
          const lastConnect = new Date();
          const updatedUser = {...user, lastConnect }

          mongo.getInstance().collection('users').updateOne({ mail: req.body.mail }, 
          { $set: updatedUser }, (err, result) => 
            {
              req.session.user = user;
              res.send({ ok: true, session: req.session});
            }
          );
      } else {
        res.send({ ok: false});
      }
    });
  }
});



/**
 * Déconnexion
 */
router.delete('/', (req, res) => {
  if (!req.session.user) {
    res.send({ok: false, message: 'user already disconnected'});
  } else {
    req.session.destroy(() => res.send({ok: true, session: req.session}));
  }
});



// Modification un utilisateur
router.put('/:id',  function(req, res) {

  var lastUpdate = new Date();
  let updateUser = {
    ...req.body,
    lastUpdate
  };
  console.log(req.params.id);

  mongo.getInstance().collection('users').updateOne(
    // Filtre
    { _id : ObjectId( req.params.id ) },
    // Chose à modifier
    { $set : updateUser },
    (err, result) => {
      if (err) throw err;
      res.send({ok:true, result : result});
    });      
});




  // Supprimer un utilisateur
  router.delete('/:id', function(req, res) {
    // Vérifier les données reçues en post
    mongo.getInstance().collection('users').deleteOne(
      // Filtre
     { _id : ObjectId(req.params.id) },
     (err, result) => {
       if (err) throw err;
       res.send({ok:true, result : result});
     });      
  });




  // Obtenir un utilisateur avec son id
  router.get('/:id', function(req, res) {
    console.log(req.params.id);
    // Requete en BDD  sur user {_id: ObjectId( req.params.id )}
    // Connection à la base de donnée
    mongo.getInstance().collection('users').findOne(
      // La ou l'id est égale à ...
      {_id: ObjectId( req.params.id )},
      // pour l'err ou le result faire
      (err, result) => {
        // Si erreur 
        if(err) throw err;
        // Renvoyer la réponse ok et le resulr
        res.send({ok: true, result})
      })
  });


module.exports = router;
