require("./events.js");

trigger_evaluate = function(scene, trigger){
    
    //
    // Bump events
    //
    if (trigger.type === "onBump"){
        for (var i=0;i<global.game.bump_events.length;i++){
            var bump_event = global.game.bump_events[i];
            if (
                (bump_event.target.id === trigger.target || trigger.target === "#ANY")  
                && 
                (bump_event.source.id === trigger.source || trigger.source === "#ANY")
                ){

                //
                // if the previous event was the same as this one, ignore it for 
                // this loop
                //
                var ignore = false;
                if (i > 0){
                    var previous_event = global.game.bump_events[i-1];
                    if (previous_event.target.id === bump_event.target.id && previous_event.source.id === bump_event.source.id){
                        ignore = true;
                    }
                }
                if (!ignore){
                    event_run(scene, trigger.event, bump_event.source, bump_event.target);
                }
            }   
        }
    } 
    
    //
    // Location triggers
    //
    if (trigger.type === "onLocation"){
        for (p in global.game.players){
            var player = global.game.players[p];
            if (player.scene == scene.id){
                if (player.x >= trigger.x && player.x <= trigger.xx){
                    if (player.y >= trigger.y && player.y <= trigger.yy){
                        event_run(scene, trigger.event,player,null);
                    }
                }
            }
        }
    }
    
    //
    // Time events
    //
    if (trigger.type === "onInterval"){
        if (!scene.timer) scene.timer = trigger.duration;
        if (scene.timer == 1){
            event_run(scene, trigger.event, null, null);
            scene.timer = trigger.duration;
        } else {
            scene.timer--;       
        }
    }
    
    //
    // Property events
    //
    
    //
    // Choice events
    //
    

}

/*
 * onEnter and onExit are only evaluated after a movement event by a player, otherwise
 * they will be triggered whenever they are on the same spot.
 * x and y are the pre-movement locations of the actor
 */
trigger_evaluate_aftermovement = function(scene_id, actor, x, y){
    var scene = global.game.scenes[scene_id];
    for (var t=0;t < scene.triggers.length;t++){
        var trigger = scene.triggers[t];
        if (trigger.active){
        
            //
            // Enter events
            //
            if (trigger.type === "onEnter"){
                if (
                    trigger_target_is_within_location(actor.x, actor.y, trigger) &&
                    !trigger_target_is_within_location(x, y, trigger) 
                    ){
                    event_run(scene, trigger.event,actor,null);
                }
            }
            
            //
            // Leave events
            //
            // For this we have to know that they _were_ previously in the scope,
            // but aren't any longer
            //
            if (trigger.type === "onLeave"){
                if (
                    !trigger_target_is_within_location(actor.x, actor.y, trigger) &&
                    trigger_target_is_within_location(x, y, trigger) 
                    ){
                    event_run(scene, trigger.event,actor,null);
                }
            }
    
        }
    }
}

trigger_target_is_within_location = function(x,y,trigger){
    if (x >= trigger.x && x <= trigger.xx){
        if (y >= trigger.y && y <= trigger.yy){
            return true;
        }
    }
}

/*
 * An onAction event is one where a player uses the "action key"
 * These events are handled separately
 *
 */
trigger_evaluate_onaction = function(scene, trigger, source, target){
    if (trigger.target == target.id){
        if(
        !trigger.source || 
        trigger.source == source || 
        trigger.source == "#ANY"){
            event_run(scene, trigger.event, source, target);
        }
    }
}