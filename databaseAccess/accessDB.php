<?php
require 'config.php';

class accessDB {
    static private $pdo = null;

    // get singleton
   static function getInstance() {
        if (self::$pdo == null) {
            $dsn = "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8";
            self::$pdo = new PDO($dsn, DB_USER, DB_PASSWORD);
        }
        return self::$pdo;
    }

}