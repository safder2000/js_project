const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const axios = require('axios');

class BotController {
    constructor(botConfig, reconnectDelay, farmCoordinates, mobsToAttack) {
        this.botConfig = botConfig;
        this.reconnectDelay = reconnectDelay;
        this.farmCoordinates = farmCoordinates;
        this.mobsToAttack = mobsToAttack;

        // Setup bot connection
        this.bot = mineflayer.createBot(this.botConfig);
        this.bot.loadPlugin(pathfinder);

        this.bot.on('login', () => {
            let botSocket = this.bot._client.socket;
            console.log(`Logged in to ${botSocket.server ? botSocket.server : botSocket._host}`);
        });

        this.bot.on('spawn', async () => {
            console.log("Spawned in");
            await this.bot.waitForTicks(10);
            this.bot.chat("/login poocha");
            this.handleAfterLogin();
        });

        this.bot.on('end', (err) => {
            console.log(`Disconnected: ${err ? err : 'intentional disconnect'}`);
            this.sendDiscordMessage(`(🦵) ${this.bot.username} Disconnected`);
            setTimeout(() => this.initBot(), this.reconnectDelay);
        });

        this.bot.on('kicked', (reason) => {
            this.sendDiscordMessage(`(🦵) ...${this.bot.username} got kicked from the server - Reason > ${reason}`);
            console.log('Kicked for reason', reason);
            setTimeout(() => this.initBot(), this.reconnectDelay);
        });

        this.bot.on('error', (err) => {
            if (err.code === 'ECONNREFUSED') {
                console.log(`Failed to connect to ${err.address}:${err.port}`);
            } else {
                console.log(`Unhandled error: ${err}`);
            }
        });
    }

    handleAfterLogin() {
        const defaultMove = new Movements(this.bot);

        this.bot.on('chat', (username, message) => {
            // Your chat event logic here...
        });

        this.bot.once('message', (message) => {
            if (message.toString().includes('Successful login!')) {
                if (!message.toString().includes('left the game') && !message.toString().includes('joined the game') && !message.toString().includes('was killed by')) {
                    console.log(`[Chat] ${message.toString()}`);
                }

                this.npcTp();

            } else if (message.toString().includes('Unknown command. Type "/help" for help')) {
                const radius = 3.3;
                const targetCoordinates = this.bot.currentPosition;


                const farmStatus = this.isNearFarm(this.farmCoordinates);
                const dcMsg = `(🔑)...${this.bot.username} ready for duty, status > ${farmStatus.toString()}`;
                this.sendDiscordMessage(dcMsg);

                
                if (farmStatus.includes('At')) {
                    if (farmStatus.includes('Kill')) {
                        this.attackMobsInListIfNearby(this.mobsToAttack, radius);
                    } else if (farmStatus.includes('Afk')) {
                        this.antiAfk();
                    }
                }





                this.anarchyWork();
            }
        });
    }

    antiAfk() {
        const getRandomInt = (minSeconds, maxSeconds) => {
            const minMilliseconds = minSeconds * 1000;
            const maxMilliseconds = maxSeconds * 1000;
            return Math.floor(Math.random() * (maxMilliseconds - minMilliseconds + 1)) + minMilliseconds;
        };
    
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
            // 20% chance of jumping
            else {
                this.bot.setControlState('jump', true);
                setTimeout(() => this.bot.setControlState('jump', false), 500);
            }
    
            // Schedule the next random action
            setTimeout(randomizeActions, getRandomInt(2, 6));
        };
    
        // Start the anti-AFK loop
        randomizeActions();
    }

    sendDiscordMessage(content) {
        const webhookUrl = 'https://discord.com/api/webhooks/1188774069944975411/UmOS6b9lt_qsHgFJxUv2uCd48l8NssyEoh1GufLWHlVslm8pvMiMaHS2k6EMMhbhAzJg';
    
        try {
            axios.post(webhookUrl, { content: content })
                .then(response => {
                    console.log('Message sent successfully:', response.data);
                })
                .catch(error => {
                    console.error('Error sending message:', error.message);
                });
        } catch (error) {
            console.error('An unexpected error occurred:', error.message);
        }
    }
    
    isNearFarm(farmCoordinates) {
        const proximityRadius = 2;
        const nearProximityRadius = 10;
    
        // Use an arrow function to bind 'this'
        const checkProximity = (coordinates, radius) => {
            const botPosition = this.bot.entity.position;
            const botXZ = { x: botPosition.x, z: botPosition.z };
            const distance = Math.sqrt(
                Math.pow(botXZ.x - coordinates.x, 3) + Math.pow(botXZ.z - coordinates.z, 3)
            );
            return distance <= radius;
        };
    
        for (const [farmName, coordinates] of Object.entries(farmCoordinates)) {
            if (checkProximity(coordinates, proximityRadius)) {
                return `At ${farmName}`;
            }
    
            if (checkProximity(coordinates, nearProximityRadius)) {
                return `Near ${farmName}`;
            }
        }
    
        return 'Not near any farm';
    }
    

    npcTp() {
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
                        console.log("+ Entity found within the specified distance.");
                        this.bot.activateEntity(targetEntity);
                        console.log("+ Activated entity:");
                    } else {
                        console.log("+ No entity found within the specified distance.");
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

    attackMobsInListIfNearby(mobsToAttack, proximityRadius) {
        const isMobInList = (entity) => mobsToAttack.includes(entity.type);
    
        const nearbyMobs = this.bot.nearestEntity((entity) => isMobInList(entity) && this.isMobInRange(entity, this.bot.entity.position, proximityRadius));
    
        // Check if the bot is holding a sword
        const hasSword = this.bot.inventory.slots.some((item) => item && item.name.includes('sword') && item.type === 'tool' && item.material === 'diamond');
    
        if (!hasSword) {
            // Search for a sword in the inventory and hot bar
            const sword = this.findSwordInInventory();
            
            if (sword) {
                // Equip the sword
                this.bot.equip(sword, 'hand');
            } else {
                // Log a message to Discord about not finding a sword
                this.sendDiscordMessage(`⚠️ ${this.bot.name} cannot find a sword`);
                return; // Stop further processing if no sword is found
            }
        }
    
        if (nearbyMobs) {
            setTimeout(() => {
                this.bot.attack(nearbyMobs);
            }, 1000);
        } else {
            // No nearby mobs found, wait for 2 seconds and then search again
            setTimeout(() => {
                this.attackMobsInListIfNearby(mobsToAttack, proximityRadius);
            }, 2000);
        }
    }
    
    
    findSwordInInventory() {
        // Search for a sword in the inventory and hot bar
        const sword = this.bot.inventory.slots.find((item) => item && item.name.includes('sword') && item.type === 'tool' && item.material === 'diamond');
        
        return sword;
    }
    
    

    checkProximity(targetCoordinates, radius, callback) {
        const botPosition = this.bot.entity.position;
        const botXZ = { x: botPosition.x, z: botPosition.z };
        const distance = Math.sqrt(
            Math.pow(botXZ.x - targetCoordinates.x, 2) + Math.pow(botXZ.z - targetCoordinates.z, 2)
        );

        if (distance <= radius) {
            callback();
        }
    }

    initBot() {
        this.bot = mineflayer.createBot(this.botConfig);
        this.bot.loadPlugin(pathfinder);

        this.bot.on('login', () => {
            let botSocket = this.bot._client.socket;
            console.log(`Logged in to ${botSocket.server ? botSocket.server : botSocket._host}`);
        });

        this.bot.on('spawn', async () => {
            console.log("Spawned in");
            await this.bot.waitForTicks(10);
            this.bot.chat("/login poocha");
            this.handleAfterLogin();
        });
    }
}

const botConfig = {
    host: '139.99.124.74',
    port: '25576',
    username: "SILENT",
    version: '1.20.1',
    hideError: false
};

const reconnectDelay = 10000;
const mobsToAttack = ['ghast', 'zombified_piglin'];
const farmCoordinates = {
    'Gast Farm Kill Chamber': { x: -99579, y: 128, z: -301193 },
    'Gast Farm Afk Chamber': { x: -12448, y: 175, z: -37649 }
};



const botController = new BotController(botConfig, reconnectDelay, farmCoordinates, mobsToAttack);
