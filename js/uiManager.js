import { soundManager } from "./soundManager.js";
import { gatherController } from "./utils/gatherController.js";

export class UIManager {
  constructor(
    game,
    enemyStatsDiv,
    towerSelectPanel,
    debugTable,
    loseMessageDiv,
    winMessageDiv
  ) {
    this.game = game;
    this.enemyStatsDiv = enemyStatsDiv;
    this.towerSelectPanel = towerSelectPanel;
    this.debugTable = debugTable;
    this.loseMessageDiv = loseMessageDiv;
    this.winMessageDiv = winMessageDiv;

    this.selectedHero = null;
    this.selectedTower = null;

    // Build / Upgrade dialog
    this.buildDialog = document.getElementById("towerBuildDialog");
    this.buildDialogClose = document.getElementById("towerBuildClose");
    this.buildOptionsDiv = document.getElementById("towerBuildOptions");

    this.upgradeDialog = document.getElementById("towerUpgradeDialog");
    this.upgradeDialogClose = document.getElementById("towerUpgradeClose");
    this.upgradeTitle = document.getElementById("towerUpgradeTitle");
    this.upgradeBtn = document.getElementById("towerUpgradeBtn");

    this.sellBtn = document.getElementById("towerSellBtn");
    this.gatherBtn = document.getElementById("towerGatherBtn");

    // Are we picking a gather point?
    this.isSettingRallyPoint = false;
    this.rallyTower = null;

    if (this.buildDialogClose) {
      this.buildDialogClose.addEventListener("click", () => {
        this.buildDialog.style.display = "none";
      });
    }
    if (this.upgradeDialogClose) {
      this.upgradeDialogClose.addEventListener("click", () => {
        this.upgradeDialog.style.display = "none";
      });
    }
    if (this.sellBtn) {
      this.sellBtn.onclick = () => {
        if (!this.selectedTower) return;
        this.game.towerManager.sellTower(this.selectedTower);
        this.upgradeDialog.style.display = "none";
      };
    }
    if (this.gatherBtn) {
      this.gatherBtn.onclick = () => {
        if (!this.selectedTower) return;
        // For a melee tower => "set gather point" 
        this.isSettingRallyPoint = true;
        this.rallyTower = this.selectedTower;
        this.upgradeDialog.style.display = "none";
      };
    }

    // canvas events
    if (this.game.canvas) {
      this.game.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
      this.game.canvas.addEventListener("click", (e) => this.handleCanvasClick(e));
    }
  }

  update() {
    if (this.buildDialog && this.buildDialog.style.display==="block") {
      const towerDefs = this.game.towerManager.getTowerData();
      const buttons = this.buildOptionsDiv.querySelectorAll("button[data-tower-type]");
      buttons.forEach(btn=>{
        const type= btn.getAttribute("data-tower-type");
        const def= towerDefs.find(d=>d.name===type);
        if(!def)return;
        const cost1= Array.isArray(def.cost)? (def.cost[0]||9999): (def.cost||9999);
        btn.disabled=(this.game.gold<cost1);
      });
    }
    if (this.upgradeDialog && this.upgradeDialog.style.display==="block" && this.selectedTower){
      const tower=this.selectedTower;
      const def=this.game.towerManager.findTowerConfigByName(tower.type);
      if(def){
        const nextLvl=tower.level+1;
        if(nextLvl>(def.cost?.length||1)){
          this.upgradeBtn.textContent="maxed";
          this.upgradeBtn.disabled=true;
        } else {
          const nextCost=def.cost[nextLvl-1]||9999;
          this.upgradeBtn.textContent=`Upgrade $${nextCost}`;
          this.upgradeBtn.disabled=(this.game.gold<nextCost);
        }
      }
    }
  }

  handleMouseMove(e) {
    const rect = this.game.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (this.isSettingRallyPoint) {
      // Use a special cursor (like crosshair)
      this.game.canvas.style.cursor="crosshair";
      return;
    }

    // If hero hovered => pointer
    const hoveredHero=this.game.heroManager?.getHeroAt(mx,my);
    if(hoveredHero){
      this.game.canvas.style.cursor="pointer";
      return;
    }

    // Tower => pointer
    const tower= this.getTowerAt(mx,my);
    if(tower){
      this.game.canvas.style.cursor="pointer";
      return;
    }

    // Spot => pointer
    const spot=this.getTowerSpotAt(mx,my);
    if(spot){
      this.game.canvas.style.cursor="pointer";
      return;
    }

    this.game.canvas.style.cursor="default";
  }

  handleCanvasClick(e) {
    // Ensure canvas click coordinates are properly calculated
    const rect = this.game.canvas.getBoundingClientRect();
    // Make sure mx and my are numbers by using explicit conversion
    const mx = parseFloat(e.clientX - rect.left);
    const my = parseFloat(e.clientY - rect.top);
    
    // Debug the click coordinates
    console.log("Canvas click at:", {
      clientX: e.clientX,
      clientY: e.clientY,
      canvasX: mx,
      canvasY: my,
      rect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      }
    });

    // If setting a rally point for tower
    if(this.isSettingRallyPoint && this.rallyTower){
      if(this.rallyTower.unitGroup){
        console.log("Setting rally point for barracks tower unit group to", mx, my);
        this.rallyTower.unitGroup.setRallyPoint(mx,my);
        
        // Visual feedback - add target indicator to the soldier units
        if (this.rallyTower.unitGroup.units) {
          this.rallyTower.unitGroup.units.forEach(soldier => {
            // Calculate soldier-specific target position based on their offset
            const i = soldier.indexInGroup;
            const offX = this.rallyTower.unitGroup.offsets[i];
            
            // Add target indicator properties
            soldier.targetX = mx + offX;
            soldier.targetY = my;
            soldier.showTarget = true;
          });
        }
      }
      this.isSettingRallyPoint=false;
      this.rallyTower=null;
      return;
    }

    // If hero selected, click empty => set gather for hero
    if(this.selectedHero){
      // Safeguard against NaN values in click coordinates
      if (isNaN(mx) || isNaN(my)) {
        console.error("Invalid click coordinates:", mx, my);
        return;
      }
      
      const t=this.getTowerAt(mx,my);
      const h=this.game.heroManager.getHeroAt(mx,my);
      if(!t && !h){
        console.log("Setting gather point for hero", this.selectedHero.name, "to", mx, my);
        
        // Set gather point directly on the hero
        this.selectedHero.gatherX = mx;
        this.selectedHero.gatherY = my;
        
        // Force a small move to kickstart movement
        const dx = mx - this.selectedHero.x;
        const dy = my - this.selectedHero.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 0) {
          // Nudge slightly in the right direction to get movement going
          this.selectedHero.x += (dx / dist) * 0.5;
          this.selectedHero.y += (dy / dist) * 0.5;
        }
        
        // Also try to use gatherController as a fallback
        try {
          if (window.gatherController) {
            gatherController.setGatherPoint(this.selectedHero, mx, my);
          }
        } catch (err) {
          console.log("Using direct gather point setting instead of controller");
        }
        
        // Add gather point target for visual feedback
        this.selectedHero.targetX = mx;
        this.selectedHero.targetY = my;
        this.selectedHero.showTarget = true;
        
        console.log("Hero gather point set to:", this.selectedHero.gatherX, this.selectedHero.gatherY);
        
        // Deselect hero after setting gather point
        this.selectedHero = null;
        return;
      }
    }

    // did we click a hero?
    const clickedHero=this.game.heroManager.getHeroAt(mx,my);
    if(clickedHero){
      this.selectedHero=clickedHero;
      this.selectedTower=null;
      return;
    }

    // did we click a tower?
    const clickedTower=this.getTowerAt(mx,my);
    if(clickedTower){
      this.selectedTower=clickedTower;
      this.showUpgradeTowerDialog(clickedTower);
      return;
    }

    // maybe a spot?
    const spot=this.getTowerSpotAt(mx,my);
    if(spot && !spot.occupied){
      this.showBuildTowerDialog(spot);
    }
  }

  showBuildTowerDialog(spot) {
    this.upgradeDialog.style.display="none";
    this.selectedTower=null;
    this.buildDialog.style.display="block";
    this.buildOptionsDiv.innerHTML="";
    const canvasRect=this.game.canvas.getBoundingClientRect();
    this.buildDialog.style.left=(canvasRect.left+spot.x-50)+"px";
    this.buildDialog.style.top =(canvasRect.top+spot.y-60)+"px";

    const towerDefs=this.game.towerManager.getTowerData();
    towerDefs.forEach(def=>{
      const colDiv=document.createElement("div");
      colDiv.style.display="flex";
      colDiv.style.flexDirection="column";
      colDiv.style.alignItems="center";

      const title=document.createElement("div");
      title.textContent=def.name||"(No Name)";
      title.style.marginBottom="6px";
      colDiv.appendChild(title);

      const buildBtn=document.createElement("button");
      buildBtn.setAttribute("data-tower-type",def.name);
      const cost1=Array.isArray(def.cost)? (def.cost[0]||9999):(def.cost||9999);
      buildBtn.textContent=`$${cost1}`;
      buildBtn.addEventListener("click",()=>{
        const newTower=this.game.towerManager.createTower(def.name);
        if(newTower){
          newTower.x=spot.x;
          newTower.y=spot.y;
          newTower.spot=spot;
          spot.occupied=true;
          this.game.gold-=cost1;
          this.game.towerManager.towers.push(newTower);
          this.game.towerManager.initializeTower(newTower);
        }
        this.buildDialog.style.display="none";
      });
      colDiv.appendChild(buildBtn);
      this.buildOptionsDiv.appendChild(colDiv);
    });
  }

  showUpgradeTowerDialog(tower){
    this.buildDialog.style.display="none";
    this.upgradeDialog.style.display="block";
    this.selectedTower=tower;
    const canvasRect=this.game.canvas.getBoundingClientRect();
    this.upgradeDialog.style.left=(canvasRect.left+tower.x-50)+"px";
    this.upgradeDialog.style.top =(canvasRect.top+tower.y-70)+"px";
    this.refreshUpgradeTowerDialog();
  }

  refreshUpgradeTowerDialog(){
    if(!this.selectedTower)return;
    const tower=this.selectedTower;
    const def=this.game.towerManager.findTowerConfigByName(tower.type);
    if(!def)return;
    this.upgradeTitle.textContent=`${tower.type} L${tower.level||1}`;
    const nextLvl=(tower.level||1)+1;
    if(nextLvl>(def.cost?.length||1)){
      this.upgradeBtn.textContent="maxed";
      this.upgradeBtn.disabled=true;
    } else {
      const nextCost=def.cost[nextLvl-1]||9999;
      this.upgradeBtn.textContent=`Upgrade $${nextCost}`;
      this.upgradeBtn.disabled=(this.game.gold<nextCost);
    }
    this.upgradeBtn.onclick=()=>{
      const newLvl=tower.level+1;
      if(newLvl>(def.cost?.length||1))return;
      const cost=def.cost[newLvl-1]||9999;
      if(this.game.gold>=cost){
        this.game.towerManager.upgradeTower(tower);
        this.refreshUpgradeTowerDialog();
      }
    };
  }

  getTowerAt(mx,my){
    return this.game.towerManager.towers.find(t=>{
      const dx=mx-t.x; const dy=my-t.y;
      return Math.sqrt(dx*dx+dy*dy)<30;
    });
  }

  getTowerSpotAt(mx,my){
    if(!this.game.towerSpots)return null;
    return this.game.towerSpots.find(s=>{
      const dx=mx-s.x; const dy=my-s.y;
      return Math.sqrt(dx*dx+dy*dy)<=20;
    });
  }

  initDebugTable(){}
  showEnemyStats(e){}
  hideEnemyStats(){}
  showLoseDialog(){}
  showWinDialog(){}
}
