import UnitCard from "./UnitCard.jsx";

export default function TeamPanel({ title, team, sharedExp, onLevelUp, disabled }) {
  return (
    <div className="panel">
      <div className="panelTitle">{title}</div>
      <div className="grid">
        {team.map((u) => (
          <UnitCard
            key={u.id}
            unit={u}
            sharedExp={sharedExp}
            onLevelUp={onLevelUp}
            disabled={disabled || !onLevelUp}
          />
        ))}
      </div>
    </div>
  );
}
