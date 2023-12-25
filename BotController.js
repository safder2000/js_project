const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');


class BotController {
    constructor(bot) {
        this.bot = bot;
    }

     npcTp() {
        const npcCord = { x: 33, y: 67, z: 41 };
        const defaultMove = new Movements(bot);

        this.bot.pathfinder.setMovements(defaultMove);
        this.bot.pathfinder.setGoal(new goals.GoalNear(npcCord.x, npcCord.y, npcCord.z, 1));

        this.bot.on('goal_reached', () => {
            // logNearestEntityInfo();
            
        
   
            lookAtAndActivateEntity();
            // const targetCoordinates = { x: 33, y: 67, z: 41 };
            // setTimeout(() => {getTo(bot,targetCoordinates);}),500
            // placeHeldItemAndListen(bot);
      
        });
    }

    
 lookAtAndActivateEntity() {
    try {
      const maxDistance = 3.5;
    //   const positionToLookAt = { x: 0, y: 67, z: 63 };
    //   console.log("Looking at position:", positionToLookAt);
  
      // Introduce a 50-tick delay before setting the bot's head position
      setTimeout(() => {
 
        setTimeout(() => {
          const targetEntity = this.bot.entityAtCursor(maxDistance);
  
          if (targetEntity) {
            console.log("+ Entity found within the specified distance.");
            this.bot.activateEntity(targetEntity);
            console.log("+ Activated entity:");
          


            // getTo(bot,targetCoordinates);
            // console.log("Activated entity:", targetEntity);
          } else {
            console.log("+ No entity found within the specified distance.");
          }
        }, 500); // Adjust the delay as needed
      }, 50 * this.bot.time.tick); // 50 ticks delay
    } catch (error) {
      console.error("+ Error in lookAtAndActivateEntity:", error.message);
    }
  }


    // Add other functions here...
}

module.exports = BotController;