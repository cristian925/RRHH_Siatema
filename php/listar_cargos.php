<?php

header("Content-Type: application/json; charset=UTF-8");

require_once "../conexion/conexion.php";

try {

    $sql = "
        SELECT
            cargo_id,
            nombre
        FROM cargos
        WHERE estado = 1
        ORDER BY nombre ASC
    ";

    $stmt = $conexion->prepare($sql);
    $stmt->execute();

    $cargos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "cargos" => $cargos
    ]);

}
catch(PDOException $e) {

    echo json_encode([
        "success" => false,
        "mensaje" => $e->getMessage()
    ]);
}