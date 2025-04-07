<?php
require_once __DIR__ . '../../models/Personal.php';
class PersonalController {
    private $db;
    private $personal;

    // Construtor
    public function __construct($db ) {
        $this->db = $db;
        $this->personal = new Personal();

    }

  public function  getPupils(){
    $pupilData = $this->personal->pupils();
    if ($pupilData) {
        return ApiResponse::success($pupilData);

    }
}
}
