<?php
require_once __DIR__ . '../../config/Database.php';

class Exercise {
    // Conexão com o banco e tabela
    private $conn;
    private $table_name = "exercises";

    // Propriedades do exercício
    public $id;
    public $name;
    public $category;
    public $type;
    public $description;
    public $muscles;
    public $instructions;
    public $image_path;
    public $video_path;
    public $created_at;

    // Construtor
    public function __construct($db) {
        $this->conn = $db;
    }

    // Criar um novo exercício
    public function create() {
        // Query para inserir
        $query = "INSERT INTO " . $this->table_name . "
                 (name, category, type, description, muscles, instructions, image_path, video_path)
                 VALUES
                 (:name, :category, :type, :description, :muscles, :instructions, :image_path, :video_path)";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->category = htmlspecialchars(strip_tags($this->category));
        $this->type = htmlspecialchars(strip_tags($this->type));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->muscles = htmlspecialchars(strip_tags($this->muscles));
        $this->instructions = htmlspecialchars(strip_tags($this->instructions));
        $this->image_path = htmlspecialchars(strip_tags($this->image_path));
        $this->video_path = htmlspecialchars(strip_tags($this->video_path));

        // Vincular
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":type", $this->type);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":muscles", $this->muscles);
        $stmt->bindParam(":instructions", $this->instructions);
        $stmt->bindParam(":image_path", $this->image_path);
        $stmt->bindParam(":video_path", $this->video_path);

        // Executar
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    // Atualizar um exercício
    public function update() {
        // Query para atualizar
        $query = "UPDATE " . $this->table_name . "
                 SET name = :name, category = :category, type = :type,
                 description = :description, muscles = :muscles,
                 instructions = :instructions, image_path = :image_path,
                 video_path = :video_path
                 WHERE id = :id";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->id = htmlspecialchars(strip_tags($this->id));
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->category = htmlspecialchars(strip_tags($this->category));
        $this->type = htmlspecialchars(strip_tags($this->type));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->muscles = htmlspecialchars(strip_tags($this->muscles));
        $this->instructions = htmlspecialchars(strip_tags($this->instructions));
        $this->image_path = htmlspecialchars(strip_tags($this->image_path));
        $this->video_path = htmlspecialchars(strip_tags($this->video_path));

        // Vincular
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":type", $this->type);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":muscles", $this->muscles);
        $stmt->bindParam(":instructions", $this->instructions);
        $stmt->bindParam(":image_path", $this->image_path);
        $stmt->bindParam(":video_path", $this->video_path);

        // Executar
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Obter um exercício pelo ID
    public function readOne() {
        // Query
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 0,1";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Vincular
        $stmt->bindParam(":id", $this->id);

        // Executar
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            // Configurar propriedades
            $this->id = $row['id'];
            $this->name = $row['name'];
            $this->category = $row['category'];
            $this->type = $row['type'];
            $this->description = $row['description'];
            $this->muscles = $row['muscles'];
            $this->instructions = $row['instructions'];
            $this->image_path = $row['image_path'];
            $this->video_path = $row['video_path'];
            $this->created_at = $row['created_at'];

            return true;
        }

        return false;
    }

    // Listar todos os exercícios
    public function readAll() {
        // Query
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY name ASC";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Executar
        $stmt->execute();

        return $stmt;
    }

    // Listar exercícios por tipo (academia ou piscina)
    public function readByType($type) {
        // Query
        $query = "SELECT * FROM " . $this->table_name . " WHERE type = :type ORDER BY name ASC";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $type = htmlspecialchars(strip_tags($type));

        // Vincular
        $stmt->bindParam(":type", $type);

        // Executar
        $stmt->execute();

        return $stmt;
    }

    // Listar exercícios por categoria
    public function readByCategory($category) {
        // Query
        $query = "SELECT * FROM " . $this->table_name . " WHERE category = :category ORDER BY name ASC";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $category = htmlspecialchars(strip_tags($category));

        // Vincular
        $stmt->bindParam(":category", $category);

        // Executar
        $stmt->execute();

        return $stmt;
    }

    // Pesquisar exercícios por nome
    public function search($keyword) {
        // Query
        $query = "SELECT * FROM " . $this->table_name . "
                 WHERE name LIKE :keyword
                 OR muscles LIKE :keyword
                 OR description LIKE :keyword
                 ORDER BY name ASC";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $keyword = htmlspecialchars(strip_tags($keyword));
        $keyword = "%{$keyword}%";

        // Vincular
        $stmt->bindParam(":keyword", $keyword);

        // Executar
        $stmt->execute();

        return $stmt;
    }

    // Excluir um exercício
    public function delete() {
        // Query para excluir
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->id = htmlspecialchars(strip_tags($this->id));

        // Vincular
        $stmt->bindParam(":id", $this->id);

        // Executar
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Salvar a mídia
    public function saveMedia() {
        $query = "UPDATE " . $this->table_name . " SET image_path = :image_path, video_path = :video_path WHERE id = :id";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Vincular
        $stmt->bindParam(":image_path", $this->image_path);
        $stmt->bindParam(":video_path", $this->video_path);
        $stmt->bindParam(":id", $this->id);

        // Executar
        if($stmt->execute()) {
            return true;
        }

        return false;

    }
}
?>
