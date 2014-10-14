var stage, player;

function init(){

    stage = new createjs.Stage("canvas");
    player = {};
    player.id = "alice";
    player.speed = 40;
    player.size = {x:56, y:80};
    player.name = "Alice";
    player.spritesheet = {
       framerate: 8,
       images: ['/assets/sprites/kit_from_firefox.png'],
       frames: {width:56, height:80},
       animations: {
          "stand" : [0,2], 
          "walk" : [3,5], 
          "jump" : [6,8],
          "hit" : [9,11, "stand"],
          "punch" : [12,14,"stand"],
          "kick" : [15,17, "stand"],
          "stunned": [24,26, "stand"]

       }     
    }
    script = {};
    script.type = "COMPOSITE";
    script.rules = [];
    script.rules[0] = {condition:"ALWAYS", action:"PICKUP", property:"pickup", importance:10};
    script.rules[1] = {condition:"ALWAYS", action:"SEEK", property:"weapon", importance:5};
    script.rules[2] = {condition:"IF NOT armed", action:"FLEE", property:"fightable", importance:1};
    script.rules[3] = {condition:"IF armed", action:"FIGHT", property:"fightable", importance:1};
    script.rules[4] = {condition:"ALWAYS", action:"SEEK", property:"treasure", importance:4};
    script.rules[5] = {condition:"IF armed", action:"SEEK", property:"fightable", importance:1};
    script.speed = 40;
    player.script = script;
    
    client.init(player);

}