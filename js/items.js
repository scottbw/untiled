require("./scene.js");

item_pick_up = function(scene, actor, item){
    console.log(actor.name+" picked up "+item.name+ " in scene "+scene);
    scene_remove_sticker(scene, item);
    return true;
}

item_drop = function(scene, actor, item){

}