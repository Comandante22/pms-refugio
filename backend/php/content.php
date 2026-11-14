<?php
require __DIR__.'/lib.php';header('Access-Control-Allow-Origin: *');header('Cache-Control: no-cache');$s=settings();$s['ai']=['name'=>$s['ai']['name']];out(200,['settings'=>$s]);
