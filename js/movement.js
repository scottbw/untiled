require("./collision.js");

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
        action = movement_create_follow_action(scene, actor, movemement);
    }
    // GOTO movement type too?
    return action;
 }
 
 movement_create_random_action = function(scene, movement){
    var directions = ["N", "S", "E", "W"];
    
 }
 
 movement_create_path_action = function(scene, actor, movement){
    //
    // If movement path is empty, do nothing
    //
    if (movement.activePath.length === 0 ) return null;
 
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
    
        var number = parseInt(movement.activePath.substr(1));
        
        //
        // If there is a number, e.g. "E30", decrement it and replace
        //
        if (number > 0){
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
        // Don't move, but change facing
        //
        var action = {};
        action.object = actor.id;
        action.type = "FACE";
        action.value = nextMove;
        return action;
    }
    
 }
 
 movement_create_follow_action = function(scene, actor, movement){
    //
    // Who are we following?
    //
    var target = movement.target_id;
    
    //
    // if its "no-one" then default to nearest player in the scene
    //
 }
 
 movement_is_valid = function(scene, actor, future){
    //
    // Does the move result in bumping into something? If so,
    // add a bump event but not a move action
    //
    var target = movement_check_target(scene, actor, future);
    if (target){
        var bump = {};
        bump.source = actor;
        bump.target = target;
        global.game.bump_events.push(bump);
        return false;
    }
    
    //
    // If there is nothing there but we can't move there, such as into the
    // "wall" of the scene
    //
    if (!movement_can_move(scene, actor, future)){
        return false;
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