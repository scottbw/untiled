//
// Utils for working with properties of things
//

properties_has_property = function(actor, property){

    //
    // No properties, no match
    //
    if (!actor.properties) return false;

    //
    // Actor properties
    //
    if (actor.properties[property] && actor.properties[property] === true ) return true;
    
    //
    // Inherited properties
    //
    var inherited = false;
    if (actor.inventory){
        for (i in actor.inventory){
            var item = actor.inventory[i];
            if (item.bestows){
                for (b in item.bestows){
                    if (item.bestows[b] === property) inherited = true;
                }
            }
        }
        for (i in actor.inventory){
            var item = actor.inventory[i];
            if (item.cancels){
                for (b in item.cancels){
                    if (item.cancels[b] === property) inherited = false;
                }
            }
        }
    }
    return inherited;

}