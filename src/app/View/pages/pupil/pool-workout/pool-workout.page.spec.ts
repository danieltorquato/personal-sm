import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PoolWorkoutPage } from './pool-workout.page';

describe('PoolWorkoutPage', () => {
  let component: PoolWorkoutPage;
  let fixture: ComponentFixture<PoolWorkoutPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoolWorkoutPage],
    }).compileComponents();

    fixture = TestBed.createComponent(PoolWorkoutPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
