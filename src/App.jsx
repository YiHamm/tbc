import { useMemo, useRef, useState } from "react";
import "./styles/app.css";
import { makePlayerTeam, makeEnemyTeam } from "./game/seed.js";
import { expNeed } from "./game/balance.js";
import { buildBattleActions } from "./game/engine.js";

const DEFAULT_NAMES = {
  attacker: "斬手",
  tank: "盾衛",
  healer: "白癒",
};

const ROLE_LABEL = {
  attacker: "攻擊",
  tank: "防禦",
  healer: "回復",
};

export default function App() {
  const [levels, setLevels] = useState({ attacker: 1, tank: 1, healer: 1 });
  const [sharedExp, setSharedExp] = useState(0);

  // ✅ 敵方難度等級：只有勝利才上升；輸了不變
  const [enemyTier, setEnemyTier] = useState(1);

  const [isPlaying, setIsPlaying] = useState(false);
  const [log, setLog] = useState([]);

  const [highlight, setHighlight] = useState({
    actorId: null,
    targetId: null,
    type: null,
    actorSide: null,
    targetSide: null,
  });

  const [battleTeams, setBattleTeams] = useState(null);

  const [floaters, setFloaters] = useState([]); // {id, unitId, text, kind}
  const floaterIdRef = useRef(1);

  const playerTeam = useMemo(() => {
    const team = makePlayerTeam(levels, DEFAULT_NAMES);
    return team.map((u) => ({ ...u, hp: u.maxHp }));
  }, [levels]);

  // 等待顯示的敵人（只是畫面）：用目前 enemyTier 生成
  const waitingEnemyTeam = useMemo(() => {
    return makeEnemyTeam(enemyTier).map((u) => ({ ...u, hp: u.maxHp }));
  }, [enemyTier]);

  const showPlayer = battleTeams?.player ?? playerTeam;
  const showEnemy = battleTeams?.enemy ?? waitingEnemyTeam;

  function addFloater(unitId, text, kind) {
    const id = floaterIdRef.current++;
    setFloaters((prev) => [...prev, { id, unitId, text, kind }]);
    setTimeout(() => {
      setFloaters((prev) => prev.filter((f) => f.id !== id));
    }, 720);
  }

  function handleLevelUp(role) {
    if (isPlaying) return;
    const need = expNeed(levels[role]);
    if (sharedExp < need) return;

    setSharedExp((e) => e - need);
    setLevels((lv) => ({ ...lv, [role]: lv[role] + 1 }));
  }

  function handleResetProgress() {
    if (isPlaying) return;
    setLevels({ attacker: 1, tank: 1, healer: 1 });
    setSharedExp(0);
    setEnemyTier(1);
    setLog([]);
    setBattleTeams(null);
    setHighlight({ actorId: null, targetId: null, type: null, actorSide: null, targetSide: null });
    setFloaters([]);
  }

  function handleFight() {
    if (isPlaying) return;

    setIsPlaying(true);
    setLog([]);
    setFloaters([]);
    setHighlight({ actorId: null, targetId: null, type: null, actorSide: null, targetSide: null });

    const playerBattle = playerTeam.map((u) => ({ ...u, hp: u.maxHp }));

    // ✅ 每次按打怪：全新敵人，但強度固定由 enemyTier 決定（輸了不變）
    const enemyBattle = makeEnemyTeam(enemyTier);

    setBattleTeams({ player: playerBattle, enemy: enemyBattle });

    const { actions, win, gainedExp } = buildBattleActions(playerBattle, enemyBattle);

    let i = 0;

    const step = () => {
      if (i >= actions.length) {
        setHighlight({ actorId: null, targetId: null, type: null, actorSide: null, targetSide: null });

        setLog((prev) => [
          ...prev,
          win
            ? `✅ 勝利！獲得經驗 +${gainedExp}（敵方難度提升到 Tier ${enemyTier + 1}）`
            : `❌ 失敗…獲得經驗 +${gainedExp}（敵方難度維持 Tier ${enemyTier}）`,
        ]);

        setSharedExp((e) => e + gainedExp);

        // ✅ 只有勝利才提升敵方難度
        if (win) setEnemyTier((t) => t + 1);

        setIsPlaying(false);
        return;
      }

      const a = actions[i++];

      setHighlight({
        actorId: a.actorId,
        targetId: a.targetId,
        type: a.type,
        actorSide: a.actorSide,
        targetSide: a.targetSide,
      });

      setLog((prev) => [...prev, `回合 ${a.round}：${a.text}`]);

      setBattleTeams((cur) => {
        if (!cur) return cur;

        const next = {
          player: cur.player.map((u) => ({ ...u })),
          enemy: cur.enemy.map((u) => ({ ...u })),
        };

        const sideArr = a.targetSide === "player" ? next.player : next.enemy;
        const t = sideArr.find((x) => x.id === a.targetId);
        if (!t) return next;

        if (a.type === "attack") {
          const before = t.hp;
          t.hp = Math.max(0, t.hp - a.amount);
          addFloater(t.id, `-${before - t.hp}`, "dmg");
        } else if (a.type === "heal") {
          const before = t.hp;
          t.hp = Math.min(t.maxHp, t.hp + a.amount);
          addFloater(t.id, `+${t.hp - before}`, "heal");
        }

        return next;
      });

      setTimeout(step, 560);
    };

    setTimeout(step, 320);
  }

  function cardClass(u) {
    let cls = "card";
    if (u.side === "enemy") cls += " enemy";

    const isActor = highlight.actorId === u.id;
    const isTarget = highlight.targetId === u.id;

    if (isActor) {
      cls += " acting";
      if (highlight.type === "attack") cls += highlight.actorSide === "player" ? " dash-right" : " dash-left";
      if (highlight.type === "heal") cls += " dash-heal";
    }

    if (isTarget && highlight.type === "attack") cls += " targeted";
    if (isTarget && highlight.type === "heal") cls += " healed";

    return cls;
  }

  function hpPct(u) {
    return Math.max(0, Math.min(100, Math.round((u.hp / u.maxHp) * 100)));
  }

  function renderCard(u) {
    const myFloaters = floaters.filter((f) => f.unitId === u.id);

    return (
      <div key={u.id} className={cardClass(u)}>
        <div className="cardHead">
          <div className="name">{u.name}</div>
          <div className="badge">{ROLE_LABEL[u.role]} Lv.{u.level}</div>
        </div>

        <div className="row">
          <span>HP</span>
          <span>{u.hp}/{u.maxHp}</span>
        </div>

        <div className="hpbar">
          <div className="hpfill" style={{ width: `${hpPct(u)}%` }} />
        </div>

        <div className="row"><span>ATK</span><span>{u.atk}</span></div>
        <div className="row"><span>DEF</span><span>{u.def}</span></div>
        {u.role === "healer" && <div className="row"><span>HEAL</span><span>{u.heal}</span></div>}

        {u.side === "player" && (
          <>
            <button
              className="btn"
              onClick={() => handleLevelUp(u.role)}
              disabled={isPlaying || sharedExp < expNeed(levels[u.role])}
            >
              升級（需 EXP {expNeed(levels[u.role])}）
            </button>
            <div className="hint">共用 EXP：{sharedExp}</div>
          </>
        )}

        <div className="floatLayer">
          {myFloaters.map((f) => (
            <div key={f.id} className={`floater ${f.kind}`}>
              {f.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <h1 className="title">Turn-based combat</h1>
      <div className="sub">
        目前敵方難度：<b>Tier {enemyTier}</b>
      </div>

      <div className="top">
        <div className="panels">
          <div className="panel">
            <div className="panelTitle">我方</div>
            <div className="grid">{showPlayer.map(renderCard)}</div>
          </div>

          <div className="panel">
            <div className="panelTitle">敵方</div>
            <div className="grid">{showEnemy.map(renderCard)}</div>
          </div>
        </div>

        <div className="side">
          <div className="bar">
            <div className="exp">EXP：<b>{sharedExp}</b></div>
            <div className="barBtns">
              <button className="btn primary" onClick={handleFight} disabled={isPlaying}>
                打怪（新戰鬥）
              </button>
              <button className="btn danger" onClick={handleResetProgress} disabled={isPlaying}>
                重置進度
              </button>
            </div>
          </div>

          <div className="log">
            <div className="logTitle">戰鬥紀錄</div>
            <div className="logBody">
              {log.length === 0 ? (
                <div className="muted">按「打怪」開始一場全新戰鬥</div>
              ) : (
                log.map((t, i) => <div key={i} className="logLine">{t}</div>)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
