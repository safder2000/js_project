const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const mineflayerViewer = require('prismarine-viewer').mineflayer

const bot__Lnzz__ = {
    host: '139.99.124.74',
    port: '25576',
    username: "yepn",
    version: '1.20.1',
    password: 'ooooo',
    hideError:false
};

const initBot = () => {
    // Setup bot connection
    let bot = mineflayer.createBot(bot__Lnzz__);

    bot.loadPlugin(pathfinder);

    bot.on('login', () => {
        let botSocket = bot._client.socket;
        console.log(`Logged in to ${botSocket.server ? botSocket.server : botSocket._host}`);
    });

    bot.on('spawn', async () => {
        console.log("Spawned in");
        // mineflayerViewer(bot, { firstPerson: true, port: 3000 })
        await bot.waitForTicks(10);
        bot.chat("/login bangali");  
  
        // Continue with additional functionality after successful login
        handleAfterLogin(bot);
    });

    function handleAfterLogin(bot) {
        const defaultMove = new Movements(bot);

        bot.on('chat', function (username, message) {
            // Your chat event logic here...
        });

        bot.on('message', (message) => {
            // Log messages to the console
            


            // Check if the message contains "Successful login!"
            if (message.toString().includes('Successful login!')) {
                if(!message.toString().includes('left the game')&&!message.toString().includes('joined the game')&&!message.toString().includes('was killed by')){
                    console.log(`[Chat] ${message.toString()}`);
    
                }
                // Additional functionality after successful login
                const targetCoordinates = { x: 33, y: 67, z: 41 };
                moveAndRightClick(bot, targetCoordinates);
                // useHotbarSlotItem(bot, 0);
              
            }
            else if(message.toString().includes('Unknown command. Type "/help" for help')){
                const newCord = { x: -12448, y: 126, z: -37649 };
                getToLocation(bot,newCord);
    
            }
        });
    }
    // function clickOnPlayer(bot, playerName) {
    //     if (!bot.players) {
    //         console.log('Bot players data not available.');
    //         return;
    //     }
    
    //     const player = bot.players[playerName];
    
    //     if (player && player.entity) {
    //         // Activate (click) the player
    //         bot.activateEntity(player.entity, (err) => {
    //             if (err) {
    //                 console.log(`Error clicking on player "${playerName}":`, err);
    //             } else {
    //                 console.log(`Clicked on player "${playerName}".`);
    //             }
    //         });
    //     } else {
    //         console.log(`Player "${playerName}" not found or not loaded.`);
    //     }
    // }
    
    

    

    
    function moveAndRightClick(bot, targetCoordinates) {
        const defaultMove = new Movements(bot);

        bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(new goals.GoalNear(targetCoordinates.x, targetCoordinates.y, targetCoordinates.z, 1));

        bot.on('goal_reached', () => {
            // logNearestEntityInfo();
            
        
   
            lookAtAndActivateEntity();
            // const targetCoordinates = { x: 33, y: 67, z: 41 };
            // setTimeout(() => {getTo(bot,targetCoordinates);}),500
            // placeHeldItemAndListen(bot);
      
        });
    }


    function getToLocation(bot, targetCoordinates) {
        const defaultMove = new Movements(bot);

        bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(new goals.GoalNear(targetCoordinates.x, targetCoordinates.y, targetCoordinates.z, 1));
        setInterval(logCurrentPosition, 10000);
        bot.on('goal_reached', () => {
            
            bot.end();
      
        });
    }

function lookAtAndActivateEntity() {
    try {
      const maxDistance = 3.5;
    //   const positionToLookAt = { x: 0, y: 67, z: 63 };
    //   console.log("Looking at position:", positionToLookAt);
  
      // Introduce a 50-tick delay before setting the bot's head position
      setTimeout(() => {
 
        setTimeout(() => {
          const targetEntity = bot.entityAtCursor(maxDistance);
  
          if (targetEntity) {
            console.log("+ Entity found within the specified distance.");
            bot.activateEntity(targetEntity);
            console.log("+ Activated entity:");
          


            // getTo(bot,targetCoordinates);
            // console.log("Activated entity:", targetEntity);
          } else {
            console.log("+ No entity found within the specified distance.");
          }
        }, 500); // Adjust the delay as needed
      }, 50 * bot.time.tick); // 50 ticks delay
    } catch (error) {
      console.error("+ Error in lookAtAndActivateEntity:", error.message);
    }
  }

  function logCurrentPosition() {
    // Get the bot's current position
    const currentPosition = bot.entity.position;
  
    // Log the current position
    console.log('Current Position:', {
        x: currentPosition.x.toFixed(0),
        y: currentPosition.y.toFixed(0),
        z: currentPosition.z.toFixed(0)
      });
  }

function listenForLoginPackets(bot) {
    // Listen for the second login packet
    bot._client.once('login', (packet) => {
        console.log('Received second login packet:', packet);
        // Handle the login packet as needed
    });
}
    bot.on('end', (err) => {
        console.log(`Disconnected: ${err ? err : 'intentional disconnect'}`);
        listenForLoginPackets(bot);
       
        // setTimeout(initBot, 5000);
    });

    bot.on('kicked', (reason) => {
        console.log('Kicked for reason', reason)
      })

    bot.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
            console.log(`Failed to connect to ${err.address}:${err.port}`);
        } else {
            console.log(`Unhandled error: ${err}`);
        }
    });
};

initBot();
