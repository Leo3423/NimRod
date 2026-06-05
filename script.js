let coins = 0;
let damage = 1;
let manualClicksPerSecond = 0;
let autoClicksPerSecond = 0;
let currentBossHp = 5;
let initialBossHp = 5;
let coinsPerKill = 15;
let killRewardIncrease = 5;
let monsterIndex = 0;
let currentSkin = 'default';

let autoClickerInterval = null;
let autoClickerLevel = 0;
let autoClickerBaseRate = 1000;
let autoClickerRate = autoClickerBaseRate;
let autoClickerDamageMultiplier = 0.5;

let criticalHitsEnabled = false;
let criticalHitChance = 0.1;
let criticalHitMultiplier = 2.5;
let treasureHunterMultiplier = 1;

let totalClicks = 0;
let totalKills = 0;
let totalCoinsEarned = 0;

const monsterFilenames = ["monster.png"];
for (let i = 2; i <= 48; i++) {
    monsterFilenames.push(`monster${i}.png`);
}

const backgroundFilenames = [
    "background.jpg", "background2.jpg", "background3.jpg",
    "background4.jpg", "background5.jpg"
];

const arrowFilenames = [
    "arrow.png", "arrow2.png", "arrow3.png",
    "arrow4.png", "arrow5.png"
];

const coinsDisplay = document.getElementById("coins");
const damageDisplay = document.getElementById("damage-per-click");
const cpsDisplay = document.getElementById("clicks-per-second");
const bossHpDisplay = document.getElementById("boss-hp");
const attackBtn = document.getElementById("attack-btn");
const healthBarFill = document.getElementById("health-bar-fill");
const enemy = document.getElementById("enemy");
const character = document.getElementById("character");
const shopToggleButton = document.getElementById("shop-toggle-button");
const shopContainerWrapper = document.getElementById("shop-container-wrapper");
const customizationToggleButton = document.getElementById("customization-toggle-button");
const customizationContainerWrapper = document.getElementById("customization-container-wrapper");
const statsAchievementsToggleButton = document.getElementById("stats-achievements-toggle-button");
const statsAchievementsContainerWrapper = document.getElementById("stats-achievements-container-wrapper");
const saveButton = document.getElementById("save-button");

const body = document.body;
const backgroundOverlay = document.getElementById("background-overlay");
const arrow = document.getElementById("arrow");
const arrowOverlay = document.getElementById("arrow-overlay");

const statTotalClicks = document.getElementById("stat-total-clicks");
const statTotalKills = document.getElementById("stat-total-kills");
const statTotalCoins = document.getElementById("stat-total-coins");
const statCritChance = document.getElementById("stat-crit-chance");
const achievementsList = document.getElementById("achievements-list");

const tutorialOverlay = document.getElementById("tutorial-overlay");
const tutorialPopup = document.getElementById("tutorial-popup");
const tutorialText = document.getElementById("tutorial-text");
const tutorialNextBtn = document.getElementById("tutorial-next-btn");

const achievementUnlockedOverlay = document.getElementById("achievement-unlocked-overlay");
const achievementUnlockedText = document.getElementById("achievement-unlocked-text");
const achievementCloseBtn = document.getElementById("achievement-close-btn");


let backgroundMusic;
let musicStarted = false;

function playBackgroundMusic() {
    if (!backgroundMusic) {
        backgroundMusic = new Audio('audio/bgmusic.mp3');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.5;
    }
    if (!musicStarted) {
        backgroundMusic.play()
            .then(() => { musicStarted = true; console.log("Background music started."); })
            .catch(error => { console.warn("Music autoplay blocked. Needs user interaction."); });
    }
}
function playTapSound() {
    const tapSound = new Audio('audio/taptap.mp3');
    tapSound.volume = 0.3;
    tapSound.play();
}
function playGrowlSound() {
    const growlSound = new Audio('audio/growl.mp3');
    growlSound.volume = 0.4;
    growlSound.play();
}
function playUpgradeSound() {
    const upgradeSound = new Audio('audio/upgrade.mp3');
    upgradeSound.volume = 0.6;
    upgradeSound.play();
}
function playAchievementSound() {
    const achievementSound = new Audio('audio/achievement.mp3');
    achievementSound.volume = 0.7;
    achievementSound.play();
}

function updateBackground() {
    let backgroundIndex = 0;
    if (monsterIndex >= 42) backgroundIndex = 4;
    else if (monsterIndex >= 37) backgroundIndex = 3;
    else if (monsterIndex >= 29) backgroundIndex = 2;
    else if (monsterIndex >= 14) backgroundIndex = 1;

    const newBackground = `url('image/${backgroundFilenames[backgroundIndex]}')`;
    backgroundOverlay.style.backgroundImage = newBackground;
    backgroundOverlay.style.opacity = 1;
    backgroundOverlay.style.filter = 'blur(5px)';

    setTimeout(() => {
        body.style.backgroundImage = newBackground;
        backgroundOverlay.style.opacity = 0;
        backgroundOverlay.style.filter = 'blur(0px)';
    }, 700);
}

function updateArrow() {
    let arrowIndex = 0;
    if (monsterIndex >= 42) arrowIndex = 4;
    else if (monsterIndex >= 37) arrowIndex = 3;
    else if (monsterIndex >= 29) arrowIndex = 2;
    else if (monsterIndex >= 14) arrowIndex = 1;

    const newArrowSrc = `image/${arrowFilenames[arrowIndex]}`;
    arrow.src = newArrowSrc;
    arrowOverlay.src = newArrowSrc;
}


function updateAllButtonStates() {
    document.querySelectorAll(".shop-btn").forEach(btn => updateShopButton(btn, btn.id));
    document.querySelectorAll(".customization-btn.skin-btn").forEach(btn => updateSkinButton(btn, btn.dataset.skin));
}

function updateStatsPanel() {
    statTotalClicks.innerText = totalClicks;
    statTotalKills.innerText = totalKills;
    statTotalCoins.innerText = totalCoinsEarned;
    statCritChance.innerText = criticalHitsEnabled ? (criticalHitChance * 100).toFixed(0) + '%' : '0%';
}

function updateUI() {
    coinsDisplay.innerText = coins;
    damageDisplay.innerText = damage;
    cpsDisplay.innerText = (manualClicksPerSecond + autoClicksPerSecond).toFixed(1);
    bossHpDisplay.innerText = Math.max(0, Math.round(currentBossHp));
    const healthPercentage = initialBossHp > 0 ? (Math.max(0, currentBossHp) / initialBossHp) * 100 : 0;
    healthBarFill.style.width = healthPercentage + "%";

    updateAllButtonStates();
    updateStatsPanel();
}

let clickTimestamps = [];
function calculateManualCPS() {
    const now = Date.now();
    clickTimestamps = clickTimestamps.filter(timestamp => now - timestamp < 1000);
    manualClicksPerSecond = clickTimestamps.length;
}

function handleMonsterDefeat() {
    playGrowlSound();

    const coinsEarnedThisKill = Math.floor(coinsPerKill * treasureHunterMultiplier);
    coins += coinsEarnedThisKill;
    totalCoinsEarned += coinsEarnedThisKill;
    totalKills++;
    coinsPerKill += killRewardIncrease;

    monsterIndex++;
    if (monsterIndex >= monsterFilenames.length) {
        monsterIndex = 0;
    }

    initialBossHp = Math.floor(5 * Math.pow(1.15, monsterIndex));
    currentBossHp = initialBossHp;

    enemy.src = `image/${monsterFilenames[monsterIndex]}`;
    updateBackground();
    updateArrow();
    checkAchievements();
    updateUI();
}

function dealDamage(amount, isAutoClick = false) {
    if (currentBossHp <= 0) return;

    let finalDamage = amount;

    if (!isAutoClick) {
        totalClicks++;
        if (criticalHitsEnabled && Math.random() < criticalHitChance) {
            finalDamage = Math.floor(finalDamage * criticalHitMultiplier);
        }
    }


    currentBossHp -= finalDamage;

    if (!isAutoClick) {
         shoot_arrow();
         playTapSound();
         const now = Date.now();
         clickTimestamps.push(now);
    }

    checkAchievements();

    if (currentBossHp <= 0) {
        setTimeout(handleMonsterDefeat, 50);
    } else {
        updateUI();
    }
}

function shoot_arrow() {
    character.classList.remove('shoot-animation');
    void character.offsetWidth;
    character.classList.add('shoot-animation');

    shootArrowProjectile();

    enemy.style.filter = "brightness(0.5) saturate(2) hue-rotate(0deg)";
    enemy.style.animation = "shake 0.2s";

    setTimeout(() => {
        enemy.style.filter = "";
        enemy.style.animation = "";
    }, 200);

     setTimeout(() => {
       character.classList.remove('shoot-animation');
     }, 200);
}

function shootArrowProjectile() {
    let arrowElement = document.getElementById("arrow-overlay");

    arrowElement.style.display = "block";
    arrowElement.style.opacity = 1;
    arrowElement.style.filter = 'blur(0px)';
    arrowElement.style.transform = `translate(-50%, 0%)`;

    arrowElement.animate([
        { opacity: 1, transform: `translate(-50%, 0%)`, filter: 'blur(0px)' },
        { opacity: 0, transform: `translate(-50%, -250%)`, filter: 'blur(3px)' }
    ], {
        duration: 300,
        easing: 'ease-out'
    });

    setTimeout(() => {
        arrowElement.style.display = "none";
        arrowElement.style.opacity = 0;
    }, 300);
}

attackBtn.addEventListener("click", () => {
    if (!musicStarted) playBackgroundMusic();
    dealDamage(damage);
});

enemy.addEventListener("click", () => {
     if (!musicStarted) playBackgroundMusic();
     dealDamage(damage);
     enemy.style.transform = 'scale(1.1)';
     setTimeout(() => enemy.style.transform = 'scale(1)', 100);
});

shopToggleButton.addEventListener("click", () => {
    const isHidden = shopContainerWrapper.style.display === "none";
    shopContainerWrapper.style.display = isHidden ? "flex" : "none";
    shopToggleButton.innerText = isHidden ? "Shop" : "Close Shop";
    if(isHidden) statsAchievementsContainerWrapper.style.display = 'none'; statsAchievementsToggleButton.innerText = "Stats";
    if(isHidden) customizationContainerWrapper.style.display = 'none'; customizationToggleButton.innerText = "Skins";
});

customizationToggleButton.addEventListener("click", () => {
    const isHidden = customizationContainerWrapper.style.display === "none";
    customizationContainerWrapper.style.display = isHidden ? "flex" : "none";
    customizationToggleButton.innerText = isHidden ? "Skins" : "Close Skins";
     if(isHidden) shopContainerWrapper.style.display = 'none'; shopToggleButton.innerText = "Shop";
     if(isHidden) statsAchievementsContainerWrapper.style.display = 'none'; statsAchievementsToggleButton.innerText = "Stats";
});

statsAchievementsToggleButton.addEventListener("click", () => {
    const isHidden = statsAchievementsContainerWrapper.style.display === "none";
    statsAchievementsContainerWrapper.style.display = isHidden ? "flex" : "none";
    statsAchievementsToggleButton.innerText = isHidden ? "Stats" : "Close Stats";
     if(isHidden) shopContainerWrapper.style.display = 'none'; shopToggleButton.innerText = "Shop";
     if(isHidden) customizationContainerWrapper.style.display = 'none'; customizationToggleButton.innerText = "Skins";
});

const upgrades = {
    "Upgrade-tap": { baseCost: 20, costMultiplier: 1.5, level: 0, effect: increaseDamage },
    "triple-strike": { baseCost: 50, level: 0, maxLevel: 1, effect: tripleDamage },
    "adrenaline-rush": { baseCost: 100, costMultiplier: 1.8, level: 0, effect: increaseAttackSpeed },
    "critical-hits": { baseCost: 150, level: 0, maxLevel: 1, effect: enableCriticalHits },
    "auto-clicker": { baseCost: 200, costMultiplier: 2.0, level: 0, effect: upgradeAutoClicker },
    "turbo-clicker": { baseCost: 300, costMultiplier: 2.2, level: 0, effect: increaseAutoClickSpeed },
    "summoned-ally": { baseCost: 500, costMultiplier: 2.5, level: 0, effect: summonAlly },
    "treasure-hunter": { baseCost: 250, level: 0, maxLevel: 1, effect: increaseCoinDrops },
    "lucky-strike": { baseCost: 500, level: 0, maxLevel: 1, effect: applyLuckyStrike },
    "jackpot": { baseCost: 500, level: 0, maxLevel: 1, effect: enableJackpot },
    "weak-spot": { baseCost: 450, costMultiplier: 1.7, level: 0, effect: enableWeakSpot },
    "firepower": { baseCost: 800, costMultiplier: 1.9, level: 0, effect: enableBurnEffect },
    "armor-piercer": { baseCost: 600, costMultiplier: 2.1, level: 0, effect: ignoreEnemyArmor },
    "explosive-hits": { baseCost: 700, costMultiplier: 2.0, level: 0, effect: enableExplosions },
};

function getUpgradeCost(id) {
    const upgrade = upgrades[id];
    if (!upgrade) return Infinity;
    if (upgrade.maxLevel === 1 && upgrade.level >= 1) return Infinity;
    if (upgrade.maxLevel === 1) return upgrade.baseCost;
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
}

function updateShopButton(button, id) {
    const upgrade = upgrades[id];
    if (!upgrade || !button) return;
    const currentCost = getUpgradeCost(id);
    const baseTextMatch = button.textContent.match(/^([^\(]+)/);
    const baseText = baseTextMatch ? baseTextMatch[1].trim() : button.id;


    if (upgrade.maxLevel === 1 && upgrade.level >= 1) {
        button.innerHTML = `${baseText} (Purchased)`;
        button.disabled = true;
        button.style.backgroundColor = '#888';
    } else {
        button.innerHTML = `${baseText} (${currentCost}) ${upgrade.level > 0 ? ` Lvl: ${upgrade.level}` : ''}`;
        button.disabled = coins < currentCost;
        button.style.backgroundColor = coins < currentCost ? '#faa' : '#ffcc00';
    }
}

document.querySelectorAll(".shop-btn").forEach((button) => {
    const id = button.id;
    const upgrade = upgrades[id];
    if (!upgrade) {
        console.warn(`No upgrade logic found for button ID: ${id}`);
        button.disabled = true;
        button.innerText += " (N/A)";
        return;
    }
    button.addEventListener("click", () => {
        const cost = getUpgradeCost(id);
        if (coins >= cost && (upgrade.maxLevel === undefined || upgrade.level < upgrade.maxLevel)) {
            coins -= cost;
            upgrade.level++;
            upgrade.effect(id);
            playUpgradeSound();
            checkAchievements();
            updateUI();
        } else {
            if (upgrade.maxLevel && upgrade.level >= upgrade.maxLevel) {
                 alert("Already purchased the maximum level for this upgrade.");
            } else if (coins < cost) {
                 alert("Not enough coins!");
            }
        }
    });
});


function increaseDamage() {
    damage += 1 + Math.floor(upgrades["Upgrade-tap"].level / 5);
    updateUI();
}

function tripleDamage() {
    damage *= 3;
    updateUI();
}

function enableCriticalHits() {
    criticalHitsEnabled = true;
    updateUI();
}

function upgradeAutoClicker(id) {
    const upgrade = upgrades[id];
    autoClickerLevel = upgrade.level;

    if (autoClickerInterval) {
        clearInterval(autoClickerInterval);
    }

    if (autoClickerLevel > 0) {
         const turboUpgrade = upgrades["turbo-clicker"];
         const rateReductionFactor = Math.pow(0.90, turboUpgrade.level);
         autoClickerRate = Math.max(50, autoClickerBaseRate * rateReductionFactor);

        autoClickerInterval = setInterval(() => {
            const autoDamage = Math.floor(damage * autoClickerDamageMultiplier);
            if (autoDamage > 0) {
                 dealDamage(autoDamage, true);
            }
        }, autoClickerRate);

        autoClicksPerSecond = 1000 / autoClickerRate;
    } else {
        if (autoClickerInterval) clearInterval(autoClickerInterval);
        autoClicksPerSecond = 0;
    }
    updateUI();
}


function increaseAutoClickSpeed(id) {
    if (autoClickerLevel > 0) {
         upgradeAutoClicker("auto-clicker");
    } else {
         const upgrade = upgrades[id];
         if (upgrade.level > 0) {
            console.warn("Turbo clicker leveled without base auto-clicker active!");
         }
    }
     updateUI();
}


function increaseCoinDrops() {
    treasureHunterMultiplier = 1.5;
}

function applyLuckyStrike() {
    if (currentBossHp > 0) {
        const damageDealt = Math.ceil(currentBossHp * 0.5);
        currentBossHp -= damageDealt;
         enemy.style.filter = "brightness(1.5) contrast(1.5) drop-shadow(0 0 10px yellow)";
         setTimeout(() => { enemy.style.filter = ""; }, 300);

        checkAchievements();

        if (currentBossHp <= 0) {
            handleMonsterDefeat();
        } else {
            updateUI();
        }
    }
}

function enableJackpot() {
    const jackpotAmount = coinsPerKill * 10;
    coins += jackpotAmount;
    totalCoinsEarned += jackpotAmount;
    coinsDisplay.style.transform = 'scale(1.2)';
    coinsDisplay.style.color = 'gold';
    setTimeout(() => {
        coinsDisplay.style.transform = 'scale(1)';
        coinsDisplay.style.color = 'white';
    }, 500);
    checkAchievements();
    updateUI();
}

function increaseAttackSpeed() { console.warn("Upgrade 'Adrenaline Rush' effect not implemented."); }
function summonAlly() { console.warn("Upgrade 'Summoned Ally' effect not implemented."); }
function enableWeakSpot() { console.warn("Upgrade 'Weak Spot' effect not implemented."); }
function enableBurnEffect() { console.warn("Upgrade 'Firepower' effect not implemented."); }
function ignoreEnemyArmor() { console.warn("Upgrade 'Armor Piercer' effect not implemented."); }
function enableExplosions() { console.warn("Upgrade 'Explosive Hits' effect not implemented."); }


const skins = {
    "default": { cost: 0, idleImage: "image/user_idle.png", shootImage: "image/user_shoot.png", purchased: true },
    "blue": { cost: 150, idleImage: "image/user_idle_blue.png", shootImage: "image/user_shoot_blue.png", purchased: false },
    "yellow": { cost: 300, idleImage: "image/user_idle_yellow.png", shootImage: "image/user_shoot_yellow.png", purchased: false }
};

function applySkin(skinName) {
    const skin = skins[skinName];
    if (!skin) return;

    currentSkin = skinName;
    character.style.backgroundImage = `url('${skin.idleImage}')`;
}


function updateSkinButton(button, skinName) {
     const skin = skins[skinName];
     if (!skin || !button) return;
     const baseTextMatch = button.textContent.match(/^([^\(]+)/);
     const baseText = baseTextMatch ? baseTextMatch[1].trim() : `Skin ${skinName}`;


     if (skin.purchased) {
         if (currentSkin === skinName) {
             button.innerText = "Equipped";
             button.disabled = true;
             button.style.backgroundColor = '#8f8';
         } else {
             button.innerText = "Equip";
             button.disabled = false;
             button.style.backgroundColor = '#ffcc00';
         }
     } else {
         button.innerText = `${baseText} (${skin.cost})`;
         button.disabled = coins < skin.cost;
         button.style.backgroundColor = coins < skin.cost ? '#faa' : '#ffcc00';
     }
 }


document.querySelectorAll(".customization-btn.skin-btn").forEach(button => {
    const skinName = button.dataset.skin;
    if (!skins[skinName]) return;

    button.addEventListener("click", () => {
        const skin = skins[skinName];
        if (skin.purchased) {
            if (currentSkin !== skinName) {
                applySkin(skinName);
                playUpgradeSound();
                updateAllButtonStates();
            }
        } else {
            if (coins >= skin.cost) {
                coins -= skin.cost;
                skin.purchased = true;
                playUpgradeSound();
                checkAchievements();
                updateUI();
                 alert(`${skinName} skin purchased! Click "Equip" to use it.`);
            } else {
                alert("Not enough coins to buy this skin.");
            }
        }
    });
});


const achievements = {
    'first_click': { name: "Getting Started", desc: "Perform your first click.", condition: () => totalClicks >= 1, completed: false, reward: () => { coins += 5; totalCoinsEarned += 5;} },
    'first_kill': { name: "Monster Slayer", desc: "Defeat your first monster.", condition: () => totalKills >= 1, completed: false, reward: () => { coins += 10; totalCoinsEarned += 10;} },
    'ten_kills': { name: "Veteran Slayer", desc: "Defeat 10 monsters.", condition: () => totalKills >= 10, completed: false, reward: () => { coins += 50; totalCoinsEarned += 50;} },
    'hundred_clicks': { name: "Click Enthusiast", desc: "Click 100 times.", condition: () => totalClicks >= 100, completed: false, reward: () => { coins += 25; totalCoinsEarned += 25;} },
    'thousand_clicks': { name: "Click Master", desc: "Click 1000 times.", condition: () => totalClicks >= 1000, completed: false, reward: () => { coins += 100; totalCoinsEarned += 100;} },
    'first_upgrade': { name: "Upgrader", desc: "Buy your first upgrade.", condition: () => Object.values(upgrades).some(u => u.level > 0), completed: false, reward: () => { coins += 20; totalCoinsEarned += 20;} },
    'reach_100_coins': { name: "Coin Collector", desc: "Have 100 coins at once.", condition: () => coins >= 100, completed: false, reward: () => {} },
    'reach_1000_coins': { name: "Rich!", desc: "Have 1000 coins at once.", condition: () => coins >= 1000, completed: false, reward: () => { coins += 100; totalCoinsEarned += 100;} },
    'buy_auto_clicker': { name: "Automation", desc: "Buy the Auto Clicker.", condition: () => upgrades['auto-clicker'].level > 0, completed: false, reward: () => { coins += 50; totalCoinsEarned += 50;} },
    'buy_skin': { name: "Fashionista", desc: "Buy any skin.", condition: () => Object.values(skins).some(s => s.purchased && s.cost > 0), completed: false, reward: () => { coins += 30; totalCoinsEarned += 30;} }
};

function updateAchievementsList() {
    achievementsList.innerHTML = '';
    for (const id in achievements) {
        const ach = achievements[id];
        const li = document.createElement('li');
        li.id = `ach-${id}`;
        li.innerHTML = `<strong>${ach.name}</strong><span>${ach.desc}</span>`;
        if (ach.completed) {
            li.classList.add('completed');
        }
        achievementsList.appendChild(li);
    }
}

function notifyAchievementUnlocked(achievement) {
    achievementUnlockedText.innerText = achievement.name;
    achievementUnlockedOverlay.classList.add('visible');
    playAchievementSound();
}

function checkAchievements() {
    let achievementUnlocked = false;
    for (const id in achievements) {
        const ach = achievements[id];
        if (!ach.completed && ach.condition()) {
            ach.completed = true;
            if(ach.reward) ach.reward();
            notifyAchievementUnlocked(ach);
            achievementUnlocked = true;
        }
    }
    if (achievementUnlocked) {
        updateAchievementsList();
        updateUI();
    }
}

achievementCloseBtn.addEventListener('click', () => {
    achievementUnlockedOverlay.classList.remove('visible');
});


const tutorialSteps = [
    { title: "Welcome!", text: "Click the monster or the attack button below it to deal damage and earn coins!" },
    { title: "The Shop", text: "Use coins to buy upgrades in the Shop panel on the right. Click 'Shop' to open it." },
    { title: "Upgrades", text: "Buying upgrades increases your damage or gives other bonuses!" },
    { title: "Skins & Stats", text: "Check the left panel for Skins and detailed Stats. Keep clicking!" }
];
let currentTutorialStep = 0;

function showTutorialStep(index) {
    if (index >= tutorialSteps.length) {
        closeTutorial();
        return;
    }
    const step = tutorialSteps[index];
    document.getElementById('tutorial-title').innerText = step.title;
    tutorialText.innerText = step.text;
    tutorialOverlay.classList.add('visible');
}

function closeTutorial() {
    tutorialOverlay.classList.remove('visible');
    localStorage.setItem('tutorialComplete', 'true');
}

function startTutorial() {
    if (localStorage.getItem('tutorialComplete') !== 'true') {
        currentTutorialStep = 0;
        showTutorialStep(currentTutorialStep);
    }
}

tutorialNextBtn.addEventListener('click', () => {
    currentTutorialStep++;
    showTutorialStep(currentTutorialStep);
});


function saveGame() {
    const saveData = {
        coins: coins,
        damage: damage,
        currentBossHp: currentBossHp,
        initialBossHp: initialBossHp,
        coinsPerKill: coinsPerKill,
        monsterIndex: monsterIndex,
        currentSkin: currentSkin,
        autoClickerLevel: autoClickerLevel,
        criticalHitsEnabled: criticalHitsEnabled,
        treasureHunterMultiplier: treasureHunterMultiplier,
        totalClicks: totalClicks,
        totalKills: totalKills,
        totalCoinsEarned: totalCoinsEarned,
        upgrades: {},
        skins: {},
        achievements: {}
    };

    for (const id in upgrades) {
        saveData.upgrades[id] = { level: upgrades[id].level };
    }
    for (const id in skins) {
         saveData.skins[id] = { purchased: skins[id].purchased };
    }
    for (const id in achievements) {
         saveData.achievements[id] = { completed: achievements[id].completed };
    }


    try {
        localStorage.setItem('nimrodClickerSave', JSON.stringify(saveData));
        console.log("Game Saved!");
        saveButton.style.backgroundColor = '#2e7d32';
        setTimeout(() => { saveButton.style.backgroundColor = '#4CAF50'; }, 500);
    } catch (e) {
        console.error("Error saving game:", e);
        alert("Could not save game! Local storage might be full or disabled.");
    }
}

function loadGame() {
    const savedDataString = localStorage.getItem('nimrodClickerSave');
    if (!savedDataString) {
        return false;
    }

    try {
        const savedData = JSON.parse(savedDataString);

        coins = savedData.coins ?? 0;
        damage = savedData.damage ?? 1;
        currentBossHp = savedData.currentBossHp ?? 5;
        initialBossHp = savedData.initialBossHp ?? 5;
        coinsPerKill = savedData.coinsPerKill ?? 15;
        monsterIndex = savedData.monsterIndex ?? 0;
        currentSkin = savedData.currentSkin ?? 'default';
        autoClickerLevel = savedData.autoClickerLevel ?? 0;
        criticalHitsEnabled = savedData.criticalHitsEnabled ?? false;
        treasureHunterMultiplier = savedData.treasureHunterMultiplier ?? 1;
        totalClicks = savedData.totalClicks ?? 0;
        totalKills = savedData.totalKills ?? 0;
        totalCoinsEarned = savedData.totalCoinsEarned ?? 0;

        if (savedData.upgrades) {
            for (const id in savedData.upgrades) {
                if (upgrades[id]) {
                    upgrades[id].level = savedData.upgrades[id].level ?? 0;
                }
            }
        }
        if (savedData.skins) {
            for (const id in savedData.skins) {
                if (skins[id]) {
                    skins[id].purchased = savedData.skins[id].purchased ?? (skins[id].cost === 0);
                }
            }
        }
        if (savedData.achievements) {
            for (const id in savedData.achievements) {
                 if (achievements[id]) {
                    achievements[id].completed = savedData.achievements[id].completed ?? false;
                 }
            }
        }

        applySkin(currentSkin);
        if (autoClickerLevel > 0) {
            upgradeAutoClicker('auto-clicker');
        }
        enemy.src = `image/${monsterFilenames[monsterIndex]}`;
        updateBackground();
        updateArrow();
        updateAchievementsList();

        console.log("Game Loaded!");
        updateUI();
        return true;

    } catch (e) {
        console.error("Error loading game:", e);
        alert("Could not load save game! Data might be corrupted.");
        localStorage.removeItem('nimrodClickerSave');
        return false;
    }
}

document.body.addEventListener("click", () => {
    if (!musicStarted) playBackgroundMusic();
    dealDamage(damage);
});

saveButton.addEventListener('click', saveGame);

document.addEventListener("DOMContentLoaded", function () {
    const loaded = loadGame();

    if (!loaded) {
        updateBackground();
        updateArrow();
        applySkin('default');
         updateAchievementsList();
        updateUI();
        startTutorial();
    }

    playBackgroundMusic();

    setInterval(calculateManualCPS, 200);
    setInterval(updateUI, 250);
});