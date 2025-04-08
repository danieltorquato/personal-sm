import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AnamnesisService } from '../../../../services/anamnesis.service';
import { Anamnesis } from '../../../../Models/anamnesis.model';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  documentTextOutline,
  medicalOutline,
  fitnessOutline,
  bodyOutline,
  flagOutline,
  createOutline,
  closeOutline,
  waterOutline,
  bedOutline,
  pulseOutline,
  personOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-anamnesis',
  templateUrl: './anamnesis.page.html',
  styleUrls: ['./anamnesis.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class AnamnesisPage implements OnInit {
  studentId = 0;
  anamnesisForm: FormGroup;
  loading = true;
  isEditing = false;
  anamnesis?: Anamnesis;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private anamnesisService: AnamnesisService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({
      saveOutline,
      documentTextOutline,
      medicalOutline,
      fitnessOutline,
      bodyOutline,
      flagOutline,
      createOutline,
      closeOutline,
      waterOutline,
      bedOutline,
      pulseOutline,
      personOutline
    });

    // Inicializar o formulário no construtor
    this.anamnesisForm = this.initForm();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.studentId = +idParam;
        this.loadAnamnesis();
      } else {
        this.presentToast('ID do aluno não fornecido', 'danger');
        this.router.navigate(['/personal/students']);
      }
    });
  }

  initForm(): FormGroup {
    return this.formBuilder.group({
      personal_info: this.formBuilder.group({
        weight: [0, [Validators.min(0), Validators.max(300)]],
        height: [0, [Validators.min(0), Validators.max(3)]],
        age: [0, [Validators.min(0), Validators.max(120)]],
        sex: ['', Validators.required]
      }),
      medical_history: this.formBuilder.group({
        main_complaint: [''],
        medical_history: [''],
        medications: [''],
        surgeries: [''],
        allergies: [''],
        family_history: ['']
      }),
      lifestyle: this.formBuilder.group({
        smoker: [false],
        alcoholic: [false],
        physical_activity: [false],
        sleep_hours: [8, [Validators.min(0), Validators.max(24)]],
        lifestyle: ['']
      })
    });
  }

  async loadAnamnesis() {
    const loading = await this.loadingController.create({
      message: 'Carregando anamnese...',
      spinner: 'crescent'
    });

    await loading.present();
    this.loading = true;

    this.anamnesisService.getAnamnesis(this.studentId).subscribe(
      (response) => {
        if (response && response.success && response.data) {
          this.anamnesis = response.data;

          // Montar os dados para o formulário separado por seções
          const formData = {
            personal_info: {
              weight: this.anamnesis.weight || 0,
              height: this.anamnesis.height || 0,
              age: this.anamnesis.age || 0,
              sex: this.anamnesis.sex || ''
            },
            medical_history: {
              main_complaint: this.anamnesis.main_complaint || '',
              medical_history: this.anamnesis.medical_history || '',
              medications: this.anamnesis.medications || '',
              surgeries: this.anamnesis.surgeries || '',
              allergies: this.anamnesis.allergies || '',
              family_history: this.anamnesis.family_history || ''
            },
            lifestyle: {
              smoker: this.anamnesis.smoker || false,
              alcoholic: this.anamnesis.alcoholic || false,
              physical_activity: this.anamnesis.physical_activity || false,
              sleep_hours: this.anamnesis.sleep_hours || 8,
              lifestyle: this.anamnesis.lifestyle || ''
            }
          };

          this.anamnesisForm.patchValue(formData);
          this.isEditing = false;
        } else {
          // Caso a anamnese não exista para este aluno
          this.isEditing = true;
          this.presentToast('Nenhuma anamnese encontrada. Por favor, crie uma nova.', 'warning');
        }
        this.loading = false;
        loading.dismiss();
      },
      (error) => {
        console.error('Erro ao carregar anamnese:', error);
        this.presentToast('Erro ao carregar anamnese: ' + (error.message || 'Erro desconhecido'), 'danger');
        this.loading = false;
        loading.dismiss();
      }
    );
  }

  async saveAnamnesis() {
    if (this.anamnesisForm.invalid) {
      this.presentToast('Por favor, preencha todos os campos obrigatórios', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: 'Deseja salvar as alterações na anamnese?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Salvar',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Salvando anamnese...',
              spinner: 'crescent'
            });

            await loading.present();

            try {
              const formValue = this.anamnesisForm.value;

              // Transformar o formulário em um objeto Anamnesis
              const anamnesisData: Anamnesis = {
                ...(this.anamnesis || {}),
                student_id: this.studentId,
                weight: formValue.personal_info.weight,
                height: formValue.personal_info.height,
                age: formValue.personal_info.age,
                sex: formValue.personal_info.sex,
                main_complaint: formValue.medical_history.main_complaint,
                medical_history: formValue.medical_history.medical_history,
                medications: formValue.medical_history.medications,
                surgeries: formValue.medical_history.surgeries,
                allergies: formValue.medical_history.allergies,
                family_history: formValue.medical_history.family_history,
                smoker: formValue.lifestyle.smoker,
                alcoholic: formValue.lifestyle.alcoholic,
                physical_activity: formValue.lifestyle.physical_activity,
                sleep_hours: formValue.lifestyle.sleep_hours,
                lifestyle: formValue.lifestyle.lifestyle
              };

              let observable;
              if (this.anamnesis && this.anamnesis.id) {
                observable = this.anamnesisService.updateAnamnesis(this.studentId, anamnesisData);
              } else {
                observable = this.anamnesisService.createAnamnesis(this.studentId, anamnesisData);
              }

              observable.subscribe(
                (response) => {
                  if (response && response.success && response.data) {
                    this.anamnesis = response.data;
                    this.presentToast('Anamnese salva com sucesso!');
                    this.isEditing = false;
                  } else {
                    this.presentToast('Erro ao salvar anamnese: ' + (response.message || 'Erro desconhecido'), 'danger');
                  }
                  loading.dismiss();
                },
                (error) => {
                  console.error('Erro ao salvar anamnese:', error);
                  this.presentToast('Erro ao salvar anamnese: ' + (error.message || 'Erro desconhecido'), 'danger');
                  loading.dismiss();
                }
              );
            } catch (error) {
              console.error('Erro ao processar dados:', error);
              this.presentToast('Erro ao processar dados da anamnese', 'danger');
              loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.loadAnamnesis();
    }
  }
}
