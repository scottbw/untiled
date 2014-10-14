//
// Require our local scripts
//
require("./js/game_server.js");
require("./js/action.js");
require("./js/scene.js");
require("./js/trigger.js");

//
// Core game loops
//

/*
 * Starts the game loops
 */
game_start = function(){
    setInterval(game_main_loop, 15);
    setInterval(game_update_loop, 45);
    setInterval(game_save, 4000);
}

/*
 * The fast loop - movement
 */
game_main_loop = function(){
  game_process_actions();
}

/*
 * The slow loop - world events
 */
game_update_loop = function(){
  game_process_move_updates();
  game_process_scene_triggers();
  game_notify_clients();
}

//
// Called during the fast loop
//
 
/*
 * Actions for stickers
 */ 
game_process_actions = function(){
    for (s in global.game.scenes){
        var scene = global.game.scenes[s];
        for (m in scene.stickers){
            var sticker = scene.stickers[m];
            if (!sticker.actions) sticker.actions = new Array();
            //
            // If the mob has a movement script,
            // execute it and add the movement to the stack
            //
            if (sticker.script){
                var action = movement_create_action(scene, sticker);
                if (action) sticker.actions.push(action);
            }
        
        
            //
            // Shift an action off of the stack and execute it
            //
            if (sticker.actions.length > 0){
                var action = sticker.actions.shift();
                //
                // Execute the action
                //
                action_execute(scene.id, sticker, action);
            }
            
        }
    }
}

//
// Called during the world loop
//

/*
 * Create an event updating where each sticker is
 * and push it onto the stack
 */
game_process_move_updates = function(){
    for (s in global.game.scenes){
        var scene = global.game.scenes[s]; 
        for (m in scene.stickers){
            var mob = scene.stickers[m];
            if (mob.hasMoved){
                var event = {};
                event.type = "MOVE";
                event.object = mob.id;
                event.x = mob.x;
                event.y = mob.y;
                event.scene = scene.id;
                global.game.push_events.push(event);
                mob.hasMoved = false;
            }
        }
    }  
}


/*
 * Scene triggers
 */
game_process_scene_triggers = function(){
    for (s in global.game.scenes){
        var scene = global.game.scenes[s];
        
        for (var t=0;t < scene.triggers.length;t++){
            var trigger = scene.triggers[t];
            if (trigger.active){
                trigger_evaluate(scene,trigger);
            }
        }
    }
    //
    // Clear bumps
    //
    global.game.bump_events.length = 0;
}

/*
 * Send updates to clients
 */
game_notify_clients = function(){
    while (global.game.push_events.length >0){
    
        var event = global.game.push_events.shift();
        
        for (p in global.game.players){
            var player = global.game.players[p];

            //
            // For TRANSITION events, add the info for the new scene to the message
            //
            if (event.type === "TRANSITION"){
                if (event.source == player.id){
                    event.scene = scene_get_render_info(event.value);
                    gameserver.notify(player, event);
                }
            }
                        
            //
            // Send each player events related to the scene they are currently in
            // Send each player events where they are the target of the event
            //
            if (player.scene == event.scene || player.id == event.target){
                gameserver.notify(player, event);
            }
        }
    }
}

//
// Game state startup, loading and saving
//

/* 
 * Save game
 */
game_save = function(){
    gameserver.store.set("players", JSON.stringify(global.game.players));
    gameserver.store.set("properties", JSON.stringify(game.properties));
}

/* 
 * Initialize a game
 */
game_init = function(){
    global.game = {};

    //
    // The "data" directory
    //
    global.game.data_directory = require('path').join(__dirname, "/data");

    //
    // Create game arrays
    //
    global.game.players = {};
    global.game.scenes = {};
    global.game.properties = [];
    global.game.bump_events = new Array();
    global.game.push_events = new Array();

    //
    // Initialize dialogue engine
    //
    global.game.dialogue = require('dialoguejs');


    //
    // Load scenes
    //
    scene_load_scenes();
    
    //
    // Load items
    //
    item_load_items();
}

/*
 * Load players
 */
game_load_players = function(callback){
    console.log("loading...");
    gameserver.store.get("players", function(err, data){
        if (err||!data){
            console.log(err);
            global.game.players = {};
        } else {
            console.log("...completed");
            global.game.players = JSON.parse(data);
        }
        game_start();
    }
    );
}

//
// Message Utils
//

/*
 * Construct a transition event for the first scene a player
 * visits on load
 */
game_render_scene = function(player){
    var event = {};
    event.type = "TRANSITION";
    event.source = player.id;    
    event.value = player.scene;
    global.game.push_events.push(event);
}

/* 
 * Send a message to a player
 */
game_send_message = function(text, player){
    var event = {};
    event.type = "MESSAGE";
    event.source = player.id;
    event.scene = player.scene;
    event.text = text;
    game.push_events.push(event);
}


//
// Player management
//

/*
 * Create a new player
 */
game_new_player = function(player){
    console.log(player.name+ " has been created as a new player");
    global.game.players[player.id]=player;
    return player;
}

/*
 * Add a player
 */
game_add_player = function(player, clientid){
   //
    // Set up action buffer
    //
    player.actions = new Array();
    
    //
    // If for some reason, the player doesn't have a scene, add one
    //
    if (!player.scene){
        player.scene = "start";
    }
    
    //
    // Add the player to the scene
    //
    scene_spawn_sticker(player.scene, player);
        
    //
    // Add session id for this player so we can remove it
    // when the client disconnects
    //
    player.sessionId = clientid;
    
    //
    // Create initial scene transition event for the player
    //
    game_render_scene(player);
    
    //
    // Create a welcome message event
    //
    game_send_message("Welcome to Untiled!", player);
}

/*
 * Remove a player 
 */
game_remove_player = function(player){
    //
    // Remove from current scene
    //
    scene_remove_sticker(player.scene, player);
}

/////////////////////////////////////////////////
//    Setup the game server and start the game //
/////////////////////////////////////////////////

//
// Catch any uncaught exceptions
//
process.on('uncaughtException', function (err) {
  if (err.message.indexOf("Redis connection")!=-1){
    console.log("ERROR: You need to start your Redis server before starting the game server");
    process.exit(code=1);
  } else {
    console.log("aargh!");
    console.log(err.stack);
    process.exit(code=1);
  } 
});
    
//
// Create the game server and network IO handler, and start it up
//
var gameserver = require("./js/game_server.js");

// Set to false to continue a game; true to clear the DB and restart
gameserver.start(true);


//
// Load data and then trigger the main loop start
//
game_init();
game_load_players(game_start);

console.log("game started");
