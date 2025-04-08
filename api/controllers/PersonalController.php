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

        return ApiResponse::success('Alunos encontrados:', $pupilData);

    }

}

public function getPupilDetails($id) {
    $pupilData = $this->personal->pupilDetails($id);
    $adressData = $this->personal->getAddress($id);
    $data = array_merge($pupilData, $adressData);
    if ($pupilData) {

        return ApiResponse::success('Aluno encontrado com sucesso', $data);
    } else {
        return ApiResponse::error("Aluno não encontrado", 404);
    }
}
}
