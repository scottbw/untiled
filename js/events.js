

/**
 * Create an event object
 */

event_create = function(script){
}

/**
 * Process an event
 */
event_run = function(scene, event, source, target){

    //
    // Set a script on an object.
    //
    if (event.type === "SET_SCRIPT"){
    
        var script_target = null;
        
        // If the object is not specified, we assume
        // its the target of the event
        if (!event.target){
            script_target = target;
        } else {
            if (!scene.id) scene = global.game.scenes[scene];
            for (s in scene.stickers){
                if (scene.stickers[s].id === event.target) script_target = scene.stickers[s];
            }
        }
        
        script_target.script = event.script;

        //
        // Movement happens in the usual game loop, so we
        // don't need to send any special events to the client
        //
    }
    
    //
    // Send the message to the client; there is
    // no other consequence for the game engine itself
    //
    if (event.type === "MESSAGE"){
        //
        // Determine who the message is for
        //
        event.target = event.to;
        if (event.to === "#SOURCE") event.target = source.id;
        if (event.to === "#TARGET") event.target = target.id;
        if (!event.to) event.target = source.id; 
        global.game.push_events.push(event);
    }
    
    //
    // Send the message to the client; there is
    // no other consequence for the game engine itself
    //
    if (event.type === "SAY"){
        //
        // Determine who the message is for
        //
        event.target = event.to;
        if (event.to === "#SOURCE") event.target = source.id;
        if (event.to === "#TARGET") event.target = target.id;
        if (!event.to) event.target = source.id;
        global.game.push_events.push(event);
    }
    
    //
    // Set the (global) property specified; no client event raised
    // although on a subsequent loop this may trigger another
    // event
    //
    if (event.type === "SET_PROPERTY"){
        global.game.properties[event.name] = event.value;
        global.game_save_properties();
    }
    
    //
    // A transition event moves a player or mob to
    // another scene. By default, the thing that is
    // transitioned is the "source" of the event
    //
    if (event.type === "TRANSITION"){
        var original_scene = source.scene;
        if (!original_scene.id) original_scene = global.game.scenes[original_scene];
        var new_scene = event.value;
        if (!new_scene.id) new_scene = global.game.scenes[new_scene];
        
        //
        // Change the scene associated with the mob or player
        //
        source.scene = new_scene.id;


        //
        // Remove sticker from old scene, and add to the new one
        //
        scene_remove_sticker(original_scene, source);
        scene_add_sticker(new_scene, source);        
        
        //
        // Update location of actor
        //
        if (event.x){
            source.x = event.x;
        }
        if (event.y){
            source.y = event.y;
        }
               
        //
        // Push a notification
        //


        game_render_scene(source);
    }
    
    //
    // Activate a trigger
    //
    if (event.type === "ACTIVATE_TRIGGER"){
        for (t in scene.triggers){
            var trigger = scene.triggers[t];
            if (trigger.id === event.trigger){
                trigger.active = true;
                scene_save(scene);
            }
        }
    }
    
    //
    // DeActivate a trigger
    //
    if (event.type === "DEACTIVATE_TRIGGER"){
        for (t in scene.triggers){
            var trigger = scene.triggers[t];
            if (trigger.id === event.trigger){
                trigger.active = false;
                scene_save(scene);
            }
        }
    }
    
    //
    // Create a Choice for the player
    //
    if (event.type === "CHOICE"){
        //
        // Create the coice options to send to the client
        //
        global.game.push_events.push(event);
    }
};