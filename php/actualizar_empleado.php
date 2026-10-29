<?php

header("Content-Type: application/json; charset=UTF-8");

require_once "../conexion/conexion.php";


$datos = json_decode(
    file_get_contents("php://input"),
    true
);


if (!$datos) {

    echo json_encode([
        "success" => false,
        "mensaje" => "No se recibieron datos."
    ]);

    exit;
}


$empleado_id =
    intval($datos['empleado_id'] ?? 0);

$nombre =
    trim($datos['nombre_completo'] ?? '');

$cargo_id =
    intval($datos['cargo_id'] ?? 0);

$salario =
    floatval($datos['salario'] ?? 0);

$cotizaciones =
    trim($datos['cotizaciones'] ?? '');


if (
    $empleado_id <= 0 ||
    $nombre === '' ||
    $salario <= 0
) {

    echo json_encode([
        "success" => false,
        "mensaje" => "Datos incompletos."
    ]);

    exit;
}


try {

    $sql = "
        UPDATE empleados

        SET
            nombre_completo = ?,
            cargo_id = ?,
            salario = ?,
            cotizaciones = ?

        WHERE empleado_id = ?
    ";


    $stmt =
        $conexion->prepare($sql);


    $stmt->execute([
        $nombre,
        $cargo_id,
        $salario,
        $cotizaciones,
        $empleado_id
    ]);


    echo json_encode([
        "success" => true,
        "mensaje" => "Empleado actualizado correctamente."
    ]);


} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "mensaje" => $e->getMessage()
    ]);
}