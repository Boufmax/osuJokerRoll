<?php
require 'accessDB.php';

$pdo = accessDB::getInstance();

$maps = array();
$stmt = $pdo->query("SELECT map_id, m FROM map");

foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    $maps[] = array("id" => $row['map_id'], "mod" => $row['m']);
}

return json_encode($maps);

