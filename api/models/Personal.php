<?php

require_once __DIR__ . '../../config/Database.php';
class Personal
{
  private $conn;
    protected $table = 'users';
    protected $primaryKey = 'id';
    public $timestamps = false;

    private $id;
    private $name;
    public function __construct() {
      $db = new Database();
    	$this->conn = $db->getConnection();


    }

public function pupils()
{
  header('Content-Type: application/json; charset=utf-8'); // Define o cabeçalho como JSON

  $query = "SELECT * FROM users WHERE personal_id = 1";
    $stmt = $this->conn->prepare($query);
    if ($stmt->execute()) {
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (empty($results)) {
          echo json_encode([
              'status' => 'success',
              'message' => 'Nenhum aluno encontrado.',
              'data' => []
          ]);
      } else {
          echo json_encode([
              'status' => 'success',
              'message' => 'Alunos encontrados com sucesso.',
              'data' => $results
          ]);
      }
}
}
public function pupilDetails($id) {
    $query = "SELECT * FROM users WHERE id = :id";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    if ($stmt->execute()) {
      $this->getAddress($id);
     return $stmt->fetch(PDO::FETCH_ASSOC);

}else{
    echo json_encode([
        'status' => 'error',
        'message' => 'Aluno não encontrado.',
        'data' => null
    ]);
    exit;
}

}
public function getAddress($id) {
    $query = "SELECT * FROM address WHERE user_id = :id";
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    if ($stmt->execute()) {
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } else {
        return null;
    }
}
}
