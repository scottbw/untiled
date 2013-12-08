/*
 * Loads all scene files
 */
scene_load_scenes = function(){
  var folder = global.game.data_directory + "/scenes";
  
  require("fs").readdirSync(folder).forEach(
    function(file) {
      if (file.indexOf(".json") != -1) scene_load(file);
    }
  );
}

/**
 * Loads the specified scene from JSON
 * Returns the scene object
 */

scene_load = function (file){
    file = global.game.data_directory + "/scenes/" + file;
    var fs = require('fs');
    fs.readFile(file, function (err, data) {
      if (err) {
        throw err; 
      }
      var scene = JSON.parse(data);
      global.game.scenes[scene.id] = scene;
      
      //
      // Set up scripts
      //
      for (s in scene.stickers){
        var sticker = scene.stickers[s];
        if (sticker.script){
            if (sticker.script.type === "PATH"){
                sticker.script.activePath = sticker.script.value;
            }
        }
        if (sticker.dialogue){
            global.game.dialogue.load(sticker.id, global.game.data_directory + "/dialogue/"+sticker.id+".txt");
        }
      
      }
    });
}

scene_save = function (scene){

}

scene_deactivate_trigger = function(trigger_id){
}

scene_activate_trigger = function(trigger_id){
}

/*
 * Generate the client-side rendering object for a scene;
 * typically the list of things to draw, and where to draw them
 */
scene_get_render_info = function(scene_id){
    var scene = global.game.scenes[scene_id];
    var scene_rendered = {};
    scene_rendered.title = scene.title;
    scene_rendered.background = scene.background;
    
    //
    // Now all the stickers
    //
    scene_rendered.stickers = new Array();
    
    for (s in scene.stickers){
        var sticker = scene.stickers[s];
        scene_rendered.stickers.push(scene_get_render_info_for_sticker(sticker));
    }
    
    return scene_rendered;
}

scene_get_render_info_for_sticker = function(sticker){
    var rendered_sticker = {};
    rendered_sticker.object = sticker.id;
    rendered_sticker.sprite = sticker.sprite;
    rendered_sticker.x = sticker.x;
    rendered_sticker.y = sticker.y;
    rendered_sticker.spritesheet = sticker.spritesheet;
    rendered_sticker.image = sticker.image;
    return rendered_sticker;
}

scene_add_sticker = function(scene, sticker){
    if (!scene.id) scene = global.game.scenes[scene];
    
    //
    // Don't add duplicates
    //
    for (s in scene.stickers){
        if (scene.stickers[s].id === sticker.id){
            console.log(sticker.id);
            return;
        }
    }
    
    scene.stickers.push(sticker);
    sticker.scene = scene.id;
    
    var event = {};
    event.type="STICKER_ADDED";
    event.scene = scene.id;
    event.object = scene_get_render_info_for_sticker(sticker);
    game.push_events.push(event);
}

scene_remove_sticker = function(scene, sticker){
    if (!scene.id) scene = global.game.scenes[scene];
    
    scene.stickers.splice(scene.stickers.indexOf(sticker),1);
    
    var event = {};
    event.type="STICKER_REMOVED";
    event.object = sticker.id;
    event.scene = scene.id;
    game.push_events.push(event);
}