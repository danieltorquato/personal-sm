<?php

class Anamnesis {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Propriedades
    public $id;
    public $user_id;
    public $weight;
    public $height;
    public $age;
    public $sex;
    public $smoker;
    public $alcoholic;
    public $physical_activity;
    public $sleep_hours;
    public $main_complaint;
    public $medical_history;
    public $medications;
    public $surgeries;
    public $allergies;
    public $family_history;
    public $lifestyle;
    public $created_at;
    private $table_name = "anamnesis";

    // Criar nova anamnese
    public function create() {
        // Query para inserir
        $query = "INSERT INTO " . $this->table_name . "
                  (user_id, weight, height, age, sex, smoker, alcoholic,
                   physical_activity, sleep_hours, main_complaint, medical_history,
                   medications, surgeries, allergies, family_history, lifestyle)
                  VALUES
                  (:user_id, :weight, :height, :age, :sex, :smoker, :alcoholic,
                   :physical_activity, :sleep_hours, :main_complaint, :medical_history,
                   :medications, :surgeries, :allergies, :family_history, :lifestyle)";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->weight = htmlspecialchars(strip_tags($this->weight));
        $this->height = htmlspecialchars(strip_tags($this->height));
        $this->age = htmlspecialchars(strip_tags($this->age));
        $this->sex = htmlspecialchars(strip_tags($this->sex));
        $this->smoker = htmlspecialchars(strip_tags($this->smoker));
        $this->alcoholic = htmlspecialchars(strip_tags($this->alcoholic));
        $this->physical_activity = htmlspecialchars(strip_tags($this->physical_activity));
        $this->sleep_hours = htmlspecialchars(strip_tags($this->sleep_hours));
        $this->main_complaint = htmlspecialchars(strip_tags($this->main_complaint));
        $this->medical_history = htmlspecialchars(strip_tags($this->medical_history));
        $this->medications = htmlspecialchars(strip_tags($this->medications));
        $this->surgeries = htmlspecialchars(strip_tags($this->surgeries));
        $this->allergies = htmlspecialchars(strip_tags($this->allergies));
        $this->family_history = htmlspecialchars(strip_tags($this->family_history));
        $this->lifestyle = htmlspecialchars(strip_tags($this->lifestyle));

        // Vincular
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":weight", $this->weight);
        $stmt->bindParam(":height", $this->height);
        $stmt->bindParam(":age", $this->age);
        $stmt->bindParam(":sex", $this->sex);
        $stmt->bindParam(":smoker", $this->smoker);
        $stmt->bindParam(":alcoholic", $this->alcoholic);
        $stmt->bindParam(":physical_activity", $this->physical_activity);
        $stmt->bindParam(":sleep_hours", $this->sleep_hours);
        $stmt->bindParam(":main_complaint", $this->main_complaint);
        $stmt->bindParam(":medical_history", $this->medical_history);
        $stmt->bindParam(":medications", $this->medications);
        $stmt->bindParam(":surgeries", $this->surgeries);
        $stmt->bindParam(":allergies", $this->allergies);
        $stmt->bindParam(":family_history", $this->family_history);
        $stmt->bindParam(":lifestyle", $this->lifestyle);

        // Executar
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    // Atualizar anamnese
    public function update() {
        // Query para atualizar
        $query = "UPDATE " . $this->table_name . "
                  SET weight = :weight,
                      height = :height,
                      age = :age,
                      sex = :sex,
                      smoker = :smoker,
                      alcoholic = :alcoholic,
                      physical_activity = :physical_activity,
                      sleep_hours = :sleep_hours,
                      main_complaint = :main_complaint,
                      medical_history = :medical_history,
                      medications = :medications,
                      surgeries = :surgeries,
                      allergies = :allergies,
                      family_history = :family_history,
                      lifestyle = :lifestyle
                  WHERE id = :id AND user_id = :user_id";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->id = htmlspecialchars(strip_tags($this->id));
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->weight = htmlspecialchars(strip_tags($this->weight));
        $this->height = htmlspecialchars(strip_tags($this->height));
        $this->age = htmlspecialchars(strip_tags($this->age));
        $this->sex = htmlspecialchars(strip_tags($this->sex));
        $this->smoker = htmlspecialchars(strip_tags($this->smoker));
        $this->alcoholic = htmlspecialchars(strip_tags($this->alcoholic));
        $this->physical_activity = htmlspecialchars(strip_tags($this->physical_activity));
        $this->sleep_hours = htmlspecialchars(strip_tags($this->sleep_hours));
        $this->main_complaint = htmlspecialchars(strip_tags($this->main_complaint));
        $this->medical_history = htmlspecialchars(strip_tags($this->medical_history));
        $this->medications = htmlspecialchars(strip_tags($this->medications));
        $this->surgeries = htmlspecialchars(strip_tags($this->surgeries));
        $this->allergies = htmlspecialchars(strip_tags($this->allergies));
        $this->family_history = htmlspecialchars(strip_tags($this->family_history));
        $this->lifestyle = htmlspecialchars(strip_tags($this->lifestyle));

        // Vincular
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":weight", $this->weight);
        $stmt->bindParam(":height", $this->height);
        $stmt->bindParam(":age", $this->age);
        $stmt->bindParam(":sex", $this->sex);
        $stmt->bindParam(":smoker", $this->smoker);
        $stmt->bindParam(":alcoholic", $this->alcoholic);
        $stmt->bindParam(":physical_activity", $this->physical_activity);
        $stmt->bindParam(":sleep_hours", $this->sleep_hours);
        $stmt->bindParam(":main_complaint", $this->main_complaint);
        $stmt->bindParam(":medical_history", $this->medical_history);
        $stmt->bindParam(":medications", $this->medications);
        $stmt->bindParam(":surgeries", $this->surgeries);
        $stmt->bindParam(":allergies", $this->allergies);
        $stmt->bindParam(":family_history", $this->family_history);
        $stmt->bindParam(":lifestyle", $this->lifestyle);

        // Executar
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Deletar anamnese
    public function delete() {
        // Query para deletar
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id AND user_id = :user_id";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $this->id = htmlspecialchars(strip_tags($this->id));
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));

        // Vincular
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":user_id", $this->user_id);

        // Executar
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Obter anamnese pelo ID do usuário
    public function readByUserId($user_id) {
        // Query
        $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = :user_id LIMIT 0,1";

        // Preparar a query
        $stmt = $this->conn->prepare($query);

        // Sanitizar
        $user_id = htmlspecialchars(strip_tags($user_id));

        // Vincular
        $stmt->bindParam(":user_id", $user_id);

        // Executar
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            // Preencher propriedades
            $this->id = $row['id'];
            $this->user_id = $row['user_id'];
            $this->weight = $row['weight'];
            $this->height = $row['height'];
            $this->age = $row['age'];
            $this->sex = $row['sex'];
            $this->smoker = $row['smoker'];
            $this->alcoholic = $row['alcoholic'];
            $this->physical_activity = $row['physical_activity'];
            $this->sleep_hours = $row['sleep_hours'];
            $this->main_complaint = $row['main_complaint'];
            $this->medical_history = $row['medical_history'];
            $this->medications = $row['medications'];
            $this->surgeries = $row['surgeries'];
            $this->allergies = $row['allergies'];
            $this->family_history = $row['family_history'];
            $this->lifestyle = $row['lifestyle'];
            $this->created_at = $row['created_at'];

            return true;
        }

        return false;
    }
}