//
// Advanced character scripting
//

var Chance = require("Chance");
var chance = new Chance();

script_process_script_action = function(scene, actor){

}

script_evaluate_rules = function(scene, actor, script){
    if (!script.activePath || script.activePath.length === 0 || script.stuck > 10){
    
        var actions = [];
        //
        // Generate a possible action for each rule
        //
        for (r in script.rules){
            var action = script_evaluate_rule(script.rules[r], scene, actor);
            if (action != null) actions.push(action);
        }
        
        //
        // No actions? Just do something random then.
        //
        if (actions.length === 0){
            return movement_create_random_action(scene, actor, actor.script);
        }
        
        //
        // Choose an action. We prune it down to the top 3 then select one at random
        //
        if (actions.length > 3) actions.splice(0,3);
        return chance.pick(actions);
    }
    
    return movement_create_path_action(scene,actor,script);

}

/*
 * Evaluates a scripting rule
 */
script_evaluate_rule = function(rule, scene, actor){
    //
    // First, check the condition
    //
    if (rule.condition){
        var value = actor.properties[rule.condition.value];
        if (rule.condition.type === "IF" && !value) return null;
        if (rule.condition.type === "IF NOT" && value) return null;
    }
    
    //
    // Next, generate an action
    //
    
    // SEEK and FLEE
    if (rule.action === "SEEK" || rule.action === "FLEE"){
    
        //
        // What are we seeking or avoiding?
        //
        var target = script_find_nearest(rule.property, scene, actor);
        
        //
        // Nothing to act on in this scene
        //
        if (!target) return null;
        
        //
        // SEEK or FLEE
        //
        if (rule.action === "FLEE"){
            return movement_create_flee_action(scene,actor,actor.script,target);
        } else {
            return movement_create_follow_action(scene,actor,actor.script);
        }
    }
    // FIGHT and PICKUP
    // TODO
    
    // No match
    return null;
}

/*
 * Finds the nearest sticker with the specified property
 */
script_find_nearest = function(property, scene, actor){
    var target = null;
    for (s in scene.stickers){
            var sticker = scene.stickers[s];
            if (sticker.properties && sticker.properties[property]){
                if (target == null){
                    target = sticker;
                } else {
                    var sticker_distance =  Math.abs(actor.x - sticker.x) + Math.abs(actor.y - sticker.y);
                    var target_distance  =  Math.abs(actor.x - target.x) + Math.abs(actor.y - target.y);
                    if (sticker_distance < target_distance) target = sticker;
                }
            }
        }
    return target;
}