require("./scene.js");
require("./events.js");

item_pick_up = function(scene, actor, item){
    
    //
    // Remove the item from the scene
    //
    scene_remove_sticker(scene, item);
    
    //
    // Add the item to the actor
    //
    if (!actor.inventory) actor.inventory = [];
    actor.inventory.push(item);
    
    //
    // Process any events
    //
    if (item.onPickup){
        for (e in item.onPickup){
            var event = item.onPickup[e];
            event_run(scene, event, item, actor);
        }
    }
}

item_drop = function(scene, actor, item){

}