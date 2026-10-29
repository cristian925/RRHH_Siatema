<?php

header("Content-Type: application/json; charset=UTF-8");

require_once "../conexion/conexion.php";

try
{
    $sql = "
        SELECT
            e.empleado_id,
            e.nombre_completo,
            e.salario,
            e.cotizaciones,
            e.dui,
            e.numero_cuenta,
            e.genero,
            e.fecha_ingreso,

            e.cargo_id,

            c.nombre AS cargo

        FROM empleados e

        LEFT JOIN cargos c
            ON e.cargo_id = c.cargo_id

        WHERE e.estado = 1

        ORDER BY e.nombre_completo ASC
    ";

    $stmt = $conexion->prepare($sql);
    $stmt->execute();

    $empleados = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "empleados" => $empleados
    ]);
}
catch(PDOException $e)
{
    echo json_encode([
        "success" => false,
        "mensaje" => $e->getMessage()
    ]);
}