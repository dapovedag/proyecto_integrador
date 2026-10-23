import { Boton } from "@/components/base";

export default function NoEncontrado() {
  return (
    <section className="contenedor" style={{ paddingBlock: "clamp(64px, 12vw, 160px)" }}>
      <p className="versalitas">Error 404 · fuera del expediente</p>
      <h1 className="display" style={{ fontSize: "var(--fs-4xl)", fontWeight: 500, margin: "16px 0 20px" }}>
        Esta página no está en el paquete de corrida.
      </h1>
      <p className="lead" style={{ marginBottom: 32 }}>
        Puede volver a la portada o abrir la paleta de comandos para saltar a cualquier capítulo.
      </p>
      <div className="fila fila--l">
        <Boton to="/" variante="primario" flecha>
          Volver a la portada
        </Boton>
        <Boton to="/metodologia">Ver la metodología</Boton>
      </div>
    </section>
  );
}
