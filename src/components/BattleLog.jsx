export default function BattleLog({ lines }) {
  return (
    <div className="log">
      <div className="logTitle">戰鬥紀錄</div>
      <div className="logBody">
        {lines.length === 0 ? (
          <div className="muted">按「打怪」開始一場全新戰鬥</div>
        ) : (
          lines.map((t, i) => (
            <div key={i} className="logLine">
              {t}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
