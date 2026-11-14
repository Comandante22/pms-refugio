<?php
header('Content-Type: application/json');header('Cache-Control: no-store');
$c=json_decode(@file_get_contents(dirname(__DIR__).'/private/bia-config.json')?:'',true);
echo json_encode(['ok'=>true,'service'=>'Bia Refugio','configured'=>!empty($c['OMNIROUTE_API_KEY'])&&!empty($c['OMNIROUTE_MODEL']),'version'=>'bia-independente-20261114-1']);
