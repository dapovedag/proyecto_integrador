# Definición de hecho (Definition of Done)

Una historia o paso está **Hecho** solo si cumple **todo** lo siguiente:

## Para notebooks
- [ ] Existe en la ruta indicada en [02_plan_paso_a_paso.md](../02_plan_paso_a_paso.md).
- [ ] La primera celda lista los IDs del enunciado que cubre.
- [ ] Corre completo con *Restart & Run All*, sin errores, y está guardado con las salidas.
- [ ] No usa rutas absolutas; toma las rutas de `config.py`.
- [ ] Usa `RANDOM_STATE = 42` en todo lo aleatorio.
- [ ] Cada gráfico tiene título, ejes con nombre e interpretación en texto.
- [ ] Termina con una celda de **Conclusiones**.
- [ ] Cumple el **criterio de hecho** específico de su paso.

## Para código (`src/`, `api/`)
- [ ] Funciones con nombre claro, *type hints* y docstring breve.
- [ ] Tiene un test en `Back/tests/` y `pytest` pasa.
- [ ] Sin credenciales ni datos personales en el código.

## Para el proyecto
- [ ] Ítems marcados en el checklist de [01_enunciado.md](../01_enunciado.md).
- [ ] Estado actualizado en [backlog.md](backlog.md).
- [ ] Retrospectiva del sprint registrada en [sprints.md](sprints.md).
