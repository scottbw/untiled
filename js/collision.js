//
// Collision detection utils
//

//
// TODO use node canvas to provide pixel-level collision detection
//

/**
 * Basic bounding box test
 */
collide = function(actor, target, future) {
    if (actor === target) return false;
    
    try{

	if (future.y.fixed(0) + actor.size.y < target.y.fixed(0)) return false;
	if (future.y.fixed(0) > target.y.fixed(0) + target.size.y) return false;

	if (future.x.fixed(0) + actor.size.x < target.x.fixed(0)) return false;
	if (future.x.fixed(0) > target.x.fixed(0) + target.size.x) return false;

	return true;
    
    } catch (err){
        console.log(actor,target,future);
    }
};