export function expNeed(level) {
  return Math.floor(20 + 8 * level + 10 * level * level);
}

export function statsFor(role, level) {
  const baseHp = 80 + 18 * level + 6 * level * level;

  if (role === "attacker") {
    const atkBase = Math.floor(18 + 9 * level + 3.2 * level * level);
    return {
      maxHp: Math.floor(baseHp * 0.95),
      // ✅ 我方攻擊力增加
      atk: Math.floor(atkBase * 1.10),
      def: Math.floor(6 + 1.6 * level),
      heal: 0,
    };
  }

  if (role === "tank") {
    return {
      maxHp: Math.floor(baseHp * 1.25),
      atk: Math.floor(12 + 5 * level + 1.6 * level * level),
      def: Math.floor(14 + 3.2 * level + 0.8 * level * level),
      heal: 0,
    };
  }

  // healer
  const healBase = Math.floor(14 + 6 * level + 1.2 * level * level);
  return {
    maxHp: Math.floor(baseHp * 1.05),
    atk: Math.floor(10 + 4 * level + 1.2 * level * level),
    def: Math.floor(9 + 2.2 * level),
    // ✅ 我方治癒量增加
    heal: Math.floor(healBase * 1.12),
  };
}

export function damageAfterDefense(rawDmg, targetDef) {
  const reduction = targetDef / (targetDef + 60);
  return Math.max(1, Math.floor(rawDmg * (1 - reduction)));
}

export function expGain(enemyAvgLevel, win) {
  const base = 18 + enemyAvgLevel * 7;
  return win ? base : Math.max(6, Math.floor(base * 0.35));
}
