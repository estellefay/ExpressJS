var express = require('express');
var router = express.Router();
var mongo = require('../bin/mongo');
const ObjectId = require('mongodb').ObjectId;


/* GET posts  sans les commentaires listing. */
router.get('/', function(req, res, next) {
  // pour les post ou parent id n'existe pas
  mongo.getInstance().collection('posts').find({  "$or": [{"parent_id": {$exists: false}}, {"parent_id": ""}]}).toArray(function(err, result) {
    if (err) throw err;
    
    console.log(result);
    res.send({ok: true, result})
  });
});


/* Creation d'un post */
router.post('/', function(req, res, next) {
  // Ajouter un post
  mongo.getInstance().collection('posts').insertOne(
    // Ajouter ces infos
    {
      title: req.body.title,
      message : req.body.message,
      sub : req.body.sub,
      author : 
      {
        pseudo: req.session.user.pseudo,
      },
      dataTime : new Date(),
      archive: false,  
    },
    (err) => {
      // Si erreur 
      if(err) throw err;
      // Renvoyer la réponse ok et le resulr
      res.send({ok: true})
  })
});


/* Obtenir un post en fonction de son ID */
router.get('/:id', function(req, res, next) {
  mongo.getInstance().collection('posts').find({_id: ObjectId( req.params.id )},).toArray(function(err, result) {
    if (err) throw err;
    else {
      res.send({ok: true, result})
    }
  });
});


/* modifier un post */
router.put('/:id', function(req, res) {
  let updatePost = {
    ...req.body,
  };

  mongo.getInstance().collection('posts').updateOne({ _id : ObjectId( req.params.id ) },
    { $set : updatePost },
    (err, result) => {
      if (err) throw err;
      else {
        res.send({ok:true, result : result});
    }
  });      
});



/* Créer un commentaire. */
router.post('/:id', function(req, res) {
  mongo.getInstance().collection('posts').insertOne(
    // Ajouter ces infos
    {
      parent_id: ObjectId(req.param.id),
      message : req.body.message,
      author : 
      {
        pseudo: req.session.user.pseudo,
      },
      dataTime : new Date(),
      rate : 0,
      nbComment: 0,   
    },
    (err) => {
      // Si erreur 
      if(err) throw err;
      // Renvoyer la réponse ok et le resulr
      res.send({ok: true})
  })
  });


/* Archiver un post */
router.delete('/:id', function(req, res, next) {
  let updatePost = {
    archive : true,
  };

  mongo.getInstance().collection('posts').updateOne({ _id : ObjectId( req.params.id ) },
    { $set : updatePost },
    (err, result) => {
      if (err) throw err;
      else {
        res.send({ok:true, result : result});
    }
  });      
  });
  

module.exports = router;
