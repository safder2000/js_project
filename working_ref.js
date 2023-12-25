const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const mineflayerViewer = require('prismarine-viewer').mineflayer
const axios = require('axios');
const BotController = require('./BotController');


const bot__Lnzz__ = {
    host: '139.99.124.74',
    port: '25576',
    username: "__Lnzz__",
    version: '1.20.1',
    password: 'ooooo',
    hideError:false
};
const reconnectDelay = 10000;
const farmCoordinates = {
    'Gast Farm Kill Chamber': { x: -99579, y: 128, z: 301193 },
    'Gast Farm Afk Chamber': { x: -12448, y: 175, z: 37649 }
};

const mobTypeToAttack = 'gast'; // Replace with the mob type you want to attack (e.g., 'zombie', 'skeleton', etc.)


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
        bot.chat("/login poocha");
  
        // Continue with additional functionality after successful login
        handleAfterLogin(bot);
    });

    function handleAfterLogin(bot) {
        const defaultMove = new Movements(bot);

        bot.on('chat', function (username, message) {
            // Your chat event logic here...
        });

        bot.on('message', (message) => {

            // Check if the message contains "Successful login!"
            if (message.toString().includes('Successful login!')) {
                // const dcMsg = '🤖...🔑...'+bot.username+' just logged in ';
                // sendDiscordMessage(dcMsg);
                if(!message.toString().includes('left the game')&&!message.toString().includes('joined the game')&&!message.toString().includes('was killed by')){
                    console.log(`[Chat] ${message.toString()}`);
    
                }

                // const tempCord = { x: 15, y: 64, z: 15 };
                // getToLocation(bot, tempCord)
                // .then((goalReached) => {
                //     console.log('Goal reached:', goalReached); // Will log true when the goal is reached

                //     antiAfk(bot);
                // })
                // .catch((goalReached) => {
                //     console.log('Goal reached:', goalReached); // Will log false when no path is found
                // });
                npcTp(bot);
        
              
            }
            else if(message.toString().includes('Unknown command. Type "/help" for help')){
                const radius = 20;
                const targetCoordinates = bot.currentPosition



                checkProximity(bot, targetCoordinates, radius, () => {
                    // The bot is within the specified radius, call your function here
                    console.log('Bot is within the proximity!');
                    // Call your function here
                    yourFunction();})
                    const farmStatus = isNearFarm(bot, farmCoordinates);
                const dcMsg = '🤖...🔑...'+bot.username+' just logged in, status > '+farmStatus;
                sendDiscordMessage(dcMsg);
                anarchyWork(bot)

            }
        });
    }

    function antiAfk(bot) {
        function getRandomInt(minSeconds, maxSeconds) {
          const minMilliseconds = minSeconds * 2000;
          const maxMilliseconds = maxSeconds * 2000;
          return Math.floor(Math.random() * (maxMilliseconds - minMilliseconds + 1)) + minMilliseconds;
        }
      
        function randomizeActions() {
          const delay = getRandomInt(5, 10); // 2 to 5 seconds delay
      
          // Perform actions to prevent AFK
        //   bot.setControlState('jump', true);
          bot.look(Math.random() * 180 - 90, 0, true); // Random rotation between -90 and 90 degrees
          bot.swingArm();
      
          // Schedule the next random action
          setTimeout(randomizeActions, delay);
        }
      
        // Start the anti-AFK loop
        randomizeActions();
      }
      

    function sendDiscordMessage(content) {
        const webhookUrl =  'https://discord.com/api/webhooks/1188774069944975411/UmOS6b9lt_qsHgFJxUv2uCd48l8NssyEoh1GufLWHlVslm8pvMiMaHS2k6EMMhbhAzJg';
        return axios.post(webhookUrl, {
          content: content,
        })
        .then(response => {
          console.log('Message sent successfully:', response.data);
        })
        .catch(error => {
          console.error('Error sending message:', error.message);
        });
      }
      
    
      function isNearFarm(bot, farmCoordinates) {
        const proximityRadius = 2;
        const nearProximityRadius = 10;
    
        function checkProximity(coordinates, radius) {
            // Get the bot's current position
            const botPosition = bot.entity.position;
    
            // Calculate the distance between the bot and the target coordinates (ignoring Y)
            const distance = Math.sqrt(
                Math.pow(botPosition.x - coordinates.x, 2) + Math.pow(botPosition.z - coordinates.z, 2)
            );
    
            // Check if the bot is within the specified radius
            return distance <= radius;
        }
    
        for (const [farmName, coordinates] of Object.entries(farmCoordinates)) {
            // Check if the bot is in a 2-block radius of the location
            if (checkProximity(coordinates, proximityRadius)) {
                return `At ${farmName}`;
            }
    
            // Check if the bot is in a 10-block radius of the location
            if (checkProximity(coordinates, nearProximityRadius)) {
                return `Near ${farmName}`;
            }
        }
    
        // Bot is not near any farm coordinates
        return 'Not near any farm';
    }
    
    function npcTp(bot) {
        const npcCord = { x: 33, y: 67, z: 41 };
        const defaultMove = new Movements(bot);

        bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(new goals.GoalNear(npcCord.x, npcCord.y, npcCord.z, 1));

        bot.on('goal_reached', () => {
            // logNearestEntityInfo();
            
        
   
            lookAtAndActivateEntity();
            // const targetCoordinates = { x: 33, y: 67, z: 41 };
            // setTimeout(() => {getTo(bot,targetCoordinates);}),500
            // placeHeldItemAndListen(bot);
      
        });
    }
    function anarchyWork(bot){

        antiAfk(bot);
        // const newCord = { x: -12448, y: 126, z: -37649 };
        // getToLocation(bot,newCord)
        // .then((goalReached) => {
        //     console.log('Goal reached:', goalReached); // Will log true when the goal is reached
        // })
        // .catch((goalReached) => {
        //     console.log('Goal reached:', goalReached); // Will log false when no path is found
        // });
    }

    function getToLocation(bot, targetCoordinates) {
        return new Promise((resolve, reject) => {
            const defaultMove = new Movements(bot);
    
            bot.pathfinder.setMovements(defaultMove);
            bot.pathfinder.setGoal(new goals.GoalNear(targetCoordinates.x, targetCoordinates.y, targetCoordinates.z, 1));
    
            bot.on('goal_reached', () => {
                // Goal reached, resolve the promise with true
                resolve(true);
            });
    
            bot.on('path_update', (results) => {
                if (results.status === 'noPath') {
                    // No path found, reject the promise with false
                    reject(false);
                }
            });
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



  function attackMobIfNearby(bot, mobType, targetCoordinates, proximityRadius) {
    function isMob(entity) {
        return entity.type === mobType;
    }

    // Get the bot's current position
    const botPosition = bot.entity.position;

    // Find the nearest mob
    const nearbyMob = bot.nearestEntity(isMob);

    // Check if the nearest mob is within the specified proximity
    checkProximity(bot, targetCoordinates, proximityRadius, () => {
        // If there is a nearby mob of the specified type, attack it with a 1-second delay
        if (nearbyMob && isMobInRange(nearbyMob, targetCoordinates, proximityRadius)) {
            setTimeout(() => {
                bot.attack(nearbyMob);
            }, 1000);
        }
    });
}
function attackHostileMobsIfNearby(bot, proximityRadius) {
    // Find all hostile mobs within the specified proximity
    const nearbyHostileMobs = bot.findEntities({
        type: 'mob',
        position: bot.entity.position,
        radius: proximityRadius,
        count: 10, // Adjust the count as needed
        matching: (entity) => bot.mobTracker.isMobHostile(entity)
    });

    // Check if there are any hostile mobs nearby
    if (nearbyHostileMobs.length > 0) {
        // Attack each nearby hostile mob with a 1-second delay
        for (const mob of nearbyHostileMobs) {
            setTimeout(() => {
                bot.attack(mob);
            }, 1000);
        }
    }
}


 function checkProximity(bot, targetCoordinates, radius, callback) {
    // Get the bot's current position
    const botPosition = bot.entity.position;

    // Ignore Y coordinate for proximity check
    const botXZ = { x: botPosition.x, z: botPosition.z };

    // Calculate the distance between the bot and the target coordinates (ignoring Y)
    const distance = Math.sqrt(
        Math.pow(botXZ.x - targetCoordinates.x, 2) + Math.pow(botXZ.z - targetCoordinates.z, 2)
    );

    // Check if the bot is within the specified radius
    if (distance <= radius) {
        // Call the callback function if the bot is within range
        callback();
    }
}



    bot.on('end', (err) => {
        console.log(`Disconnected: ${err ? err : 'intentional disconnect'}`);
 
        // const dcMsg = '🤖 🦵 '+bot.username+' Disconnected> '+reason;
        sendDiscordMessage(dcMsg);
        setTimeout(initBot, reconnectDelay );
        // setTimeout(initBot, 5000);
    });

    bot.on('kicked', (reason) => {
        const dcMsg = '🤖...🦵 ...'+bot.username+' got kicked from the server - Reason > '+reason.toString();
        sendDiscordMessage(dcMsg);
        console.log('Kicked for reason', reason)
        setTimeout(initBot, reconnectDelay );
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
