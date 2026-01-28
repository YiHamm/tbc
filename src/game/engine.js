import { damageAfterDefense, expGain } from "./balance.js";

function alive(units) {
  return units.filter((u) => u.hp > 0);
}

// 目標鎖定：先 tank → attacker → healer（但要能隨死亡切換）
function pickByPriority(units, roleOrder) {
  const list = alive(units);
  if (list.length === 0) return null;

  for (const role of roleOrder) {
    const t = list.find((u) => u.role === role);
    if (t) return t;
  }
  return list[0] ?? null;
}

// ✅ 補師：優先補「HP 數字最低」(且一定不能補死人)
function pickLowestHp(units) {
  const list = alive(units); // 死人不會進來
  if (list.length === 0) return null;

  // 同 hp 時，讓行為穩定：先 tank → attacker → healer
  const roleRank = { tank: 0, attacker: 1, healer: 2 };

  return list
    .slice()
    .sort((a, b) => {
      if (a.hp !== b.hp) return a.hp - b.hp; // ✅ 血量數字低的優先
      return (roleRank[a.role] ?? 9) - (roleRank[b.role] ?? 9);
    })[0];
}

function cloneTeam(team) {
  return team.map((u) => ({ ...u }));
}

export function buildBattleActions(playerTeamBase, enemyTeamBase) {
  // ✅ 這裡的 clone 是「引擎模擬用」：必須同步扣血/補血，才會換目標、會死人
  const player = cloneTeam(playerTeamBase);
  const enemy = cloneTeam(enemyTeamBase);

  const actions = [];
  let round = 1;

  const push = (a) => actions.push({ ...a, round });

  const targetOrder = ["tank", "attacker", "healer"];

  // 小工具：找到單位（在模擬隊伍中）
  const findUnit = (side, id) => {
    const arr = side === "player" ? player : enemy;
    return arr.find((u) => u.id === id) ?? null;
  };

  while (alive(player).length > 0 && alive(enemy).length > 0 && round <= 50) {
    // ===== 玩家先手 =====
    for (const u of player) {
      if (u.hp <= 0) continue;

      if (u.role === "healer") {
        const t = pickLowestHp(player);
        if (!t) continue;

        // ✅ 治療量（你之前嫌補太滿，所以這裡仍保留「下修版」）
        const amount = Math.max(3, Math.floor(u.heal * (0.45 + Math.random() * 0.20)));

        push({
          type: "heal",
          actorSide: "player",
          actorId: u.id,
          targetSide: "player",
          targetId: t.id,
          amount,
          text: `${u.name}(回復) 治療 ${t.name} +${amount}`,
        });

        // ✅ 重要：同步更新「模擬隊伍」血量（但不能救死人，t 一定是 alive）
        t.hp = Math.min(t.maxHp, t.hp + amount);
      } else {
        const t = pickByPriority(enemy, targetOrder);
        if (!t) continue;

        const variance = u.role === "tank"
          ? (0.90 + Math.random() * 0.20)
          : (0.80 + Math.random() * 0.40);

        const raw = Math.floor(u.atk * variance);
        const dmg = damageAfterDefense(raw, t.def);

        push({
          type: "attack",
          actorSide: "player",
          actorId: u.id,
          targetSide: "enemy",
          targetId: t.id,
          amount: dmg,
          text: `${u.name} 攻擊 ${t.name} -${dmg}`,
        });

        // ✅ 同步扣血，這樣坦克死了就會改打 attacker/healer
        t.hp = Math.max(0, t.hp - dmg);
      }
    }

    if (alive(enemy).length === 0) break;

    // ===== 敵方行動 =====
    for (const u of enemy) {
      if (u.hp <= 0) continue;

      if (u.role === "healer") {
        const t = pickLowestHp(enemy);
        if (!t) continue;

        const amount = Math.max(3, Math.floor(u.heal * (0.45 + Math.random() * 0.20)));

        push({
          type: "heal",
          actorSide: "enemy",
          actorId: u.id,
          targetSide: "enemy",
          targetId: t.id,
          amount,
          text: `${u.name}(回復) 治療 ${t.name} +${amount}`,
        });

        t.hp = Math.min(t.maxHp, t.hp + amount);
      } else {
        const t = pickByPriority(player, targetOrder);
        if (!t) continue;

        const variance = u.role === "tank"
          ? (0.90 + Math.random() * 0.20)
          : (0.80 + Math.random() * 0.40);

        const raw = Math.floor(u.atk * variance);
        const dmg = damageAfterDefense(raw, t.def);

        push({
          type: "attack",
          actorSide: "enemy",
          actorId: u.id,
          targetSide: "player",
          targetId: t.id,
          amount: dmg,
          text: `${u.name} 攻擊 ${t.name} -${dmg}`,
        });

        t.hp = Math.max(0, t.hp - dmg);
      }
    }

    round += 1;
  }

  const win = alive(player).length > 0 && alive(enemy).length === 0;
  const enemyAvg = Math.max(1, Math.round(enemy.reduce((s, u) => s + u.level, 0) / enemy.length));
  const gained = expGain(enemyAvg, win);

  return { actions, win, gainedExp: gained };
}
