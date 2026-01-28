import { statsFor } from "./balance.js";

let uid = 1;
function nextId() {
  return String(uid++);
}

export function makePlayerTeam(levelsByRole, namesByRole) {
  const roles = ["attacker", "tank", "healer"];
  return roles.map((role) => {
    const level = levelsByRole[role] ?? 1;
    const name = namesByRole[role] ?? role;
    const st = statsFor(role, level);
    return {
      id: nextId(),
      side: "player",
      role,
      name,
      level,
      ...st,
      hp: st.maxHp,
    };
  });
}

export function makeEnemyTeam(enemyAvgLevel = 1) {
  const roles = ["tank", "attacker", "healer"]; // 讓敵方也同結構
  const enemyNames = {
    attacker: ["斬影", "赤刃", "狂刃", "裂牙"],
    tank: ["鐵壁", "巨盾", "石甲", "鋼岩"],
    healer: ["詠者", "白癒", "綠息", "聖手"],
  };

  return roles.map((role) => {
    const lv = Math.max(
      1,
      enemyAvgLevel + (Math.random() < 0.55 ? 0 : 1) - (Math.random() < 0.25 ? 1 : 0)
    );

    const nameList = enemyNames[role];
    const name = nameList[Math.floor(Math.random() * nameList.length)];
    const st = statsFor(role, lv);

    // ✅ 不再 nerf 敵人，甚至微幅提升，解決「我方太強」
    const mul = 1.03;

    const maxHp = Math.floor(st.maxHp * mul);
    const atk = Math.floor(st.atk * mul);
    const def = Math.floor(st.def * mul);
    const heal = Math.floor((st.heal ?? 0) * mul);

    return {
      id: nextId(),
      side: "enemy",
      role,
      name,
      level: lv,
      maxHp,
      atk,
      def,
      heal,
      hp: maxHp,
    };
  });
}
