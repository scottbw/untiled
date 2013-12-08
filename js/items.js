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
    
    //
    // Create an inventory update event
    //
    item_send_inventory_update(actor);
    
}

item_drop = function(scene, actor, item_id){
    
    var index = -1;
    var item = null;
    
    //
    // Get the item
    //
    for (i in actor.inventory){
        if (actor.inventory[i].id === item_id){
            index = i;
            item = actor.inventory[i];
        }
    }
    
    if (index === -1 || !item){
        console.log("attempt to drop non-existant item");
        return;
    }

    //
    // Add the item to the scene
    //
    item.x = actor.x;
    item.y = actor.y + actor.size.y;
    scene_add_sticker(scene, item);
    
    //
    // Remove the item from the actor
    //
    actor.inventory.splice(index,1);
    
    //
    // Process any events
    //
    if (item.onDrop){
        for (e in item.onDrop){
            var event = item.onDrop[e];
            event_run(scene, event, item, actor);
        }
    }
    
    //
    // Create an inventory update event
    //
    item_send_inventory_update(actor);
}

//
// Create an inventory update event
//
item_send_inventory_update = function(actor){

    //
    // Only provide limited inventory info to the client
    //
    var inventory = [];    
    for (i in actor.inventory){
        var item = actor.inventory[i];
        var inventory_item = {};
        inventory_item.id = item.id;
        inventory_item.name = item.name;
        inventory_item.image = item.image;
        inventory.push(inventory_item);
    }
    
    //
    // Create the event
    //
    var event = {};
    event.type = "INVENTORY_UPDATED";
    event.inventory = inventory;
    event.target = actor.id;
    event.source = actor.id;
        
    //
    // Add event to push events buffer
    //
    global.game.push_events.push(event);
}