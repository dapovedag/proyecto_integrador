"""Fixtures compartidas: datos reales del proyecto (sin red, sin rutas absolutas)."""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from credit_risk import config
from credit_risk.data import aprender_imputacion, cargar_datos, dividir, limpiar


@pytest.fixture(scope="session")
def crudo() -> pd.DataFrame:
    return cargar_datos()


@pytest.fixture(scope="session")
def particion(crudo: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    train, test = dividir(limpiar(crudo))
    reglas = aprender_imputacion(train)
    return reglas.aplicar(train), reglas.aplicar(test)


@pytest.fixture(scope="session")
def muestra(particion: tuple[pd.DataFrame, pd.DataFrame]) -> tuple[pd.DataFrame, np.ndarray]:
    """2.000 filas de train para pruebas rápidas de modelos."""
    train = particion[0].sample(2000, random_state=config.RANDOM_STATE).reset_index(drop=True)
    return train.drop(columns=[config.TARGET]), train[config.TARGET].to_numpy()
