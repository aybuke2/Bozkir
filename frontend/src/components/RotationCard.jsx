
function RotationCard({ rotation }) {
  return (
    <div className="rotation-card">

      <h3>{rotation.name}</h3>

      <p>{rotation.description}</p>

      <div className="score-row">
        <span>Su Yönetimi</span>
        <strong>{rotation.waterScore}/100</strong>
      </div>

      <div className="score-bar">
        <div
          className="score-fill"
          style={{
            width: `${rotation.waterScore}%`
          }}
        />
      </div>

      <div className="score-row">
        <span>Toprak Sağlığı</span>
        <strong>{rotation.soilScore}/100</strong>
      </div>

      <div className="score-bar">
        <div
          className="score-fill"
          style={{
            width: `${rotation.soilScore}%`
          }}
        />
      </div>

      <div className="overall-score">
        <span>Genel Uygunluk</span>
        <h2>{rotation.overallScore}/100</h2>
      </div>

      <h4>Avantajlar</h4>

      <ul>
        {rotation.advantages.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <h4>Dikkat Edilmesi Gerekenler</h4>

      <ul>
        {rotation.risks.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

    </div>
  );
}

export default RotationCard;
