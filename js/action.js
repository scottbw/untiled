/*
 * Executes an action, such as movement
 *
 * The result of executing an action is to generate
 * a new game event, adding it to the server push stack,
 * as well as modifying game state variables 
 *
 */
require('./movement.js');
require('./items.js');

action_execute = function(scene, actor, action){

  //
  // FACE
  //
  if (action.type === "FACE"){
    actor.facing = action.value;
    game.push_events.push(action);
  }
  
  //
  // MOVE
  //
  if (action.type === "MOVE"){
    
    var future = movement_get_future(actor, action.value, action.speed);
    
    if (movement_is_valid(scene, actor, future)){
        
        //
        // Store the past values
        //
        var x = actor.x;
        var y = actor.y;
    
        //
        // Let the actor face and move to its new position
        //
        actor.x = future.x;
        actor.y = future.y;
        actor.face = action.value;
        
        //
        // Update the action with the new position
        //
        action.x = actor.x;
        action.y = actor.y;
        action.face = action.value;
        
        actor.hasMoved = true;
        
        //
        // Trigger any post-movement triggers passing
        // along the old position
        //
        trigger_evaluate_aftermovement(scene, actor, x, y);
        
    } else {
        //
        // Don't move, but change facing
        //
        actor.face = action.value;
        action.type = "FACE";
        actor.hasMoved = true;
        action.scene = scene;
        action.object = actor.id;
        global.game.push_events.push(action);
    }
    
  }
  
  //
  // DROP an item
  //
  if (action.type === "DROP"){
        item_drop(scene, actor, action.item);
  }
  
  //
  // ACTION (the generic space-button one)
  //
  if (action.type === "ACTION"){
    var target = action_get_target(scene,actor);
    if (target){
        //
        // Check triggers
        //
        if (!scene.triggers) scene = global.game.scenes[scene];
        for (t in scene.triggers){
            var trigger = scene.triggers[t];
            if (trigger.type === "onAction"){
                trigger_evaluate_onaction(scene, trigger, actor, target);
            }
        }
        //
        // Check dialogue
        //
        var dialogue = global.game.dialogue.interact(target.id, actor.id, action.response);
        if (dialogue){
            var fireevent = {type:"SAY", dialogue: dialogue, from: target.id, to:actor.id, target:actor.id};
            global.game.push_events.push(fireevent);
        }
        
        //
        // Pickup?
        //
        if (target.properties && target.properties.pickup){
            item_pick_up(scene, actor, target);
        }   

    }
  }
  
  //
  // DIALOGUE choice
  //
  if (action.type === "DIALOGUE"){
    var target = action_get_target(scene,actor);
    if (target){
        var thedialogue = global.game.dialogue.interact(target.id, actor.id, action.response);
        var event = {type:"SAY", dialogue: thedialogue, from: target.id, to:actor.id, target:actor.id};
        global.game.push_events.push(event);
    }
  }

}
/**
 *
 * Identify the target of a generic action
 *
 */
action_get_target = function(scene, actor){
    //
    // Look ahead two moves in current facing
    //
    var ahead = movement_get_future(actor, actor.face, actor.speed * 2);
    return movement_check_target(scene,actor,ahead);
}

Number.prototype.fixed = function(n) { n = n || 3; return parseFloat(this.toFixed(n)); };


