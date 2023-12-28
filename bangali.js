const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const axios = require('axios');
class BotController {
    constructor(botConfig, reconnectDelay, farmCoordinates, mobsToAttack) {
        this.shouldCheckActivity = true;
        this.lastActivityTimestamp = Date.now();
        this.timeoutIds = [];
        this.intervalIds = [];
        this.inactivityTimeoutIDs = [];



        this.botConfig = botConfig;
        this.reconnectDelay = reconnectDelay;
        this.farmCoordinates = farmCoordinates;
        this.mobsToAttack = mobsToAttack;

        // Setup bot connection
        this.bot = mineflayer.createBot(this.botConfig);
        this.bot.loadPlugin(pathfinder);

        this.bot.on('login', () => {
            let botSocket = this.bot._client.socket;
            console.log(`Logged in to ${botSocket.server ? botSocket.server : botSocket._host}   `);
        });

        this.bot.on('spawn', async () => {
            console.log(`[${this.bot.username}] Spawned in  `);
            await this.bot.waitForTicks(80);
            this.bot.chat("/login poocha");
            this.bot.quit();
            // this.handleAfterLogin();
            this.shouldCheckActivity = true;
            this.checkActivity();
        });
        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        this.bot.on('end', async (err) => {
            console.log(`[${this.bot.username}]-➡️🚪- Disconnected: ${err ? err : 'intentional disconnect'} ,`);
            this.sendDiscordMessage(`[${this.bot.username}]-➡️🚪-  Disconnected  `);

            // Clear all timeouts
            this.timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
            this.inactivityTimeoutIDs.forEach((timeoutId) => clearTimeout(timeoutId));
            this.timeoutIds = [];
            this.inactivityTimeoutIDs = [];

            // Clear all intervals
            this.intervalIds.forEach((intervalId) => clearInterval(intervalId));
            this.intervalIds = [];
            console.log(`[${this.bot.username}]-➡️🚪-"End" Try connecting in ${((this.reconnectDelay + 5000) / 1000).toString()} sec   ,`);
            await delay(5000);
            setTimeout(() => this.initBot(), this.reconnectDelay);
        });

        this.bot.on('kicked', (reason) => {
            this.sendDiscordMessage(`[${this.bot.username}]-🦿➡️🚪- got kicked from the server - Reason > ${reason}`);
            console.log(`[${this.bot.username}] Kicked for reason  `, reason);

            if (reason.toString().includes('restart')) {
                this.reconnectDelay = 2 * 60 * 1000;
            }
            console.log(`[${this.bot.username}] Try reconnecting in: ${this.reconnectDelay / 1000} seconds   `);
            setTimeout(() => this.initBot(), this.reconnectDelay);
        });

        this.bot.on('error', (err) => {
            if (err.code === 'ECONNREFUSED') {
                console.log(`[${this.bot.username}] Failed to connect to ${err.address}:${err.port}   `);
            } else {
                console.log(`[${this.bot.username}] Unhandled error: ${err}   `);
            }
            console.log(`[${this.bot.username}] Try reconnecting in: ${this.reconnectDelay / 1000} seconds    `);
            setTimeout(() => this.initBot(), this.reconnectDelay);
        });
    }


    async checkActivity() {

        if (!this.shouldCheckActivity || !this.bot.entity) {
            this.inactivityTimeoutIDs.forEach((timeoutId) => clearTimeout(timeoutId));
            this.inactivityTimeoutIDs = [];
            console.log(`[${this.bot.username}] 🕒 Left the lobby, Stoped checking for inactivity    `);
            return;
        }

        // Wait for 10 ticks
        await this.bot.waitForTicks(10);

        const currentTime = Date.now();
        const elapsedTime = currentTime - this.lastActivityTimestamp;

        // Check if the bot is within a 100 block radius of 0,0,0
        const proximityRadius = 100;
        const botPosition = this.bot.entity.position;
        console.log(`[${this.bot.username}] 🕒 start checking for inactivity,  (waiting ${(((120000 - elapsedTime) / 60) / 1000).toFixed(2)} min before qutting) `);

        if (!botPosition) {
            return; // Ensure botPosition is defined
        }

        const distanceToZeroZero = Math.sqrt(
            Math.pow(botPosition.x, 2) + Math.pow(botPosition.y, 2) + Math.pow(botPosition.z, 2)
        );

        // Check if the chat message contains a specific string
        const chatMessage = this.bot.chatHistory && this.bot.chatHistory.length > 0
            ? this.bot.chatHistory[this.bot.chatHistory.length - 1].toString()
            : null;

        if (chatMessage && chatMessage.includes('Unknown command. Type "/help" for help')) {
            console.log(`Received the specified chat message. Stopping checkActivity...   `);

            // Stop further execution of checkActivity
            this.shouldCheckActivity = false;
        } else if (elapsedTime > 120000 && distanceToZeroZero > proximityRadius) {
            console.log(`No activity for over 1 minute. Stopping checkActivity...   `);

            // Stop further execution of checkActivity
            this.shouldCheckActivity = false;
        } else if (elapsedTime > 120000 && distanceToZeroZero < proximityRadius) {
            console.log(`[${this.bot.username}] 🔃 inactive for ${120000 / 60 / 1000} min, --> quiting   `);
            this.bot.quit()
        } else {

            const inactivityID = setTimeout(() => this.checkActivity(), 10000);
            this.inactivityTimeoutIDs.push(inactivityID);
            // Check activity every 10 seconds
        }
    }


    handleAfterLogin() {
        const defaultMove = new Movements(this.bot);

        this.bot.on('chat', (username, message) => {
            // Your chat event logic here...
        });




        this.bot.once('message', (message) => {


            if (message.toString().includes('Successful login!')) {
                this.lastActivityTimestamp = Date.now();
                this.npcTp();
                this.checkActivity();
            } else if (message.toString().includes('Unknown command. Type "/help" for help')) {
                console.log(`Received the specified chat message. Stopping checkActivity...  `);

                // Clear all timeouts and intervals before stopping
                this.clearTimeoutsAndIntervals();
                const radius = 3.3;



                const farmStatus = this.isNearFarm(this.farmCoordinates);
                const dcMsg = `[🔑] Ready for duty, status > ${farmStatus.toString()}`;
                this.sendDiscordMessage(dcMsg);


                if (farmStatus.includes('At')) {
                    this.inactivityTimeoutIDs.forEach((timeoutId) => clearTimeout(timeoutId));
                    this.timeoutIds = [];
                    this.shouldCheckActivity = false;
                    if (farmStatus.includes('Kill')) {

                        const armorStandPos = { x: -99579, y: 128, z: -301193 }
                        this.moveToArmorStandAndAttack(armorStandPos);


                    } else if (farmStatus.includes('Afk')) {
                        this.antiAfk();
                    }

                }

            }
        });

        // Start checking for inactivity

    }



    //console.log('loop exit');
    moveToArmorStandAndAttack(targetPosition) {
        const defaultMove = new Movements(this.bot);

        const target = new goals.GoalNear(targetPosition.x, targetPosition.y, targetPosition.z, 1);

        this.bot.pathfinder.setMovements(defaultMove);
        this.bot.pathfinder.setGoal(target);

        this.bot.on('goal_reached', () => {
            this.bot.lookAt(this.bot.entity.position.offset(0, -1.6, 0));

            const intervalId = setInterval(() => {
                let times = 0;
                const mobFilter = e => e.type === 'mob';
                const mob = this.bot.nearestEntity(mobFilter);

                if (mob && this.bot.entity.position.distanceTo(mob.position) < 4) {

                    let logMessage = 'Checking for mobs';
                    process.stdout.write('\r' + logMessage);

                    let sword = null;
                    for (const item of this.bot.inventory.slots) {
                        if (item && item.name && item.name.includes('sword')) {
                            sword = item;
                            break;
                        }
                    }

                    const delay = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;


                    setTimeout(() => {
                        if (sword) {
                            times = times + 1;
                            logMessage = `🔪 - Attacking with sword [${mob.name}] ,(${times.toString()}) - next attack in ${(delay / 1000).toString()} sec`;
                            process.stdout.write('\r' + logMessage);
                            this.bot.equip(sword, 'hand');
                            this.bot.attack(mob);
                        } else {
                            times = times + 1;
                            logMessage = `👊 - Attacking without a sword  [${mob.name}],(${times.toString()}) - next attack in ${(delay / 1000).toString()} sec`;
                            process.stdout.write('\r' + logMessage);
                            this.bot.attack(mob);
                        }
                    }, delay);
                } else {
                    process.stdout.write('\r'); // Clear the line
                }
            }, 3000);
            this.intervalIds.push(intervalId);
        });
    }


    antiAfk() {
        const getRandomInt = (minSeconds, maxSeconds) => {
            const minMilliseconds = minSeconds * 1000;
            const maxMilliseconds = maxSeconds * 1000;
            return Math.floor(Math.random() * (maxMilliseconds - minMilliseconds + 1)) + minMilliseconds;
        };
        const checkHealthTime = 0;
        const randomizeActions = () => {
            // Generate a random number to determine the action
            const actionSelector = Math.random();

            // 40% chance of looking around
            if (actionSelector < 0.4) {
                this.bot.look(Math.random() * 180 - 90, 0, true);
            }
            // 40% chance of swinging arm
            else if (actionSelector < 0.8) {
                this.bot.swingArm();
            }
            else if (checkHealthTime > 500) {
                this.checkHealthAndHunger();
                checkHealthTime = 0;
            }
            // 20% chance of jumping
            else {
                this.bot.setControlState('jump', true);
                setTimeout(() => this.bot.setControlState('jump', false), 500);
            }

            // Schedule the next random action
            const timeoutId = setTimeout(randomizeActions, getRandomInt(2, 6));
            this.timeoutIds.push(timeoutId);
        };

        // Start the anti-AFK loop
        randomizeActions();
    }

    sendDiscordMessage(content) {
        const webhookUrl = 'https://discord.com/api/webhooks/1188774069944975411/UmOS6b9lt_qsHgFJxUv2uCd48l8NssyEoh1GufLWHlVslm8pvMiMaHS2k6EMMhbhAzJg';
        const msg = `[${this.bot.username}] : ` + content;
        const coloredContent = '```css\n' + msg + '\n```';
        try {
            axios.post(webhookUrl, { content: coloredContent })
                .then(response => {
                    console.log(`[${this.bot.username}] DC msg :` + content.toString(), response.data);
                })
                .catch(error => {
                    console.error('Error sending message:', error.message);
                });
        } catch (error) {
            console.error('An unexpected error occurred:', error.message);
        }
    }

    isNearFarm(farmCoordinates) {
        const proximityRadius = 5;
        const nearProximityRadius = 10;

        // Use an arrow function to bind 'this'
        const checkProximity = (coordinates, radius) => {
            const botPosition = this.bot.entity.position;
            const botXZ = { x: botPosition.x, z: botPosition.z };
            const distance = Math.sqrt(
                Math.pow(botXZ.x - coordinates.x, 2) + Math.pow(botXZ.z - coordinates.z, 2)
            );
            return distance <= radius;
        };

        for (const [farmName, coordinates] of Object.entries(farmCoordinates)) {
            console.log(`Checking proximity for ${farmName}`);

            if (checkProximity(coordinates, proximityRadius)) {
                console.log(`At ${farmName}`);
                return `At ${farmName}`;
            }

            if (checkProximity(coordinates, nearProximityRadius)) {
                console.log(`Near ${farmName}`);
                return `Near ${farmName}`;
            }
        }

        console.log(` ${this.bot.name} ⚠️ Not near any farm`);
        return 'Not near any farm';
    }


    npcTp() {
        console.log(` [${this.bot.name}] -🗽-Targeting npc`);

        const npcCord = { x: 33, y: 67, z: 41 };
        const defaultMove = new Movements(this.bot);

        this.bot.pathfinder.setMovements(defaultMove);
        this.bot.pathfinder.setGoal(new goals.GoalNear(npcCord.x, npcCord.y, npcCord.z, 1));

        this.bot.on('goal_reached', () => {
            this.lookAtAndActivateEntity();
        });
    }

    anarchyWork() {
        this.antiAfk();
    }

    getToLocation(targetCoordinates) {
        return new Promise((resolve, reject) => {
            const defaultMove = new Movements(this.bot);

            this.bot.pathfinder.setMovements(defaultMove);
            this.bot.pathfinder.setGoal(new goals.GoalNear(targetCoordinates.x, targetCoordinates.y, targetCoordinates.z, 1));

            this.bot.on('goal_reached', () => {
                resolve(true);
            });

            this.bot.on('path_update', (results) => {
                if (results.status === 'noPath') {
                    reject(false);
                }
            });
        });
    }
    lookAtAndActivateEntity() {
        try {
            const maxDistance = 3.5;
            setTimeout(() => {
                setTimeout(() => {
                    const targetEntity = this.bot.entityAtCursor(maxDistance);

                    if (targetEntity) {
                        console.log(`+[${this.bot.username}] - Entity found within the specified distance.`);
                        this.bot.activateEntity(targetEntity);
                        console.log(`+[${this.bot.username}] - Activated entity:`);
                    } else {
                        console.log(`+[${this.bot.username}] - No entity found within the specified distance.`);
                    }
                }, 500);
            }, 50 * this.bot.time.tick);
        } catch (error) {
            console.error("+ Error in lookAtAndActivateEntity:", error.message);
        }
    }

    logCurrentPosition() {
        const currentPosition = this.bot.entity.position;
        console.log('Current Position:', {
            x: currentPosition.x.toFixed(0),
            y: currentPosition.y.toFixed(0),
            z: currentPosition.z.toFixed(0)
        });
    }



    findSwordInInventoryAndHotBar() {
        // Search for a sword in the inventory and hot bar
        const sword = this.bot.inventory.slots.find((item) => item && item.name.includes('sword') && item.type === 'tool' && item.material === 'diamond');

        return sword;
    }

    checkHealthAndHunger() {


        const healthWarningThreshold = 15; // Send warning if health is below 15
        const healthDisconnectThreshold = 10; // Disconnect if health is below 10
        const hungerWarningThreshold = 15; // Send warning if hunger is below 15
        const hungerDisconnectThreshold = 10; // Disconnect if hunger is below 10

        const health = this.bot.health;
        const hunger = this.bot.food;

        if (health < healthWarningThreshold) {
            console.log(`${this.bot.username} 💓-⚠️ health is below ${healthWarningThreshold}. Sending warning...`);
            this.sendDiscordMessage(`(💓-⚠️) ${this.bot.username}'s health is low (${health}).`);
        }

        if (hunger < hungerWarningThreshold) {
            console.log(`${this.bot.username}(🍗-⚠️) hunger is below ${hungerWarningThreshold}. Sending warning...`);
            this.sendDiscordMessage(`(🍗-⚠️) ${this.bot.username}'s hunger is low (${hunger}).`);
        }

        if (health < healthDisconnectThreshold || hunger < hungerDisconnectThreshold) {
            console.log(` ${this.bot.username}__health or hunger is below the disconnect threshold. Disconnecting...`);

            // Clear all timeouts and intervals before disconnecting
            this.timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
            this.timeoutIds = [];

            this.intervalIds.forEach((intervalId) => clearInterval(intervalId));
            this.intervalIds = [];

            // Send disconnect message
            this.sendDiscordMessage(`💀 (🍗) [${this.bot.username}] critical hunger ${hungerWarningThreshold}`);

            // Disconnect the bot
            // this.bot.end();
        }
    }
    clearTimeoutsAndIntervals() {
        // Implement logic to clear timeouts and intervals
        // For example, if you have stored interval IDs in an array, you can clear them like this:
        for (const intervalId of this.intervalIds) {
            clearInterval(intervalId);
        }
        this.intervalIds = []; // Clear the array of interval IDs
    }
    checkProximity(targetCoordinates, radius, callback) {
        const botPosition = this.bot.entity.position;
        log.console(bot.entity.name + ": position > x" + botPosition.x.toString() + ", z" + botPosition.y.toString());
        const botXZ = { x: botPosition.x, z: botPosition.z };
        const distance = Math.sqrt(
            Math.pow(botXZ.x - targetCoordinates.x, 2) + Math.pow(botXZ.z - targetCoordinates.z, 2)
        );

        if (distance <= radius) {
            callback();
        }
    }
    getCurrentTime() {
        const currentTime = new Date();
        const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });
        return formattedTime;
    }
    initBot() {
        console.log(`Starting init 🍿...`);
        this.bot = mineflayer.createBot(this.botConfig);
        this.bot.loadPlugin(pathfinder);
        try{

            this.bot.on('login', () => {
                let botSocket = this.bot._client.socket;
                console.log(`[${this.bot.username}] - Logged in to ${botSocket.server ? botSocket.server : botSocket._host}  `);
            });
    
            this.bot.on('spawn', async () => {
                console.log(`[${this.bot.username}]  - Spawned in`);
    
         
    
                await this.bot.waitForTicks(120);
                this.bot.chat("/login poocha");
    
                await this.bot.waitForTicks(60);
                this.bot.once('message', (message) => {
                    if (!message.toString().includes('left the game') && !message.toString().includes('joined the game') && !message.toString().includes('was killed by')) {
                        console.log(`[${this.bot.username}][Chat] ${message.toString()}`);
                    }
                });
                console.log(`[${this.bot.username}] -🔑-  Password entered `);
                this.handleAfterLogin();
                // const restartIntervel = setInterval(() => {
                this.shouldCheckActivity = true;
                this.checkActivity();
                // this.bot.quit();
                // }, 100000);  
                // console.log(`[${this.bot.username}}] Attempting to reconnect in (in class)${100000/1000} sec`)
                // this.intervalIds.push(restartIntervel);
    
                this.bot.on('death', () => {
                    console.log(`Bot died. Disconnecting...`);
    
                    // Clear all timeouts and intervals before disconnecting
                    this.clearTimeoutsAndIntervals();
    
                    // Send disconnect message
                    this.sendDiscordMessage(`(💀) ${this.bot.username} died. Terminating the process...`);
    
                    // Disconnect the bot
                    // process.exit();
                });
    
            });
        }catch(e){
            console.error(`[${this.bot.username}] - Error creating bot:`, error.message);
            this.bot.quit();
        }

    }
}
const botNames = [
    '__Lnzz__', 'SILENT'];
const baseBotConfig = {
    host: '139.99.124.74',
    port: '25576',
    // username: "SILENT",
    version: '1.20.1',
    hideError: false
};
const delayBetweenBotCreation = 2000;
const botControllers = [];
const reconnectDelay = 15000;
const mobsToAttack = ['Ghast', 'Zombified Piglin'];
const farmCoordinates = {
    'Gast Farm Kill Chamber': { x: -99579, y: 128, z: -301193 },
    'Gast Farm Afk Chamber': { x: -12448, y: 175, z: -37649 }
};
async function createBotController(name) {
    const botConfig = {
        ...baseBotConfig,
        username: name
    };

    const botController = new BotController(botConfig, reconnectDelay, farmCoordinates, mobsToAttack);
    botControllers.push(botController);

    // Introduce a delay before creating the next bot controller
    await new Promise(resolve => setTimeout(resolve, delayBetweenBotCreation));
}

let shouldContinue = true;

async function createBotControllers() {
    const startTime = Date.now();

    for (const name of botNames) {
        if (!shouldContinue) {
            console.log("Stopping the bot creation process.");
            return;
        }

        try {
            await createBotController(name);
        } catch (error) {
            console.error(`Error creating bot '${name}':`, error.message);
            // Restart bot creation after a delay
            console.log(`Restarting bot creation for '${name}' within 10 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
            await createBotController(name);
        }
    }

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime > 15 * 60 * 1000) {
        console.log(`Bot creation process exceeded 15 minutes. Stopping the process.`);
        shouldContinue = false;
        return;
    }

    // Schedule the next execution of the function
    // setTimeout(() => {
    //     console.log(`] Attempting to reconnect in (out side class)${15 * 60 * 1000} min`)
    //     BotController.bot.quit();
    //     // createBotControllers();
    // }, 15 * 60 * 1000); // You can adjust the delay as needed
}


createBotControllers();