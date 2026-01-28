export default function ControlBar({ sharedExp, onFight, onResetProgress, busy }) {
  return (
    <div className="bar">
      <div className="exp">共用 EXP：<b>{sharedExp}</b></div>

      <div className="barBtns">
        <button className="btn primary" onClick={onFight} disabled={busy}>
          打怪（新戰鬥）
        </button>
        <button className="btn danger" onClick={onResetProgress} disabled={busy}>
          重置進度
        </button>
      </div>
    </div>
  );
}
