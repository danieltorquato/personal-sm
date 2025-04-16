import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonFooter,
  IonRow,
  IonCol,
  IonSpinner,
  IonRange,
  ToastController
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  fitnessOutline,
  playOutline,
  volumeMediumOutline,
  expandOutline,
  chevronBackOutline,
  alertCircleOutline,
  arrowBackOutline,
  notificationsOutline,
  barbellOutline,
  informationCircleOutline,
  bodyOutline,
  listOutline,
  repeatOutline,
  syncOutline,
  imageOutline,
  videocamOutline,
  saveOutline
} from 'ionicons/icons';
import { WorkoutService } from 'src/app/services/workout.service';


interface Exercise {
  id?: number;
  name: string;
  description?: string;
  instructions?: string;
  muscles?: string;
  category?: string;
  equipment?: string;
  video?: string;
  image?: string;
  sets?: number;
  reps?: number;
  imagePreview?: string;
  videoPreview?: string;
}

@Component({
  selector: 'app-exercise-info',
  templateUrl: './exercise-info.page.html',
  styleUrls: ['./exercise-info.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonBackButton,
    IonButtons,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonFooter,
    IonRow,
    IonCol,
    IonSpinner,
    IonRange
  ]
})
export class ExerciseInfoPage implements OnInit {
  @ViewChild('videoPlayer') videoPlayer: ElementRef | undefined;
  @ViewChild('imageInput') imageInput!: ElementRef;
  @ViewChild('videoInput') videoInput!: ElementRef;

  exercise: Exercise | undefined;
  selectedExercise: Exercise | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workoutService: WorkoutService,
    private toastController: ToastController
  ) {
    addIcons({
      closeOutline,
      fitnessOutline,
      arrowBackOutline,
      alertCircleOutline,
      barbellOutline,
      informationCircleOutline,
      bodyOutline,
      listOutline,
      repeatOutline,
      syncOutline,
      chevronBackOutline,
      imageOutline,
      videocamOutline,
      saveOutline
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loading = true;
        this.loadExercise(Number(id));
      } else {
        this.error = 'ID do exercício não fornecido';
        this.loading = false;
      }
    });
  }

  loadExercise(id: number) {
    this.loading = true;

    // Esta é uma versão simplificada que usa getWorkout, mas idealmente
    // deveria haver um endpoint específico para buscar exercícios
    this.workoutService.getAllExercises().subscribe({
      next: (response) => {
        if (response && response.data && response.data.length > 0) {
          // Procurar o exercício pelo ID
          const exerciseData = response.data.find((ex: any) => ex.id === id);

          if (exerciseData) {
            this.selectedExercise = {
              id: exerciseData.id,
              name: exerciseData.name || 'Exercício',
              description: exerciseData.description,
              category: exerciseData.category_name || exerciseData.category,
              instructions: exerciseData.instructions,
              muscles: exerciseData.muscles_worked || exerciseData.muscles,
              sets: exerciseData.default_sets || 3,
              reps: exerciseData.default_reps || 12,
              video: exerciseData.video_path,
              image: exerciseData.image_path
            };
            console.log('Exercício carregado:', this.selectedExercise);
          } else {
            // Se não encontrar o exercício específico, usar dados de exemplo
            this.setupExampleExercise(id);
          }
        } else {
          // Se não tiver dados da API, usar dados de exemplo
          this.setupExampleExercise(id);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar exercício:', err);
        this.error = 'Erro ao carregar dados do exercício';
        this.loading = false;
        this.selectedExercise = null;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // Configura um exercício de exemplo quando não temos dados da API
  setupExampleExercise(id: number) {
    this.selectedExercise = {
      id: id,
      name: 'Crossover',
      description: 'Exercício com cabos para peito, ideal para definição muscular.',
      muscles: 'Peitoral, ombros, tríceps',
      category: 'peito',
      instructions: 'Fique de frente ao aparelho, puxe os cabos cruzando-os na frente do corpo à altura do peito. Mantenha o tronco estável durante o movimento.',
      sets: 3,
      reps: 12
    };
  }

  getCategoryName(categoryId: string): string {
    const categories: {[key: string]: string} = {
      'peito': 'Peito',
      'costas': 'Costas',
      'pernas': 'Pernas',
      'ombros': 'Ombros',
      'biceps': 'Bíceps',
      'triceps': 'Tríceps',
      'abdomen': 'Abdômen',
      'cardio': 'Cardio'
    };

    return categories[categoryId] || categoryId;
  }

  voltar() {
    this.router.navigate(['/tabs/exercises']);
  }

  fechar() {
    // Pode ser o mesmo que voltar para navegação normal
    this.voltar();
  }

  // Métodos para upload de mídia
  triggerImageUpload() {
    this.imageInput.nativeElement.click();
  }

  triggerVideoUpload() {
    this.videoInput.nativeElement.click();
  }

  onImageSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;

    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];

      // Verificar tamanho (limitar a 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('A imagem não pode ter mais de 5MB');
        return;
      }

      // Verificar tipo
      if (!file.type.includes('image/')) {
        this.showToast('O arquivo selecionado não é uma imagem válida');
        return;
      }

      // Usar o caminho da imagem diretamente
      if (this.selectedExercise) {
        // Salvar caminho do arquivo
        const filePath = file.name;

        // Atualizar o exercício com o caminho da imagem
        this.selectedExercise.image = filePath;

        // Para exibição na interface, criar URL temporária
        const imageUrl = URL.createObjectURL(file);
        this.selectedExercise.imagePreview = imageUrl;

        this.showToast('Imagem adicionada com sucesso');
      }
    }
  }

  onVideoSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;

    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];

      // Verificar tamanho (limitar a 50MB)
      if (file.size > 50 * 1024 * 1024) {
        this.showToast('O vídeo não pode ter mais de 50MB');
        return;
      }

      // Verificar tipo
      if (!file.type.includes('video/')) {
        this.showToast('O arquivo selecionado não é um vídeo válido');
        return;
      }

      // Usar o caminho do vídeo diretamente
      if (this.selectedExercise) {
        // Salvar caminho do arquivo
        const filePath = file.name;

        // Atualizar o exercício com o caminho do vídeo
        this.selectedExercise.video = filePath;

        // Para exibição na interface, criar URL temporária
        const videoUrl = URL.createObjectURL(file);
        this.selectedExercise.videoPreview = videoUrl;

        this.showToast('Vídeo adicionado com sucesso');
      }
    }
  }

  // Salvar o exercício com as novas mídias
  saveExerciseMedia() {
    if (!this.selectedExercise || !this.selectedExercise.id) {
      this.showToast('Erro: Exercício não encontrado');
      return;
    }

    this.loading = true;
    this.showToast('Enviando mídia para o servidor...');

    // Criar FormData com os arquivos
    const formData = new FormData();

    // Adicionar exercise_id com o nome correto
    formData.append('exercise_id', this.selectedExercise.id.toString());
    console.log('ID do exercício:', this.selectedExercise.id);

    // Adicionar arquivos reais
    let hasFiles = false;

    if (this.imageInput && this.imageInput.nativeElement.files && this.imageInput.nativeElement.files.length > 0) {
      const imageFile = this.imageInput.nativeElement.files[0];
      formData.append('image', imageFile, imageFile.name);
      console.log('Imagem selecionada:', imageFile.name, imageFile.type, imageFile.size);
      hasFiles = true;
    }

    if (this.videoInput && this.videoInput.nativeElement.files && this.videoInput.nativeElement.files.length > 0) {
      const videoFile = this.videoInput.nativeElement.files[0];
      formData.append('video', videoFile, videoFile.name);
      console.log('Vídeo selecionado:', videoFile.name, videoFile.type, videoFile.size);
      hasFiles = true;
    }

    // Verificar se há arquivos para enviar
    if (!hasFiles) {
      this.loading = false;
      this.showToast('Nenhum arquivo selecionado para upload');
      return;
    }

    // Enviar para o servidor usando formData
    this.workoutService.updateExerciseMedia(this.selectedExercise.id, formData)
      .subscribe({
        next: (response) => {
          this.loading = false;
          console.log('Mídia salva com sucesso:', response);
          if (response && response.status) {
            this.showToast('Mídia salva com sucesso!');

            // Atualize os caminhos com os retornados pelo servidor, se disponíveis
            if (response.data) {
              if (response.data.image_path) {
                // Caminho para assets/images/exercises
                this.selectedExercise!.image = response.data.image_path;
                console.log('Novo caminho de imagem:', this.selectedExercise!.image);
                // Limpar a prévia
                this.selectedExercise!.imagePreview = undefined;
              }
              if (response.data.video_path) {
                // Caminho para assets/images/exercises
                this.selectedExercise!.video = response.data.video_path;
                console.log('Novo caminho de vídeo:', this.selectedExercise!.video);
                // Limpar a prévia
                this.selectedExercise!.videoPreview = undefined;
              }
            }
          } else {
            this.showToast('Erro ao salvar mídia. Por favor, tente novamente.');
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Erro ao salvar mídia:', error);
          if (error.error && error.error.message) {
            this.showToast(`Erro: ${error.error.message}`);
          } else {
            this.showToast('Erro ao salvar mídia no servidor');
          }
        }
      });
  }

  // Exibir toast de notificação
  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'dark'
    });

    await toast.present();
  }
}
