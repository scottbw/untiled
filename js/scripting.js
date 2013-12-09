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
            if (action != null){
                for (var i = 0; i < script.rules[r].importance; i++){
                    console.log(script.rules[r].condition + " " + script.rules[r].action + " " + script.rules[r].property);
                    actions.push(action);                    
                }

            }
        }
        
        //
        // No actions? Just do something random then.
        //
        if (actions.length === 0){
            return movement_create_random_action(scene, actor, actor.script);
        }
        
        //
        // Choose an action.
        //        
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
            var action = movement_create_follow_action(scene,actor,actor.script, target);
            return action;
        }
    }
    // FIGHT and PICKUP
    
    if (rule.action === "FIGHT" || rule.action === "PICKUP"){
    
        //
        // What is next to us?
        //
        var targets = [];
        var directions = ["N","S","E","W"];
        for (d in directions){
            var target = script_find_adjacent(scene, actor,directions[d]); 
            if (target != null) targets.push({direction: directions[d], object:target});   
        }
        targets = chance.shuffle(targets);
        
        //
        // PICKUP
        //
        for (t in targets){
            var target = targets[t];
            if (target.object.properties && target.object.properties[rule.property]){
                if (rule.action === "PICKUP"){
                    var action = {};
                    actor.face = target.direction;
                    action.object = actor.id;
                    action.type = "ACTION";
                    return action;
                } else {
                    var action = {};
                    actor.face = target.direction;
                    action.object = actor.id;
                    action.type = "ATTACK";
                    return action;                    
                }
            }
        }
        
        
        
    // TODO
    
    // No match
    }
    return null;
}

script_find_adjacent = function(scene, actor, direction){
    var future = movement_get_future(actor, "N");
    return movement_check_target(scene, actor, future);
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