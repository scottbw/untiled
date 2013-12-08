//
// Client JavaScript library for Untiled engine
//


// The main update loop runs on requestAnimationFrame,
// Which falls back to a setTimeout loop on the server
// Code below is from Three.js, and sourced from links below

    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

    // requestAnimationFrame polyfill by Erik Möller
    // fixes from Paul Irish and Tino Zijdel

var frame_time = 16/1000; // run the local game at 16ms/ 60hz


//
// The Untiled Game Client
//
// Captures user-initiated events and sends to server
// Captures server-sent rendering events and renders to canvas
//

var client = {};
client.stickers = [];

                
client.register = function(player){
    console.log("registering client");
    var msg = {};
    msg.player = player;
    this.socket.emit("message",msg);
}

    
//
// Initialize the client
// 
client.init = function(player){

    // Keyboard input buffer
    this.actionbuffer = 0;

    // Set up canvas
    this.c = document.getElementById("canvas");
    this.ctx = this.c.getContext("2d");
    
    //Create a keyboard handler
    this.keyboard = new THREEx.KeyboardState();

    // Setup websockets
    this.socket = io.connect("http://localhost:3000"); 
    
    this.socket.on('connect', function(){
        console.log('connected');
    });
     
    // Setup events and callbacks
    this.socket.on('message', function(data){
    
            //
            // Ready message
            //
            if (data === "ready"){
                console.log("got ready message");
                client.register(player);
            }
            
            //
            // Render the event
            //
            //
            // The event can be targeted at a specific object in the scene, 
            // the whole scene, or other game elements (messages, inventory etc)
            //
            
            // types
            //
            // FACE (target, direction)
            if (data.type === "FACE"){
                client.render_face_event(data);
            }
            
            // MOVE (target, x, y)
            if (data.type === "MOVE"){
                client.render_move_event(data)
            }                  
            
            // MESSAGE (text)
            if (data.type === "MESSAGE"){
                client.render_message_event(data)
            }  
            
            // SAY (from, text)
            if (data.type === "SAY"){
                client.render_say_event(data)
            }                
            
            // SAY (who, text)
            // TRANSITION (who, scene)
            //
            if (data.type === "TRANSITION" && data.scene){
                client.render_scene_event(data.scene)
            }
            
            // Scene updates
            if (data.type === "STICKER_ADDED"){
                client.add_sticker_event(data)
            } 
            if (data.type === "STICKER_REMOVED"){
                client.remove_sticker_event(data)
            } 
     });
}

// **************
// Send to server
// **************
    
//
// Send an action
//
// The typical actions are MOVE, ACTION, SAY, USE and CHOICE
//
client.send = function(action){
    client.socket.emit("message", action);
}

client.send_movement_action = function(direction){
    var action = {};
    action.type="MOVE";
    action.value=direction;
    client.send(action);
}

client.send_action = function(){
    var action = {};
    action.type="ACTION";
    client.send(action);
}

client.send_response = function(id){
    var action = {};
    action.type="DIALOGUE";
    action.response=id;
    client.send(action);
}

// *************************
// Render Events From Server
// *************************

/**
 * Handle render event - this a full state push including static background info
 */
client.render_scene_event = function(scene){

    //
    // Set the scene title
    //
    $("#title").text(scene.title);

    //
    // Set the scene background
    //
    var img = new Image;
    img.src = scene.background;
    
    img.onload = function(){
        var b = document.getElementById("canvas_background");
        var bctx = b.getContext("2d");
        bctx.drawImage(img,0,0);
    }
    
    //
    // Clear existing sprites
    //
    stage.removeAllChildren();
    
    //
    // Place stickers
    //
    client.stickers = scene.stickers;
    for (s in client.stickers){
        var sticker = client.stickers[s];
        client.add_sticker(sticker);        
    }
    
    stage.update();
    
    //
    // Only now do we start the main loop
    //
    createjs.Ticker.setInterval(16);
    createjs.Ticker.addEventListener("tick", stage);
    createjs.Ticker.addEventListener("tick", client.onTick);
}

//
// Add a sticker to the stage
//
client.add_sticker = function(sticker){
        //
        // Load the sticker image
        //
        if (sticker.spritesheet){
            var spritesheet = new createjs.SpriteSheet(sticker.spritesheet);
            sticker.sprite = new createjs.Sprite(spritesheet,"stand");
            sticker.sprite.regX = sticker.spritesheet.frames.width / 2;
        
            stage.addChild(sticker.sprite);
            sticker.sprite.x = sticker.x + sticker.sprite.regX;
            sticker.sprite.y = sticker.y;

        } else {
            var image = new createjs.Bitmap(sticker.image);
            image.x = sticker.x;
            image.y = sticker.y;
            sticker.sprite = image;
            stage.addChild(image);
        }
}

//
// Scene updates
//
client.add_sticker_event = function(event){
    console.log("added ",event.object);
    if (!client.get_sticker_from_object(event.object.object)){
        if (client.stickers.length == 0) return;
        client.stickers.push(event.object);
        client.add_sticker(event.object);
    }
}
client.remove_sticker_event = function(event){
    console.log("removed ",event.object);
    
    //
    // Locate the sticker in the client list
    //
    var stickerPos  = -1; 
    for (s in client.stickers){
        if (client.stickers[s].object == event.object){
            stickerPos = s;
        }
    }
    
    if (stickerPos != -1){
    
        //
        // Remove sprite from stage
        //
        var sticker = client.stickers[stickerPos];
        if (sticker.sprite){
            stage.removeChild(sticker.sprite);
        }
        stage.update();
        
        //
        // Remove from client list
        //
        client.stickers.splice(stickerPos,1)
    }
}

//
// Movement
//
client.render_move_event = function(event){
    var sticker = client.get_sticker_from_object(event.object);
    client.update_position(sticker, event.x, event.y);
}

client.get_sticker_from_object = function(object){
    for (s in client.stickers){
        var sticker = client.stickers[s];
        if (sticker.object === object){
            return sticker;
        }
    }
    return null;
}

client.render_face_event = function(event){
    var sticker = client.get_sticker_from_object(event.object);

    if (event.value === "W"){
        sticker.sprite.scaleX = -1;
    }
    if (event.value === "E"){
        sticker.sprite.scaleX = 1;
    }
}

client.render_message_event = function(message){
    document.getElementById("messages").innerHTML += "<p>"+message.text + "</p>";
}

client.render_say_event = function(message){
    
    var actor = client.get_sticker_from_object(message.from);

    var text = message.dialogue.text;
    
    bubble_show_text(actor.x + actor.spritesheet.frames.width/2,actor.y - 10,text);
    
    if (message.dialogue.responses){
        var text = "";
        for (r in message.dialogue.responses){
            var response = message.dialogue.responses[r];
            text += "<p> - <a href=\"#\" a onclick=\"client.send_response("+response.id+")\"> "+response.text +"</a></p>";
        }
        
        document.getElementById("options").innerHTML = text;
    }
}

client.render_choice_event = function(action){
}


client.onTick = function(){
 var pos = client.handle_input();
 client.update_local_position(pos);
}

client.action_list = [];

client.handle_input = function(){

    var x_dir = 0;
    var y_dir = 0;
    

    if( this.keyboard.pressed('A') ||
        this.keyboard.pressed('left')) {
            client.send_movement_action("W");
            x_dir = -1;
        }

    else if( this.keyboard.pressed('D') ||
        this.keyboard.pressed('right')) {
            client.send_movement_action("E");
            x_dir = 1;
        }

    else if( this.keyboard.pressed('S') ||
        this.keyboard.pressed('down')) {
            client.send_movement_action("S");
            y_dir = 1;
        } 

    else if( this.keyboard.pressed('W') ||
        this.keyboard.pressed('up')) {
            client.send_movement_action("N");
            y_dir = -1
        }
    
    //
    // Lets not repeat ourselves
    //
    else if( this.keyboard.pressed("space" )) {
        if (client.actionbuffer === 0){
            client.send_action();
            client.actionbuffer = 6;
        } else {
            client.actionbuffer--;
        }
    }
    
    return {
        x: (x_dir * (player.speed * 0.015)).fixed(3),
        y: (y_dir * (player.speed * 0.015)).fixed(3)
    };
    

    
}


/**
 * See where we need to draw (predictive)
 */
client.update_local_position = function(pos){
    for (s in client.stickers){
        var sticker = client.stickers[s];
        if (sticker.object === player.id){
            client.update_position(sticker, sticker.x + pos.x, sticker.y + pos.y);
        }
    }
}



//
// Update position of a sticker
//
client.update_position = function(sticker,x,y){
    if (sticker.x != x || sticker.y != y){
        sticker.x = x;
        sticker.y = y; 
        //
        // Update animation
        //
        if (sticker.sprite){
            //
            // Walk
            //
            if (sticker.sprite.currentAnimation != "walk") sticker.sprite.gotoAndPlay("walk");
            
            //
            // Walk - set direction
            //
            if (sticker.x + sticker.sprite.regX < sticker.sprite.x)
                sticker.sprite.scaleX = -1;
            if (sticker.x + sticker.sprite.regX > sticker.sprite.x)
                sticker.sprite.scaleX = 1;
            
            
            //
            // Add registration value
            //
            sticker.sprite.x = sticker.x + sticker.sprite.regX;
            sticker.sprite.y = sticker.y; 
              
        } 
    } else {
        //
        // Move to standing animation
        //
        if (sticker.sprite){
            if (sticker.sprite.currentAnimation != "stand") sticker.sprite.gotoAndPlay("stand");
        }

    }
}



Number.prototype.fixed = function(n) { n = n || 3; return parseFloat(this.toFixed(n)); };

