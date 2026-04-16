"use client";
import styles from "./KanbanCard.module.css";

const ESTADO_LABEL = {
  ingresada:   "Ingresada",
  diagnostico: "Diagnóstico",
  reparacion:  "Reparación",
  lista:       "Lista",
  entregada:   "Entregada",
};

function tiempoRelativo(fecha) {
  const diff = Date.now() - new Date(fecha).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export default function KanbanCard({ bici, onAvanzar, onReportar }) {
  const foto = bici.fotos?.[0]?.url;
  const hallazgoPendiente = bici.hallazgos?.[0];
  const hasHallazgo = !!hallazgoPendiente;

  return (
    <div className={`${styles.card} ${hasHallazgo ? styles.hasHallazgo : ""}`}>
      <div className={styles.inner}>
        {foto ? (
          <img src={foto} alt={bici.modelo} className={styles.foto} />
        ) : (
          <div className={styles.fotoPlaceholder}>🚲</div>
        )}
        <div className={styles.info}>
          <div className={styles.modelo}>{bici.modelo}</div>
          <div className={styles.cliente}>{bici.cliente?.nombre}</div>
          <div className={styles.meta}>
            <span className={`${styles.badge} ${styles[bici.estado]}`}>
              {ESTADO_LABEL[bici.estado]}
            </span>
            <span className={styles.tiempo}>
              {tiempoRelativo(bici.creadoEn)}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.footer}>
        {hasHallazgo && (
          <span className={styles.hallazgoStrip}>
            Hallazgo · {hallazgoPendiente.descripcion}
          </span>
        )}
        {hasHallazgo ? (
          <button className={styles.btnReportar} onClick={() => onReportar?.(bici)}>
            Reportar →
          </button>
        ) : (
          <button className={styles.btnAvanzar} onClick={() => onAvanzar?.(bici)}>
            Avanzar
          </button>
        )}
      </div>
    </div>
  );
}
