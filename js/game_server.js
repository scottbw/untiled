//////////
// This is all the boring server stuff like managing
// the network IO
//////////

module.exports = new Server();


function Server(){

    //
    // Express Application - used for serving assets and the client
    //
    HOST = "localhost"; // localhost
    PORT = 3000;
    var http = require('http');
    var express = require('express');
    var app = express();
    this.server = require('http').createServer(app);
    app.use('/', express.static( require('path').join(__dirname, '../public/client') ));
    app.use('/assets/', express.static( require('path').join(__dirname, '../public/assets') ));

    //
    // Database
    //
    this.store = {}; // the key store we're using
    var RedisStore = require('socket.io/lib/stores/redis')
      , redis  = require('socket.io/node_modules/redis')
      , pub    = redis.createClient()
      , sub    = redis.createClient()
      , client = redis.createClient();
    
    //
    // Network IO
    //
    this.clients = []; // the current connected clients
    this.io = require('socket.io').listen(this.server);
    this.io.set('store', new RedisStore({
      redisPub : pub
    , redisSub : sub
    , redisClient : client
    }));
    this.io.set('log level', 1); // reduce logging
        

    //
    // Start listening
    //
    this.server.listen(PORT, HOST);
    

}

/*
 * Starts the server
 */
Server.prototype.start = function(clear){
    var database_options = {"host":"127.0.0.1", "port":"6379", "clear":clear}
    this.attach(this.server, database_options);
}

Server.prototype.attach = function(server, options){
    /*
     * Setup connection to nosql server
     *
     * Note we use the "keys" API which supports Redis, nStore, Riak and Mongo
     *
     */ 
    options = options || {};
    var keys = require("keys");

    //
    // Use Redis as the default keystore - you can use any supported
    // stores instead by editing this code.
    //
    this.store = new keys.Redis(options);
    if (options.clear){
     this.store.clear();  // Clear the store
     console.log("info: cleared store");
    }
    
    /*
     * Socket configuration
     *
     * This sets up a socketio server with event handlers
     * for connection, messages and disconnection.
     * 
     * The socket interface expects two kinds of messages 
     * to br received - either "registration" messages
     * containing an idkey property, or deltas for updating
     * the state model.
     */
    var that = this;
    this.io.sockets.on('connection', function(client){
    
      //
      // Let client know it can start sending messages
      //
      client.send("ready");
      
      //
      // Got a message
      //
      client.on('message', function(message){ 
            if (message.player){
                //
                // register client and add player to game
                //
                that.addPlayer(client, message.player);
            } else {
                //
                // handle player action event
                //
                that.processPlayerAction(client, message);
            }
      }); 
      
      // De-register the client on disconnect
      client.on('disconnect', function(){
        console.log("disconnecting player");
        // Remove the client from the array of currently connected clients
        // This will stop us trying to send notifications to it
        var sessionId = client.id;
        that.clients = that.clients.filter(function(client){
         if (client.id == sessionId) return false; 
         return true;
        });

        // Remove participant associated with the client
        that.removePlayer(sessionId);
      }); 
      
    }); 
};


//
// Handle input events from the player
//
Server.prototype.processPlayerAction = function(client, message){
  var player = this.getPlayerForSessionId(client.id);
  player.actions.push(message);
};

//
// Return the player object
//
Server.prototype.getPlayerForSessionId = function(sessionId){
  for (p in global.game.players){
    var player = global.game.players[p];
    if (player.sessionId == sessionId){
        return player
    }
  }
  return null;
};

Server.prototype.getPlayerStickerFromScene = function(player){
    var scene = global.game.scenes[player.scene];
    for (s in scene.stickers){
        var sticker = scene.stickers[s];
        if (sticker.id === player.id){
            return sticker;
        }
    }
}

//
// Add a new client/player
//
Server.prototype.addPlayer = function(client, player){
    console.log(player.name+ " has joined the game");
    
    var that = this;
    
    // Add client to global clients list
    this.clients.push(client);
    
    // Save the client details
    this.store.set(player.id, player);
        
    //
    // Add player if not already present
    //        
    if (!global.game.players[player.id]) {
        console.log(player.name+ " has been created as a new player");
        global.game.players[player.id]=player;
    } else {
        player = global.game.players[player.id];
    }
    
    //
    // Set up action buffer
    //
    player.actions = new Array();
    
    //
    // If for some reason, the player doesn't have a scene, add one
    //
    if (!player.scene){
        player.scene = "start";
        player.x = 200;
        player.y = 200;
    }
    
    //
    // Add the player to the scene
    //
    scene_add_sticker(player.scene, player);
        
    //
    // Add session id for this player so we can remove it
    // when the client disconnects
    //
    player.sessionId = client.id;
    
    //
    // Create initial scene transition event for the player
    //
    game_render_scene(player);
    
    //
    // Create a welcome message event
    //
    game_send_message("Welcome to Untiled!", player);

};

//
// Remove (disconnect) a player
//
Server.prototype.removePlayer = function(sessionId){
    console.log("removing player");
    var that = this;
    this.store.get(sessionId, function(err, key){
        if (err || !key) return false;
        that.store.get("players", function(err, data){
            if (err || !data) {
                global.game.players = {};
            } else {
                global.game.players = JSON.parse(data);
            }
            // Remove player if present
            for (var player in global.game.players){
                if (global.game.players[player].sessionId == sessionId) {
                    global.game.players[player].sessionId = null;
                    that.savePlayers();
                }            
            }

        });

    });
};

//
// Message to client
//
Server.prototype.notify = function(target, message){
    this.io.sockets.socket(target.sessionId).emit("message", message);
};

//
// Broadcast to all clients
//
Server.prototype.notifyAll = function(message){
    console.log("broadcasting");
    for (var i in this.clients){
        this.notify(this.clients[i], message);
    }
};