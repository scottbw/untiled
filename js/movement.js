require("./collision.js");
require("./scripting.js");

/*
 * Process a movement script and return an action
 */
 movement_create_action = function(scene, actor){
    var movement = actor.script;
    var action = null;
    if (!movement){
        return null;
    }
    
    if (movement.type === "RANDOM"){
        action = movement_create_random_action(scene, actor, movement);
    }
    if (movement.type === "PATH"){
        action = movement_create_path_action(scene, actor, movement);
    }   
    if (movement.type === "FOLLOW"){
        action = movement_create_follow_action(scene, actor, movement);
    }
    if (movement.type === "GOTO"){
        action = movement_create_goto_action(scene, actor, movement);
    }
    if (movement.type === "FLEE"){
        action = movement_create_flee_action(scene, actor, movement);
    }
    if (movement.type === "COMPOSITE"){
        action = script_evaluate_rules(scene, actor, movement);
    }
    return action;
 }
 
 /*
  * Process a RANDOM movement script
  */
 movement_create_random_action = function(scene, actor, movement){
 
    if (!movement.activePath || movement.activePath.length === 0 || movement.stuck > 10){
        var future = null;
        var tries = 0;
        while ((!future || !movement_is_valid(scene, actor, future)) && tries < 10){
            var path = movement_generate_random_path(movement);
            nextMove = path[0];
            future = movement_get_future(actor, nextMove, path[1]);  
            movement.activePath = path[0]+path[1]; 
            tries++; 
        }
    }
    
    return movement_create_path_action(scene, actor, movement);
    
 }
 
 /*
  * Generates a random path, e.g "N50"
  */
 movement_generate_random_path = function(movement){
    var Chance = require("chance");
    var chance = new Chance();
    var direction = chance.d4();
    var directions = ["N", "S", "E", "W"];
    var distance = chance.d6()+2 * movement.speed;
    return [directions[direction-1], distance];
 }
 
 /*
  * Process a PATH movement script
  */
 movement_create_path_action = function(scene, actor, movement){
 
    //
    // If movement path is empty, do nothing
    //
    if (!movement.activePath || movement.activePath.length === 0 ) return null;
     
    //
    // Check if we need to reset the path
    //
    if (movement.activePath === "*")        
    {
        movement.activePath = actor.script.value; 
    }
    
    //
    // Look at the next move and see if its possible.
    //
    var nextMove = movement.activePath[0];
    var future = movement_get_future(actor, nextMove, movement.speed);
    
    //
    // Create a movement type action and pop the move off the path
    // if the following character is a number, we decrement it rather than remove it
    //
    if (movement_is_valid(scene, actor, future)){
        //
        // If we were stuck, we aren't now
        //
        movement.stuck = 0;
    
        var number = parseInt(movement.activePath.substr(1));
        
        //
        // If there is a number, e.g. "E30", decrement it and replace
        //
        if (number > 0){
            number = number.fixed(0);
            var idx = movement.activePath.indexOf(number);
            var len = number.toString().length;
            number--;
            movement.activePath = nextMove.concat(number.toString(),movement.activePath.substr(idx+len));
        } else {
            //
            // Otherwise shift it off the path
            //
            movement.activePath = movement.activePath.substr(1);
        }
        

        var action = {};
        action.object = actor.id;
        action.type = "MOVE";
        action.value = nextMove;
        action.speed = movement.speed;
        return action;
    } else {
        //
        // Don't move, but change facing, and increment the 'stuck' counter
        //
        if (!movement.stuck) movement.stuck = 0;
        movement.stuck++;
        var action = {};
        action.object = actor.id;
        action.type = "FACE";
        action.value = nextMove;
        return action;
        
    }
    
 }
 
 /*
  * Process a FOLLOW script
  */
 movement_create_follow_action = function(scene, actor, movement){
 
    if (movement.stuck > 100) return movement_create_random_action(scene, actor, movement);

    //
    // Create a movement script if we don't already have one, or if we are stuck
    //    
    if (!movement.activePath || movement.activePath.length === 0 || movement.stuck > 10){
    
        //
        // Who are we following?
        //
        var target = movement.target;
        
        //
        // TODO if its "no-one" then default to nearest player in the scene
        //
        if (!target){
            for (p in global.game.players){
                if (global.game.players[p].scene === scene.id && global.game.players[p].sessionId != null) target = global.game.players[p];
            }
        }
        
        //
        // No valid targets
        //
        if (!target){
            return null;
        }
        
        //
        // Plot a route
        //        
        var future = null;
        var tries = 0; // we give ourselves 10 tries at finding a workable path
        
        while (!future || !movement_is_valid(scene, actor, future) && tries < 10){
            var path = movement_generate_follow_path(actor, target);
            nextMove = path[0];
            future = movement_get_future(actor, nextMove, path[1]);  
            movement.activePath = path;  
            tries++;
        }
    }
    return movement_create_path_action(scene, actor, movement);
 }
 
 /*
  * Process a GOTO script
  */
 movement_create_goto_action = function(scene, actor, movement){
    
    //
    // Create a movement script if we don't already have one, or if we are stuck
    //    
    if (!movement.activePath || movement.activePath.length === 0 || movement.stuck > 10){
    
        var target = movement.target;
        
        //
        // Plot a route
        //        
        var future = null;
        var tries = 0; // we give ourselves 10 tries at finding a workable path
        
        while (!future || !movement_is_valid(scene, actor, future) && tries < 10){
            var path = movement_generate_follow_path(actor, target);
            nextMove = path[0];
            future = movement_get_future(actor, nextMove, path[1]);  
            movement.activePath = path;  
            tries++;
        }        
    
    }
    
    return movement_create_path_action(scene, actor, movement);

 
 }
 
  /*
  * Process a FLEE script
  */
 movement_create_flee_action = function(scene, actor, movement, target){
 
    if (movement.stuck > 100) return movement_create_random_action(scene, actor, movement);
    //
    // Create a movement script if we don't already have one, or if we are stuck
    //    
    if (!movement.activePath || movement.activePath.length === 0 || movement.stuck > 10){
    
        //
        // Who are we fleeing?
        //
        if (!target) target = movement.target_id;
        
        //
        // TODO if its "no-one" then default to nearest player in the scene
        //
        if (!target){
            for (p in global.game.players){
                if (global.game.players[p].scene === scene.id) target = global.game.players[p];
            }
        }
        //
        // No valid targets
        //
        if (!target){
            return movement_create_random_action(scene, actor, movement)
        }
        //
        // Plot a route
        //        
        var future = null;
        var tries = 0; // we give ourselves 10 tries at finding a workable path
        while (!future || !movement_is_valid(scene, actor, future) && tries < 10){
            var path = movement_generate_flee_path(actor, target);
            nextMove = path[0];
            future = movement_get_future(actor, nextMove, path[1]);  
            movement.activePath = path;  
            tries++;
        }
    }
    return movement_create_path_action(scene, actor, movement);
 }
 
 movement_generate_flee_path = function(actor,target){
   var path = movement_generate_follow_path(actor, target);
   if (path.indexOf("N") != -1){
        path = path.replace("N", "S");
    } else {
        path = path.replace("S", "N");
    }
    if (path.indexOf("E") != -1){
        path = path.replace("E", "W");
    } else {
        path = path.replace("W", "E");
    }
    return path;
 }
 
 /*
  * Generate a path to a target, with both an x and a y component
  * This is a bit basic, so we may want to do an A* later
  */
 movement_generate_follow_path = function(actor, target){
    var Chance = require("chance");
    var chance = new Chance();
    var path = [];
    
    if (actor.x > target.x){
        var path_distance = actor.script.speed * 10;
        var actual_distance = actor.x - target.x;
        if (path_distance > actual_distance && actor.script.stuck < 5) path_distance = actual_distance;
        
        path[0] = "W" + path_distance.round();
    }
    if (actor.x < target.x){
        var path_distance = actor.script.speed * 10;
        var actual_distance = target.x - actor.x;
        if (path_distance > actual_distance && actor.script.stuck < 5) path_distance = actual_distance;        
        
        path[0] = "E" + path_distance.round();
     
    }
    if (actor.y > target.y){
        var path_distance = actor.script.speed * 10;
        var actual_distance = actor.y - target.y;
        if (path_distance > actual_distance && actor.script.stuck < 5) path_distance = actual_distance;   
        
        path[1] = "N" + path_distance.round();
        
    }
    if (actor.y < target.y){
        var path_distance = actor.script.speed * 10;
        var actual_distance = target.y - actor.y;
        if (path_distance > actual_distance && actor.script.stuck < 5) path_distance = actual_distance; 
             
        path[1] = "S" + path_distance.round();
        
    }
    
    if (!path[0]) path[0] = path[1];
    if (!path[1]) path[1] = path[0];
    
    //
    // Randomise whether we go x then y or y then x
    //
    if (chance.d4() > 2){
        return path[0]+path[1];
    } else {
        return path[1]+path[0];
    }
 }
 
 movement_is_valid = function(scene, actor, future){

    
    //
    // If there is nothing there but we can't move there, such as into the
    // "wall" of the scene
    //
    if (!movement_can_move(scene, actor, future)){
        return false;
    }
    
    //
    // Does the move result in bumping into something? If so,
    // add a bump event but not a move action
    //
    var target = movement_check_target(scene, actor, future);
    if (target){
        if (target.solid == null || target.solid === true){
            var bump = {};
            bump.source = actor;
            bump.target = target;
            global.game.bump_events.push(bump);
            return false;
        }
    }
    
    //
    // Otherwise return true - the move is valid
    //
    return true;
 }
 
 /*
  * Returns the id of any object at the target location (collision)
  */
 movement_check_target = function(scene, actor, future){
    if (!scene.id) scene = global.game.scenes[scene];
    var target = null;
    
    for (s in scene.stickers){
        var sticker = scene.stickers[s];
        
        if (collide(actor, sticker, future)){
            return sticker;
        }
    } 
    return target;
 }
 
 /*
  * Returns a set of future coordinates given an actor, direction and speed
  */
 movement_get_future = function(actor, direction, speed){

    if (!speed) speed = actor.speed;
    
    //
    // First lets see if this is a valid move
    // 
    
    var future = {x:actor.x, y:actor.y};
    if (direction === "N"){
        future.y = future.y - (speed * 0.045).fixed(3);
    }
    if (direction === "S"){
        future.y = future.y + (speed * 0.045).fixed(3);
    }
    if (direction === "E"){
        future.x = future.x + (speed * 0.045).fixed(3);
    }
    if (direction === "W"){
        future.x = future.x - (speed * 0.045).fixed(3);
    }
    
    return future;
 
 }
 
 
 movement_can_move = function(scene, actor, future){
    if (!scene.id) scene = global.game.scenes[scene];
    if (future.x < scene.border.left) return false;
    if (future.x + actor.size.x > scene.size.x - scene.border.right) return false;
    if (future.y < scene.border.top) return false;
    if (future.y + actor.size.y > scene.size.y - scene.border.bottom) return false;
    return true;
 }
 
 Number.prototype.fixed = function(n) { n = n || 3;return parseFloat(this.toFixed(n)); };
 Number.prototype.round = function()  { return Math.round(this); };