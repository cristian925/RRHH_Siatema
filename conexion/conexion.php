<?php

$host = "localhost";
$port = "3306";
$dbname = "system_RRHH";

$user = "rrhh_user";
$password = "RRHH2026*";

try
{
    $conexion = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $user,
        $password
    );

    $conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conexion->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
}
catch(PDOException $e)
{
    die("Error de conexión a la base de datos: " . $e->getMessage());
}