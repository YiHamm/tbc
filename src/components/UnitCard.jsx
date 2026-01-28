import { expNeed } from "../game/balance.js";

const ROLE_NAME = {
  attacker: "攻擊",
  tank: "防禦",
  healer: "回復",
};

export default function UnitCard({ unit, sharedExp, onLevelUp, disabled }) {
  const need = expNeed(unit.level);
  const can = sharedExp >= need;

  return (
    <div className="card">
      <div className="cardHead">
        <div className="name">{unit.name}</div>
        <div className="badge">{ROLE_NAME[unit.role]} Lv.{unit.level}</div>
      </div>

      <div className="row">
        <span>HP</span>
        <span>
          {unit.hp}/{unit.maxHp}
        </span>
      </div>
      <div className="row">
        <span>ATK</span>
        <span>{unit.atk}</span>
      </div>
      <div className="row">
        <span>DEF</span>
        <span>{unit.def}</span>
      </div>
      {unit.role === "healer" && (
        <div className="row">
          <span>HEAL</span>
          <span>{unit.heal}</span>
        </div>
      )}

      <button
        className="btn"
        onClick={() => onLevelUp(unit.role)}
        disabled={disabled || !can}
        title={can ? "升級" : `需要經驗 ${need}`}
      >
        升級（需 EXP {need}）
      </button>
      {!can && <div className="hint">共用EXP不足：目前 {sharedExp}</div>}
    </div>
  );
}
